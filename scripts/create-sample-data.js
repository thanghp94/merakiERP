const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createSampleData() {
  console.log('🔄 Creating sample main sessions and sessions...\n');

  try {
    // First, get the GS12 class ID
    const { data: classes, error: classError } = await supabase
      .from('classes')
      .select('id, class_name')
      .eq('class_name', 'GS12 test')
      .single();

    if (classError || !classes) {
      console.log('❌ GS12 class not found. Please create a class first.');
      return;
    }

    console.log('✅ Found GS12 class:', classes.class_name);
    const classId = classes.id;

    // Get an employee (teacher) ID
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, full_name')
      .limit(1)
      .single();

    if (empError || !employees) {
      console.log('❌ No employees found. Please create an employee first.');
      return;
    }

    console.log('✅ Found teacher:', employees.full_name);
    const teacherId = employees.id;

    // Create main sessions for different lesson types
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const mainSessions = [
      {
        main_session_name: 'U3 L3 GS12 - TSI',
        scheduled_date: today.toISOString().split('T')[0],
        class_id: classId,
        lesson_id: 'U3L3',
        data: {
          subject_type: 'TSI',
          start_time: '22:30',
          end_time: '23:30'
        }
      },
      {
        main_session_name: 'U2 L3 GS12 - REP',
        scheduled_date: tomorrow.toISOString().split('T')[0],
        class_id: classId,
        lesson_id: 'U2L3',
        data: {
          subject_type: 'REP',
          start_time: '00:00',
          end_time: '01:00'
        }
      }
    ];

    console.log('🔄 Creating main sessions...');
    const { data: createdMainSessions, error: mainSessionError } = await supabase
      .from('main_sessions')
      .insert(mainSessions)
      .select('*');

    if (mainSessionError) {
      console.error('❌ Error creating main sessions:', mainSessionError);
      return;
    }

    console.log(`✅ Created ${createdMainSessions.length} main sessions`);

    // Create individual sessions
    const sessions = [];

    // Create sessions for each main session
    createdMainSessions.forEach((mainSession) => {
      const sessionDate = new Date(mainSession.scheduled_date);
      const [startHour, startMinute] = mainSession.data.start_time.split(':');
      const [endHour, endMinute] = mainSession.data.end_time.split(':');
      
      const startTime = new Date(sessionDate);
      startTime.setHours(parseInt(startHour), parseInt(startMinute), 0);
      
      const endTime = new Date(sessionDate);
      endTime.setHours(parseInt(endHour), parseInt(endMinute), 0);

      sessions.push({
        lesson_id: mainSession.main_session_id,
        subject_type: mainSession.data.subject_type,
        teacher_id: teacherId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        date: mainSession.scheduled_date,
        data: {
          subject_name: mainSession.main_session_name,
          lesson_id: mainSession.lesson_id,
          subject_type: mainSession.data.subject_type,
          main_session_id: mainSession.main_session_id
        }
      });
    });

    console.log('🔄 Creating individual sessions...');
    const { data: createdSessions, error: sessionError } = await supabase
      .from('sessions')
      .insert(sessions)
      .select('*');

    if (sessionError) {
      console.error('❌ Error creating sessions:', sessionError);
      return;
    }

    console.log(`✅ Created ${createdSessions.length} individual sessions`);
    console.log('\n🎉 Sample data created successfully!');
    console.log('\nCreated sessions:');
    createdSessions.forEach(session => {
      console.log(`- ${session.data.subject_name} on ${session.date} at ${session.start_time}`);
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createSampleData();
