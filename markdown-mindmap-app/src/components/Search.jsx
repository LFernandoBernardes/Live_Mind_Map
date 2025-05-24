
import React, { useState } from 'react';

const Search = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('content');

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value, searchType);
  };

  return (
    <div className="search-container">
      <input
        type="text"
        value={searchTerm}
        onChange={handleSearch}
        placeholder="Search in mind map..."
        className="search-input"
      />
      <select 
        value={searchType}
        onChange={(e) => setSearchType(e.target.value)}
        className="search-type"
      >
        <option value="content">Content</option>
        <option value="tags">Tags</option>
        <option value="relationships">Relationships</option>
      </select>
    </div>
  );
};

export default Search;
