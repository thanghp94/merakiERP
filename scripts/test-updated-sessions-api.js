const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testUpdatedSessionsAPI() {
  console.log('🔍 Testing updated sessions API...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Get a session ID to test with
    const { data: sessions, error: sessionError } = await supabase
      .from('sessions')
      .select('id')
      .limit(1);
    
    if (sessionError || !sessions || sessions.length === 0) {
      console.error('❌ No sessions found to test with');
      return;
    }
    
    const sessionId = sessions[0].id;
    console.log(`🎯 Testing with session ID: ${sessionId}`);
    
    // Test the manual join approach directly
    console.log('\n📋 Testing manual join approach...');
    
    // Get session
    const { data: session, error: sessionErr } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (sessionErr) {
      console.error('❌ Session fetch failed:', sessionErr);
      return;
    }
    
    console.log('✅ Session fetched:', {
      id: session.id,
      lesson_id: session.lesson_id,
      subject_type: session.subject_type
    });
    
    // Get main session
    const { data: mainSession, error: mainErr } = await supabase
      .from('main_sessions')
      .select(`
        main_session_id,
        main_session_name,
        scheduled_date,
        class_id,
        classes (
          id,
          class_name,
          data
        )
      `)
      .eq('main_session_id', session.lesson_id)
      .single();
    
    if (mainErr) {
      console.error('❌ Main session fetch failed:', mainErr);
      return;
    }
    
    console.log('✅ Main session fetched:', {
      main_session_id: mainSession.main_session_id,
      main_session_name: mainSession.main_session_name,
      class_id: mainSession.class_id,
      class_name: mainSession.classes?.class_name
    });
    
    // Get teacher
    const { data: teacher, error: teacherErr } = await supabase
      .from('employees')
      .select('id, full_name')
      .eq('id', session.teacher_id)
      .single();
    
    if (teacherErr) {
      console.error('❌ Teacher fetch failed:', teacherErr);
    } else {
      console.log('✅ Teacher fetched:', teacher);
    }
    
    // Combine data
    const combinedData = {
      ...session,
      main_sessions: mainSession,
      teacher: teacher
    };
    
    console.log('\n🎉 Combined data structure:');
    console.log('- Session ID:', combinedData.id);
    console.log('- Main Session Name:', combinedData.main_sessions?.main_session_name);
    console.log('- Class ID:', combinedData.main_sessions?.class_id);
    console.log('- Class Name:', combinedData.main_sessions?.classes?.class_name);
    console.log('- Teacher:', combinedData.teacher?.full_name);
    
    console.log('\n✅ Manual join approach works! The attendance modal should now be able to get the class_id.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testUpdatedSessionsAPI();
