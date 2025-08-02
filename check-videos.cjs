const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const Video = require('./backend/models/Video');
    const videos = await Video.find();
    console.log('Videos in database:');
    videos.forEach(video => {
      console.log(`Title: ${video.title}`);
      console.log(`Video URL: ${video.videoUrl}`);
      console.log('---');
    });
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  }); 