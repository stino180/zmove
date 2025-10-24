const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const https = require('https');
const http = require('http');
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
  res.send('API is running on both HTTP and HTTPS');
});

// HTTP Server (always runs)
const HTTP_PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);

// Redirect HTTP to HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

httpServer.listen(HTTP_PORT, () => {
  console.log(`✅ HTTP Server running on port ${HTTP_PORT}`);
  console.log(`🌐 Visit: http://localhost:${HTTP_PORT}`);
});

// HTTPS Server (only if certificates exist)
const HTTPS_PORT = process.env.HTTPS_PORT || 5001;
const certPath = path.join(__dirname, 'certs');
const keyPath = path.join(certPath, 'key.pem');
const certPathFile = path.join(certPath, 'cert.pem');

if (fs.existsSync(keyPath) && fs.existsSync(certPathFile)) {
  try {
    const sslOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPathFile)
    };

    const httpsServer = https.createServer(sslOptions, app);
    httpsServer.listen(HTTPS_PORT, () => {
      console.log(`🔒 HTTPS Server running on port ${HTTPS_PORT}`);
      console.log(`🔐 Visit: https://localhost:${HTTPS_PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start HTTPS server:', error.message);
    console.log('✅ HTTP server is still running on port', HTTP_PORT);
  }
} else {
  console.log('\n🔒 SSL certificates not found. HTTPS server not started.');
  console.log('📁 Expected files:');
  console.log(`   - ${keyPath}`);
  console.log(`   - ${certPathFile}`);
  console.log('\n💡 To enable HTTPS:');
  console.log('   1. Install OpenSSL from: https://slproweb.com/products/Win32OpenSSL.html');
  console.log('   2. Run: npm run generate-cert');
  console.log('   3. Or place your own key.pem and cert.pem files in the certs/ directory');
  console.log('\n✅ HTTP server is running on port', HTTP_PORT);
}
