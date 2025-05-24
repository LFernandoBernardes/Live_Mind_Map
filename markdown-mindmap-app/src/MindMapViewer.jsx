import React, { useEffect, useRef, useState } from 'react';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';

const NODE_SHAPES = {
  DEFAULT: 'rect',
  CIRCLE: 'circle',
  SQUARE: 'rect',
  ROUNDED: 'roundedrect'
};

const MindMapViewer = ({ 
  markdown, 
  onNodeEditComplete, 
  selectedNodeId, 
  setSelectedNodeId, 
  onNodeReparent,
  nodeShape = NODE_SHAPES.DEFAULT 
}) => {
  const svgRef = useRef();
  const mmRef = useRef();
  const inputRef = useRef(); 

  const [editingNode, setEditingNode] = useState(null); 
  const [editText, setEditText] = useState('');
  
  const [dragState, setDragState] = useState({
    id: null,
    initialX: 0, initialY: 0, // Mouse position relative to SVG container at drag start
    offsetX: 0, offsetY: 0, // Offset of mouse from top-left of dragged element
    currentX: 0, currentY: 0,
    originalTransform: '',
    isDragging: false,
  });

  const transformer = new Transformer();

  useEffect(() => {
    if (!svgRef.current || !markdown) return;
    const { root } = transformer.transform(markdown);
    if (mmRef.current) mmRef.current.destroy();
    while (svgRef.current.firstChild) svgRef.current.removeChild(svgRef.current.firstChild);
    mmRef.current = Markmap.create(svgRef.current, null, root);

    const nodeGroups = svgRef.current.querySelectorAll('g.markmap-node');
    nodeGroups.forEach(gNode => {
      const nodeId = gNode.id;

      // Mousedown for potential drag start
      gNode.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        if (editingNode) return; // Don't start drag if already editing text

        const svgRect = svgRef.current.getBoundingClientRect();
        const initialMouseX = e.clientX - svgRect.left;
        const initialMouseY = e.clientY - svgRect.top;
        
        // Get current transform to append to it, or default to no transform
        const originalTransform = gNode.getAttribute('transform') || '';

        setDragState({
          id: nodeId,
          initialX: initialMouseX,
          initialY: initialMouseY,
          currentX: initialMouseX, // Initialize current position
          currentY: initialMouseY,
          originalTransform: originalTransform,
          isDragging: true, // Set isDragging to true immediately
        });

        svgRef.current.style.cursor = 'grabbing';
        // Add global listeners for mousemove and mouseup
        window.addEventListener('mousemove', handleGlobalMouseMove);
        window.addEventListener('mouseup', handleGlobalMouseUp);
      });
      
      // Single click for selection (if not dragging)
      gNode.addEventListener('click', (e) => {
        e.stopPropagation();
        if (dragState.isDragging && nodeId === dragState.id) {
          // If a drag just ended, this click might be the end of the drag.
          // The selection should be handled by the mouseup if it's a simple click.
          // For now, let's assume mouseup handles selection after drag.
          // If it's just a click without drag, select.
        } else if (!editingNode) { // Only select if not in text edit mode for another node
             setSelectedNodeId(nodeId);
        }
      });

      const textEl = gNode.querySelector('text');
      if (textEl) {
        textEl.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          if (editingNode && editingNode.targetTextElement) {
            editingNode.targetTextElement.style.visibility = 'visible';
          }
          const bbox = textEl.getBBox();
          setEditingNode({
            id: nodeId, originalText: textEl.textContent,
            x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height,
            targetTextElement: textEl,
          });
          setEditText(textEl.textContent);
          textEl.style.visibility = 'hidden';
        });
      }
    });
    return () => {
      if (mmRef.current) mmRef.current.destroy();
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [markdown, transformer, setSelectedNodeId, editingNode]); // dragState should not be here

  // Separate effect for managing visual selection based on selectedNodeId prop
   useEffect(() => {
    if (!svgRef.current || !mmRef.current?.state) return; // Ensure map is rendered
    const allNodes = svgRef.current.querySelectorAll('g.markmap-node');
    allNodes.forEach(node => {
      if (node.id === selectedNodeId) {
        node.classList.add('selected-node');
      } else {
        node.classList.remove('selected-node');
      }
    });
  }, [selectedNodeId, markdown]); // Re-apply when markdown (map) changes

  const handleGlobalMouseMove = (e) => {
    setDragState(prev => {
      if (!prev.isDragging || !prev.id) return prev;
      
      const svgRect = svgRef.current.getBoundingClientRect();
      const currentMouseX = e.clientX - svgRect.left;
      const currentMouseY = e.clientY - svgRect.top;

      const deltaX = currentMouseX - prev.initialX;
      const deltaY = currentMouseY - prev.initialY;

      const draggedEl = svgRef.current.querySelector(`#${prev.id}`);
      if (draggedEl) {
        // If originalTransform already includes a translate, we need to parse and add to it.
        // For simplicity, this MVP assumes originalTransform is simple or we just append.
        // A robust solution would parse and combine translate values.
        draggedEl.setAttribute('transform', `translate(${deltaX}, ${deltaY}) ${prev.originalTransform}`);
      }
      return {...prev, currentX: currentMouseX, currentY: currentMouseY };
    });
  };

  const handleGlobalMouseUp = (e) => {
    setDragState(prev => {
      if (!prev.isDragging || !prev.id) return prev;

      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      svgRef.current.style.cursor = 'grab';

      const draggedEl = svgRef.current.querySelector(`#${prev.id}`);
      let targetNodeId = null;
      
      if (draggedEl) {
        // Revert transform before calling onNodeReparent
        draggedEl.setAttribute('transform', prev.originalTransform);

        const draggedRect = draggedEl.getBoundingClientRect();
        const draggedCenterX = draggedRect.left + draggedRect.width / 2;
        const draggedCenterY = draggedRect.top + draggedRect.height / 2;

        const allOtherNodes = svgRef.current.querySelectorAll(`g.markmap-node:not(#${prev.id})`);
        allOtherNodes.forEach(nodeEl => {
          const targetRect = nodeEl.getBoundingClientRect();
          if (draggedCenterX >= targetRect.left && draggedCenterX <= targetRect.right &&
              draggedCenterY >= targetRect.top && draggedCenterY <= targetRect.bottom) {
            targetNodeId = nodeEl.id;
          }
        });
      }
      
      if (targetNodeId && targetNodeId !== prev.id) {
        if (onNodeReparent) {
          onNodeReparent(prev.id, targetNodeId, 'child'); // MVP: Always 'child'
        }
      } else {
        // If not dropped on a target, it might be a click for selection
        // Check if mouse moved significantly, if not, treat as click for selection
        const distMoved = Math.sqrt(
            Math.pow(prev.currentX - prev.initialX, 2) + 
            Math.pow(prev.currentY - prev.initialY, 2)
        );
        if (distMoved < 5 && setSelectedNodeId) { // Threshold for 'click' vs 'drag'
            setSelectedNodeId(prev.id);
        }
      }
      return { ...prev, id: null, isDragging: false, originalTransform: '' }; // Reset drag state
    });
  };
  
  useEffect(() => {
    if (editingNode && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select(); 
    }
  }, [editingNode]);

  const handleEditComplete = () => { /* ... (same as before) ... */ };
  const cancelEdit = () => { /* ... (same as before) ... */ };
  const handleInputChange = (e) => setEditText(e.target.value);
  const handleInputKeyDown = (e) => { /* ... (same as before) ... */ };
  let inputStyle = {};
  if (editingNode) { /* ... (same as before) ... */ }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }} onMouseMove={dragState.isDragging ? handleGlobalMouseMove : null} onMouseUp={dragState.isDragging ? handleGlobalMouseUp : null} >
      <svg ref={svgRef} style={{ width: '100%', height: '100%', cursor: dragState.isDragging ? 'grabbing' : 'grab' }} />
      {editingNode && ( <input ref={inputRef} type="text" value={editText} onChange={handleInputChange} onBlur={handleEditComplete} onKeyDown={handleInputKeyDown} style={inputStyle} /> )}
    </div>
  );
};

export default MindMapViewer;
