const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkSessionsData() {
  console.log('🔍 Checking sessions data...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // First, check if we have any sessions at all
    console.log('📋 Checking all sessions...');
    const { data: allSessions, error: allError } = await supabase
      .from('sessions')
      .select('*')
      .limit(5);
    
    if (allError) {
      console.error('❌ Error fetching sessions:', allError);
      return;
    }
    
    console.log(`✅ Found ${allSessions?.length || 0} sessions total`);
    
    if (allSessions && allSessions.length > 0) {
      console.log('\nFirst session:');
      console.log(`  ID: ${allSessions[0].id}`);
      console.log(`  Main Session ID: ${allSessions[0].main_session_id}`);
      console.log(`  Subject Type: ${allSessions[0].subject_type}`);
      console.log(`  Date: ${allSessions[0].date}`);
      console.log(`  Start Time: ${allSessions[0].start_time}`);
      console.log(`  Data:`, allSessions[0].data);
      
      // Now test with joins using the correct foreign key
      console.log('\n📋 Testing with joins...');
      const { data: sessionsWithJoins, error: joinError } = await supabase
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
        .limit(3);
      
      if (joinError) {
        console.error('❌ Error with joins:', joinError);
        return;
      }
      
      console.log(`✅ Joins successful! Found ${sessionsWithJoins?.length || 0} sessions with joins`);
      
      if (sessionsWithJoins && sessionsWithJoins.length > 0) {
        const session = sessionsWithJoins[0];
        console.log('\nFirst session with joins:');
        console.log(`  ID: ${session.id}`);
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
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkSessionsData();
