const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testSessions() {
  console.log('🔍 Testing sessions data...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // First, let's check sessions without joins
    console.log('📋 Checking sessions table...');
    const { data: sessions, error: sessionError } = await supabase
      .from('sessions')
      .select('*');
    
    if (sessionError) {
      console.error('❌ Error fetching sessions:', sessionError);
      return;
    }
    
    console.log('🎯 Sessions found:', sessions?.length || 0);
    sessions?.forEach(session => {
      console.log(`  - Session ID: ${session.id}, Lesson ID: ${session.lesson_id}, Subject: ${session.subject_type}`);
    });
    
    // Now let's check main_sessions
    console.log('\n📋 Checking main_sessions table...');
    const { data: mainSessions, error: mainSessionError } = await supabase
      .from('main_sessions')
      .select('*');
    
    if (mainSessionError) {
      console.error('❌ Error fetching main_sessions:', mainSessionError);
      return;
    }
    
    console.log('🎯 Main sessions found:', mainSessions?.length || 0);
    mainSessions?.forEach(session => {
      console.log(`  - Main Session ID: ${session.main_session_id}, Name: ${session.main_session_name}, Class ID: ${session.class_id}`);
    });
    
    // Test a specific session if we have any
    if (sessions && sessions.length > 0) {
      const sessionId = sessions[0].id;
      console.log(`\n🔍 Testing session API for session: ${sessionId}`);
      
      try {
        const response = await fetch(`http://localhost:3000/api/sessions/${sessionId}`);
        const result = await response.json();
        
        if (result.success) {
          console.log('✅ Session API works!');
          console.log('Session data:', JSON.stringify(result.data, null, 2));
        } else {
          console.log('❌ Session API failed:', result.message);
        }
      } catch (apiError) {
        console.log('❌ API call failed:', apiError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testSessions();
