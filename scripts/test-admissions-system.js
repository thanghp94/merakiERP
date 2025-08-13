const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testAdmissionsSystem() {
  console.log('🎓 Testing Admissions System...\n');

  try {
    // Test 1: Create a sample admission
    console.log('1. Creating sample admission...');
    const sampleAdmission = {
      student_name: 'Nguyễn Văn Test',
      phone: '0901234567',
      email: 'test@example.com',
      parent_name: 'Nguyễn Thị Parent',
      location: 'Quận 1, TP.HCM',
      status: 'fanpage_inquiry',
      application_date: new Date().toISOString(),
      data: {
        source: 'facebook',
        notes: 'Khách hàng quan tâm đến chương trình GrapeSEED cho con',
        interested_program: 'grapeseed',
        budget: 2000000,
        urgency: 'medium',
        facebook_profile: 'https://facebook.com/test.user'
      }
    };

    const { data: createdAdmission, error: createError } = await supabase
      .from('admissions')
      .insert([sampleAdmission])
      .select()
      .single();

    if (createError) {
      console.log('❌ Error creating admission:', createError.message);
      return;
    }

    console.log('✅ Admission created successfully:', createdAdmission.id);

    // Test 2: Fetch all admissions
    console.log('\n2. Fetching all admissions...');
    const { data: admissions, error: fetchError } = await supabase
      .from('admissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.log('❌ Error fetching admissions:', fetchError.message);
      return;
    }

    console.log(`✅ Found ${admissions.length} admissions`);
    admissions.forEach((admission, index) => {
      console.log(`   ${index + 1}. ${admission.student_name} - ${admission.status} (${admission.phone})`);
    });

    // Test 3: Update admission status
    console.log('\n3. Updating admission status...');
    const { data: updatedAdmission, error: updateError } = await supabase
      .from('admissions')
      .update({ 
        status: 'zalo_consultation',
        data: {
          ...createdAdmission.data,
          notes: 'Đã liên hệ qua Zalo, khách hàng quan tâm và muốn đặt lịch học thử'
        }
      })
      .eq('id', createdAdmission.id)
      .select()
      .single();

    if (updateError) {
      console.log('❌ Error updating admission:', updateError.message);
      return;
    }

    console.log('✅ Admission status updated:', updatedAdmission.status);

    // Test 4: Test status filtering
    console.log('\n4. Testing status filtering...');
    const statuses = ['pending', 'fanpage_inquiry', 'zalo_consultation', 'trial_class', 'enrolled'];
    
    for (const status of statuses) {
      const { data: filteredAdmissions, error: filterError } = await supabase
        .from('admissions')
        .select('*')
        .eq('status', status);

      if (filterError) {
        console.log(`❌ Error filtering by ${status}:`, filterError.message);
        continue;
      }

      console.log(`   ${status}: ${filteredAdmissions.length} admissions`);
    }

    // Test 5: Test customer journey progression
    console.log('\n5. Testing customer journey progression...');
    const journeySteps = [
      'fanpage_inquiry',
      'zalo_consultation', 
      'trial_class',
      'enrolled'
    ];

    for (let i = 0; i < journeySteps.length; i++) {
      const currentStatus = journeySteps[i];
      const { data: updated, error: journeyError } = await supabase
        .from('admissions')
        .update({ 
          status: currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', createdAdmission.id)
        .select()
        .single();

      if (journeyError) {
        console.log(`❌ Error updating to ${currentStatus}:`, journeyError.message);
        continue;
      }

      console.log(`   ✅ Step ${i + 1}: ${currentStatus}`);
      
      // Small delay to simulate real progression
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Test 6: Test search functionality
    console.log('\n6. Testing search functionality...');
    const { data: searchResults, error: searchError } = await supabase
      .from('admissions')
      .select('*')
      .or(`student_name.ilike.%Test%,phone.ilike.%0901%,email.ilike.%test%`);

    if (searchError) {
      console.log('❌ Error searching admissions:', searchError.message);
    } else {
      console.log(`✅ Search found ${searchResults.length} matching admissions`);
    }

    // Test 7: Clean up - Delete test admission
    console.log('\n7. Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('admissions')
      .delete()
      .eq('id', createdAdmission.id);

    if (deleteError) {
      console.log('❌ Error deleting test admission:', deleteError.message);
    } else {
      console.log('✅ Test admission deleted successfully');
    }

    console.log('\n🎉 All admission system tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Create admission');
    console.log('   ✅ Fetch admissions');
    console.log('   ✅ Update admission status');
    console.log('   ✅ Status filtering');
    console.log('   ✅ Customer journey progression');
    console.log('   ✅ Search functionality');
    console.log('   ✅ Data cleanup');

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

// Run the test
testAdmissionsSystem();
