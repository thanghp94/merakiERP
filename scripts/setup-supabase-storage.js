const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please ensure these are set in your .env.local file:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorageBucket() {
  console.log('🚀 Setting up Supabase Storage for session media...\n');

  try {
    // Check if bucket already exists
    console.log('1. Checking existing buckets...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError.message);
      return false;
    }

    const bucketExists = buckets?.some(bucket => bucket.name === 'session-media');
    
    if (bucketExists) {
      console.log('✅ Bucket "session-media" already exists');
    } else {
      // Create the bucket
      console.log('2. Creating "session-media" bucket...');
      const { error: createError } = await supabase.storage.createBucket('session-media', {
        public: true
      });

      if (createError) {
        console.error('❌ Error creating bucket:', createError.message);
        return false;
      }
      
      console.log('✅ Successfully created "session-media" bucket');
    }

    // Test bucket access
    console.log('3. Testing bucket access...');
    const { data: files, error: listFilesError } = await supabase.storage
      .from('session-media')
      .list('', { limit: 1 });

    if (listFilesError) {
      console.error('❌ Error accessing bucket:', listFilesError.message);
      return false;
    }

    console.log('✅ Bucket access test successful');

    // Create test folder structure
    console.log('4. Testing folder creation...');
    const testContent = Buffer.from('test file for folder structure');
    const testPath = 'sessions/test-class/test-session/2025-01-08/test.txt';
    
    const { error: uploadError } = await supabase.storage
      .from('session-media')
      .upload(testPath, testContent, {
        contentType: 'text/plain',
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Error testing upload:', uploadError.message);
      return false;
    }

    console.log('✅ Test file uploaded successfully');

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('session-media')
      .getPublicUrl(testPath);

    console.log('✅ Public URL generated:', publicUrlData.publicUrl);

    // Clean up test file
    const { error: deleteError } = await supabase.storage
      .from('session-media')
      .remove([testPath]);

    if (deleteError) {
      console.warn('⚠️  Warning: Could not clean up test file:', deleteError.message);
    } else {
      console.log('✅ Test file cleaned up');
    }

    console.log('\n🎉 Supabase Storage setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Navigate to the Sessions tab');
    console.log('3. Click the camera button (📷) on any session');
    console.log('4. Test uploading an image or video');
    
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

// Run the setup
setupStorageBucket().then(success => {
  process.exit(success ? 0 : 1);
});
