// Phase 2: Data Migration Script - Link existing users to employees
// This script implements the data migration from USER_EMPLOYEE_MAPPING_PLAN.md

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for admin operations
);

async function linkUsersToEmployees() {
  console.log('🔄 Starting user-employee linking process...\n');

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

    // Step 3: Link users to employees
    let linkedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    console.log('🔗 Starting linking process...\n');

    for (const user of users) {
      try {
        console.log(`Processing user: ${user.email}`);

        // Skip if user doesn't have email
        if (!user.email) {
          console.log(`  ⚠️  Skipped - No email address`);
          skippedCount++;
          continue;
        }

        // Method 1: Try to match by email
        let employee = employees.find(emp => 
          emp.data?.email?.toLowerCase() === user.email.toLowerCase()
        );

        // Method 2: If not found by email, try by full_name from user metadata
        if (!employee && user.user_metadata?.full_name) {
          employee = employees.find(emp => 
            emp.full_name?.toLowerCase() === user.user_metadata.full_name.toLowerCase()
          );
          
          if (employee) {
            console.log(`  📝 Matched by name: ${employee.full_name}`);
          }
        }

        // Method 3: If still not found, try partial name matching
        if (!employee && user.user_metadata?.full_name) {
          const userNameParts = user.user_metadata.full_name.toLowerCase().split(' ');
          employee = employees.find(emp => {
            const empNameParts = emp.full_name?.toLowerCase().split(' ') || [];
            return userNameParts.some(part => 
              empNameParts.some(empPart => empPart.includes(part) || part.includes(empPart))
            );
          });
          
          if (employee) {
            console.log(`  🔍 Matched by partial name: ${employee.full_name}`);
          }
        }

        if (employee) {
          // Check if employee is already linked to another user
          if (employee.user_id) {
            console.log(`  ⚠️  Skipped - Employee already linked to user: ${employee.user_id}`);
            skippedCount++;
            continue;
          }

          // Link the employee to the user
          const { error: updateError } = await supabase
            .from('employees')
            .update({ user_id: user.id })
            .eq('id', employee.id);

          if (updateError) {
            throw new Error(`Failed to update employee: ${updateError.message}`);
          }

          console.log(`  ✅ Successfully linked to employee: ${employee.full_name}`);
          linkedCount++;

          // Update local employee record to prevent duplicate linking
          employee.user_id = user.id;
        } else {
          console.log(`  ❌ No matching employee found`);
          skippedCount++;
        }

        console.log(''); // Empty line for readability
      } catch (error) {
        console.error(`  ❌ Error processing user ${user.email}: ${error.message}`);
        errorCount++;
      }
    }

    // Step 4: Summary report
    console.log('📊 LINKING SUMMARY');
    console.log('==================');
    console.log(`Total users processed: ${users.length}`);
    console.log(`Successfully linked: ${linkedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('');

    // Step 5: Show unlinked employees
    const { data: unlinkedEmployees, error: unlinkedError } = await supabase
      .from('employees')
      .select('id, full_name, data')
      .is('user_id', null)
      .eq('status', 'active');

    if (!unlinkedError && unlinkedEmployees.length > 0) {
      console.log('👤 UNLINKED EMPLOYEES');
      console.log('=====================');
      unlinkedEmployees.forEach(emp => {
        console.log(`- ${emp.full_name} (${emp.data?.email || 'No email'})`);
      });
      console.log('');
      console.log('💡 These employees can be manually linked or will need user accounts created.');
    }

    // Step 6: Verify the linking
    const { data: linkedEmployees, error: verifyError } = await supabase
      .from('employees')
      .select('id, full_name, user_id, data')
      .not('user_id', 'is', null);

    if (!verifyError) {
      console.log('✅ VERIFICATION');
      console.log('===============');
      console.log(`Total linked employees: ${linkedEmployees.length}`);
      
      if (linkedEmployees.length > 0) {
        console.log('\nLinked employees:');
        linkedEmployees.forEach(emp => {
          console.log(`- ${emp.full_name} → ${emp.user_id}`);
        });
      }
    }

    console.log('\n🎉 User-employee linking process completed!');
    console.log('\nNext steps:');
    console.log('1. Create the /api/employees/current endpoint');
    console.log('2. Update frontend components to use the new mapping');
    console.log('3. Test the request form with proper user mapping');

  } catch (error) {
    console.error('❌ Fatal error during linking process:', error.message);
    process.exit(1);
  }
}

// Helper function to create employee for user (if needed)
async function createEmployeeForUser(userId, userEmail, userFullName) {
  console.log(`Creating employee record for user: ${userEmail}`);
  
  const { data, error } = await supabase
    .from('employees')
    .insert({
      full_name: userFullName || userEmail.split('@')[0],
      position: 'staff', // Default position
      department: 'general', // Default department
      status: 'active',
      user_id: userId,
      data: {
        email: userEmail,
        created_from_auth: true
      }
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create employee: ${error.message}`);
  }

  return data;
}

// Run the script
if (require.main === module) {
  linkUsersToEmployees().catch(console.error);
}

module.exports = { linkUsersToEmployees, createEmployeeForUser };
