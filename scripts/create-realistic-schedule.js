const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createRealisticSchedule() {
  console.log('🔄 Creating realistic schedule similar to your example...\n');

  try {
    // Get existing main sessions and employees
    const { data: mainSessions, error: mainError } = await supabase
      .from('main_sessions')
      .select('*')
      .limit(5);

    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*');

    if (mainError || empError) {
      console.error('❌ Error fetching data:', mainError || empError);
      return;
    }

    const teachers = employees.filter(emp => 
      emp.position?.toLowerCase().includes('teacher') || 
      emp.position?.toLowerCase().includes('giáo viên')
    );

    if (!mainSessions || mainSessions.length === 0 || teachers.length === 0) {
      console.log('❌ Need main sessions and teachers to create schedule');
      return;
    }

    // Clear existing sessions first
    await supabase.from('sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('🗑️ Cleared existing sessions\n');

    const scheduleData = [
      // Monday 2025-08-04
      {
        date: '2025-08-04',
        sessions: [
          { time: '15:30-16:30', subject: 'U3 L3 GS12', teacher: 'Hussam', location: 'R1.1 Van' },
          { time: '17:00-18:00', subject: 'U2 L3 GS12', teacher: 'Hussam', location: 'R1.1 Van' }
        ]
      },
      // Tuesday 2025-08-05  
      {
        date: '2025-08-05',
        sessions: [
          { time: '09:00-09:30', subject: 'U3 L3 GS12', teacher: 'Hussam', location: 'R1.1 Van' },
          { time: '09:30-10:30', subject: 'U3 L3 GS12', teacher: 'Hussam', location: 'R1.1 Van' },
          { time: '10:30-11:00', subject: 'U3 L3 GS12', teacher: 'Hussam', location: 'R1.1 Van' },
          { time: '11:00-11:30', subject: 'U3 L3 GS12', teacher: 'Hussam', location: 'R1.1 Van' }
        ]
      },
      // Wednesday 2025-08-06
      {
        date: '2025-08-06',
        sessions: [
          { time: '10:30-11:00', subject: 'U3 L3 GS12', teacher: 'Hussam', location: 'R1.1 Van' },
          { time: '11:00-11:30', subject: 'U3 L3 GS12', teacher: 'Hussam', location: 'R1.1 Van' }
        ]
      }
    ];

    let totalCreated = 0;

    for (const day of scheduleData) {
      console.log(`📅 Creating sessions for ${day.date}:`);
      
      for (const sessionInfo of day.sessions) {
        const [startTime, endTime] = sessionInfo.time.split('-');
        const teacher = teachers.find(t => t.full_name?.includes('Hussam')) || teachers[0];
        const mainSession = mainSessions[0]; // Use first available main session

        const startDateTime = new Date(`${day.date}T${startTime}:00Z`);
        const endDateTime = new Date(`${day.date}T${endTime}:00Z`);

        const { data: session, error } = await supabase
          .from('sessions')
          .insert({
            lesson_id: mainSession.main_session_id,
            subject_type: sessionInfo.subject.includes('U3') ? 'TSI' : 'REP',
            teacher_id: teacher.id,
            teaching_assistant_id: null,
            location_id: null,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            date: day.date,
            data: {
              subject_name: sessionInfo.subject,
              location: sessionInfo.location,
              teacher_name: sessionInfo.teacher
            }
          });

        if (error) {
          console.error(`❌ Error creating session ${sessionInfo.time}:`, error);
        } else {
          console.log(`  ✅ ${sessionInfo.time}: ${sessionInfo.subject} - ${sessionInfo.teacher} (${sessionInfo.location})`);
          totalCreated++;
        }

        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      console.log('');
    }

    console.log(`🎉 Successfully created ${totalCreated} sessions!`);
    console.log('\n📋 Schedule Summary:');
    console.log('- Monday (2025-08-04): 2 sessions (15:30-16:30, 17:00-18:00)');
    console.log('- Tuesday (2025-08-05): 4 sessions (09:00-11:30 continuous)');
    console.log('- Wednesday (2025-08-06): 2 sessions (10:30-11:30)');
    console.log('\n💡 You can now view this realistic schedule at /schedule');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
createRealisticSchedule();
