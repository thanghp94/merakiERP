const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function debugMainSessionCreation() {
  console.log('🔍 Debugging main session creation with sessions...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Step 1: Get required data for testing
    console.log('📋 Step 1: Getting required data...');
    
    const { data: classes, error: classError } = await supabase
      .from('classes')
      .select('id, class_name')
      .limit(1);
    
    if (classError || !classes || classes.length === 0) {
      console.error('❌ No classes found');
      return;
    }
    
    const testClass = classes[0];
    console.log(`✅ Using class: ${testClass.class_name} (ID: ${testClass.id})`);
    
    // Get any employees (not just teachers) for testing
    const { data: employees, error: employeeError } = await supabase
      .from('employees')
      .select('id, full_name, role')
      .limit(2);
    
    const { data: facilities, error: facilityError } = await supabase
      .from('facilities')
      .select('id, name')
      .limit(1);
    
    console.log(`Found ${employees?.length || 0} employees and ${facilities?.length || 0} facilities`);
    
    // Step 2: Test the API payload structure
    console.log('\n📋 Step 2: Testing API payload structure...');
    
    const testPayload = {
      main_session_name: `Debug Test Session ${Date.now()}`,
      scheduled_date: '2024-01-20',
      class_id: testClass.id,
      sessions: [
        {
          subject_type: 'Grammar',
          teacher_id: employees && employees.length > 0 ? employees[0].id : null,
          location_id: facilities && facilities.length > 0 ? facilities[0].id : null,
          start_time: '09:00',
          end_time: '10:30',
          duration_minutes: 90
        },
        {
          subject_type: 'Speaking',
          teacher_id: employees && employees.length > 1 ? employees[1].id : (employees && employees.length > 0 ? employees[0].id : null),
          location_id: facilities && facilities.length > 0 ? facilities[0].id : null,
          start_time: '10:45',
          end_time: '12:15',
          duration_minutes: 90
        }
      ]
    };
    
    console.log('Test payload:', JSON.stringify(testPayload, null, 2));
    
    // Step 3: Simulate the main session creation logic
    console.log('\n📋 Step 3: Simulating main session creation...');
    
    // Create main session first
    const { data: mainSessionData, error: mainSessionError } = await supabase
      .from('main_sessions')
      .insert({
        main_session_name: testPayload.main_session_name,
        scheduled_date: testPayload.scheduled_date,
        class_id: testPayload.class_id,
        data: {
          start_time: '09:00',
          end_time: '12:15',
          total_duration_minutes: 180,
          created_by_debug: true
        }
      })
      .select()
      .single();
    
    if (mainSessionError) {
      console.error('❌ Main session creation failed:', mainSessionError);
      return;
    }
    
    console.log(`✅ Main session created: ${mainSessionData.main_session_name}`);
    console.log(`✅ Main session ID: ${mainSessionData.main_session_id}`);
    
    // Step 4: Test sessions creation logic
    console.log('\n📋 Step 4: Testing sessions creation...');
    
    if (testPayload.sessions && testPayload.sessions.length > 0) {
      console.log(`Attempting to create ${testPayload.sessions.length} sessions...`);
      
      const sessionsToInsert = testPayload.sessions.map((session, index) => {
        const sessionData = {
          lesson_id: mainSessionData.main_session_id,
          subject_type: session.subject_type,
          teacher_id: session.teacher_id,
          teaching_assistant_id: session.teaching_assistant_id || null,
          location_id: session.location_id,
          start_time: `${testPayload.scheduled_date}T${session.start_time}:00+00:00`,
          end_time: `${testPayload.scheduled_date}T${session.end_time}:00+00:00`,
          date: testPayload.scheduled_date,
          data: {
            lesson_id: session.lesson_id || `${session.subject_type}${Date.now()}_${index}`,
            subject_name: `${testPayload.main_session_name} - ${session.subject_type}`,
            subject_type: session.subject_type,
            main_session_id: mainSessionData.main_session_id,
            created_by_debug: true
          }
        };
        
        console.log(`Session ${index + 1} data:`, JSON.stringify(sessionData, null, 2));
        return sessionData;
      });
      
      const { data: createdSessions, error: sessionsError } = await supabase
        .from('sessions')
        .insert(sessionsToInsert)
        .select();
      
      if (sessionsError) {
        console.error('❌ Sessions creation failed:', sessionsError);
        console.error('Error details:', JSON.stringify(sessionsError, null, 2));
        
        // Try to understand the error
        if (sessionsError.message.includes('foreign key')) {
          console.log('\n🔍 Foreign key constraint issue detected. Checking references...');
          
          // Check if teacher_id exists
          if (employees && employees.length > 0) {
            const { data: teacherCheck } = await supabase
              .from('employees')
              .select('id, full_name')
              .eq('id', employees[0].id);
            console.log('Teacher exists:', teacherCheck);
          }
          
          // Check if location_id exists
          if (facilities && facilities.length > 0) {
            const { data: facilityCheck } = await supabase
              .from('facilities')
              .select('id, name')
              .eq('id', facilities[0].id);
            console.log('Facility exists:', facilityCheck);
          }
          
          // Check if main_session_id exists
          const { data: mainSessionCheck } = await supabase
            .from('main_sessions')
            .select('main_session_id, main_session_name')
            .eq('main_session_id', mainSessionData.main_session_id);
          console.log('Main session exists:', mainSessionCheck);
        }
        
        return;
      }
      
      console.log(`✅ Successfully created ${createdSessions?.length || 0} sessions`);
      createdSessions?.forEach((session, index) => {
        console.log(`  Session ${index + 1}: ${session.subject_type} (ID: ${session.id})`);
      });
    }
    
    // Step 5: Verify the created sessions
    console.log('\n📋 Step 5: Verifying created sessions...');
    
    const { data: verificationSessions, error: verifyError } = await supabase
      .from('sessions')
      .select(`
        *,
        employees!sessions_teacher_id_fkey (
          full_name
        ),
        facilities (
          name
        )
      `)
      .eq('lesson_id', mainSessionData.main_session_id);
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
    } else {
      console.log(`✅ Verification: Found ${verificationSessions?.length || 0} sessions linked to main session`);
      verificationSessions?.forEach(session => {
        console.log(`  - ${session.subject_type}: ${session.employees?.full_name || 'No teacher'} at ${session.facilities?.name || 'No location'}`);
      });
    }
    
    console.log('\n🎉 Debug completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugMainSessionCreation();
