const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const API_BASE_URL = 'http://localhost:3000';

// Create a test image file
function createTestImage() {
  const testImagePath = path.join(__dirname, 'test-image.txt');
  const testContent = 'This is a test file simulating an image upload';
  fs.writeFileSync(testImagePath, testContent);
  return testImagePath;
}

async function testMediaUpload() {
  console.log('🧪 Testing Media Upload Functionality\n');

  try {
    // Step 1: Create test file
    console.log('1. Creating test file...');
    const testFilePath = createTestImage();
    console.log('✅ Test file created:', testFilePath);

    // Step 2: Test API endpoint
    console.log('\n2. Testing upload API endpoint...');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath), {
      filename: 'test-image.jpg',
      contentType: 'image/jpeg'
    });
    formData.append('sessionId', 'test-session-id');
    formData.append('className', 'Test Class');
    formData.append('sessionName', 'Test Session');

    const response = await fetch(`${API_BASE_URL}/api/sessions/upload-media-supabase`, {
      method: 'POST',
      body: formData,
      headers: {
        ...formData.getHeaders()
      }
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Upload API test successful');
      console.log('Response:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Upload API test failed');
      console.log('Status:', response.status);
      console.log('Error:', JSON.stringify(result, null, 2));
    }

    // Step 3: Clean up
    console.log('\n3. Cleaning up...');
    fs.unlinkSync(testFilePath);
    console.log('✅ Test file cleaned up');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    
    // Clean up on error
    const testFilePath = path.join(__dirname, 'test-image.txt');
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🚀 Media Upload Test Suite\n');
  
  // Check if development server is running
  console.log('Checking if development server is running...');
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Development server is not running');
    console.log('Please start the server with: npm run dev');
    console.log('Then run this test again.');
    process.exit(1);
  }
  
  console.log('✅ Development server is running\n');
  
  await testMediaUpload();
  
  console.log('\n🎉 Test completed!');
  console.log('\nNext steps:');
  console.log('1. If tests passed, try uploading via the UI');
  console.log('2. Navigate to Sessions tab and click camera button');
  console.log('3. Upload a real image or video file');
}

// Add form-data dependency check
try {
  require('form-data');
  require('node-fetch');
} catch (error) {
  console.log('❌ Missing dependencies for testing');
  console.log('Please install: npm install form-data node-fetch');
  process.exit(1);
}

main().catch(console.error);
