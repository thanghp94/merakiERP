const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createTestClasses() {
  console.log('🚀 Creating test classes for auto session functionality...');

  try {
    // First, get or create a test facility
    let { data: facilities, error: facilityError } = await supabase
      .from('facilities')
      .select('*')
      .limit(1);

    if (facilityError) {
      console.error('Error fetching facilities:', facilityError);
      return;
    }

    let facilityId;
    if (facilities && facilities.length > 0) {
      facilityId = facilities[0].id;
      console.log('✅ Using existing facility:', facilities[0].name);
    } else {
      // Create a test facility
      const { data: newFacility, error: createFacilityError } = await supabase
        .from('facilities')
        .insert({
          name: 'Test Center - Auto Sessions',
          status: 'active',
          data: {
            type: 'main_center',
            address: '123 Test Street',
            rooms: [
              { id: 'room1', name: 'Phòng A1' },
              { id: 'room2', name: 'Phòng A2' },
              { id: 'room3', name: 'Phòng B1' }
            ]
          }
        })
        .select()
        .single();

      if (createFacilityError) {
        console.error('Error creating facility:', createFacilityError);
        return;
      }

      facilityId = newFacility.id;
      console.log('✅ Created test facility:', newFacility.name);
    }

    // Create test classes
    const testClasses = [
      {
        class_name: 'GS53',
        facility_id: facilityId,
        status: 'active',
        start_date: '2024-01-15',
        data: {
          program_type: 'GrapeSEED',
          unit: 'U8',
          description: 'GrapeSEED class for testing auto sessions',
          max_students: 12,
          schedule_entries: [
            {
              id: 'mon',
              day: 'monday',
              startTime: '17:30',
              endTime: '18:45'
            },
            {
              id: 'wed',
              day: 'wednesday', 
              startTime: '17:30',
              endTime: '18:45'
            },
            {
              id: 'fri',
              day: 'friday',
              startTime: '17:30',
              endTime: '18:45'
            },
            {
              id: 'sat',
              day: 'saturday',
              startTime: '17:30',
              endTime: '18:45'
            }
          ]
        }
      },
      {
        class_name: 'TATH-A1',
        facility_id: facilityId,
        status: 'active',
        start_date: '2024-01-16',
        data: {
          program_type: 'TATH',
          description: 'Tiếng Anh Tiểu Học class for testing auto sessions',
          max_students: 15,
          schedule_entries: [
            {
              id: 'tue',
              day: 'tuesday',
              startTime: '17:30',
              endTime: '19:00'
            },
            {
              id: 'thu',
              day: 'thursday',
              startTime: '17:30',
              endTime: '19:00'
            },
            {
              id: 'sat',
              day: 'saturday',
              startTime: '17:30',
              endTime: '19:00'
            }
          ]
        }
      },
      {
        class_name: 'GS12 test',
        facility_id: facilityId,
        status: 'active',
        start_date: '2024-01-20',
        data: {
          program_type: 'GrapeSEED',
          unit: 'U10',
          description: 'Another GrapeSEED class for testing lesson progression',
          max_students: 10,
          schedule_entries: [
            {
              id: 'mon',
              day: 'monday',
              startTime: '16:00',
              endTime: '17:15'
            },
            {
              id: 'wed',
              day: 'wednesday',
              startTime: '16:00',
              endTime: '17:15'
            }
          ]
        }
      }
    ];

    // Insert test classes
    const { data: createdClasses, error: classError } = await supabase
      .from('classes')
      .insert(testClasses)
      .select();

    if (classError) {
      console.error('Error creating test classes:', classError);
      return;
    }

    console.log('✅ Successfully created test classes:');
    createdClasses.forEach(cls => {
      console.log(`   - ${cls.class_name} (${cls.data.program_type})`);
      if (cls.data.schedule_entries) {
        console.log(`     Schedule: ${cls.data.schedule_entries.map(s => `${s.day} ${s.startTime}-${s.endTime}`).join(', ')}`);
      }
    });

    // Create some test employees (teachers and assistants)
    const testEmployees = [
      {
        full_name: 'Nguyễn Văn A',
        email: 'teacher.a@test.com',
        phone: '0901234567',
        position: 'Giáo viên',
        status: 'active',
        data: {
          specialization: 'GrapeSEED',
          experience_years: 3
        }
      },
      {
        full_name: 'Trần Thị B',
        email: 'teacher.b@test.com',
        phone: '0901234568',
        position: 'Giáo viên',
        status: 'active',
        data: {
          specialization: 'TATH',
          experience_years: 5
        }
      },
      {
        full_name: 'Lê Văn C',
        email: 'assistant.c@test.com',
        phone: '0901234569',
        position: 'Trợ giảng',
        status: 'active',
        data: {
          specialization: 'General',
          experience_years: 2
        }
      },
      {
        full_name: 'Phạm Thị D',
        email: 'assistant.d@test.com',
        phone: '0901234570',
        position: 'Trợ giảng',
        status: 'active',
        data: {
          specialization: 'GrapeSEED',
          experience_years: 1
        }
      }
    ];

    const { data: createdEmployees, error: employeeError } = await supabase
      .from('employees')
      .insert(testEmployees)
      .select();

    if (employeeError) {
      console.error('Error creating test employees:', employeeError);
    } else {
      console.log('✅ Successfully created test employees:');
      createdEmployees.forEach(emp => {
        console.log(`   - ${emp.full_name} (${emp.position})`);
      });
    }

    console.log('\n🎉 Test data creation completed!');
    console.log('\n📋 How to test the Auto Session functionality:');
    console.log('1. Go to the Classes tab in the dashboard');
    console.log('2. Find the test classes (GS53, TATH-A1, GS12 test)');
    console.log('3. Click the "Thêm buổi dạy tự động" button (🤖 icon)');
    console.log('4. For GrapeSEED classes:');
    console.log('   - Select starting lesson (L1, L2, etc.)');
    console.log('   - Choose TSI first or REP first');
    console.log('   - Select teachers and assistants');
    console.log('5. For TATH classes:');
    console.log('   - Configure weekly schedule with subject types');
    console.log('   - Select teachers for each day');
    console.log('6. Set number of sessions and start date');
    console.log('7. Click "Tạo buổi tự động" to generate sessions');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the script
createTestClasses();
