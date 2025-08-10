const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createSampleSessions() {
  console.log('🔄 Creating sample teaching sessions...\n');

  try {
    // First, get some classes to work with
    const { data: classes, error: classError } = await supabase
      .from('classes')
      .select('*')
      .limit(3);

    if (classError) {
      console.error('❌ Error fetching classes:', classError);
      return;
    }

    if (!classes || classes.length === 0) {
      console.log('❌ No classes found. Please create some classes first.');
      return;
    }

    // Get some teachers
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*')
      .limit(5);

    if (empError) {
      console.error('❌ Error fetching employees:', empError);
      return;
    }

    const teachers = employees.filter(emp => 
      emp.position?.toLowerCase().includes('teacher') || 
      emp.position?.toLowerCase().includes('giáo viên')
    );

    const assistants = employees.filter(emp => 
      emp.position?.toLowerCase().includes('assistant') || 
      emp.position?.toLowerCase().includes('trợ giảng')
    );

    if (teachers.length === 0) {
      console.log('❌ No teachers found. Please create some teachers first.');
      return;
    }

    // Create main sessions for the next week
    const today = new Date();
    const sessions = [];

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const sessionDate = new Date(today);
      sessionDate.setDate(today.getDate() + dayOffset);
      const dateString = sessionDate.toISOString().split('T')[0];

      // Skip weekends for some variety
      if (sessionDate.getDay() === 0 || sessionDate.getDay() === 6) continue;

      for (let classIndex = 0; classIndex < Math.min(classes.length, 2); classIndex++) {
        const selectedClass = classes[classIndex];
        
        // Create a main session
        const mainSessionName = `${selectedClass.class_name}.U2.L${dayOffset + 1}`;
        
        const { data: mainSession, error: mainError } = await supabase
          .from('main_sessions')
          .insert({
            main_session_name: mainSessionName,
            scheduled_date: dateString,
            class_id: selectedClass.id,
            data: {
              start_time: '09:00',
              end_time: '11:00',
              total_duration_minutes: 120,
              created_by_form: true
            }
          })
          .select()
          .single();

        if (mainError) {
          console.error('❌ Error creating main session:', mainError);
          continue;
        }

        console.log(`✅ Created main session: ${mainSessionName} on ${dateString}`);

        // Create TSI session
        const tsiTeacher = teachers[Math.floor(Math.random() * teachers.length)];
        const tsiAssistant = assistants.length > 0 ? assistants[Math.floor(Math.random() * assistants.length)] : null;

        const { data: tsiSession, error: tsiError } = await supabase
          .from('teaching_sessions')
          .insert({
            main_session_id: mainSession.id,
            subject_type: 'TSI',
            teacher_id: tsiTeacher.id,
            teaching_assistant_id: tsiAssistant?.id || null,
            location_id: selectedClass.facility_id, // Use class facility as location
            start_time: '09:00',
            end_time: '10:00',
            duration_minutes: 60,
            status: 'scheduled',
            data: {}
          });

        if (tsiError) {
          console.error('❌ Error creating TSI session:', tsiError);
        } else {
          console.log(`  ✅ Created TSI session: 09:00-10:00 with ${tsiTeacher.full_name}`);
        }

        // Create REP session
        const repTeacher = teachers[Math.floor(Math.random() * teachers.length)];
        const repAssistant = assistants.length > 0 ? assistants[Math.floor(Math.random() * assistants.length)] : null;

        const { data: repSession, error: repError } = await supabase
          .from('teaching_sessions')
          .insert({
            main_session_id: mainSession.id,
            subject_type: 'REP',
            teacher_id: repTeacher.id,
            teaching_assistant_id: repAssistant?.id || null,
            location_id: selectedClass.facility_id, // Use class facility as location
            start_time: '10:00',
            end_time: '11:00',
            duration_minutes: 60,
            status: 'scheduled',
            data: {}
          });

        if (repError) {
          console.error('❌ Error creating REP session:', repError);
        } else {
          console.log(`  ✅ Created REP session: 10:00-11:00 with ${repTeacher.full_name}`);
        }

        sessions.push({
          mainSession,
          tsiSession: !tsiError ? tsiSession : null,
          repSession: !repError ? repSession : null
        });
      }
    }

    console.log(`\n🎉 Successfully created ${sessions.length} main sessions with TSI and REP teaching sessions!`);
    console.log('\n📋 Summary:');
    console.log(`- Main sessions: ${sessions.length}`);
    console.log(`- TSI sessions: ${sessions.filter(s => s.tsiSession).length}`);
    console.log(`- REP sessions: ${sessions.filter(s => s.repSession).length}`);
    console.log('\n💡 You can now view these sessions in the schedule view at /schedule');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
createSampleSessions();
