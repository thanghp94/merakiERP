// Create employee records for users that don't have matching employees
// This script creates employee records for admin@merakierp.com and teacher@merakierp.com

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for admin operations
);

async function createMissingEmployeeRecords() {
  console.log('🔄 Creating missing employee records...\n');

  try {
    // Step 1: Get all auth users
    console.log('📋 Fetching all authenticated users...');
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`Failed to fetch users: ${authError.message}`);
    }

    const users = authData.users;
    console.log(`✅ Found ${users.length} authenticated users\n`);

    // Step 2: Get all employees
    console.log('👥 Fetching all employees...');
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('*');
    
    if (employeesError) {
      throw new Error(`Failed to fetch employees: ${employeesError.message}`);
    }

    console.log(`✅ Found ${employees.length} employee records\n`);

    // Step 3: Find users without employee records
    const usersWithoutEmployees = [];
    
    for (const user of users) {
      if (!user.email) continue;
      
      // Check if user already has an employee record
      const hasEmployee = employees.some(emp => emp.user_id === user.id);
      
      if (!hasEmployee) {
        usersWithoutEmployees.push(user);
      }
    }

    console.log(`🔍 Found ${usersWithoutEmployees.length} users without employee records:`);
    usersWithoutEmployees.forEach(user => {
      console.log(`  - ${user.email}`);
    });
    console.log('');

    // Step 4: Create employee records for specific users
    const employeeCreationMap = {
      'admin@merakierp.com': {
        full_name: 'Admin User',
        position: 'Giám đốc',
        department: 'Ban giám đốc',
        status: 'active',
        data: {
          email: 'admin@merakierp.com',
          created_from_auth: true,
          role: 'admin'
        }
      },
      'teacher@merakierp.com': {
        full_name: 'Teacher User',
        position: 'Giáo viên',
        department: 'Vận hành',
        status: 'active',
        data: {
          email: 'teacher@merakierp.com',
          created_from_auth: true,
          role: 'teacher'
        }
      }
    };

    let createdCount = 0;
    let skippedCount = 0;

    for (const user of usersWithoutEmployees) {
      try {
        const employeeData = employeeCreationMap[user.email];
        
        if (employeeData) {
          console.log(`Creating employee record for: ${user.email}`);
          
          const { data: newEmployee, error: createError } = await supabase
            .from('employees')
            .insert({
              ...employeeData,
              user_id: user.id
            })
            .select()
            .single();

          if (createError) {
            throw new Error(`Failed to create employee: ${createError.message}`);
          }

          console.log(`  ✅ Successfully created employee: ${newEmployee.full_name} (ID: ${newEmployee.id})`);
          createdCount++;
        } else {
          console.log(`  ⚠️  Skipped ${user.email} - no predefined employee data`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`  ❌ Error creating employee for ${user.email}: ${error.message}`);
      }
    }

    // Step 5: Summary report
    console.log('\n📊 EMPLOYEE CREATION SUMMARY');
    console.log('============================');
    console.log(`Users without employees: ${usersWithoutEmployees.length}`);
    console.log(`Successfully created: ${createdCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log('');

    // Step 6: Verify all users now have employee records
    console.log('🔍 FINAL VERIFICATION');
    console.log('=====================');
    
    const { data: updatedEmployees, error: verifyError } = await supabase
      .from('employees')
      .select('id, full_name, user_id, data')
      .not('user_id', 'is', null);

    if (!verifyError) {
      console.log(`Total linked employees: ${updatedEmployees.length}`);
      
      if (updatedEmployees.length > 0) {
        console.log('\nAll linked employees:');
        updatedEmployees.forEach(emp => {
          const userEmail = emp.data?.email || 'No email';
          console.log(`- ${emp.full_name} → ${emp.user_id} (${userEmail})`);
        });
      }
    }

    // Step 7: Check for any remaining unlinked users
    const { data: remainingUsers, error: remainingError } = await supabase.auth.admin.listUsers();
    
    if (!remainingError) {
      const stillUnlinked = [];
      
      for (const user of remainingUsers.users) {
        if (!user.email) continue;
        
        const hasEmployee = updatedEmployees.some(emp => emp.user_id === user.id);
        if (!hasEmployee) {
          stillUnlinked.push(user.email);
        }
      }
      
      if (stillUnlinked.length > 0) {
        console.log('\n⚠️  STILL UNLINKED USERS:');
        stillUnlinked.forEach(email => {
          console.log(`- ${email}`);
        });
        console.log('\n💡 These users will need employee records created manually or through the employee form.');
      } else {
        console.log('\n🎉 All users now have linked employee records!');
      }
    }

    console.log('\n✅ Employee creation process completed!');
    console.log('\nNext steps:');
    console.log('1. Test login with admin@merakierp.com and teacher@merakierp.com');
    console.log('2. Verify request forms work correctly for all users');
    console.log('3. Check that employee data is properly populated');

  } catch (error) {
    console.error('❌ Fatal error during employee creation:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  createMissingEmployeeRecords().catch(console.error);
}

module.exports = { createMissingEmployeeRecords };
