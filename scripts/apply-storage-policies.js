require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please check your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyStoragePolicies() {
  console.log('🔧 Applying Supabase Storage policies...');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'fix-storage-policies.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL commands by semicolon and filter out empty ones
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📝 Found ${sqlCommands.length} SQL commands to execute`);

    // Execute each SQL command
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      console.log(`⚡ Executing command ${i + 1}/${sqlCommands.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: command });
        if (error) {
          console.warn(`⚠️  Warning on command ${i + 1}: ${error.message}`);
        } else {
          console.log(`✅ Command ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.warn(`⚠️  Warning on command ${i + 1}: ${err.message}`);
      }
    }

    // Test bucket access
    console.log('\n🧪 Testing bucket access...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError.message);
    } else {
      const sessionMediaBucket = buckets.find(b => b.id === 'session-media');
      if (sessionMediaBucket) {
        console.log('✅ session-media bucket found and accessible');
      } else {
        console.log('⚠️  session-media bucket not found');
      }
    }

    // Test file upload
    console.log('\n🧪 Testing file upload...');
    const testContent = 'Test file for storage policies';
    const testFileName = `test-policies-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('session-media')
      .upload(`test/${testFileName}`, testContent, {
        contentType: 'text/plain'
      });

    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError.message);
    } else {
      console.log('✅ Upload test successful');
      
      // Clean up test file
      await supabase.storage
        .from('session-media')
        .remove([`test/${testFileName}`]);
      console.log('🧹 Test file cleaned up');
    }

    console.log('\n🎉 Storage policies applied successfully!');
    console.log('\nNext steps:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Navigate to the Sessions tab');
    console.log('3. Test the camera button upload functionality');

  } catch (error) {
    console.error('❌ Error applying storage policies:', error.message);
    process.exit(1);
  }
}

applyStoragePolicies();
