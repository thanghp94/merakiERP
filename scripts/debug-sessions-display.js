const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugSessionsDisplay() {
  console.log('🔍 Debugging sessions display - checking teacher, TA, and room data...\n');

  try {
    // Test the sessions API to see what data structure we get
    console.log('1. Testing sessions API response...');
    const response = await fetch('http://localhost:3000/api/sessions?start_date=2025-08-11&end_date=2025-08-11');
    const result = await response.json();
    
    if (!result.success) {
      console.error('❌ API failed:', result.message);
      return;
    }

    const sessions = result.data || [];
    console.log(`Found ${sessions.length} sessions for 2025-08-11:`);
    
    sessions.forEach((session, index) => {
      console.log(`\n${index + 1}. Session ID: ${session.id}`);
      console.log(`   - Subject: ${session.subject_type}`);
      console.log(`   - Teacher ID: ${session.teacher_id}`);
      console.log(`   - Teacher Data:`, session.teacher ? `${session.teacher.full_name} (${session.teacher.id})` : 'Not loaded');
      console.log(`   - TA ID: ${session.teaching_assistant_id || 'None'}`);
      console.log(`   - TA Data:`, session.teaching_assistant ? `${session.teaching_assistant.full_name} (${session.teaching_assistant.id})` : 'Not loaded');
      console.log(`   - Location ID: ${session.location_id || 'None'}`);
      console.log(`   - Location Data:`, session.location ? `${session.location.facility_name} - ${session.location.room_name} (${session.location.room_id})` : 'Not loaded');
      console.log(`   - Session Data:`, JSON.stringify(session.data, null, 2));
    });

    // Check what facilities look like
    console.log('\n2. Checking facilities structure...');
    const { data: facilities, error: facilityError } = await supabase
      .from('facilities')
      .select('id, name, data')
      .limit(3);

    if (facilityError) {
      console.error('❌ Error fetching facilities:', facilityError);
    } else {
      console.log(`Found ${facilities.length} facilities:`);
      facilities.forEach((facility, index) => {
        console.log(`${index + 1}. ${facility.name} (ID: ${facility.id})`);
        console.log(`   - Data:`, JSON.stringify(facility.data, null, 2));
      });
    }

    // Check what employees look like
    console.log('\n3. Checking employees structure...');
    const { data: employees, error: employeeError } = await supabase
      .from('employees')
      .select('id, full_name, position')
      .limit(5);

    if (employeeError) {
      console.error('❌ Error fetching employees:', employeeError);
    } else {
      console.log(`Found ${employees.length} employees:`);
      employees.forEach((employee, index) => {
        console.log(`${index + 1}. ${employee.full_name} - ${employee.position} (ID: ${employee.id})`);
      });
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugSessionsDisplay();
