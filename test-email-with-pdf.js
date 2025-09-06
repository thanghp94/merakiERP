const { getNodemailerService } = require('./lib/nodemailer-service');
const { PDFService } = require('./lib/pdf-service');

async function testEmailWithPDF() {
  console.log('🧪 Testing Email with PDF Attachment...\n');

  try {
    // Test data
    const testTeacher = {
      full_name: 'Thang Huynh',
      email: 'thanghuynh@meraki.edu.vn'
    };

    const testSessions = [
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
      },
      {
        start_time: '2025-01-21T09:00:00Z',
        end_time: '2025-01-21T10:00:00Z',
        main_sessions: {
          classes: {
            class_name: 'TATH-A1'
          }
        },
        data: {
          room: '1.2',
          class_name: 'TATH-A1'
        },
        subject_type: 'TSI'
      }
    ];

    const startDate = '2025-01-20';
    const endDate = '2025-01-26';

    console.log('📧 Test Configuration:');
    console.log(`📬 To: ${testTeacher.email}`);
    console.log(`👨‍🏫 Teacher: ${testTeacher.full_name}`);
    console.log(`📅 Period: ${formatDateRange(startDate, endDate)}`);
    console.log(`📊 Sessions: ${testSessions.length} sessions\n`);

    // Check email service configuration
    const emailService = getNodemailerService();
    console.log('🔧 Email Service Status:');
    console.log(`   Configured: ${emailService.isReady() ? '✅ Yes' : '❌ No'}`);
    
    if (!emailService.isReady()) {
      console.log('   ⚠️  Gmail credentials not found in environment variables');
      console.log('   📝 Required: GMAIL_USER and GMAIL_APP_PASSWORD');
      console.log('\n📋 Setup Instructions:');
      console.log('   1. Enable 2FA on your Gmail account');
      console.log('   2. Generate an App Password for Gmail');
      console.log('   3. Add to your .env.local file:');
      console.log('      GMAIL_USER=your-email@gmail.com');
      console.log('      GMAIL_APP_PASSWORD=your-16-character-app-password');
      console.log('\n🔗 Detailed setup guide: https://support.google.com/accounts/answer/185833');
    } else {
      console.log('   ✅ Testing connection...');
      const connectionTest = await emailService.testConnection();
      console.log(`   Connection: ${connectionTest ? '✅ Success' : '❌ Failed'}`);
    }

    console.log('\n📄 Generating PDF...');
    const pdfBuffer = await PDFService.generateSchedulePDF(testTeacher, testSessions, startDate, endDate);
    console.log(`   ✅ PDF generated (${pdfBuffer.length} bytes)`);

    console.log('\n📧 Generating email HTML...');
    const emailHtml = generateEmailHTML(testTeacher, testSessions, startDate, endDate);
    console.log('   ✅ Email HTML generated');

    console.log('\n📤 Sending email...');
    const emailResult = await emailService.sendEmail({
      to: testTeacher.email,
      subject: `Test Weekly Schedule - ${formatDateRange(startDate, endDate)}`,
      html: emailHtml,
      attachments: [
        {
          filename: `schedule_${testTeacher.full_name.replace(/\s+/g, '_')}_${startDate}_${endDate}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });

    if (emailResult.success) {
      console.log('   ✅ Email sent successfully!');
      console.log(`   📧 Message ID: ${emailResult.messageId}`);
      console.log(`   📬 Sent to: ${testTeacher.email}`);
      console.log('\n🎉 Test completed successfully!');
      console.log('   Check your email inbox for the schedule with PDF attachment.');
    } else {
      console.log('   ❌ Email sending failed:');
      console.log(`   Error: ${emailResult.error}`);
      
      if (emailResult.fallbackUrl) {
        console.log('\n🔗 Fallback Gmail compose URL:');
        console.log(emailResult.fallbackUrl);
        console.log('\n💡 You can copy this URL and paste it in your browser to send manually.');
      }
    }

  } catch (error) {
    console.error('💥 Test failed with error:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure all dependencies are installed: npm install');
    console.log('2. Check your environment variables in .env.local');
    console.log('3. Verify your Gmail App Password is correct');
    console.log('4. Ensure 2FA is enabled on your Gmail account');
  }
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

function generateEmailHTML(teacher, sessions, startDate, endDate) {
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
      <title>Weekly Schedule</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; }
        .teacher-info { margin-bottom: 20px; background-color: #f8f9fa; padding: 15px; border-radius: 5px; }
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
        <p>This is a test email to verify the schedule email functionality with PDF attachment.</p>
      </div>

      <div class="header">
        <h1>Weekly Schedule</h1>
        <h2>${formatDateRange(startDate, endDate)}</h2>
      </div>
      
      <div class="teacher-info">
        <h3>Teacher: ${teacher.full_name}</h3>
        <p>Email: ${teacher.email}</p>
      </div>

      ${sessions.length > 0 ? `
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
      ` : `
        <div style="text-align: center; padding: 20px; color: #666;">
          <p>No sessions scheduled for this period.</p>
        </div>
      `}

      <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
        <p>Generated on ${new Date().toLocaleString()}</p>
        <p>MerakiERP - Schedule Management System (Test)</p>
        <p>📎 PDF schedule attached</p>
      </div>
    </body>
    </html>
  `;
}

// Set environment variables for testing
process.env.GMAIL_USER = 'schedule@meraki.edu.vn';
process.env.GMAIL_APP_PASSWORD = 'vhms kuep huwx zcrm';

// Run the test
testEmailWithPDF();
