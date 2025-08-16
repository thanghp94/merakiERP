const fetch = require('node-fetch');

async function testClassFormSubmission() {
  console.log('Testing class form submission...');
  
  // Test data that matches what the form would send
  const testData = {
    class_name: 'Test Class Form',
    facility_id: null,
    status: 'active',
    start_date: '2024-01-15',
    data: {
      program_type: 'GrapeSEED',
      unit: 'U1',
      description: 'Test description from form',
      schedule_entries: [
        { id: '1', day: 'monday', startTime: '19:00', endTime: '21:00' }
      ]
    }
  };

  console.log('Sending data:');
  console.log(JSON.stringify(testData, null, 2));

  try {
    const response = await fetch('http://localhost:3000/api/classes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log('\nResponse status:', response.status);
    console.log('Response data:');
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n✅ Class created successfully!');
      console.log('Class ID:', result.data.id);
    } else {
      console.log('\n❌ Failed to create class');
      console.log('Error:', result.message);
    }

  } catch (error) {
    console.error('\n❌ Network error:', error.message);
  }
}

// Test with minimal required data
async function testMinimalData() {
  console.log('\n\nTesting with minimal required data...');
  
  const minimalData = {
    class_name: 'Minimal Test Class',
    start_date: '2024-01-15'
  };

  console.log('Sending minimal data:');
  console.log(JSON.stringify(minimalData, null, 2));

  try {
    const response = await fetch('http://localhost:3000/api/classes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(minimalData)
    });

    const result = await response.json();
    
    console.log('\nResponse status:', response.status);
    console.log('Response data:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('\n❌ Network error:', error.message);
  }
}

// Run tests
testClassFormSubmission().then(() => {
  return testMinimalData();
}).then(() => {
  console.log('\nTests completed.');
});
