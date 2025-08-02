import VideoCard from './VideoCard'

export default function VideoFeed({ videos = [], currentUser, onVideoUpdate, onUserClick }) {
  if (videos.length === 0) {
    return (
      <div className="video-feed">
        <div className="no-videos">
          <p>No videos yet. Be the first to upload!</p>
        </div>
      </div>
    )
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
  )
} 