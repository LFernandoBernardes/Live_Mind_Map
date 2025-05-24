import React, { useState, useEffect } from 'react';
import MindMapViewer from './MindMapViewer';
import MarkdownEditor from './MarkdownEditor';
import './App.css';
import { marked } from 'marked';

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

function parseNodeIdPath(nodeId) {
  if (!nodeId || !nodeId.startsWith('mm-')) return null;
  return nodeId.substring(3).split('-').map(s => parseInt(s, 10) - 1);
}

function findTokenByPath(tokens, path, originalTokensRef = tokens) {
    if (!path || path.length === 0) return null;
    let currentTokens = tokens;
    let currentToken = null;
    let parentTokenContext = null; // To store context like parent list for list_items

    for (let i = 0; i < path.length; i++) {
        const targetIndex = path[i];
        let structuralTokenCount = -1;
        let foundAtCurrentLevel = false;

        for (let j = 0; j < currentTokens.length; j++) {
            const token = currentTokens[j];
            let isStructural = false;

            if (token.type === 'heading' || token.type === 'list') {
                isStructural = true;
                // If we are looking for a list item, parentTokenContext should be the list containing currentTokens (items)
            } else if (parentTokenContext && parentTokenContext.type === 'list' && token.type === 'list_item') {
                isStructural = true;
            }

            if (isStructural) {
                structuralTokenCount++;
                if (structuralTokenCount === targetIndex) {
                    currentToken = token;
                    if (i === path.length - 1) { // Target depth reached
                        return { token: currentToken, parentArray: currentTokens, index: j, parentListToken: parentTokenContext && parentTokenContext.type === 'list' ? parentTokenContext : null };
                    }

                    // Delve deeper
                    foundAtCurrentLevel = true;
                    if (currentToken.type === 'list') {
                        parentTokenContext = currentToken;
                        currentTokens = currentToken.items || [];
                    } else if (currentToken.type === 'list_item') {
                        let subList = currentToken.tokens?.find(t => t.type === 'list');
                        if (subList) {
                            parentTokenContext = subList;
                            currentTokens = subList.items || [];
                        } else { return null; } // Path expects children but no sub-list found
                    } else if (currentToken.type === 'heading') {
                        // For headings, Markmap might show subsequent list as children.
                        // Try to find the list immediately following the heading.
                        // This requires looking in the originalTokensRef or the parent of currentToken.
                        // For simplicity, let's assume currentTokens is the array containing the heading.
                        let listAfterHeading = null;
                        if(j + 1 < tokens.length && tokens[j+1].type === 'list') { // check in original top-level tokens array
                            listAfterHeading = tokens[j+1]; // This assumes heading is top-level.
                        } else {
                            // If heading is not top-level, this logic is flawed.
                            // This part is very complex for a general solution.
                            // For now, we'll assume if a heading isn't the target, the next path element implies a list that should follow it.
                             const headingParentArray = findParentArray(originalTokensRef, currentToken);
                             const headingIndexInParent = headingParentArray?.findIndex(t => t === currentToken);
                             if(headingParentArray && headingIndexInParent !== -1 && headingIndexInParent + 1 < headingParentArray.length && headingParentArray[headingIndexInParent+1].type === 'list'){
                                listAfterHeading = headingParentArray[headingIndexInParent+1];
                             }
                        }

                        if (listAfterHeading) {
                            parentTokenContext = listAfterHeading;
                            currentTokens = listAfterHeading.items || [];
                        } else { return null; } // No list found after heading
                    } else {
                        return null; // Cannot delve deeper for this token type
                    }
                    break; // Found target for current path segment, move to next segment
                }
            }
        }
        if (!foundAtCurrentLevel) return null; // Path segment not found
    }
    return null; // Should not be reached if path is valid and structure matches
}

// Helper to find the parent array of a token (needed for complex heading scenarios)
// This is also heuristic and not fully robust.
function findParentArray(tokensToSearch, targetToken) {
    for (const token of tokensToSearch) {
        if (token === targetToken) return tokensToSearch; // Target is top-level
        if (token.tokens) {
            const found = findParentArray(token.tokens, targetToken);
            if (found) return found;
        }
        if (token.items) { // For lists
            const found = findParentArray(token.items, targetToken);
            if (found) return found;
        }
    }
    return null;
}


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

  const addNewMap = () => {
    const newId = `map-${Date.now()}`;
    setMarkdownContent(prev => [...prev, { id: newId, content: '# New Mind Map\n' }]);
    setCurrentMapId(newId);
  };

  const checkFileApiSupport = () => { /* ... */ return true;};
  const handleOpenFile = async () => { /* ... */ };
  const handleSaveFile = async () => { /* ... */ };
  const handleSaveAsFile = async () => { /* ... */ };
  const handleVisualNodeTextUpdate = (nodeId, originalText, newText) => { /* ... */ };
  const handleAddChildNode = () => { /* ... */ };
  const handleAddSiblingNode = () => { /* ... */ };
  const handleDeleteNode = () => { /* ... */ };

  const handleNodeReparent = (draggedNodeId, targetNodeId, relationshipType) => {
    console.log(`Intent to reparent: Dragged ${draggedNodeId}, Target ${targetNodeId}, Type ${relationshipType}`);
    if (draggedNodeId === targetNodeId) {
      console.warn("Cannot drop a node onto itself.");
      return;
    }

    setMarkdownContent(prevMarkdown => {
      // Deep clone tokens to prevent modifying the original array if parsing/logic fails
      const originalTokens = marked.lexer(prevMarkdown);
      const tokens = JSON.parse(JSON.stringify(originalTokens)); // Simple deep clone

      const draggedPath = parseNodeIdPath(draggedNodeId);
      const targetPath = parseNodeIdPath(targetNodeId);

      if (!draggedPath || !targetPath) {
        console.error("Invalid node ID(s) for reparenting.", draggedNodeId, targetNodeId);
        return prevMarkdown;
      }

      // --- 1. Find and Detach Dragged Token ---
      const draggedResult = findTokenByPath(tokens, draggedPath, tokens);
      if (!draggedResult || !draggedResult.token) {
        console.warn(`Dragged token ${draggedNodeId} not found.`);
        return prevMarkdown;
      }

      const { token: draggedToken, parentArray: draggedTokenParentArray, index: draggedTokenIndex, parentListToken: draggedTokenParentList } = draggedResult;

      // Detach (remove) the token from its original position
      if (!draggedTokenParentArray || typeof draggedTokenIndex !== 'number' || draggedTokenIndex < 0) {
          console.warn(`Could not determine parent context for dragged token ${draggedNodeId}.`);
          return prevMarkdown;
      }
      draggedTokenParentArray.splice(draggedTokenIndex, 1);

      // Heuristically update raw text of the source list if applicable
      if (draggedTokenParentList && draggedTokenParentList.items) {
        draggedTokenParentList.raw = (draggedTokenParentList.items.map(it => it.raw || `- ${it.text}\n`).join('')).trim();
      }
      // Note: If dragged from top level, no specific parent list raw update needed here.

      // --- 2. Find Target Token (careful, indices might have shifted if common ancestor) ---
      // **MAJOR LIMITATION FOR MVP**: Re-finding target after detach is complex if they shared a close common parent.
      // This implementation proceeds with the initially found target path, which might be wrong if detachment affected it.
      // This will cause failures for sibling drags or drags within the same list if target was after dragged.
      const targetResult = findTokenByPath(tokens, targetPath, tokens); // Re-find in modified tokens
      if (!targetResult || !targetResult.token) {
        console.warn(`Target token ${targetNodeId} not found after detaching dragged token (or originally).`);
        return prevMarkdown;
      }
      const { token: targetToken } = targetResult;

      // --- 3. Attach Dragged Token as Child of Target ---
      // For MVP, relationshipType is always 'child'
      let modified = false;
      if (relationshipType === 'child') {
        if (targetToken.type === 'list_item') {
          if (!Array.isArray(targetToken.tokens)) targetToken.tokens = [];
          let subList = targetToken.tokens.find(t => t.type === 'list');
          if (!subList) {
            subList = { type: 'list', raw: '', ordered: false, start: '', loose: false, items: [] };
            targetToken.tokens.push(subList);
          }
          // Ensure dragged token is a list_item if target is a list_item expecting list_item children in its sublist
          // This is very naive. If draggedToken was a heading, this makes invalid Markdown.
          if (draggedToken.type !== 'list_item') {
             console.warn(`Cannot directly make token type '${draggedToken.type}' a child list item. Wrapping attempt may fail.`);
             // Attempt to wrap it, this is highly problematic
             const wrappedText = draggedToken.text || 'Dragged Node';
             draggedToken.raw = `- ${wrappedText}\n`;
             draggedToken.text = wrappedText;
             draggedToken.type = 'list_item';
             draggedToken.tokens = [{type: 'text', raw: wrappedText, text: wrappedText}];
          }
          subList.items.push(draggedToken);
          // Heuristically update raw texts
          subList.raw = (subList.raw || '') + (draggedToken.raw || `- ${draggedToken.text}\n`);
          targetToken.raw = (targetToken.raw || targetToken.text + '\n') + `  ` + (draggedToken.raw || `- ${draggedToken.text}\n`);
          modified = true;

        } else if (targetToken.type === 'heading') {
          // Find or create a list after the heading
          const targetTokenParentArray = findParentArray(tokens, targetToken);
          const targetTokenIndexInParent = targetTokenParentArray?.findIndex(t => t === targetToken);

          if (!targetTokenParentArray || typeof targetTokenIndexInParent !== 'number' || targetTokenIndexInParent < 0) {
              console.warn(`Could not determine parent context for target heading ${targetNodeId}.`);
              return prevMarkdown;
          }

          let listAfterHeading;
          if (targetTokenIndexInParent + 1 < targetTokenParentArray.length && targetTokenParentArray[targetTokenIndexInParent + 1].type === 'list') {
            listAfterHeading = targetTokenParentArray[targetTokenIndexInParent + 1];
          } else {
            listAfterHeading = { type: 'list', raw: '', ordered: false, start: '', loose: false, items: [] };
            targetTokenParentArray.splice(targetTokenIndexInParent + 1, 0, listAfterHeading);
          }
          // Similar wrapping problem as above if draggedToken is not a list_item
          if (draggedToken.type !== 'list_item') {
            console.warn(`Cannot directly make token type '${draggedToken.type}' a child list item of a heading. Wrapping attempt may fail.`);
            const wrappedText = draggedToken.text || 'Dragged Node';
            draggedToken.raw = `- ${wrappedText}\n`;
            draggedToken.text = wrappedText;
            draggedToken.type = 'list_item';
            draggedToken.tokens = [{type: 'text', raw: wrappedText, text: wrappedText}];
          }
          listAfterHeading.items.push(draggedToken);
          listAfterHeading.raw = (listAfterHeading.raw || '') + (draggedToken.raw || `- ${draggedToken.text}\n`);
          modified = true;
        } else {
          console.warn(`Cannot make child of token type: ${targetToken.type}. Reparenting aborted.`);
          return prevMarkdown;
        }
      } else {
         console.warn(`Unsupported relationshipType: ${relationshipType}. Reparenting aborted.`);
         return prevMarkdown;
      }

      if (modified) {
        try {
          const newMarkdown = marked.parser(tokens);
          console.log("Markdown updated successfully after reparenting.");
          setSelectedNodeId(null); // Clear selection
          return newMarkdown;
        } catch (e) {
          console.error("Error reconstructing Markdown after reparenting:", e);
          // Attempt to revert by re-parsing original tokens (very basic revert)
          try { return marked.parser(originalTokens); } catch { return prevMarkdown; }
        }
      }
      console.warn("Reparenting did not result in modification or failed before reconstruction.");
      return prevMarkdown; // No change if not modified or logic failed
    });
  };


  return (
    <>
      {/* ... (file-operations and node-operations divs) ... */}
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
            onNodeReparent={handleNodeReparent} // Pass the new handler
          />
        </div>
      </div>
    </>
  );
}
export default App;