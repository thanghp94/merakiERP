const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createSampleSessions() {
  console.log('🔄 Creating sample sessions using sessions table...\n');

  try {
    // Get existing main sessions
    const { data: mainSessions, error: mainError } = await supabase
      .from('main_sessions')
      .select('*')
      .limit(10);

    if (mainError) {
      console.error('❌ Error fetching main sessions:', mainError);
      return;
    }

    if (!mainSessions || mainSessions.length === 0) {
      console.log('❌ No main sessions found. Please create some main sessions first using the lesson form.');
      return;
    }

    // Get some teachers
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*')
      .limit(10);

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

    console.log(`📋 Found ${mainSessions.length} main sessions to add sessions to...\n`);

    let createdSessions = 0;

    // Create TSI and REP sessions for each main session
    for (const mainSession of mainSessions) {
      console.log(`🔄 Processing main session: ${mainSession.main_session_name}`);

      // Create TSI session
      const tsiTeacher = teachers[Math.floor(Math.random() * teachers.length)];
      const tsiAssistant = assistants.length > 0 ? assistants[Math.floor(Math.random() * assistants.length)] : null;

      const tsiStartTime = new Date(`${mainSession.scheduled_date}T09:00:00Z`);
      const tsiEndTime = new Date(`${mainSession.scheduled_date}T10:00:00Z`);

      const { data: tsiSession, error: tsiError } = await supabase
        .from('sessions')
        .insert({
          lesson_id: mainSession.main_session_id,
          subject_type: 'TSI',
          teacher_id: tsiTeacher.id,
          teaching_assistant_id: tsiAssistant?.id || null,
          location_id: null, // We'll set this to null for now
          start_time: tsiStartTime.toISOString(),
          end_time: tsiEndTime.toISOString(),
          date: mainSession.scheduled_date,
          data: {}
        });

      if (tsiError) {
        console.error('❌ Error creating TSI session:', tsiError);
      } else {
        console.log(`  ✅ Created TSI session: 09:00-10:00 with ${tsiTeacher.full_name}`);
        createdSessions++;
      }

      // Create REP session
      const repTeacher = teachers[Math.floor(Math.random() * teachers.length)];
      const repAssistant = assistants.length > 0 ? assistants[Math.floor(Math.random() * assistants.length)] : null;

      const repStartTime = new Date(`${mainSession.scheduled_date}T10:00:00Z`);
      const repEndTime = new Date(`${mainSession.scheduled_date}T11:00:00Z`);

      const { data: repSession, error: repError } = await supabase
        .from('sessions')
        .insert({
          lesson_id: mainSession.main_session_id,
          subject_type: 'REP',
          teacher_id: repTeacher.id,
          teaching_assistant_id: repAssistant?.id || null,
          location_id: null, // We'll set this to null for now
          start_time: repStartTime.toISOString(),
          end_time: repEndTime.toISOString(),
          date: mainSession.scheduled_date,
          data: {}
        });

      if (repError) {
        console.error('❌ Error creating REP session:', repError);
      } else {
        console.log(`  ✅ Created REP session: 10:00-11:00 with ${repTeacher.full_name}`);
        createdSessions++;
      }

      // Add a small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n🎉 Successfully created ${createdSessions} sessions!`);
    console.log('\n📋 Summary:');
    console.log(`- Total sessions created: ${createdSessions}`);
    console.log(`- TSI sessions: ${Math.floor(createdSessions / 2)}`);
    console.log(`- REP sessions: ${Math.floor(createdSessions / 2)}`);
    console.log('\n💡 You can now view these sessions in the schedule view at /schedule');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
createSampleSessions();
