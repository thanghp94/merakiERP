const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testSessionsWithJoins() {
  console.log('🔍 Testing sessions API with joins...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    console.log('📋 Testing direct Supabase query with joins...');
    
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select(`
        *,
        main_sessions!sessions_main_session_id_fkey (
          main_session_id,
          main_session_name,
          scheduled_date,
          class_id,
          classes (
            id,
            class_name,
            data
          )
        ),
        employees!sessions_teacher_id_fkey (
          id,
          full_name
        )
      `)
      .gte('date', '2025-08-04')
      .lte('date', '2025-08-04')
      .order('start_time', { ascending: true });
    
    if (error) {
      console.error('❌ Supabase query failed:', error);
      return;
    }
    
    console.log(`✅ Found ${sessions?.length || 0} sessions`);
    
    if (sessions && sessions.length > 0) {
      sessions.forEach((session, index) => {
        console.log(`\nSession ${index + 1}:`);
        console.log(`  ID: ${session.id}`);
        console.log(`  Subject: ${session.subject_type}`);
        console.log(`  Data subject_name: ${session.data?.subject_name || 'N/A'}`);
        console.log(`  Main Session:`, session.main_sessions ? 'Present' : 'Missing');
        
        if (session.main_sessions) {
          console.log(`    Main Session ID: ${session.main_sessions.main_session_id}`);
          console.log(`    Main Session Name: ${session.main_sessions.main_session_name}`);
          console.log(`    Class ID: ${session.main_sessions.class_id}`);
          console.log(`    Classes:`, session.main_sessions.classes ? 'Present' : 'Missing');
          
          if (session.main_sessions.classes) {
            console.log(`      Class Name: ${session.main_sessions.classes.class_name}`);
          }
        }
        
        console.log(`  Teacher:`, session.employees ? session.employees.full_name : 'N/A');
      });
    }
    
    console.log('\n📋 Testing via API endpoint...');
    
    // Test the API endpoint
    const apiResponse = await fetch(`http://localhost:3000/api/sessions?start_date=2025-08-04&end_date=2025-08-04`);
    
    if (!apiResponse.ok) {
      console.error('❌ API request failed:', apiResponse.status, apiResponse.statusText);
      return;
    }
    
    const apiResult = await apiResponse.json();
    
    if (!apiResult.success) {
      console.error('❌ API returned error:', apiResult.message);
      return;
    }
    
    console.log(`✅ API returned ${apiResult.data?.length || 0} sessions`);
    
    if (apiResult.data && apiResult.data.length > 0) {
      const firstSession = apiResult.data[0];
      console.log('\nFirst session from API:');
      console.log(`  Has main_sessions: ${firstSession.main_sessions ? 'Yes' : 'No'}`);
      if (firstSession.main_sessions) {
        console.log(`  Class name: ${firstSession.main_sessions.classes?.class_name || 'N/A'}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testSessionsWithJoins();
