import './App.css'
import VideoFeed from './VideoFeed'
import Auth from './components/Auth'
import VideoUpload from './components/VideoUpload'
import Profile from './components/Profile'
import VideoFilterBar from './components/VideoFilterBar'
import { useEffect, useState } from 'react'
import { authAPI, videoAPI } from './api'

function App() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstall, setShowInstall] = useState(false)
  const [user, setUser] = useState(null)
  const [videos, setVideos] = useState([])
  const [currentView, setCurrentView] = useState('home') // 'home', 'upload', 'profile'
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

  // Load videos (with filters)
  useEffect(() => {
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
  }, [filters])

  const handleAuthSuccess = (userData) => {
    setUser(userData)
  }

  const handleLogout = () => {
    authAPI.logout()
    setUser(null)
    setCurrentView('home')
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
        {loading ? (
          <div className="loading">Loading...</div>
        ) : !user ? (
          <Auth onAuthSuccess={handleAuthSuccess} />
        ) : (
          <>
            {currentView === 'home' && <>
              <VideoFilterBar onFilterChange={handleFilterChange} />
              <VideoFeed videos={videos} currentUser={user} onVideoUpdate={handleVideoUpdate} />
            </>}
            {currentView === 'upload' && <VideoUpload onUploadSuccess={handleUploadSuccess} />}
            {currentView === 'profile' && <Profile currentUser={user} onProfileUpdate={handleProfileUpdate} onVideoDeleted={handleVideoDeleted} />}
          </>
        )}
      </main>

      {/* Bottom Navigation Bar */}
      {user && (
        <nav className="bottom-nav">
          <button className="nav-btn">Following</button>
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
