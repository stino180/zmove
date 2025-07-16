const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to get auth token
const getToken = () => localStorage.getItem('token');

// Helper function to set auth token
const setToken = (token) => localStorage.setItem('token', token);

// Helper function to remove auth token
const removeToken = () => localStorage.removeItem('token');

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Authentication API functions
export const authAPI = {
  // Register a new user
  register: async (userData) => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    setToken(data.token);
    return data;
  },

  // Login user
  login: async (credentials) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    setToken(data.token);
    return data;
  },

  // Get current user
  getCurrentUser: async () => {
    return await apiRequest('/auth/me');
  },

  // Logout
  logout: () => {
    removeToken();
  },

  // Check if user is logged in
  isLoggedIn: () => {
    return !!getToken();
  },
};

// Video API functions
export const videoAPI = {
  // Upload a video
  uploadVideo: async (formData) => {
    const token = getToken();
    
    const response = await fetch(`${API_BASE_URL}/videos/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData, // Don't set Content-Type for FormData
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Upload failed');
    }
    
    return data;
  },

  // Get all videos with search and filter
  getAllVideos: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(`/videos${queryString ? `?${queryString}` : ''}`);
  },

  // Get categories
  getCategories: async () => {
    return await apiRequest('/videos/categories');
  },

  // Get trending tags
  getTrendingTags: async () => {
    return await apiRequest('/videos/trending-tags');
  },

  // Get user's videos
  getUserVideos: async () => {
    return await apiRequest('/videos/my-videos');
  },

  // Get single video
  getVideo: async (videoId) => {
    return await apiRequest(`/videos/${videoId}`);
  },

  // Delete video
  deleteVideo: async (videoId) => {
    return await apiRequest(`/videos/${videoId}`, {
      method: 'DELETE',
    });
  },
};

// Profile API functions
export const profileAPI = {
  // Get user profile by username
  getUserProfile: async (username) => {
    return await apiRequest(`/profiles/${username}`);
  },

  // Get current user's profile
  getMyProfile: async () => {
    return await apiRequest('/profiles/me/profile');
  },

  // Update profile
  updateProfile: async (profileData) => {
    return await apiRequest('/profiles/update', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Follow user
  followUser: async (userId) => {
    return await apiRequest(`/profiles/follow/${userId}`, {
      method: 'POST',
    });
  },

  // Unfollow user
  unfollowUser: async (userId) => {
    return await apiRequest(`/profiles/unfollow/${userId}`, {
      method: 'POST',
    });
  },

  // Upload avatar
  uploadAvatar: async (file) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await fetch(`${API_BASE_URL}/profiles/upload-avatar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Avatar upload failed');
    }
    return data;
  },
};

// Interaction API functions
export const interactionAPI = {
  // Like/unlike video
  toggleLike: async (videoId) => {
    return await apiRequest(`/interactions/like/${videoId}`, {
      method: 'POST',
    });
  },

  // Add comment
  addComment: async (videoId, text) => {
    return await apiRequest(`/interactions/comment/${videoId}`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  // Get comments
  getComments: async (videoId) => {
    return await apiRequest(`/interactions/comments/${videoId}`);
  },

  // Delete comment
  deleteComment: async (videoId, commentId) => {
    return await apiRequest(`/interactions/comment/${videoId}/${commentId}`, {
      method: 'DELETE',
    });
  },

  // Increment view count
  incrementView: async (videoId) => {
    return await apiRequest(`/interactions/view/${videoId}`, {
      method: 'POST',
    });
  },
}; 