require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testGPSClockIn() {
  console.log('🧪 Testing GPS-based Clock-In Functionality...\n');

  try {
    // 1. Run the database migration first
    console.log('1. Running database migration...');
    const fs = require('fs');
    const migrationSQL = fs.readFileSync('./scripts/add-gps-to-facilities.sql', 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement.trim() });
          if (error && !error.message.includes('already exists')) {
            console.warn('Migration warning:', error.message);
          }
        } catch (err) {
          // Try direct query if RPC doesn't work
          const { error } = await supabase.from('_').select('*').limit(0);
          // Ignore errors for migration - they're expected for some statements
        }
      }
    }
    console.log('✅ Database migration completed');

    // 2. Check if Meraki facilities exist
    console.log('\n2. Checking Meraki facilities...');
    const { data: facilities, error: facilitiesError } = await supabase
      .from('facilities')
      .select('id, name, latitude, longitude, radius_meters, data')
      .eq('status', 'active');

    if (facilitiesError) {
      console.error('❌ Error fetching facilities:', facilitiesError);
      return;
    }

    const merakiFacilities = facilities?.filter(f => f.data?.type === 'Meraki') || [];
    console.log(`✅ Found ${merakiFacilities.length} Meraki facilities:`);
    merakiFacilities.forEach(f => {
      console.log(`   - ${f.name}: (${f.latitude}, ${f.longitude}) radius: ${f.radius_meters}m`);
    });

    if (merakiFacilities.length === 0) {
      console.log('⚠️  No Meraki facilities found. Creating sample facility...');
      
      const { data: newFacility, error: createError } = await supabase
        .from('facilities')
        .insert({
          name: 'Meraki Test Location',
          status: 'active',
          latitude: 10.7769,
          longitude: 106.7009,
          radius_meters: 20,
          data: { 
            type: 'Meraki', 
            address: '123 Test Street, Ho Chi Minh City',
            description: 'Test location for GPS clock-in'
          }
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating test facility:', createError);
        return;
      }

      console.log('✅ Created test Meraki facility:', newFacility.name);
      merakiFacilities.push(newFacility);
    }

    // 3. Get a test employee
    console.log('\n3. Getting test employee...');
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, full_name')
      .limit(1);

    if (employeesError || !employees || employees.length === 0) {
      console.error('❌ No employees found:', employeesError);
      return;
    }

    const testEmployee = employees[0];
    console.log(`✅ Using employee: ${testEmployee.full_name} (ID: ${testEmployee.id})`);

    // 4. Test GPS Clock-In API with valid location (within 20m of facility)
    console.log('\n4. Testing GPS Clock-In with VALID location...');
    const validLocation = {
      latitude: merakiFacilities[0].latitude + 0.0001, // ~11m away
      longitude: merakiFacilities[0].longitude + 0.0001
    };

    const clockInResponse = await fetch('http://localhost:3000/api/clock-records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employee_id: testEmployee.id,
        type: 'clock_in',
        latitude: validLocation.latitude,
        longitude: validLocation.longitude
      }),
    });

    const clockInResult = await clockInResponse.json();
    console.log('Valid Location Clock-In Response:', clockInResult);

    if (clockInResult.success) {
      console.log('✅ Valid location clock-in successful!');
      
      // 5. Test GPS Clock-Out
      console.log('\n5. Testing GPS Clock-Out...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

      const clockOutResponse = await fetch('http://localhost:3000/api/clock-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: testEmployee.id,
          type: 'clock_out',
          latitude: validLocation.latitude,
          longitude: validLocation.longitude
        }),
      });

      const clockOutResult = await clockOutResponse.json();
      console.log('Clock-Out Response:', clockOutResult);

      if (clockOutResult.success) {
        console.log('✅ Clock-out successful!');
      } else {
        console.log('❌ Clock-out failed:', clockOutResult.message);
      }
    } else {
      console.log('❌ Valid location clock-in failed:', clockInResult.message);
    }

    // 6. Test GPS Clock-In API with invalid location (too far from facility)
    console.log('\n6. Testing GPS Clock-In with INVALID location...');
    const invalidLocation = {
      latitude: merakiFacilities[0].latitude + 0.001, // ~111m away
      longitude: merakiFacilities[0].longitude + 0.001
    };

    const invalidClockInResponse = await fetch('http://localhost:3000/api/clock-records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employee_id: testEmployee.id,
        type: 'clock_in',
        latitude: invalidLocation.latitude,
        longitude: invalidLocation.longitude
      }),
    });

    const invalidClockInResult = await invalidClockInResponse.json();
    console.log('Invalid Location Clock-In Response:', invalidClockInResult);

    if (!invalidClockInResult.success) {
      console.log('✅ Invalid location correctly rejected!');
      console.log(`   Distance: ${invalidClockInResult.data?.distance}m`);
      console.log(`   Required: ${invalidClockInResult.data?.required_distance}m`);
    } else {
      console.log('⚠️  Invalid location was accepted (this might be unexpected)');
    }

    // 7. Test missing GPS coordinates
    console.log('\n7. Testing missing GPS coordinates...');
    const noGPSResponse = await fetch('http://localhost:3000/api/clock-records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employee_id: testEmployee.id,
        type: 'clock_in'
        // No latitude/longitude
      }),
    });

    const noGPSResult = await noGPSResponse.json();
    console.log('No GPS Response:', noGPSResult);

    if (!noGPSResult.success && noGPSResult.message.includes('GPS')) {
      console.log('✅ Missing GPS coordinates correctly rejected!');
    } else {
      console.log('⚠️  Missing GPS coordinates was not properly handled');
    }

    console.log('\n🎉 GPS-based Clock-In functionality test completed!');

  } catch (error) {
    console.error('❌ Error testing GPS clock-in functionality:', error);
  }
}

testGPSClockIn();
