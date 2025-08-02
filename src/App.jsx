import './App.css'
import VideoFeed from './VideoFeed'
import Auth from './components/Auth'
import VideoUpload from './components/VideoUpload'
import Profile from './components/Profile'
import UserProfile from './components/UserProfile'
import FollowingFeed from './components/FollowingFeed'
import VideoFilterBar from './components/VideoFilterBar'
import { useEffect, useState } from 'react'
import { authAPI, videoAPI } from './api'

function App() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstall, setShowInstall] = useState(false)
  const [user, setUser] = useState(null)
  const [videos, setVideos] = useState([])
  const [currentView, setCurrentView] = useState('home') // 'home', 'upload', 'profile', 'userProfile', 'following'
  const [viewingUser, setViewingUser] = useState(null) // username of user being viewed
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ category: 'All', search: '', tag: '' })

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstall(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      if (authAPI.isLoggedIn()) {
        try {
          const userData = await authAPI.getCurrentUser()
          setUser(userData)
        } catch (error) {
          authAPI.logout()
        }
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  // Load videos (with filters) - only for home view
  useEffect(() => {
    if (currentView === 'home') {
      const loadVideos = async () => {
        try {
          const params = {}
          if (filters.category && filters.category !== 'All') params.category = filters.category
          if (filters.search) params.search = filters.search
          if (filters.tag) params.search = filters.tag
          const videosData = await videoAPI.getAllVideos(params)
          setVideos(videosData)
        } catch (error) {
          console.error('Failed to load videos:', error)
        }
      }
      loadVideos()
    }
  }, [filters, currentView])

  const handleAuthSuccess = (userData) => {
    setUser(userData)
  }

  const handleLogout = () => {
    authAPI.logout()
    setUser(null)
    setCurrentView('home')
    setViewingUser(null)
  }

  const handleUploadSuccess = (newVideo) => {
    setVideos([newVideo, ...videos])
    setCurrentView('home')
  }

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser)
  }

  const handleVideoUpdate = (videoId, updates) => {
    setVideos(prevVideos => 
      prevVideos.map(video => 
        video._id === videoId ? { ...video, ...updates } : video
      )
    )
  }

  const handleVideoDeleted = (videoId) => {
    setVideos(prevVideos => prevVideos.filter(video => video._id !== videoId))
  }

  const handleUserClick = (username) => {
    setViewingUser(username)
    setCurrentView('userProfile')
  }

  const handleBackToHome = () => {
    setCurrentView('home')
    setViewingUser(null)
  }

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      deferredPrompt.userChoice.then(() => {
        setShowInstall(false)
        setDeferredPrompt(null)
      })
    }
  }

  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters })
  }

  const renderMainContent = () => {
    if (loading) {
      return <div className="loading">Loading...</div>
    }

    if (!user) {
      return <Auth onAuthSuccess={handleAuthSuccess} />
    }

    switch (currentView) {
      case 'home':
        return (
          <>
            <VideoFilterBar onFilterChange={handleFilterChange} />
            <VideoFeed 
              videos={videos} 
              currentUser={user} 
              onVideoUpdate={handleVideoUpdate}
              onUserClick={handleUserClick}
            />
          </>
        )
      case 'following':
        return (
          <FollowingFeed 
            currentUser={user} 
            onVideoUpdate={handleVideoUpdate}
            onUserClick={handleUserClick}
          />
        )
      case 'upload':
        return <VideoUpload onUploadSuccess={handleUploadSuccess} />
      case 'profile':
        return (
          <Profile 
            currentUser={user} 
            onProfileUpdate={handleProfileUpdate} 
            onVideoDeleted={handleVideoDeleted} 
          />
        )
      case 'userProfile':
        return (
          <UserProfile 
            username={viewingUser}
            currentUser={user}
            onBack={handleBackToHome}
          />
        )
      default:
        return <div>View not found</div>
    }
  }

  return (
    <div className="app-container">
      {/* Top Navigation Bar */}
      <nav className="top-nav">
        <div className="logo-title">
          <img src="/z-logo.png" alt="Zmove Logo" className="z-logo" />
          <span className="brand">zmove</span>
        </div>
        <input className="search-bar" placeholder="Search sports, teams, users..." />
        <div className="nav-actions">
          {user ? (
            <div className="user-info">
              <span>Welcome, {user.username}!</span>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          ) : null}
          {showInstall && (
            <button className="install-btn" onClick={handleInstallClick}>
              Install App
            </button>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        {renderMainContent()}
      </main>

      {/* Bottom Navigation Bar */}
      {user && (
        <nav className="bottom-nav">
          <button 
            className={`nav-btn ${currentView === 'following' ? 'active' : ''}`}
            onClick={() => setCurrentView('following')}
          >
            Following
          </button>
          <button 
            className={`nav-btn ${currentView === 'home' ? 'active' : ''}`}
            onClick={() => setCurrentView('home')}
          >
            Home
          </button>
          <button 
            className={`nav-btn ${currentView === 'upload' ? 'active' : ''}`}
            onClick={() => setCurrentView('upload')}
          >
            Upload
          </button>
          <button 
            className={`nav-btn ${currentView === 'profile' ? 'active' : ''}`}
            onClick={() => setCurrentView('profile')}
          >
            Profile
          </button>
        </nav>
      )}
    </div>
  )
}

export default App
