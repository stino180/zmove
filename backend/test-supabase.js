const supabase = require('./config/supabase');

async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase connection...\n');

  try {
    // Test connection by listing buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return;
    }

    console.log('✅ Supabase connection successful!');
    console.log('📦 Available buckets:', buckets.map(b => b.name));

    // Check if required buckets exist
    const requiredBuckets = ['videos', 'avatars'];
    const existingBuckets = buckets.map(b => b.name);
    
    console.log('\n🔍 Checking required buckets:');
    requiredBuckets.forEach(bucket => {
      if (existingBuckets.includes(bucket)) {
        console.log(`✅ ${bucket} bucket exists`);
      } else {
        console.log(`❌ ${bucket} bucket missing - please create it in Supabase dashboard`);
      }
    });

    // Test upload to videos bucket
    console.log('\n🧪 Testing video upload...');
    const testFileName = `test-${Date.now()}.txt`;
    const testContent = 'This is a test file for ZMove video storage';
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('videos')
      .upload(testFileName, testContent, {
        contentType: 'text/plain'
      });

    if (uploadError) {
      console.log('❌ Video upload test failed:', uploadError.message);
    } else {
      console.log('✅ Video upload test successful!');
      
      // Test getting public URL
      const { data: urlData } = supabase.storage
        .from('videos')
        .getPublicUrl(testFileName);
      
      console.log('🔗 Public URL:', urlData.publicUrl);
      
      // Clean up test file
      const { error: deleteError } = await supabase.storage
        .from('videos')
        .remove([testFileName]);
      
      if (deleteError) {
        console.log('⚠️  Could not delete test file:', deleteError.message);
      } else {
        console.log('🧹 Test file cleaned up');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testSupabaseConnection();
