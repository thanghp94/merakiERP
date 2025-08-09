const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...\n');
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('📋 Environment Variables:');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Not set');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Not set');
  console.log('URL Value:', supabaseUrl || 'undefined');
  console.log();
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing environment variables. Please check your .env.local file');
    console.log('📝 Required format:');
    console.log('NEXT_PUBLIC_SUPABASE_URL=https://lunkgjarwqqkpbohneqn.supabase.co');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here');
    return;
  }
  
  // Test connection
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    console.log('🔗 Testing connection to Supabase...');
    
    // Test basic connection by trying to fetch from a system table
    const { data, error } = await supabase
      .from('students')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Connection failed:', error.message);
      
      if (error.message.includes('relation "students" does not exist')) {
        console.log('📝 The "students" table does not exist yet.');
        console.log('💡 You need to run the database schema first:');
        console.log('   1. Go to Supabase Dashboard > SQL Editor');
        console.log('   2. Run the SQL from database/schema.sql');
      } else if (error.message.includes('Invalid API key')) {
        console.log('📝 Invalid API key. Please check your NEXT_PUBLIC_SUPABASE_ANON_KEY');
      } else {
        console.log('📝 Other connection issue. Please check your configuration.');
      }
    } else {
      console.log('✅ Connection successful!');
      console.log('📊 Students table is accessible');
    }
    
  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
  }
}

testSupabaseConnection();
