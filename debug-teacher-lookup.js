const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

async function debugTeacherLookup() {
  console.log('🔍 Debugging Teacher Lookup Issue...\n');

  try {
    // First, let's check all employees to see what we have
    console.log('📋 Fetching all employees...');
    const response = await fetch(`${supabaseUrl}/rest/v1/employees`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch employees:', response.status, response.statusText);
      return;
    }

    const employees = await response.json();
    console.log(`✅ Found ${employees.length} employees total\n`);

    // Look for employees with "vhuynh" in their name or email
    console.log('🔍 Searching for "vhuynh" related employees:');
    const vhuynhEmployees = employees.filter(emp => 
      (emp.full_name && emp.full_name.toLowerCase().includes('vhuynh')) ||
      (emp.email && emp.email.toLowerCase().includes('vhuynh')) ||
      (emp.first_name && emp.first_name.toLowerCase().includes('vhuynh')) ||
      (emp.last_name && emp.last_name.toLowerCase().includes('vhuynh'))
    );

    if (vhuynhEmployees.length > 0) {
      console.log(`✅ Found ${vhuynhEmployees.length} matching employee(s):`);
      vhuynhEmployees.forEach((emp, index) => {
        console.log(`\n${index + 1}. Employee Details:`);
        console.log(`   ID: ${emp.id}`);
        console.log(`   Full Name: ${emp.full_name || 'N/A'}`);
        console.log(`   First Name: ${emp.first_name || 'N/A'}`);
        console.log(`   Last Name: ${emp.last_name || 'N/A'}`);
        console.log(`   Email: ${emp.email || '❌ NO EMAIL'}`);
        console.log(`   Role: ${emp.role || 'N/A'}`);
        console.log(`   Status: ${emp.status || 'N/A'}`);
      });
    } else {
      console.log('❌ No employees found matching "vhuynh"');
      
      // Let's show a few sample employees to understand the data structure
      console.log('\n📋 Sample employees (first 5):');
      employees.slice(0, 5).forEach((emp, index) => {
        console.log(`\n${index + 1}. Sample Employee:`);
        console.log(`   ID: ${emp.id}`);
        console.log(`   Full Name: ${emp.full_name || 'N/A'}`);
        console.log(`   Email: ${emp.email || 'NO EMAIL'}`);
        console.log(`   Role: ${emp.role || 'N/A'}`);
      });
    }

    // Test the exact API call that the email endpoint uses
    console.log('\n🧪 Testing specific teacher ID lookup...');
    
    // If we found vhuynh employees, test with their IDs
    if (vhuynhEmployees.length > 0) {
      for (const emp of vhuynhEmployees) {
        console.log(`\n🔍 Testing lookup for ID: ${emp.id}`);
        const testResponse = await fetch(`${supabaseUrl}/rest/v1/employees?id=eq.${emp.id}`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        });

        const testData = await testResponse.json();
        console.log(`   Response: ${testResponse.ok ? '✅ Success' : '❌ Failed'}`);
        console.log(`   Data:`, testData);
        
        if (testData.length > 0) {
          const teacher = testData[0];
          console.log(`   Teacher found: ${teacher.full_name}`);
          console.log(`   Has email: ${teacher.email ? '✅ Yes' : '❌ No'}`);
        } else {
          console.log('   ❌ No teacher found with this ID');
        }
      }
    }

    // Also check if there are any employees without emails
    console.log('\n📧 Checking employees without email addresses:');
    const noEmailEmployees = employees.filter(emp => !emp.email);
    console.log(`Found ${noEmailEmployees.length} employees without email addresses`);
    
    if (noEmailEmployees.length > 0 && noEmailEmployees.length <= 10) {
      noEmailEmployees.forEach((emp, index) => {
        console.log(`   ${index + 1}. ${emp.full_name || emp.first_name + ' ' + emp.last_name || 'Unknown'} (ID: ${emp.id})`);
      });
    }

  } catch (error) {
    console.error('💥 Error during debug:', error);
  }
}

// Run the debug
debugTeacherLookup();
