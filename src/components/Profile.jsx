import React, { useState, useEffect } from 'react';
import { profileAPI, videoAPI } from '../api';
import VideoCard from '../VideoCard';

const Profile = ({ currentUser, onProfileUpdate, onVideoDeleted }) => {
  const [profile, setProfile] = useState(null);
  const [videos, setVideos] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    username: '',
    bio: '',
    avatar: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await profileAPI.getMyProfile();
      setProfile(data.user);
      setVideos(data.videos);
      setEditData({
        username: data.user.username,
        bio: data.user.bio || '',
        avatar: data.user.avatar || ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const updatedUser = await profileAPI.updateProfile(editData);
      setProfile(updatedUser);
      setIsEditing(false);
      onProfileUpdate(updatedUser);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChange = (e) => {
    setEditData({
      ...editData,
      [e.target.name]: e.target.value
    });
  };

  const handleVideoClick = (video) => {
    setSelectedVideo(video);
  };

  const handleVideoDelete = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this video?')) {
      return;
    }

    try {
      await videoAPI.deleteVideo(videoId);
      setVideos(videos.filter(video => video._id !== videoId));
      onVideoDeleted && onVideoDeleted(videoId);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleVideoUpdate = (videoId, updates) => {
    setVideos(prevVideos => 
      prevVideos.map(video => 
        video._id === videoId ? { ...video, ...updates } : video
      )
    );
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const result = await profileAPI.uploadAvatar(file);
      setProfile(result.user);
      setEditData({ ...editData, avatar: result.avatar });
      onProfileUpdate(result.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setAvatarUploading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-info">
          <div className="profile-avatar">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.username} />
            ) : (
              <div className="avatar-placeholder">
                {profile.username.charAt(0).toUpperCase()}
              </div>
            )}
            {isEditing && (
              <form className="avatar-upload-form">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={avatarUploading}
                  style={{ marginTop: '0.5rem' }}
                />
                {avatarUploading && <div style={{ color: '#a259e6', fontSize: '0.9rem' }}>Uploading...</div>}
              </form>
            )}
          </div>
          <div className="profile-details">
            <h2>@{profile.username}</h2>
            {profile.bio && <p className="bio">{profile.bio}</p>}
            <div className="profile-stats">
              <span>{videos.length} videos</span>
              <span>{profile.followers?.length || 0} followers</span>
              <span>{profile.following?.length || 0} following</span>
            </div>
          </div>
        </div>
        
        <button 
          className="edit-profile-btn"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {isEditing && (
        <div className="edit-profile-form">
          <h3>Edit Profile</h3>
          <form onSubmit={handleEditSubmit}>
            <div className="form-group">
              <label>Username:</label>
              <input
                type="text"
                name="username"
                value={editData.username}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Bio:</label>
              <textarea
                name="bio"
                value={editData.bio}
                onChange={handleChange}
                rows="3"
                placeholder="Tell us about yourself..."
              />
            </div>
            
            <div className="form-group">
              <label>Avatar URL:</label>
              <input
                type="url"
                name="avatar"
                value={editData.avatar}
                onChange={handleChange}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
            
            <button type="submit" className="save-btn">
              Save Changes
            </button>
          </form>
        </div>
      )}

      <div className="profile-videos">
        <h3>My Videos ({videos.length})</h3>
        {videos.length === 0 ? (
          <div className="no-videos">
            <p>You haven't uploaded any videos yet.</p>
          </div>
        ) : (
          <div className="videos-grid">
            {videos.map((video) => (
              <div key={video._id} className="profile-video-item">
                <div 
                  className="video-thumbnail"
                  onClick={() => handleVideoClick(video)}
                >
                  <video 
                    src={`http://localhost:5000${video.videoUrl}`} 
                    muted 
                    onLoadedData={(e) => {
                      e.target.currentTime = 1; // Set to 1 second for thumbnail
                    }}
                  />
                  <div className="video-overlay-info">
                    <span className="video-title">{video.title}</span>
                    <span className="video-stats">
                      {video.likes?.length || 0} likes • {video.comments?.length || 0} comments • {video.viewCount || 0} views
                    </span>
                  </div>
                </div>
                <button 
                  className="delete-video-btn"
                  onClick={() => handleVideoDelete(video._id)}
                  title="Delete video"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <div className="video-modal" onClick={() => setSelectedVideo(null)}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="close-modal-btn"
              onClick={() => setSelectedVideo(null)}
            >
              ×
            </button>
            <VideoCard 
              video={selectedVideo} 
              currentUser={currentUser}
              onVideoUpdate={handleVideoUpdate}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile; 