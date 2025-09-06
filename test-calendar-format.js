const nodemailer = require('nodemailer');
const puppeteer = require('puppeteer');

// Set up environment variables directly for testing
process.env.GMAIL_USER = 'schedule@meraki.edu.vn';
process.env.GMAIL_APP_PASSWORD = 'vhms kuep huwx zcrm';

async function testCalendarFormat() {
  console.log('🧪 Testing NEW Calendar Format PDF Email...\n');

  try {
    // Check environment variables
    console.log('🔧 Environment Check:');
    console.log(`   GMAIL_USER: ${process.env.GMAIL_USER ? '✅ Set' : '❌ Missing'}`);
    console.log(`   GMAIL_APP_PASSWORD: ${process.env.GMAIL_APP_PASSWORD ? '✅ Set' : '❌ Missing'}`);
    console.log(`   From: ${process.env.GMAIL_USER}`);

    // Create transporter
    console.log('\n📧 Creating email transporter...');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    // Test connection
    console.log('🔗 Testing connection...');
    await transporter.verify();
    console.log('   ✅ Connection successful!');

    // Generate Calendar Format PDF
    console.log('\n📄 Generating Calendar Format PDF...');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Test data
    const testTeacher = {
      full_name: 'Thang Huynh',
      email: 'thanghuynh@meraki.edu.vn'
    };

    const testSessions = [
      {
        start_time: '2025-01-20T10:30:00Z',
        end_time: '2025-01-20T11:30:00Z',
        class_name: 'GS53',
        room: '1.1',
        subject_type: 'TSI'
      },
      {
        start_time: '2025-01-20T14:30:00Z',
        end_time: '2025-01-20T15:30:00Z',
        class_name: 'GS53',
        room: '2.1',
        subject_type: 'REP'
      },
      {
        start_time: '2025-01-21T09:00:00Z',
        end_time: '2025-01-21T10:00:00Z',
        class_name: 'TATH-A1',
        room: '1.2',
        subject_type: 'TSI'
      }
    ];

    // Generate week dates (Monday to Sunday)
    const getWeekDates = (startDate) => {
      const dates = [];
      const start = new Date(startDate);
      
      // Find Monday of the week
      const monday = new Date(start);
      const dayOfWeek = monday.getDay();
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      monday.setDate(monday.getDate() + daysToMonday);
      
      // Generate 7 days
      for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
      }
      
      return dates;
    };

    const weekDates = getWeekDates('2025-01-20');
    const dayNames = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

    // Group sessions by date
    const sessionsByDate = {};
    testSessions.forEach(session => {
      const date = session.start_time.split('T')[0];
      if (!sessionsByDate[date]) {
        sessionsByDate[date] = [];
      }
      sessionsByDate[date].push(session);
    });

    // Generate day columns
    const dayColumns = weekDates.map((date, index) => {
      const dayName = dayNames[index];
      const daySessions = sessionsByDate[date] || [];
      const formattedDate = new Date(date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      }).replace(/\//g, '-');

      const sessionBlocks = daySessions.map(session => {
        const startTime = session.start_time.substring(11, 16);
        const endTime = session.end_time.substring(11, 16);
        
        // Color coding based on subject type
        let backgroundColor = '#e3f2fd'; // Default blue
        if (session.subject_type === 'TSI') backgroundColor = '#e8f5e8'; // Green
        if (session.subject_type === 'REP') backgroundColor = '#fff3e0'; // Orange
        if (session.subject_type === 'Other') backgroundColor = '#f3e5f5'; // Purple

        return `
          <div class="session-block" style="
            background-color: ${backgroundColor};
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 8px;
            margin-bottom: 8px;
            font-size: 11px;
            line-height: 1.3;
          ">
            <div style="font-weight: bold; color: #333;">${session.class_name}</div>
            <div style="color: #666;">${testTeacher.full_name}</div>
            <div style="color: #666;">${startTime}-${endTime}</div>
            ${session.room ? `<div style="color: #666;">Room: ${session.room}</div>` : ''}
          </div>
        `;
      }).join('');

      return `
        <div class="day-column" style="
          flex: 1;
          border: 1px solid #ddd;
          min-height: 400px;
          background-color: white;
        ">
          <div class="day-header" style="
            background-color: #f5f5f5;
            padding: 12px 8px;
            text-align: center;
            border-bottom: 1px solid #ddd;
            font-weight: bold;
            font-size: 12px;
          ">
            <div>${dayName}</div>
            <div style="font-size: 10px; color: #666; margin-top: 2px;">${formattedDate}</div>
          </div>
          <div class="day-content" style="padding: 8px;">
            ${daySessions.length > 0 ? sessionBlocks : `
              <div style="text-align: center; color: #999; font-style: italic; margin-top: 20px; font-size: 11px;">
                No sessions
              </div>
            `}
          </div>
        </div>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Class Schedule - ${testTeacher.full_name}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 15px;
          }
          
          body { 
            font-family: Arial, sans-serif; 
            margin: 15px; 
            color: #333; 
            font-size: 12px;
          }
          .header { 
            text-align: center; 
            margin-bottom: 20px; 
          }
          .header h1 {
            margin: 0 0 5px 0;
            font-size: 24px;
            font-weight: bold;
          }
          .header h2 {
            margin: 0 0 10px 0;
            font-size: 16px;
            color: #666;
            font-weight: normal;
          }
          .teacher-info {
            text-align: center;
            margin-bottom: 20px;
            font-size: 14px;
            color: #666;
          }
          .calendar-grid {
            display: flex;
            gap: 1px;
            background-color: #ddd;
            border: 1px solid #ddd;
          }
          .legend {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-bottom: 15px;
            font-size: 11px;
          }
          .legend-item {
            display: flex;
            align-items: center;
            gap: 5px;
          }
          .legend-color {
            width: 12px;
            height: 12px;
            border-radius: 2px;
            border: 1px solid #ddd;
          }
          .footer {
            margin-top: 20px;
            text-align: center;
            color: #666;
            font-size: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Class Schedule</h1>
          <h2>Jan 20-26, 2025</h2>
        </div>
        
        <div class="teacher-info">
          <strong>Teacher:</strong> ${testTeacher.full_name} | <strong>Email:</strong> ${testTeacher.email}
        </div>

        <div class="legend">
          <div class="legend-item">
            <div class="legend-color" style="background-color: #e8f5e8;"></div>
            <span>TSI (GrapeSEED)</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #fff3e0;"></div>
            <span>REP (GrapeSEED)</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #f3e5f5;"></div>
            <span>Other</span>
          </div>
        </div>

        <div class="calendar-grid">
          ${dayColumns}
        </div>

        <div class="footer">
          <p>Generated on ${new Date().toLocaleString()}</p>
          <p>MerakiERP - Schedule Management System</p>
        </div>
      </body>
      </html>
    `;

    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: {
        top: '15px',
        right: '15px',
        bottom: '15px',
        left: '15px'
      }
    });

    await browser.close();
    console.log(`   ✅ Calendar PDF generated (${pdfBuffer.length} bytes)`);

    // Send email
    console.log('\n📤 Sending email with NEW calendar format...');
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: 'thanghuynh@meraki.edu.vn',
      subject: '🎉 NEW CALENDAR FORMAT - Weekly Schedule - Jan 20-26, 2025',
      html: `
        <div style="font-family: Arial, sans-serif; margin: 20px;">
          <div style="background-color: #e8f5e8; border: 1px solid #4CAF50; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
            <h3>🎉 NEW CALENDAR FORMAT!</h3>
            <p>This email contains the updated weekly schedule in calendar format with the following improvements:</p>
            <ul>
              <li>📅 Weekly calendar layout (Monday-Sunday columns)</li>
              <li>🎨 Color-coded session blocks by subject type</li>
              <li>📄 Landscape orientation for better viewing</li>
              <li>🏷️ Professional styling with legend</li>
            </ul>
          </div>

          <h2>Weekly Schedule - Calendar Format</h2>
          <p><strong>Period:</strong> Jan 20-26, 2025</p>
          <p><strong>Teacher:</strong> ${testTeacher.full_name}</p>
          <p><strong>Email:</strong> ${testTeacher.email}</p>

          <h3>Schedule Summary:</h3>
          <ul>
            <li>Monday, Jan 20: 2 sessions (GS53 - TSI & REP)</li>
            <li>Tuesday, Jan 21: 1 session (TATH-A1 - TSI)</li>
            <li>Wednesday-Sunday: No sessions scheduled</li>
          </ul>

          <p>📎 <strong>NEW Calendar format schedule is attached as PDF</strong></p>

          <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>MerakiERP - Schedule Management System (NEW Calendar Format)</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `NEW_calendar_schedule_${testTeacher.full_name.replace(/\s+/g, '_')}_2025-01-20_2025-01-26.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    const result = await transporter.sendMail(mailOptions);
    
    console.log('   ✅ Email sent successfully!');
    console.log(`   📧 Message ID: ${result.messageId}`);
    console.log(`   📬 Sent to: ${testTeacher.email}`);
    console.log(`   📎 PDF attachment: NEW_calendar_schedule_${testTeacher.full_name.replace(/\s+/g, '_')}_2025-01-20_2025-01-26.pdf`);

    console.log('\n🎉 NEW Calendar Format test completed successfully!');
    console.log('   Check your email inbox for the UPDATED calendar format schedule!');
    console.log('   📅 This should now show a weekly calendar layout instead of a table!');

  } catch (error) {
    console.error('💥 Test failed with error:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your .env.local file has the correct Gmail credentials');
    console.log('2. Verify your Gmail App Password is correct');
    console.log('3. Ensure 2FA is enabled on your Gmail account');
    console.log('4. Make sure all dependencies are installed: npm install');
  }
}

// Run the test
testCalendarFormat();
