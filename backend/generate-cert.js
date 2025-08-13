const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create certs directory if it doesn't exist
const certsDir = path.join(__dirname, 'certs');
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir);
}

console.log('Generating self-signed SSL certificate...');

try {
  // Generate private key
  execSync('openssl genrsa -out certs/key.pem 2048', { stdio: 'inherit' });
  
  // Generate certificate signing request
  execSync('openssl req -new -key certs/key.pem -out certs/csr.pem -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"', { stdio: 'inherit' });
  
  // Generate self-signed certificate
  execSync('openssl x509 -req -days 365 -in certs/csr.pem -signkey certs/key.pem -out certs/cert.pem', { stdio: 'inherit' });
  
  console.log('SSL certificates generated successfully!');
  console.log('Files created in backend/certs/ directory:');
  console.log('- key.pem (private key)');
  console.log('- cert.pem (certificate)');
  console.log('- csr.pem (certificate signing request)');
  
} catch (error) {
  console.error('Error generating certificates:', error.message);
  console.log('\nIf you don\'t have OpenSSL installed, you can:');
  console.log('1. Install OpenSSL from https://slproweb.com/products/Win32OpenSSL.html');
  console.log('2. Or use the pre-generated certificates in the certs/ directory');
}
