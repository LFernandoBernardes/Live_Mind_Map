import React, { useState, useEffect } from 'react';
import MindMapViewer from './MindMapViewer';
import MarkdownEditor from './MarkdownEditor';
import './App.css';

const initialMarkdown = `
# Welcome!
- Item 1
  - Item 1.1
  - Item 1.2
- Item 2
- Item 3

## Another Topic
- List A
- List B
`;

function App() {
  const [markdownContent, setMarkdownContent] = useState(initialMarkdown);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [nodeStyles, setNodeStyles] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const handleStyleChange = (nodeId, style) => {
    setNodeStyles(prev => ({
      ...prev,
      [nodeId]: { ...prev[nodeId], ...style }
    }));
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    // Highlight nodes containing the search query
    const nodes = document.querySelectorAll('.markmap-node');
    nodes.forEach(node => {
      const text = node.textContent.toLowerCase();
      if (text.includes(query.toLowerCase())) {
        node.classList.add('search-highlight');
      } else {
        node.classList.remove('search-highlight');
      }
    });
  };

  const handleVisualNodeTextUpdate = (nodeId, originalText, newText) => {
    // Implementação futura
    console.log('Update node', nodeId, 'from', originalText, 'to', newText);
  };

  const handleAddChildNode = () => {
    // Implementação futura
    console.log('Add child node');
  };

  const handleAddSiblingNode = () => {
    // Implementação futura
    console.log('Add sibling node');
  };

  const handleDeleteNode = () => {
    // Implementação futura
    console.log('Delete node');
  };

    const checkFileApiSupport = () => { /* ... */ return true;};
    const handleOpenFile = async () => { /* ... */ };
    const handleSaveFile = async () => { /* ... */ };
    const handleSaveAsFile = async () => { /* ... */ };

  const handleNodeReparent = (draggedNodeId, targetNodeId, relationshipType) => {
    console.log('Reparent node', draggedNodeId, 'to', targetNodeId, 'as', relationshipType);
  };

  return (
    <>
      <div className="file-operations">
        <button onClick={handleOpenFile}>Open File</button>
        <button onClick={handleSaveFile}>Save File</button>
        <button onClick={handleSaveAsFile}>Save As...</button>
      </div>
      <div className="node-operations">
        <button onClick={handleAddChildNode} title="Add child to selected node">Add Child</button>
        <button onClick={handleAddSiblingNode} title="Add sibling after selected node">Add Sibling</button>
        <button onClick={handleDeleteNode} title="Delete selected node">Delete Node</button>
        {selectedNodeId && <span className="selected-node-info">Selected: {selectedNodeId}</span>}
      </div>
      <div className="app-container">
        <div className="left-pane">
          <MarkdownEditor value={markdownContent} onChange={setMarkdownContent} />
        </div>
        <div className="right-pane">
          <MindMapViewer
            markdown={markdownContent}
            onNodeEditComplete={handleVisualNodeTextUpdate}
            selectedNodeId={selectedNodeId}
            setSelectedNodeId={setSelectedNodeId}
            onNodeReparent={handleNodeReparent}
          />
        </div>
      </div>
    </>
  );
}

export default App;