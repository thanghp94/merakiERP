const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testSessionRelationship() {
  console.log('🔍 Testing session-main_session relationship...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Test different ways to query the relationship
    console.log('📋 Method 1: Direct join using lesson_id...');
    const { data: sessions1, error: error1 } = await supabase
      .from('sessions')
      .select(`
        id,
        lesson_id,
        subject_type,
        main_sessions!lesson_id (
          main_session_id,
          main_session_name,
          class_id
        )
      `)
      .limit(1);
    
    if (error1) {
      console.error('❌ Method 1 failed:', error1);
    } else {
      console.log('✅ Method 1 success:', JSON.stringify(sessions1, null, 2));
    }
    
    console.log('\n📋 Method 2: Using inner join...');
    const { data: sessions2, error: error2 } = await supabase
      .from('sessions')
      .select(`
        id,
        lesson_id,
        subject_type,
        main_sessions!inner (
          main_session_id,
          main_session_name,
          class_id
        )
      `)
      .limit(1);
    
    if (error2) {
      console.error('❌ Method 2 failed:', error2);
    } else {
      console.log('✅ Method 2 success:', JSON.stringify(sessions2, null, 2));
    }
    
    console.log('\n📋 Method 3: Manual join...');
    const { data: sessions3, error: error3 } = await supabase
      .from('sessions')
      .select('*')
      .limit(1);
    
    if (error3) {
      console.error('❌ Method 3 failed:', error3);
      return;
    }
    
    if (sessions3 && sessions3.length > 0) {
      const session = sessions3[0];
      const { data: mainSession, error: mainError } = await supabase
        .from('main_sessions')
        .select('*')
        .eq('main_session_id', session.lesson_id)
        .single();
      
      if (mainError) {
        console.error('❌ Main session lookup failed:', mainError);
      } else {
        console.log('✅ Method 3 success:');
        console.log('Session:', session);
        console.log('Main Session:', mainSession);
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testSessionRelationship();
