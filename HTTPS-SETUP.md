# 🔒 HTTPS Setup Guide for zmove

This guide will help you enable HTTPS for your zmove application, both in development and production.

## 🚀 Quick Start

### 1. Check Current Setup
```bash
cd backend
npm run setup-https
```

This will tell you if you have SSL certificates and what to do next.

### 2. Start the Server
```bash
# Start HTTP only (default)
npm start

# Start HTTP + HTTPS (if certificates exist)
npm run start:https-simple

# Start combined server (HTTP + HTTPS)
npm run start:combined
```

## 📋 Prerequisites

- Node.js installed
- npm or yarn package manager
- MongoDB connection configured

## 🔐 SSL Certificate Options

### Option 1: Self-Signed Certificates (Development)

#### Install OpenSSL on Windows:
1. Download from: https://slproweb.com/products/Win32OpenSSL.html
2. Install and add to PATH
3. Generate certificates:
```bash
npm run generate-cert
```

#### Generate certificates manually:
```bash
# Create private key
openssl genrsa -out certs/key.pem 2048

# Create certificate signing request
openssl req -new -key certs/key.pem -out certs/csr.pem -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Create self-signed certificate
openssl x509 -req -days 365 -in certs/csr.pem -signkey certs/key.pem -out certs/cert.pem
```

### Option 2: Let's Encrypt (Production)

For production, use Let's Encrypt free certificates:

1. Install certbot: https://certbot.eff.org/
2. Generate certificates for your domain
3. Place the generated files in the `certs/` directory:
   - `key.pem` (private key)
   - `cert.pem` (certificate)

### Option 3: Commercial Certificates

Purchase SSL certificates from providers like:
- DigiCert
- GlobalSign
- Comodo
- GoDaddy

## 🏃‍♂️ Running the Application

### Development Mode

1. **HTTP Only:**
```bash
npm start
# Server runs on http://localhost:5000
```

2. **HTTP + HTTPS:**
```bash
npm run start:https-simple
# HTTP: http://localhost:5000
# HTTPS: https://localhost:5001 (if certificates exist)
```

3. **Combined Server:**
```bash
npm run start:combined
# Runs both HTTP and HTTPS simultaneously
```

### Production Mode

1. Set environment variables:
```bash
NODE_ENV=production
HTTPS_PORT=443
PORT=80
```

2. Start the server:
```bash
npm run start:https-simple
```

## 🌐 Frontend Configuration

The frontend automatically detects the protocol and uses the appropriate API endpoint:

- **HTTP page** → HTTP API calls
- **HTTPS page** → HTTPS API calls

### Manual Configuration

Edit `src/config.js` to customize API endpoints:

```javascript
const config = {
  development: {
    apiBaseUrl: 'http://localhost:5000/api',
    httpsApiBaseUrl: 'https://localhost:5001/api',
    useHttps: false, // Set to true to force HTTPS
  }
};
```

## 🔧 Troubleshooting

### Common Issues

1. **"SSL certificates not found"**
   - Run `npm run setup-https` for guidance
   - Ensure `key.pem` and `cert.pem` exist in `certs/` directory

2. **"Failed to start HTTPS server"**
   - Check certificate file permissions
   - Verify certificate format (PEM)
   - Check for port conflicts

3. **Browser security warnings**
   - Self-signed certificates show warnings (normal for development)
   - Click "Advanced" → "Proceed to localhost" in Chrome
   - Add security exception in Firefox

4. **CORS errors**
   - Ensure CORS origins include both HTTP and HTTPS URLs
   - Check `server-https-simple.js` CORS configuration

### Port Conflicts

If ports are in use, set custom ports:

```bash
# Set custom ports
PORT=3000 HTTPS_PORT=3443 npm run start:https-simple
```

## 📁 File Structure

```
backend/
├── certs/                 # SSL certificates directory
│   ├── key.pem           # Private key
│   └── cert.pem          # Certificate
├── server.js              # Original HTTP server
├── server-https.js        # HTTPS-only server
├── server-https-simple.js # Combined HTTP+HTTPS server
├── server-combined.js     # Alternative combined server
├── generate-cert.js       # Certificate generation script
├── setup-https.js         # HTTPS setup helper
└── package.json           # Scripts and dependencies
```

## 🔒 Security Considerations

### Development
- Self-signed certificates are fine for local development
- Browser warnings are expected and normal
- Use HTTP for quick testing, HTTPS for security testing

### Production
- Always use valid SSL certificates
- Consider using Let's Encrypt (free)
- Set up automatic certificate renewal
- Use strong security headers (already configured with helmet)

## 🚀 Next Steps

1. **For Development:**
   - Install OpenSSL and generate certificates
   - Test HTTPS functionality
   - Ensure frontend works with both protocols

2. **For Production:**
   - Obtain valid SSL certificates
   - Configure domain and DNS
   - Set up automatic HTTPS redirects
   - Test security headers and CORS

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Run `npm run setup-https` for diagnostics
3. Check server logs for error messages
4. Verify certificate files exist and are readable

---

**Happy coding with HTTPS! 🔐✨**

