import React, { useState, useEffect } from 'react';
import { interactionAPI } from '../api';

const Comments = ({ videoId, currentUser, onCommentAdded }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadComments();
  }, [videoId]);

  const loadComments = async () => {
    try {
      const commentsData = await interactionAPI.getComments(videoId);
      setComments(commentsData);
    } catch (err) {
      console.error('Failed to load comments:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    setError('');

    try {
      const result = await interactionAPI.addComment(videoId, newComment);
      setComments([result.comment, ...comments]);
      setNewComment('');
      onCommentAdded && onCommentAdded(result.comment);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await interactionAPI.deleteComment(videoId, commentId);
      setComments(comments.filter(comment => comment._id !== commentId));
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="comments-section">
      <h3>Comments ({comments.length})</h3>
      
      {error && <div className="error-message">{error}</div>}
      
      {/* Add Comment Form */}
      {currentUser && (
        <form onSubmit={handleSubmit} className="comment-form">
          <div className="comment-input-group">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              maxLength="500"
              disabled={loading}
            />
            <button type="submit" disabled={loading || !newComment.trim()}>
              {loading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="comments-list">
        {comments.length === 0 ? (
          <p className="no-comments">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="comment-item">
              <div className="comment-header">
                <div className="comment-user">
                  <div className="comment-avatar">
                    {comment.user.avatar ? (
                      <img src={comment.user.avatar} alt={comment.user.username} />
                    ) : (
                      <div className="avatar-placeholder">
                        {comment.user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="comment-info">
                    <span className="comment-username">@{comment.user.username}</span>
                    <span className="comment-date">{formatDate(comment.createdAt)}</span>
                  </div>
                </div>
                {(currentUser?._id === comment.user._id || currentUser?._id === comment.video?.uploadedBy) && (
                  <button
                    className="delete-comment-btn"
                    onClick={() => handleDeleteComment(comment._id)}
                    title="Delete comment"
                  >
                    ×
                  </button>
                )}
              </div>
              <p className="comment-text">{comment.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Comments; 