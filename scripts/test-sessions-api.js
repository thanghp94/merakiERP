const fetch = require('node-fetch');

async function testSessionsAPI() {
  try {
    console.log('Testing Sessions API...');
    
    // Test with today's date
    const today = new Date().toISOString().split('T')[0];
    console.log('Testing date:', today);
    
    const response = await fetch(`http://localhost:3000/api/sessions?start_date=${today}&end_date=${today}`);
    const result = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(result, null, 2));
    
    if (result.success && result.data) {
      console.log('Number of sessions found:', result.data.length);
      
      if (result.data.length > 0) {
        console.log('First session structure:');
        console.log(JSON.stringify(result.data[0], null, 2));
      }
    }
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testSessionsAPI();
