const { createClient } = require('@supabase/supabase-js');

// You'll need to set these environment variables or replace with actual values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

async function debugVhuynhTeacher() {
  console.log('🔍 Debugging vhuynh Teacher Issue...\n');

  try {
    // Search for vhuynh in different ways
    console.log('1. 📋 Searching for employees with "vhuynh" in name...');
    const nameResponse = await fetch(`${supabaseUrl}/rest/v1/employees?or=(full_name.ilike.*vhuynh*,first_name.ilike.*vhuynh*,last_name.ilike.*vhuynh*)`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    if (nameResponse.ok) {
      const nameResults = await nameResponse.json();
      console.log(`   Found ${nameResults.length} employees with "vhuynh" in name:`);
      nameResults.forEach((emp, index) => {
        console.log(`   ${index + 1}. ID: ${emp.id} | Name: ${emp.full_name} | Email: ${emp.email || '❌ NO EMAIL'}`);
      });
    } else {
      console.log('   ❌ Failed to search by name');
    }

    console.log('\n2. 📧 Searching for employees with "vhuynh" in email...');
    const emailResponse = await fetch(`${supabaseUrl}/rest/v1/employees?email.ilike.*vhuynh*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    if (emailResponse.ok) {
      const emailResults = await emailResponse.json();
      console.log(`   Found ${emailResults.length} employees with "vhuynh" in email:`);
      emailResults.forEach((emp, index) => {
        console.log(`   ${index + 1}. ID: ${emp.id} | Name: ${emp.full_name} | Email: ${emp.email}`);
      });
    } else {
      console.log('   ❌ Failed to search by email');
    }

    console.log('\n3. 🎯 Testing exact API call that email endpoint uses...');
    
    // Get all employees to find the vhuynh teacher ID
    const allResponse = await fetch(`${supabaseUrl}/rest/v1/employees`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    if (allResponse.ok) {
      const allEmployees = await allResponse.json();
      const vhuynhTeachers = allEmployees.filter(emp => 
        (emp.full_name && emp.full_name.toLowerCase().includes('vhuynh')) ||
        (emp.email && emp.email.toLowerCase().includes('vhuynh')) ||
        (emp.first_name && emp.first_name.toLowerCase().includes('vhuynh')) ||
        (emp.last_name && emp.last_name.toLowerCase().includes('vhuynh'))
      );

      if (vhuynhTeachers.length > 0) {
        console.log(`   Found ${vhuynhTeachers.length} potential vhuynh teacher(s):`);
        
        for (const teacher of vhuynhTeachers) {
          console.log(`\n   🧪 Testing teacher ID: ${teacher.id}`);
          console.log(`      Name: ${teacher.full_name}`);
          console.log(`      Email: ${teacher.email || '❌ NO EMAIL'}`);
          
          // Test the exact same API call as the email endpoint
          const testResponse = await fetch(`${supabaseUrl}/rest/v1/employees?id=eq.${teacher.id}`, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
            },
          });

          const testData = await testResponse.json();
          console.log(`      API Response: ${testResponse.ok ? '✅ Success' : '❌ Failed'}`);
          console.log(`      Records returned: ${testData.length}`);
          
          if (testData.length > 0) {
            const foundTeacher = testData[0];
            console.log(`      Found teacher: ${foundTeacher.full_name}`);
            console.log(`      Has email: ${foundTeacher.email ? '✅ Yes (' + foundTeacher.email + ')' : '❌ No'}`);
            
            // This is the exact check the API does
            if (!foundTeacher || !foundTeacher.email) {
              console.log(`      ❌ This teacher would FAIL the API check: ${!foundTeacher ? 'Teacher not found' : 'No email address'}`);
            } else {
              console.log(`      ✅ This teacher would PASS the API check`);
            }
          } else {
            console.log(`      ❌ No teacher found with this ID (this would cause the API error)`);
          }
        }
      } else {
        console.log('   ❌ No vhuynh teachers found in the database');
      }
    }

    console.log('\n4. 💡 Recommendations:');
    console.log('   - Copy the teacher ID from above that has an email address');
    console.log('   - Use that exact ID when testing the email feature');
    console.log('   - If no teacher has an email, add an email address to the vhuynh teacher record');
    console.log('   - Make sure you\'re selecting the correct teacher from the dropdown in the UI');

  } catch (error) {
    console.error('💥 Error during debug:', error);
    console.log('\n🔧 Make sure to set your environment variables:');
    console.log('   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url');
    console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
  }
}

// Run the debug
debugVhuynhTeacher();
