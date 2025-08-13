const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function debugStudentsIssue() {
  console.log('🔍 Debugging Students Loading Issue...\n');
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('📋 Environment Variables:');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Not set');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Not set');
  console.log();
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing environment variables');
    return;
  }
  
  // Test direct Supabase connection
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    console.log('🔗 Testing direct Supabase connection to students table...');
    
    // First, check if students table exists
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'students');
    
    if (tablesError) {
      console.log('❌ Error checking table existence:', tablesError.message);
    } else if (!tables || tables.length === 0) {
      console.log('❌ Students table does not exist');
      console.log('💡 You need to create the students table first');
      return;
    } else {
      console.log('✅ Students table exists');
    }
    
    // Test basic query
    const { data, error, count } = await supabase
      .from('students')
      .select('*', { count: 'exact' });
    
    if (error) {
      console.log('❌ Direct query failed:', error.message);
      console.log('Error details:', error);
      
      if (error.message.includes('permission denied')) {
        console.log('📝 This is likely a Row Level Security (RLS) issue');
        console.log('💡 Solutions:');
        console.log('   1. Check if RLS policies are properly configured');
        console.log('   2. Ensure the user has proper permissions');
        console.log('   3. Check if the user is authenticated');
      }
    } else {
      console.log('✅ Direct query successful!');
      console.log(`📊 Found ${count} students in database`);
      console.log('Sample data:', data?.slice(0, 2));
    }
    
    // Test with authentication (simulate API call)
    console.log('\n🔐 Testing with authentication simulation...');
    
    // Check if we can access the students table with RLS
    const { data: rlsData, error: rlsError } = await supabase
      .from('students')
      .select('id, full_name, email, status')
      .limit(5);
    
    if (rlsError) {
      console.log('❌ RLS query failed:', rlsError.message);
      console.log('💡 This confirms it\'s an RLS/permissions issue');
    } else {
      console.log('✅ RLS query successful!');
      console.log('Data:', rlsData);
    }
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
  
  // Test the API endpoint directly
  console.log('\n🌐 Testing API endpoint...');
  try {
    const response = await fetch('http://localhost:3000/api/students');
    const result = await response.json();
    
    console.log('API Response Status:', response.status);
    console.log('API Response:', result);
    
    if (!result.success) {
      console.log('❌ API call failed:', result.message);
    } else {
      console.log('✅ API call successful!');
      console.log(`📊 API returned ${result.data?.length || 0} students`);
    }
  } catch (error) {
    console.log('❌ API test failed:', error.message);
    console.log('💡 Make sure the development server is running (npm run dev)');
  }
}

debugStudentsIssue().catch(console.error);
