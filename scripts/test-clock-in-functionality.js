require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testClockInFunctionality() {
  console.log('🧪 Testing Clock-In Functionality...\n');

  try {
    // 1. Get a test employee
    console.log('1. Getting test employee...');
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, full_name, data')
      .limit(1);

    if (employeesError || !employees || employees.length === 0) {
      console.error('❌ No employees found:', employeesError);
      return;
    }

    const testEmployee = employees[0];
    console.log(`✅ Found employee: ${testEmployee.full_name} (ID: ${testEmployee.id})`);

    // 2. Test Clock-In API
    console.log('\n2. Testing Clock-In API...');
    const clockInResponse = await fetch('http://localhost:3000/api/clock-records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employee_id: testEmployee.id,
        type: 'clock_in'
      }),
    });

    const clockInResult = await clockInResponse.json();
    console.log('Clock-In Response:', clockInResult);

    if (clockInResult.success) {
      console.log('✅ Clock-In successful!');
      
      // 3. Verify the record was created
      console.log('\n3. Verifying clock-in record...');
      const { data: clockRecords, error: fetchError } = await supabase
        .from('employee_clock_ins')
        .select('*')
        .eq('employee_id', testEmployee.id)
        .is('clock_out_time', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error('❌ Error fetching clock records:', fetchError);
        return;
      }

      if (clockRecords && clockRecords.length > 0) {
        const record = clockRecords[0];
        console.log('✅ Clock-in record found:');
        console.log(`   - ID: ${record.id}`);
        console.log(`   - Work Date: ${record.work_date}`);
        console.log(`   - Clock In Time: ${record.clock_in_time}`);
        console.log(`   - Clock Out Time: ${record.clock_out_time || 'Not clocked out yet'}`);

        // 4. Test Clock-Out API
        console.log('\n4. Testing Clock-Out API...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

        const clockOutResponse = await fetch('http://localhost:3000/api/clock-records', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            employee_id: testEmployee.id,
            type: 'clock_out'
          }),
        });

        const clockOutResult = await clockOutResponse.json();
        console.log('Clock-Out Response:', clockOutResult);

        if (clockOutResult.success) {
          console.log('✅ Clock-Out successful!');
          
          // 5. Verify the record was updated
          console.log('\n5. Verifying clock-out record...');
          const { data: updatedRecord, error: updateFetchError } = await supabase
            .from('employee_clock_ins')
            .select('*')
            .eq('id', record.id)
            .single();

          if (updateFetchError) {
            console.error('❌ Error fetching updated record:', updateFetchError);
            return;
          }

          if (updatedRecord && updatedRecord.clock_out_time) {
            console.log('✅ Clock-out record updated:');
            console.log(`   - Clock Out Time: ${updatedRecord.clock_out_time}`);
            
            // Calculate total hours
            const clockIn = new Date(updatedRecord.clock_in_time);
            const clockOut = new Date(updatedRecord.clock_out_time);
            const totalHours = Math.round((clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60) * 10) / 10;
            console.log(`   - Total Hours: ${totalHours}h`);
          } else {
            console.log('❌ Clock-out time not updated properly');
          }
        } else {
          console.log('❌ Clock-Out failed:', clockOutResult.message);
        }
      } else {
        console.log('❌ No clock-in record found');
      }
    } else {
      console.log('❌ Clock-In failed:', clockInResult.message);
    }

    // 6. Test GET API
    console.log('\n6. Testing GET Clock Records API...');
    const getResponse = await fetch(`http://localhost:3000/api/clock-records?employee_id=${testEmployee.id}`);
    const getResult = await getResponse.json();
    
    if (getResult.success) {
      console.log(`✅ GET API successful! Found ${getResult.data.length} records`);
      getResult.data.slice(0, 3).forEach((record, index) => {
        console.log(`   Record ${index + 1}:`);
        console.log(`     - Date: ${record.work_date}`);
        console.log(`     - Status: ${record.status}`);
        console.log(`     - Total Hours: ${record.total_hours || 'N/A'}h`);
      });
    } else {
      console.log('❌ GET API failed:', getResult.message);
    }

    // 7. Test duplicate clock-in prevention
    console.log('\n7. Testing duplicate clock-in prevention...');
    const duplicateResponse = await fetch('http://localhost:3000/api/clock-records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employee_id: testEmployee.id,
        type: 'clock_in'
      }),
    });

    const duplicateResult = await duplicateResponse.json();
    
    if (!duplicateResult.success && duplicateResult.message.includes('đã chấm công vào')) {
      console.log('✅ Duplicate clock-in prevention working correctly');
    } else {
      console.log('⚠️  Duplicate clock-in prevention may not be working:', duplicateResult);
    }

    console.log('\n🎉 Clock-In functionality test completed!');

  } catch (error) {
    console.error('❌ Error testing clock-in functionality:', error);
  }
}

testClockInFunctionality();
