const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkMainSessionsSchema() {
  console.log('🔍 Checking main_sessions table schema...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Try to get the table structure by querying with limit 0
    console.log('📋 Attempting to query main_sessions table structure...');
    
    const { data, error } = await supabase
      .from('main_sessions')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error querying main_sessions:', error);
      console.log('\nThis error might tell us which columns exist or don\'t exist.');
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Successfully queried main_sessions table');
      console.log('\nSample record structure:');
      const sampleRecord = data[0];
      
      Object.keys(sampleRecord).forEach(key => {
        const value = sampleRecord[key];
        const type = typeof value;
        console.log(`  ${key}: ${type} = ${value}`);
      });
    } else {
      console.log('✅ Table exists but no records found');
    }
    
    // Try to insert a test record to see what columns are expected
    console.log('\n🧪 Testing insert to identify required columns...');
    
    const testData = {
      main_session_name: 'TEST_SCHEMA_CHECK',
      scheduled_date: '2025-08-15',
      class_id: null,
      lesson_id: 'TEST'
    };
    
    console.log('Attempting insert with minimal data:', testData);
    
    const { data: insertData, error: insertError } = await supabase
      .from('main_sessions')
      .insert(testData)
      .select()
      .single();
    
    if (insertError) {
      console.log('\n❌ Insert failed (this helps identify required columns):');
      console.log('Error:', insertError.message);
      console.log('Code:', insertError.code);
      console.log('Details:', insertError.details);
      console.log('Hint:', insertError.hint);
    } else {
      console.log('\n✅ Insert successful! Cleaning up...');
      
      // Clean up the test record
      await supabase
        .from('main_sessions')
        .delete()
        .eq('main_session_id', insertData.main_session_id);
      
      console.log('Test record cleaned up.');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkMainSessionsSchema();
