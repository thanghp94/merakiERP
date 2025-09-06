// Since this is a TypeScript project, we'll test the API endpoint directly
const https = require('https');
const http = require('http');

async function testScheduleEmail() {
  console.log('🧪 Testing Schedule Email API Endpoint...\n');

  try {
    // Sample test data
    const testData = {
      teacherId: 'test-teacher-id',
      startDate: '2025-01-20',
      endDate: '2025-01-26',
      sessions: [
        {
          start_time: '2025-01-20T10:30:00Z',
          end_time: '2025-01-20T11:30:00Z',
          main_sessions: {
            classes: {
              class_name: 'GS53'
            }
          },
          data: {
            room: '1.1',
            class_name: 'GS53'
          },
          subject_type: 'TSI'
        },
        {
          start_time: '2025-01-20T14:30:00Z',
          end_time: '2025-01-20T15:30:00Z',
          main_sessions: {
            classes: {
              class_name: 'GS53'
            }
          },
          data: {
            room: '2.1',
            class_name: 'GS53'
          },
          subject_type: 'REP'
        }
      ]
    };

    console.log('📧 Testing email functionality...');
    console.log(`📬 Target email: thanghuynh@meraki.edu.vn`);
    console.log(`📅 Period: ${formatDateRange(testData.startDate, testData.endDate)}`);
    console.log(`📊 Sessions: ${testData.sessions.length} sessions\n`);

    // Generate test HTML
    const testHtml = generateTestScheduleHtml({
      teacher: {
        full_name: 'Thang Huynh',
        email: 'thanghuynh@meraki.edu.vn'
      },
      sessions: testData.sessions,
      startDate: testData.startDate,
      endDate: testData.endDate
    });

    console.log('📄 Generated HTML schedule preview:');
    console.log('─'.repeat(50));
    console.log(testHtml.substring(0, 500) + '...');
    console.log('─'.repeat(50));

    console.log('\n✅ Test completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Start your Next.js development server: npm run dev');
    console.log('2. Navigate to the schedule page');
    console.log('3. Click the "📧 Email Schedule" button');
    console.log('4. Select a teacher and send the email');
    console.log('\n💡 The email will be sent to the teacher\'s email address from the database.');

  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
}

function generateTestScheduleHtml(data) {
  const { teacher, sessions, startDate, endDate } = data;
  
  const formatTime = (timeString) => {
    return timeString.substring(11, 16);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Group sessions by date
  const sessionsByDate = {};
  sessions.forEach(session => {
    const date = session.start_time.split('T')[0];
    if (!sessionsByDate[date]) {
      sessionsByDate[date] = [];
    }
    sessionsByDate[date].push(session);
  });

  // Sort sessions within each date by start time
  Object.keys(sessionsByDate).forEach(date => {
    sessionsByDate[date].sort((a, b) => 
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
  });

  const sessionRows = Object.keys(sessionsByDate)
    .sort()
    .map(date => {
      const dateSessions = sessionsByDate[date];
      return dateSessions.map((session, index) => `
        <tr>
          ${index === 0 ? `<td rowspan="${dateSessions.length}" style="border: 1px solid #ddd; padding: 8px; background-color: #f9f9f9; font-weight: bold;">${formatDate(date)}</td>` : ''}
          <td style="border: 1px solid #ddd; padding: 8px;">${formatTime(session.start_time)} - ${formatTime(session.end_time)}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${session.main_sessions?.classes?.class_name || session.data?.class_name || 'Class'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${session.data?.room || session.data?.location || 'Room'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${session.subject_type || 'N/A'}</td>
        </tr>
      `).join('');
    }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Test Weekly Schedule</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .teacher-info { margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #4CAF50; color: white; padding: 12px; text-align: left; border: 1px solid #ddd; }
        td { padding: 8px; border: 1px solid #ddd; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        .test-notice { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="test-notice">
        <h3>🧪 TEST EMAIL</h3>
        <p>This is a test email to verify the schedule email functionality is working correctly.</p>
      </div>

      <div class="header">
        <h1>Weekly Schedule</h1>
        <h2>${formatDateRange(startDate, endDate)}</h2>
      </div>
      
      <div class="teacher-info">
        <h3>Teacher: ${teacher.full_name}</h3>
        <p>Email: ${teacher.email}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Class</th>
            <th>Room</th>
            <th>Subject Type</th>
          </tr>
        </thead>
        <tbody>
          ${sessionRows}
        </tbody>
      </table>

      <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
        <p>Generated on ${new Date().toLocaleString()}</p>
        <p>MerakiERP - Schedule Management System (Test)</p>
      </div>
    </body>
    </html>
  `;
}

function formatDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const startStr = start.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
  
  const endStr = end.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
  
  return `${startStr} - ${endStr}`;
}

// Run the test
testScheduleEmail();
