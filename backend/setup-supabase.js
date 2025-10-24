const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Supabase configuration for ZMove...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file...');
  
  let envContent = `# MongoDB
MONGODB_URI=mongodb://localhost:27017/zmove

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Server Configuration
PORT=5000
NODE_ENV=development
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created!');
} else {
  console.log('✅ .env file already exists');
}

console.log('\n📋 Next steps:');
console.log('1. Go to your Supabase project dashboard');
console.log('2. Copy your Project URL and paste it as SUPABASE_URL');
console.log('3. Copy your anon/public key and paste it as SUPABASE_ANON_KEY');
console.log('4. Create two storage buckets in Supabase:');
console.log('   - "videos" (for video uploads)');
console.log('   - "avatars" (for profile pictures)');
console.log('5. Set the buckets to public access');
console.log('6. Update your MongoDB URI if needed');
console.log('7. Set a secure JWT_SECRET');

console.log('\n🔧 Supabase Storage Bucket Setup:');
console.log('1. Go to Storage in your Supabase dashboard');
console.log('2. Create bucket named "videos"');
console.log('3. Create bucket named "avatars"');
console.log('4. Set both buckets to "Public"');
console.log('5. Configure RLS policies if needed');

console.log('\n📁 Your .env file is located at:', envPath);
console.log('\n🎉 Setup complete! Edit your .env file with your Supabase credentials.');
