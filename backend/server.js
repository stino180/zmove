const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Routes
const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/videos');
const profileRoutes = require('./routes/profiles');
const interactionRoutes = require('./routes/interactions');

app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/interactions', interactionRoutes);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));
app.use('/uploads/avatars', express.static('uploads/avatars'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });

app.get('/', (req, res) => {
  res.send('API is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 