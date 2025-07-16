import React, { useEffect, useState } from 'react';
import { videoAPI } from '../api';

const VideoFilterBar = ({ onFilterChange }) => {
  const [search, setSearch] = useState('');
  const [trendingTags, setTrendingTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState('');

  useEffect(() => {
    loadTrendingTags();
  }, []);

  const loadTrendingTags = async () => {
    try {
      const tags = await videoAPI.getTrendingTags();
      setTrendingTags(tags.map(tag => tag._id));
    } catch (err) {
      // ignore
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setSelectedTag('');
    onFilterChange({ search: e.target.value, tag: '' });
  };

  const handleTagClick = (tag) => {
    setSelectedTag(tag);
    setSearch('');
    onFilterChange({ search: '', tag });
  };

  return (
    <div className="video-filter-bar">
      <input
        type="text"
        className="search-input"
        placeholder="Search videos or tags..."
        value={search}
        onChange={handleSearchChange}
      />
      <div className="trending-tags">
        {trendingTags.map(tag => (
          <button
            key={tag}
            className={`tag-btn${selectedTag === tag ? ' selected' : ''}`}
            onClick={() => handleTagClick(tag)}
          >
            #{tag}
          </button>
        ))}
      </div>
    </div>
  );
};

export default VideoFilterBar; 