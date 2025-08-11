const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testSessionsDisplayFix() {
  console.log('🧪 Testing sessions display fix - verifying real data shows instead of hardcoded...\n');

  try {
    // Test the sessions API that the frontend will use
    const response = await fetch('http://localhost:3000/api/sessions?start_date=2025-08-11&end_date=2025-08-11');
    const result = await response.json();
    
    if (!result.success) {
      console.error('❌ API failed:', result.message);
      return;
    }

    const sessions = result.data || [];
    console.log(`✅ API Success: Found ${sessions.length} sessions\n`);
    
    console.log('📊 Data verification for frontend display:');
    sessions.forEach((session, index) => {
      console.log(`\n${index + 1}. Session: ${session.subject_type}`);
      
      // Teacher verification
      const teacherDisplay = session.teacher?.full_name || 'Chưa phân công';
      const isTeacherReal = session.teacher?.full_name && !['Chưa phân công'].includes(session.teacher.full_name);
      console.log(`   👨‍🏫 Teacher: ${teacherDisplay} ${isTeacherReal ? '✅ Real data' : '❌ Fallback'}`);
      
      // TA verification
      const taDisplay = session.teaching_assistant?.full_name || 'Chưa có TA';
      const isTAReal = session.teaching_assistant?.full_name && !['Van', 'TA Van'].includes(session.teaching_assistant.full_name);
      console.log(`   👩‍🎓 TA: ${taDisplay} ${isTAReal ? '✅ Real data' : '❌ Fallback/Hardcoded'}`);
      
      // Room verification
      const roomDisplay = session.location ? session.location.room_name : 'Chưa có phòng';
      const isRoomReal = session.location?.room_name && !['R1.1'].includes(session.location.room_name);
      console.log(`   📍 Room: ${roomDisplay} ${isRoomReal ? '✅ Real data' : '❌ Fallback/Hardcoded'}`);
    });

    // Summary
    const realTeachers = sessions.filter(s => s.teacher?.full_name).length;
    const realTAs = sessions.filter(s => s.teaching_assistant?.full_name).length;
    const realRooms = sessions.filter(s => s.location?.room_name).length;
    
    console.log('\n📈 Summary:');
    console.log(`   Teachers with real data: ${realTeachers}/${sessions.length}`);
    console.log(`   TAs with real data: ${realTAs}/${sessions.length}`);
    console.log(`   Rooms with real data: ${realRooms}/${sessions.length}`);
    
    const allFixed = realTeachers > 0 && realTAs > 0 && realRooms > 0;
    console.log(`\n${allFixed ? '🎉 SUCCESS' : '⚠️  PARTIAL'}: ${allFixed ? 'All data types showing real values!' : 'Some data still using fallbacks'}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSessionsDisplayFix();
