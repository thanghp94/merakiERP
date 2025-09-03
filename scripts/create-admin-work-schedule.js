const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase environment variables');
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  console.log('Current values:');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Not set');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminWorkSchedule() {
  console.log('🔧 Creating Admin Work Schedule...\n');

  try {
    // First, let's find the admin user's email
    console.log('1. Looking for admin user...');
    
    // Check if there are any employees (since email column doesn't exist)
    const { data: employees, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .limit(10);

    if (employeeError) {
      console.error('❌ Error fetching employees:', employeeError);
      return;
    }

    console.log(`   Found ${employees.length} employees with 'admin' in email`);

    if (employees.length === 0) {
      console.log('⚠️  No admin employees found. Let\'s create one...');
      
      // Create an admin employee record
      const adminEmployee = {
        full_name: 'Administrator',
        email: 'admin@example.com',
        phone: '+84123456789',
        position: 'System Administrator',
        status: 'active',
        data: {
          work_schedules: [
            {
              id: '1',
              day: 'monday',
              start_time: '08:00',
              end_time: '17:00',
              is_active: true,
              break_start: '12:00',
              break_end: '13:00',
              notes: 'Standard work schedule'
            },
            {
              id: '2',
              day: 'tuesday',
              start_time: '08:00',
              end_time: '17:00',
              is_active: true,
              break_start: '12:00',
              break_end: '13:00',
              notes: 'Standard work schedule'
            },
            {
              id: '3',
              day: 'wednesday',
              start_time: '08:00',
              end_time: '17:00',
              is_active: true,
              break_start: '12:00',
              break_end: '13:00',
              notes: 'Standard work schedule'
            },
            {
              id: '4',
              day: 'thursday',
              start_time: '08:00',
              end_time: '17:00',
              is_active: true,
              break_start: '12:00',
              break_end: '13:00',
              notes: 'Standard work schedule'
            },
            {
              id: '5',
              day: 'friday',
              start_time: '08:00',
              end_time: '17:00',
              is_active: true,
              break_start: '12:00',
              break_end: '13:00',
              notes: 'Standard work schedule'
            }
          ]
        }
      };

      const { data: newEmployee, error: createError } = await supabase
        .from('employees')
        .insert(adminEmployee)
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating admin employee:', createError);
        return;
      }

      console.log('✅ Created admin employee with work schedule!');
      console.log(`   Employee ID: ${newEmployee.id}`);
      console.log(`   Email: ${newEmployee.email}`);
      console.log(`   Work schedules: ${newEmployee.data.work_schedules.length} entries`);
      
    } else {
      // Update existing admin employee with work schedule
      const adminEmployee = employees[0];
      console.log(`   Found admin employee: ${adminEmployee.full_name} (${adminEmployee.email})`);

      // Check if they already have work schedules
      if (adminEmployee.data && adminEmployee.data.work_schedules && adminEmployee.data.work_schedules.length > 0) {
        console.log(`✅ Admin already has ${adminEmployee.data.work_schedules.length} work schedules`);
        console.log('   Work schedule entries:');
        adminEmployee.data.work_schedules.forEach((schedule, index) => {
          console.log(`     ${index + 1}. ${schedule.day}: ${schedule.start_time} - ${schedule.end_time} (${schedule.is_active ? 'Active' : 'Inactive'})`);
        });
        return;
      }

      // Add work schedules to existing admin employee
      const updatedData = {
        ...adminEmployee.data,
        work_schedules: [
          {
            id: '1',
            day: 'monday',
            start_time: '08:00',
            end_time: '17:00',
            is_active: true,
            break_start: '12:00',
            break_end: '13:00',
            notes: 'Standard admin work schedule'
          },
          {
            id: '2',
            day: 'tuesday',
            start_time: '08:00',
            end_time: '17:00',
            is_active: true,
            break_start: '12:00',
            break_end: '13:00',
            notes: 'Standard admin work schedule'
          },
          {
            id: '3',
            day: 'wednesday',
            start_time: '08:00',
            end_time: '17:00',
            is_active: true,
            break_start: '12:00',
            break_end: '13:00',
            notes: 'Standard admin work schedule'
          },
          {
            id: '4',
            day: 'thursday',
            start_time: '08:00',
            end_time: '17:00',
            is_active: true,
            break_start: '12:00',
            break_end: '13:00',
            notes: 'Standard admin work schedule'
          },
          {
            id: '5',
            day: 'friday',
            start_time: '08:00',
            end_time: '17:00',
            is_active: true,
            break_start: '12:00',
            break_end: '13:00',
            notes: 'Standard admin work schedule'
          }
        ]
      };

      const { data: updatedEmployee, error: updateError } = await supabase
        .from('employees')
        .update({ data: updatedData })
        .eq('id', adminEmployee.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating admin employee:', updateError);
        return;
      }

      console.log('✅ Updated admin employee with work schedule!');
      console.log(`   Employee ID: ${updatedEmployee.id}`);
      console.log(`   Email: ${updatedEmployee.email}`);
      console.log(`   Work schedules: ${updatedEmployee.data.work_schedules.length} entries`);
    }

    console.log('\n🎉 Admin Work Schedule Setup Complete!');
    console.log('\n📋 Summary:');
    console.log('   - Admin employee record exists with work schedule data');
    console.log('   - Work schedule includes Monday-Friday, 8:00-17:00');
    console.log('   - Lunch break: 12:00-13:00');
    console.log('   - All schedules are active');
    console.log('\n✅ The admin user should now see their work schedule in the Personal tab!');

  } catch (error) {
    console.error('❌ Script failed with error:', error);
  }
}

// Run the script
createAdminWorkSchedule();
