
import React from 'react';

const StyleToolbar = ({ onStyleChange, selectedNodeId, onAddChild, onAddSibling, onDelete }) => {
  const handleShapeChange = (e) => {
    onStyleChange(selectedNodeId, { shape: e.target.value });
  };

  const handleColorChange = (e) => {
    onStyleChange(selectedNodeId, { backgroundColor: e.target.value });
  };

  const handleBorderChange = (e) => {
    onStyleChange(selectedNodeId, { borderColor: e.target.value });
  };

  return (
    <div className="style-toolbar">
      <select onChange={handleShapeChange}>
        <option value="rect">Rectangle</option>
        <option value="circle">Circle</option>
        <option value="diamond">Diamond</option>
        <option value="folder">Folder</option>
      </select>
      <input type="color" onChange={handleColorChange} title="Fill Color" />
      <input type="color" onChange={handleBorderChange} title="Border Color" />
    </div>
  );
};

export default StyleToolbar;
