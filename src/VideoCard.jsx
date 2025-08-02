import React, { useState, useEffect } from 'react';
import { interactionAPI, profileAPI } from './api';
import Comments from './components/Comments';

export default function VideoCard({ video, currentUser, onVideoUpdate, onUserClick }) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(video.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(video.comments?.length || 0);
  const [loading, setLoading] = useState(false);
  const [viewCount, setViewCount] = useState(video.viewCount || 0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const videoUrl = video.videoUrl ? video.videoUrl : (video.url || '');
  const username = video.uploadedBy?.username || video.user || 'Unknown User';
  const uploadedBy = video.uploadedBy;

  // Debug: log video info
  console.log('Video data:', video);
  console.log('Video URL:', videoUrl);

  useEffect(() => {
    // Check if current user has liked this video
    if (currentUser && video.likes) {
      setIsLiked(video.likes.some(like => like._id === currentUser._id || like === currentUser._id));
    }
    setViewCount(video.viewCount || 0);
    
    // Check if current user is following the video uploader
    if (currentUser && uploadedBy && uploadedBy.followers) {
      setIsFollowing(uploadedBy.followers.some(follower => 
        follower._id === currentUser._id || follower === currentUser._id
      ));
    }
  }, [currentUser, video.likes, video.viewCount, uploadedBy]);

  const handleLike = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const result = await interactionAPI.toggleLike(video._id);
      setIsLiked(result.isLiked);
      setLikesCount(result.likesCount);
      onVideoUpdate && onVideoUpdate(video._id, { likesCount: result.likesCount });
    } catch (error) {
      console.error('Failed to like video:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser || !uploadedBy) return;
    
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await profileAPI.unfollowUser(uploadedBy._id);
        setIsFollowing(false);
      } else {
        await profileAPI.followUser(uploadedBy._id);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Failed to follow/unfollow user:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUserClick = () => {
    if (onUserClick && uploadedBy) {
      onUserClick(uploadedBy.username);
    }
  };

  const handleCommentAdded = (newComment) => {
    setCommentsCount(prev => prev + 1);
    onVideoUpdate && onVideoUpdate(video._id, { commentsCount: commentsCount + 1 });
  };

  const handleVideoPlay = () => {
    // Increment view count when video starts playing
    interactionAPI.incrementView(video._id)
      .then(res => {
        if (res && typeof res.viewCount === 'number') {
          setViewCount(res.viewCount);
          onVideoUpdate && onVideoUpdate(video._id, { viewCount: res.viewCount });
        }
      })
      .catch(console.error);
  };

  const isOwnVideo = currentUser && uploadedBy && currentUser._id === uploadedBy._id;

  return (
    <div className="video-card">
      <video 
        className="video-player" 
        src={videoUrl} 
        controls 
        loop 
        playsInline 
        onPlay={handleVideoPlay}
      />
      <div className="video-overlay">
        <div className="video-info">
          <div className="video-user-section">
            <span 
              className="video-user clickable"
              onClick={handleUserClick}
            >
              @{username}
            </span>
            {!isOwnVideo && currentUser && uploadedBy && (
              <button 
                className={`follow-btn-small ${isFollowing ? 'following' : ''}`}
                onClick={handleFollowToggle}
                disabled={followLoading}
              >
                {followLoading ? '...' : (isFollowing ? '✓' : '+')}
              </button>
            )}
          </div>
          <span className="video-title">{video.title}</span>
          {video.description && (
            <span className="video-description">{video.description}</span>
          )}
        </div>
        <div className="video-actions">
          <button 
            className={`like-btn ${isLiked ? 'liked' : ''}`}
            onClick={handleLike}
            disabled={loading}
          >
            {isLiked ? '❤️' : '🤍'} {likesCount}
          </button>
          <button 
            className="comment-btn"
            onClick={() => setShowComments(!showComments)}
          >
            💬 {commentsCount}
          </button>
          <span className="view-count">👁️ {viewCount}</span>
          <button className="share-btn">🔗</button>
        </div>
      </div>
      
      {showComments && (
        <div className="comments-overlay">
          <Comments 
            videoId={video._id} 
            currentUser={currentUser}
            onCommentAdded={handleCommentAdded}
          />
        </div>
      )}
    </div>
  )
} 