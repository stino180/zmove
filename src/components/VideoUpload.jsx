import React, { useState } from 'react';
import { videoAPI } from '../api';

const VideoUpload = ({ onUploadSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Please select a video file');
      return;
    }
    if (!formData.tags.trim()) {
      setError('Please enter at least one tag');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const uploadData = new FormData();
      uploadData.append('video', selectedFile);
      uploadData.append('title', formData.title);
      uploadData.append('description', formData.description);
      uploadData.append('tags', formData.tags);

      const result = await videoAPI.uploadVideo(uploadData);
      
      // Reset form
      setFormData({ title: '', description: '', tags: '' });
      setSelectedFile(null);
      e.target.reset();
      
      onUploadSuccess(result.video);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="video-upload">
      <h3>Upload Video</h3>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title:</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Description:</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
          />
        </div>
        <div className="form-group">
          <label>Tags (comma separated):</label>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            required
            placeholder="e.g. basketball, dunk, highlight"
          />
          <small>Tags help others find your video. Use sport, team, or event names!</small>
        </div>
        <div className="form-group">
          <label>Video File:</label>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            required
          />
          <small>Supported formats: MP4, AVI, MOV, WMV, FLV, WebM (Max 100MB)</small>
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Uploading...' : 'Upload Video'}
        </button>
      </form>
    </div>
  );
};

export default VideoUpload; 