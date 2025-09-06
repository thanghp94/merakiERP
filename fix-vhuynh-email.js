// Script to add email address to vhuynh teacher
const { createClient } = require('@supabase/supabase-js');

// You'll need to set these environment variables or replace with actual values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lunkgjarwqqkpbohneqn.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

async function fixVhuynhEmail() {
  console.log('🔧 Fixing vhuynh teacher email...\n');

  try {
    // First, find the vhuynh teacher
    console.log('1. Finding vhuynh teacher...');
    const { data: teachers, error: findError } = await supabase
      .from('employees')
      .select('*')
      .ilike('full_name', '%vhuynh%');

    if (findError) {
      console.log('❌ Error finding teacher:', findError);
      return;
    }

    if (!teachers || teachers.length === 0) {
      console.log('❌ No vhuynh teacher found');
      return;
    }

    const teacher = teachers[0];
    console.log('✅ Found teacher:', teacher.full_name);
    console.log('📧 Current email:', teacher.data?.email || 'NONE');

    // Ask user for email address
    console.log('\n2. Please provide an email address for this teacher:');
    console.log('   Example: vhuynh@meraki.edu.vn or thanghuynh@meraki.edu.vn');

    // For now, let's use a default email - you can modify this
    const newEmail = 'vhuynh@meraki.edu.vn'; // Change this to the actual email

    console.log(`\n3. Updating teacher ${teacher.full_name} with email: ${newEmail}`);

    // Update the teacher record
    const { data: updatedTeacher, error: updateError } = await supabase
      .from('employees')
      .update({
        data: {
          ...teacher.data,
          email: newEmail
        }
      })
      .eq('id', teacher.id)
      .select();

    if (updateError) {
      console.log('❌ Error updating teacher:', updateError);
      return;
    }

    console.log('✅ Teacher updated successfully!');
    console.log('📧 New email:', updatedTeacher[0].data.email);

    // Verify the update
    console.log('\n4. Verifying the update...');
    const { data: verifyTeacher, error: verifyError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', teacher.id);

    if (verifyError) {
      console.log('❌ Error verifying update:', verifyError);
      return;
    }

    console.log('✅ Verification successful!');
    console.log('👤 Teacher:', verifyTeacher[0].full_name);
    console.log('📧 Email:', verifyTeacher[0].data.email);

    console.log('\n🎉 SUCCESS! The vhuynh teacher now has an email address.');
    console.log('📧 You can now try sending the schedule email again.');

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Run the fix
fixVhuynhEmail();
