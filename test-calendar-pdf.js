const nodemailer = require('nodemailer');

// Set up environment variables directly for testing
process.env.GMAIL_USER = 'schedule@meraki.edu.vn';
process.env.GMAIL_APP_PASSWORD = 'vhms kuep huwx zcrm';

// Import the PDF service (we'll use require since this is a JS file)
const { PDFService } = require('./lib/pdf-service.ts');

async function testCalendarPDF() {
  console.log('🧪 Testing Calendar PDF Email...\n');

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

    // Generate PDF using our updated PDF service
    console.log('\n📄 Generating Calendar PDF using PDFService...');
    const pdfBuffer = await PDFService.generateSchedulePDF(testTeacher, testSessions, startDate, endDate);
    console.log(`   ✅ Calendar PDF generated (${pdfBuffer.length} bytes)`);

    // Send email
    console.log('\n📤 Sending email with calendar PDF...');
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: 'thanghuynh@meraki.edu.vn',
      subject: 'NEW Calendar Format - Weekly Schedule - Jan 20-26, 2025',
      html: `
        <div style="font-family: Arial, sans-serif; margin: 20px;">
          <div style="background-color: #e8f5e8; border: 1px solid #4CAF50; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
            <h3>🎉 NEW CALENDAR FORMAT!</h3>
            <p>This email contains the updated weekly schedule in calendar format (landscape layout with Monday-Sunday columns).</p>
          </div>

          <h2>Weekly Schedule - Calendar Format</h2>
          <p><strong>Period:</strong> Jan 20-26, 2025</p>
          <p><strong>Teacher:</strong> ${testTeacher.full_name}</p>
          <p><strong>Email:</strong> ${testTeacher.email}</p>

          <h3>New Features:</h3>
          <ul>
            <li>📅 Weekly calendar layout (Monday-Sunday columns)</li>
            <li>🎨 Color-coded session blocks by subject type</li>
            <li>📄 Landscape orientation for better viewing</li>
            <li>🏷️ Professional styling with legend</li>
          </ul>

          <p>📎 <strong>Calendar schedule is attached as PDF</strong></p>

          <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>MerakiERP - Schedule Management System (Calendar Format)</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `calendar_schedule_${testTeacher.full_name.replace(/\s+/g, '_')}_${startDate}_${endDate}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    const result = await transporter.sendMail(mailOptions);
    
    console.log('   ✅ Email sent successfully!');
    console.log(`   📧 Message ID: ${result.messageId}`);
    console.log(`   📬 Sent to: ${testTeacher.email}`);
    console.log(`   📎 PDF attachment: calendar_schedule_${testTeacher.full_name.replace(/\s+/g, '_')}_${startDate}_${endDate}.pdf`);

    console.log('\n🎉 Calendar PDF test completed successfully!');
    console.log('   Check your email inbox for the NEW calendar format schedule!');

  } catch (error) {
    console.error('💥 Test failed with error:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure the PDF service is properly compiled');
    console.log('2. Check that all dependencies are installed');
    console.log('3. Verify the email credentials are correct');
  }
}

// Run the test
testCalendarPDF();
