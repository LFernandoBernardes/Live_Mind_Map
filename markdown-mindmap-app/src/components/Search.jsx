
import React from 'react';

const Search = ({ onSearch }) => {
  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Search in mind map..."
        onChange={(e) => onSearch(e.target.value)}
      />
    </div>
  );
};

export default Search;
