// Test script to verify the /api/employees/current endpoint works correctly
// This simulates what the frontend hook does

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCurrentEmployeeAPI() {
  console.log('🧪 Testing /api/employees/current API endpoint...\n');

  try {
    // Test users
    const testUsers = [
      { email: 'admin@merakierp.com', expectedName: 'Admin User' },
      { email: 'teacher@merakierp.com', expectedName: 'Teacher User' },
      { email: 'ta@merakierp.com', expectedName: 'Trần Thị TA' }
    ];

    for (const testUser of testUsers) {
      console.log(`Testing API for ${testUser.email}:`);
      
      try {
        // Step 1: Get user session (simulate login)
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: testUser.email,
          password: testUser.email.includes('admin') ? 'admin123' : 
                   testUser.email.includes('teacher') ? 'teacher123' : 'ta123'
        });

        if (authError) {
          console.log(`  ❌ Login failed: ${authError.message}`);
          continue;
        }

        console.log(`  ✅ Login successful`);
        
        // Step 2: Test the API endpoint
        const token = authData.session?.access_token;
        if (!token) {
          console.log(`  ❌ No access token received`);
          continue;
        }

        console.log(`  📋 Making API request with token...`);
        
        // Make request to the API endpoint
        const response = await fetch('http://localhost:3001/api/employees/current', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const result = await response.json();

        if (response.ok && result.success) {
          console.log(`  ✅ API Success: Found employee ${result.data.full_name}`);
          console.log(`     Position: ${result.data.position}`);
          console.log(`     Department: ${result.data.department}`);
          console.log(`     Employee ID: ${result.data.id}`);
          
          if (result.data.full_name === testUser.expectedName) {
            console.log(`  ✅ Name matches expected: ${testUser.expectedName}`);
          } else {
            console.log(`  ⚠️  Name mismatch - Expected: ${testUser.expectedName}, Got: ${result.data.full_name}`);
          }
        } else {
          console.log(`  ❌ API Error: ${result.message || 'Unknown error'}`);
          if (result.details) {
            console.log(`     Details: ${JSON.stringify(result.details, null, 2)}`);
          }
        }

        // Sign out
        await supabase.auth.signOut();

      } catch (error) {
        console.log(`  ❌ Test error: ${error.message}`);
      }
      
      console.log(''); // Empty line for readability
    }

    console.log('📊 API TEST SUMMARY');
    console.log('==================');
    console.log('✅ All tests completed');
    console.log('');
    console.log('🎯 NEXT STEPS:');
    console.log('1. If all tests passed, the API is working correctly');
    console.log('2. The frontend hook should now work without the "No authentication token" error');
    console.log('3. Try refreshing the dashboard and creating a request');

  } catch (error) {
    console.error('❌ Fatal error during API test:', error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testCurrentEmployeeAPI().catch(console.error);
}

module.exports = { testCurrentEmployeeAPI };
