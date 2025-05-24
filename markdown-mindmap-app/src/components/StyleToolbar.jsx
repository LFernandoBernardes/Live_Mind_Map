
import React from 'react';

const StyleToolbar = ({ onShapeChange, onColorChange, onSizeChange }) => {
  return (
    <div className="style-toolbar">
      <select onChange={(e) => onShapeChange(e.target.value)}>
        <option value="rect">Rectangle</option>
        <option value="circle">Circle</option>
        <option value="roundedrect">Rounded</option>
      </select>
      <input 
        type="color" 
        onChange={(e) => onColorChange(e.target.value)} 
        title="Node Color"
      />
      <input 
        type="range" 
        min="10" 
        max="30" 
        defaultValue="16" 
        onChange={(e) => onSizeChange(e.target.value)}
        title="Font Size" 
      />
    </div>
  );
};

export default StyleToolbar;
