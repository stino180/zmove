const fs = require('fs');
const path = require('path');

console.log('🔒 HTTPS Setup for zmove\n');

const certsDir = path.join(__dirname, 'certs');
const keyPath = path.join(certsDir, 'key.pem');
const certPath = path.join(certsDir, 'cert.pem');

// Check if certificates exist
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  console.log('✅ SSL certificates found!');
  console.log('🔐 You can now run: npm run start:https-simple');
  console.log('🌐 This will start both HTTP and HTTPS servers');
} else {
  console.log('❌ SSL certificates not found');
  console.log('\n📁 Creating certs directory...');
  
  if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir);
    console.log('✅ Created certs directory');
  }
  
  console.log('\n💡 To enable HTTPS, you have several options:\n');
  
  console.log('🔧 Option 1: Install OpenSSL and generate certificates');
  console.log('   1. Download OpenSSL from: https://slproweb.com/products/Win32OpenSSL.html');
  console.log('   2. Install and add to PATH');
  console.log('   3. Run: npm run generate-cert');
  console.log('\n🔧 Option 2: Use pre-generated certificates');
  console.log('   1. Download sample certificates from a trusted source');
  console.log('   2. Place key.pem and cert.pem in the certs/ directory');
  console.log('\n🔧 Option 3: Use Let\'s Encrypt (for production)');
  console.log('   1. Use certbot or similar tool');
  console.log('   2. Place the generated certificates in certs/ directory');
  
  console.log('\n📋 For now, you can:');
  console.log('   - Run: npm start (HTTP only)');
  console.log('   - Run: npm run start:https-simple (HTTP + HTTPS if certs exist)');
  
  console.log('\n⚠️  Note: Self-signed certificates will show browser warnings in development');
  console.log('   This is normal and expected for local development');
}

console.log('\n🚀 Ready to set up HTTPS!');

