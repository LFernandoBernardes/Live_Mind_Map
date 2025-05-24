import React from 'react';
import MDEditor from '@uiw/react-md-editor';

// The CSS for MDEditor is usually bundled or should be imported in a global CSS file if needed.
// For this setup, assuming Vite handles CSS imports from node_modules correctly or it's globally available.
// If specific themes are needed, they might require explicit imports like:
// import '@uiw/react-md-editor/markdown-editor.css';
// import '@uiw/react-markdown-preview/markdown.css';

const MarkdownEditor = ({ value, onChange }) => {
  return (
    // The parent div needs to have a defined height for the editor's 100% height to work.
    // The .left-pane in App.css should provide this.
    <div data-color-mode="light" style={{ height: '100%', overflow: 'hidden' }}>
      <MDEditor
        value={value}
        onChange={onChange}
        height="100%" // This makes the editor fill the parent div.
        preview="edit" // Default to edit mode, can be changed to "live" or "preview"
        // Other props can be added as needed, e.g., visibleDragbar, etc.
      />
    </div>
  );
};

export default MarkdownEditor;
