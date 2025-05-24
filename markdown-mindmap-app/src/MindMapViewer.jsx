import React, { useEffect, useRef, useState } from 'react';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';

const MindMapViewer = ({ markdown, onNodeEditComplete }) => { // Added onNodeEditComplete prop
  const svgRef = useRef();
  const mmRef = useRef();
  const inputRef = useRef(); 

  const [editingNode, setEditingNode] = useState(null); 
  const [editText, setEditText] = useState('');

  const transformer = new Transformer();

  useEffect(() => {
    if (!svgRef.current || !markdown) return;

    const { root } = transformer.transform(markdown);
    
    if (mmRef.current) {
      mmRef.current.destroy();
    }
    while (svgRef.current.firstChild) {
      svgRef.current.removeChild(svgRef.current.firstChild);
    }
    
    mmRef.current = Markmap.create(svgRef.current, null, root);

    const textElements = svgRef.current.querySelectorAll('g.markmap-node text');
    textElements.forEach(textEl => {
      const gNode = textEl.closest('g.markmap-node');
      if (!gNode) return;
      const nodeId = gNode.id; 

      const handleNodeActivateEdit = (e) => {
        e.stopPropagation();
        
        if (editingNode && editingNode.targetTextElement) {
            editingNode.targetTextElement.style.visibility = 'visible';
        }

        const bbox = textEl.getBBox();
        
        setEditingNode({
          id: nodeId,
          originalText: textEl.textContent,
          x: bbox.x, 
          y: bbox.y,
          width: bbox.width, 
          height: bbox.height, 
          targetTextElement: textEl, 
        });
        setEditText(textEl.textContent);
        textEl.style.visibility = 'hidden'; 
      };
      
      textEl.addEventListener('dblclick', handleNodeActivateEdit);
    });

    return () => {
      if (mmRef.current) {
        mmRef.current.destroy();
      }
    };

  }, [markdown, transformer]);

  useEffect(() => {
    if (editingNode && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select(); 
    }
  }, [editingNode]);

  const handleEditComplete = () => {
    if (!editingNode) return;

    // Call the callback prop instead of just logging
    if (onNodeEditComplete) {
      onNodeEditComplete(editingNode.id, editingNode.originalText, editText);
    } else {
      // Fallback log if no callback is provided
      console.log(`Node Edit Intent (no callback):
        ID: ${editingNode.id}
        Original Text: "${editingNode.originalText}"
        New Text: "${editText}"`);
    }
    
    if (editingNode.targetTextElement) {
      editingNode.targetTextElement.style.visibility = 'visible'; 
    }
    setEditingNode(null);
  };
  
  const cancelEdit = () => {
    if (!editingNode) return;
    if (editingNode.targetTextElement) {
      editingNode.targetTextElement.style.visibility = 'visible'; 
    }
    setEditingNode(null);
  }

  const handleInputChange = (e) => setEditText(e.target.value);

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleEditComplete();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  let inputStyle = {};
  if (editingNode) {
    const estimatedFontSize = editingNode.height * 0.8 || 12; 
    inputStyle = {
      position: 'absolute',
      top: `${editingNode.y}px`, 
      left: `${editingNode.x}px`, 
      width: `${Math.max(editingNode.width, 100)}px`, 
      height: `${editingNode.height}px`,
      fontFamily: 'sans-serif', 
      fontSize: `${estimatedFontSize}px`, 
      lineHeight: `${editingNode.height}px`, 
      border: '1px solid #ccc',
      boxSizing: 'border-box',
      zIndex: 1000,
      backgroundColor: 'white', 
    };
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
      {editingNode && (
        <input
          ref={inputRef}
          type="text"
          value={editText}
          onChange={handleInputChange}
          onBlur={handleEditComplete} 
          onKeyDown={handleInputKeyDown}
          style={inputStyle}
        />
      )}
    </div>
  );
};

export default MindMapViewer;
