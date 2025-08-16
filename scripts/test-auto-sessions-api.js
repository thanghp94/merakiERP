const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

async function testAutoSessionsAPI() {
  console.log('🧪 Testing Auto Sessions API...\n');

  try {
    // First, let's test if the server is running
    console.log('1. Testing server health...');
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    if (healthResponse.ok) {
      console.log('✅ Server is running\n');
    } else {
      console.log('❌ Server health check failed\n');
      return;
    }

    // Test getting classes
    console.log('2. Testing classes API...');
    const classesResponse = await fetch(`${BASE_URL}/api/classes`);
    const classesData = await classesResponse.json();
    
    if (classesData.success && classesData.data.length > 0) {
      console.log(`✅ Found ${classesData.data.length} classes`);
      
      // Find our test classes
      const grapeseedClass = classesData.data.find(cls => cls.class_name === 'GS53');
      const tathClass = classesData.data.find(cls => cls.class_name === 'TATH-A1');
      
      if (grapeseedClass) {
        console.log(`   Found GrapeSEED test class: ${grapeseedClass.class_name} (Unit: ${grapeseedClass.data?.unit || 'N/A'})`);
      }
      if (tathClass) {
        console.log(`   Found TATH test class: ${tathClass.class_name}`);
      }
      console.log('');

      // Test auto-sessions API with GrapeSEED class
      if (grapeseedClass) {
        console.log(`3. Testing auto-sessions API with GrapeSEED class: ${grapeseedClass.class_name}...`);
        
        const grapeseedPayload = {
          sessionCount: 3,
          sessionType: 'grapeseed',
          tsiFirst: true,
          startingLesson: 'L4',
          teacher: null,
          assistant: null,
          room: null,
          startDate: '2024-01-15'
        };

        console.log('GrapeSEED Payload:', JSON.stringify(grapeseedPayload, null, 2));

        const grapeseedResponse = await fetch(`${BASE_URL}/api/classes/${grapeseedClass.id}/auto-sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(grapeseedPayload)
        });

        const grapeseedResult = await grapeseedResponse.json();
        
        if (grapeseedResponse.ok) {
          console.log('✅ GrapeSEED auto-sessions API responded successfully');
          console.log('Response:', JSON.stringify(grapeseedResult, null, 2));
        } else {
          console.log('❌ GrapeSEED auto-sessions API failed');
          console.log('Error:', JSON.stringify(grapeseedResult, null, 2));
        }
        console.log('');
      }

      // Test auto-sessions API with TATH class
      if (tathClass) {
        console.log(`4. Testing auto-sessions API with TATH class: ${tathClass.class_name}...`);
        
        const tathPayload = {
          sessionCount: 2,
          sessionType: 'regular',
          weeklySchedule: [
            { day: 'tuesday', teacher: null, subjectType: 'GRA' },
            { day: 'thursday', teacher: null, subjectType: 'VOC' },
            { day: 'saturday', teacher: null, subjectType: 'LIS' }
          ],
          startDate: '2024-01-16'
        };

        console.log('TATH Payload:', JSON.stringify(tathPayload, null, 2));

        const tathResponse = await fetch(`${BASE_URL}/api/classes/${tathClass.id}/auto-sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tathPayload)
        });

        const tathResult = await tathResponse.json();
        
        if (tathResponse.ok) {
          console.log('✅ TATH auto-sessions API responded successfully');
          console.log('Response:', JSON.stringify(tathResult, null, 2));
        } else {
          console.log('❌ TATH auto-sessions API failed');
          console.log('Error:', JSON.stringify(tathResult, null, 2));
        }
        console.log('');
      }

    } else {
      console.log('❌ No classes found or API failed');
      console.log('Response:', JSON.stringify(classesData, null, 2));
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testAutoSessionsAPI();
