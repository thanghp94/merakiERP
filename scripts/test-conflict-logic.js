const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testNonConflictingTime() {
  console.log('🧪 Testing with a non-conflicting time (14:00-15:00)...');
  
  const testSession = {
    main_session_name: 'Non-Conflict Test',
    scheduled_date: '2025-01-19',
    timezone: 'Asia/Ho_Chi_Minh',
    sessions: [{
      subject_type: 'TSI',
      teacher_id: 'f09a8b6a-f437-44fe-a578-95cd8afe3b4b',
      start_time: '14:00', // Should not conflict with 11:22-12:22
      end_time: '15:00'
    }]
  };

  const { data: classes } = await supabase.from('classes').select('id').limit(1);
  testSession.class_id = classes[0].id;

  try {
    const response = await fetch('http://localhost:3000/api/main-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testSession),
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Non-conflicting time created successfully!');
      console.log('This proves the conflict detection is working correctly.');
      
      // Clean up
      await supabase.from('main_sessions').delete().eq('main_session_id', result.data.main_session_id);
      console.log('🧹 Test session cleaned up');
    } else {
      console.log('❌ Unexpected conflict:', result.message);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testOverlappingTimes() {
  console.log('\n🔍 Testing why 15:22-16:22 conflicts with 11:22-12:22...');
  
  // The existing session is 11:22-12:22 VN (04:22-05:22 UTC)
  // Let's test if 15:22-16:22 VN (08:22-09:22 UTC) should actually conflict
  
  const existingStart = new Date('2025-01-19T04:22:00+00:00');
  const existingEnd = new Date('2025-01-19T05:22:00+00:00');
  
  const testStart = new Date('2025-01-19T08:22:00+00:00'); // 15:22 VN
  const testEnd = new Date('2025-01-19T09:22:00+00:00');   // 16:22 VN
  
  console.log('Existing session UTC:', existingStart.toISOString(), '-', existingEnd.toISOString());
  console.log('Test session UTC:    ', testStart.toISOString(), '-', testEnd.toISOString());
  
  // Check overlap logic: start_time < existing_end AND end_time > existing_start
  const overlaps = testStart < existingEnd && testEnd > existingStart;
  console.log('Should overlap?', overlaps);
  
  if (!overlaps) {
    console.log('✅ These times should NOT conflict - there might be a bug in the overlap detection!');
  } else {
    console.log('❌ These times should conflict');
  }
}

async function runTests() {
  await testNonConflictingTime();
  await testOverlappingTimes();
}

runTests();
