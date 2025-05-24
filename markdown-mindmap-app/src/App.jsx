import React, { useState, useEffect } from 'react';
import MindMapViewer from './MindMapViewer';
import MarkdownEditor from './MarkdownEditor';
import './App.css';
import { marked } from 'marked'; // Import marked

const initialMarkdown = `
# Welcome to the Markdown Mind Map Editor!

This is a simple Markdown document to get you started.

## Features
- Edit Markdown in the left pane.
- See the Mind Map update in the right pane.
- Open, Save, and Save As your Markdown files.
- Try editing node text directly on the mind map!

### Try it out:
* First list item
* Second list item with **bold**
* Third list item
  * Nested item 1
  * Nested item 2
    * Deeper nested item

#### Another Heading
Some paragraph text under the H4.
`;

function App() {
  const [markdownContent, setMarkdownContent] = useState(initialMarkdown);
  const [currentFileHandle, setCurrentFileHandle] = useState(null);

  const checkFileApiSupport = () => {
    if (!window.showOpenFilePicker || !window.showSaveFilePicker) {
      alert("File System Access API is not fully supported in this browser. Please use a modern Chromium-based browser.");
      return false;
    }
    return true;
  };

  const handleOpenFile = async () => {
    if (!checkFileApiSupport()) return;
    try {
      const [fileHandle] = await window.showOpenFilePicker({
        types: [{ description: 'Markdown Files', accept: { 'text/markdown': ['.md', '.markdown'] } }],
      });
      const file = await fileHandle.getFile();
      const contents = await file.text();
      setMarkdownContent(contents);
      setCurrentFileHandle(fileHandle);
      console.log(`File opened: ${fileHandle.name}`);
    } catch (err) {
      if (err.name === 'AbortError') console.log('User cancelled open.');
      else { console.error("Error opening file:", err); alert(`Error opening file: ${err.message}`);}
    }
  };

  const handleSaveFile = async () => {
    if (!currentFileHandle) { handleSaveAsFile(); return; }
    if (!checkFileApiSupport()) return;
    try {
      const writable = await currentFileHandle.createWritable();
      await writable.write(markdownContent);
      await writable.close();
      alert('File saved successfully!');
      console.log(`File saved: ${currentFileHandle.name}`);
    } catch (err) {
      console.error("Error saving file:", err); alert(`Error saving file: ${err.message}`);
      const trySaveAs = confirm("Could not save. Try 'Save As'?");
      if (trySaveAs) handleSaveAsFile();
    }
  };

  const handleSaveAsFile = async () => {
    if (!checkFileApiSupport()) return;
    try {
      const newFileHandle = await window.showSaveFilePicker({
        types: [{ description: 'Markdown Files', accept: { 'text/markdown': ['.md', '.markdown'] } }],
      });
      setCurrentFileHandle(newFileHandle);
      const writable = await newFileHandle.createWritable();
      await writable.write(markdownContent);
      await writable.close();
      alert('File saved successfully!');
      console.log(`File saved as: ${newFileHandle.name}`);
    } catch (err) {
      if (err.name === 'AbortError') console.log('User cancelled save.');
      else { console.error("Error saving file as:", err); alert(`Error saving file: ${err.message}`);}
    }
  };

  const handleVisualNodeTextUpdate = (nodeId, originalText, newText) => {
    console.log("Attempting to update Markdown for node:", nodeId, "from:", originalText, "to:", newText);
    setMarkdownContent(prevMarkdown => {
      const tokens = marked.lexer(prevMarkdown);
      let modified = false;
      
      // This is a very simplified token search. It does NOT use nodeId yet.
      // It will find the first occurrence of originalText and replace it.
      // This is highly likely to be buggy for non-unique text.
      function findAndReplaceInTokens(tokenList) {
        if (modified) return;
        for (let i = 0; i < tokenList.length; i++) {
          let token = tokenList[i];
          
          if (token.text && typeof token.text === 'string' && token.text.includes(originalText)) {
            // Heuristic: if the original text is exactly the token's text, replace it all.
            // Otherwise, if it's part of a larger text block, replace the specific part.
            // This is still naive for complex inline elements.
            if (token.text.trim() === originalText.trim()) {
                token.text = newText;
            } else {
                token.text = token.text.replace(originalText, newText);
            }
            modified = true;
            return;
          }
          
          if (token.tokens && token.tokens.length > 0) {
            findAndReplaceInTokens(token.tokens);
            if (modified) return;
          }
          
          if (token.type === 'list' && token.items) {
            for (const item of token.items) {
              if (modified) return;
              // Check item.text (raw text before further tokenization within list item)
              if (item.text && typeof item.text === 'string' && item.text.includes(originalText)) {
                if (item.text.trim() === originalText.trim()) {
                    item.text = newText;
                } else {
                    item.text = item.text.replace(originalText, newText);
                }
                modified = true;
                return;
              }
              // Recursively check tokens within the list item (for nested structures or complex content)
              if (item.tokens) {
                findAndReplaceInTokens(item.tokens);
                if (modified) return;
              }
            }
          }
        }
      }

      findAndReplaceInTokens(tokens);

      if (modified) {
        try {
          const newMarkdown = marked.parser(tokens);
          console.log("Markdown updated successfully via visual edit.");
          return newMarkdown;
        } catch (e) {
          console.error("Error reconstructing Markdown from tokens:", e);
          return prevMarkdown;
        }
      } else {
        console.warn(`Failed to find and update token in Markdown: NodeID ${nodeId}, Original Text: "${originalText}", New Text: "${newText}"`);
        return prevMarkdown;
      }
    });
  };

  return (
    <>
      <div className="file-operations">
        <button onClick={handleOpenFile}>Open File</button>
        <button onClick={handleSaveFile}>Save File</button>
        <button onClick={handleSaveAsFile}>Save As...</button>
      </div>
      <div className="app-container">
        <div className="left-pane">
          <MarkdownEditor value={markdownContent} onChange={setMarkdownContent} />
        </div>
        <div className="right-pane">
          <MindMapViewer markdown={markdownContent} onNodeEditComplete={handleVisualNodeTextUpdate} />
        </div>
      </div>
    </>
  );
}

export default App;
