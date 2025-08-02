import React, { useState, useEffect } from 'react';
import { videoAPI } from '../api';
import VideoCard from '../VideoCard';

const FollowingFeed = ({ currentUser, onVideoUpdate, onUserClick }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFollowingVideos();
  }, []);

  const loadFollowingVideos = async () => {
    try {
      // Get videos from followed users
      const followingVideos = await videoAPI.getFollowingVideos();
      setVideos(followingVideos);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading following videos...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (videos.length === 0) {
    return (
      <div className="video-feed">
        <div className="no-videos">
          <p>No videos from people you follow yet.</p>
          <p>Follow some users to see their videos here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="video-feed">
      {videos.map((video) => (
        <VideoCard 
          key={video._id} 
          video={video} 
          currentUser={currentUser}
          onVideoUpdate={onVideoUpdate}
          onUserClick={onUserClick}
        />
      ))}
    </div>
  );
};

export default FollowingFeed; 