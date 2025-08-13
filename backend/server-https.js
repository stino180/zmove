const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const mongoose = require('mongoose');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      mediaSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth
  message: 'Too many authentication attempts, please try again later.',
});

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://zmove.xyz', 'https://www.zmove.xyz'] 
    : ['https://localhost:3000', 'https://localhost:5173', 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(limiter);
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Routes
const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/videos');
const profileRoutes = require('./routes/profiles');
const interactionRoutes = require('./routes/interactions');

app.use('/api/auth', authLimiter, authRoutes);
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
  res.send('HTTPS API is running');
});

// SSL options
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certs', 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certs', 'cert.pem'))
};

const PORT = process.env.HTTPS_PORT || 5001;
const httpsServer = https.createServer(sslOptions, app);

httpsServer.listen(PORT, () => {
  console.log(`HTTPS Server running on port ${PORT}`);
  console.log(`Visit: https://localhost:${PORT}`);
});
