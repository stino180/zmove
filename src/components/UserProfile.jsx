import React, { useState, useEffect } from 'react';
import { profileAPI } from '../api';
import VideoCard from '../VideoCard';

const UserProfile = ({ username, currentUser, onBack }) => {
  const [profile, setProfile] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, [username]);

  const loadUserProfile = async () => {
    try {
      const data = await profileAPI.getUserProfile(username);
      setProfile(data.user);
      setVideos(data.videos);
      
      // Check if current user is following this user
      if (currentUser && data.user.followers) {
        setIsFollowing(data.user.followers.some(follower => 
          follower._id === currentUser._id || follower === currentUser._id
        ));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser) return;
    
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await profileAPI.unfollowUser(profile._id);
        setIsFollowing(false);
        // Update followers count
        setProfile(prev => ({
          ...prev,
          followers: prev.followers.filter(follower => 
            follower._id !== currentUser._id && follower !== currentUser._id
          )
        }));
      } else {
        await profileAPI.followUser(profile._id);
        setIsFollowing(true);
        // Update followers count
        setProfile(prev => ({
          ...prev,
          followers: [...prev.followers, currentUser]
        }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleVideoClick = (video) => {
    setSelectedVideo(video);
  };

  const handleVideoUpdate = (videoId, updates) => {
    setVideos(prevVideos => 
      prevVideos.map(video => 
        video._id === videoId ? { ...video, ...updates } : video
      )
    );
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (error) {
    return (
      <div className="error-message">
        {error}
        <button onClick={onBack} className="back-btn">Go Back</button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="error-message">
        User not found
        <button onClick={onBack} className="back-btn">Go Back</button>
      </div>
    );
  }

  const isOwnProfile = currentUser && currentUser._id === profile._id;

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
        
        <div className="profile-actions">
          {!isOwnProfile && currentUser && (
            <button 
              className={`follow-btn ${isFollowing ? 'following' : ''}`}
              onClick={handleFollowToggle}
              disabled={followLoading}
            >
              {followLoading ? 'Loading...' : (isFollowing ? 'Unfollow' : 'Follow')}
            </button>
          )}
          <button onClick={onBack} className="back-btn">
            Back
          </button>
        </div>
      </div>

      <div className="profile-videos">
        <h3>{profile.username}'s Videos ({videos.length})</h3>
        {videos.length === 0 ? (
          <div className="no-videos">
            <p>@{profile.username} hasn't uploaded any videos yet.</p>
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
                    src={video.videoUrl} 
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

export default UserProfile; 