const nodemailer = require('nodemailer');
const puppeteer = require('puppeteer');

// Set up environment variables directly for testing
process.env.GMAIL_USER = 'schedule@meraki.edu.vn';
process.env.GMAIL_APP_PASSWORD = 'vhms kuep huwx zcrm';

async function testSimpleEmail() {
  console.log('🧪 Testing Simple Email with PDF...\n');

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

    // Generate simple PDF
    console.log('\n📄 Generating PDF...');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .schedule-table { width: 100%; border-collapse: collapse; }
          .schedule-table th, .schedule-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .schedule-table th { background-color: #4CAF50; color: white; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Weekly Schedule</h1>
          <h2>Test Schedule - Jan 20-26, 2025</h2>
          <p><strong>Teacher:</strong> Thang Huynh</p>
        </div>
        
        <table class="schedule-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Class</th>
              <th>Room</th>
              <th>Subject</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Monday, Jan 20</td>
              <td>10:30 - 11:30</td>
              <td>GS53</td>
              <td>1.1</td>
              <td>TSI</td>
            </tr>
            <tr>
              <td>Monday, Jan 20</td>
              <td>14:30 - 15:30</td>
              <td>GS53</td>
              <td>2.1</td>
              <td>REP</td>
            </tr>
            <tr>
              <td>Tuesday, Jan 21</td>
              <td>09:00 - 10:00</td>
              <td>TATH-A1</td>
              <td>1.2</td>
              <td>TSI</td>
            </tr>
          </tbody>
        </table>
        
        <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
          <p>Generated on ${new Date().toLocaleString()}</p>
          <p>MerakiERP - Schedule Management System (Test)</p>
        </div>
      </body>
      </html>
    `;

    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    await browser.close();
    console.log(`   ✅ PDF generated (${pdfBuffer.length} bytes)`);

    // Send email
    console.log('\n📤 Sending email...');
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: 'thanghuynh@meraki.edu.vn',
      subject: 'Test Weekly Schedule - Jan 20-26, 2025',
      html: `
        <div style="font-family: Arial, sans-serif; margin: 20px;">
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
            <h3>🧪 TEST EMAIL</h3>
            <p>This is a test email to verify the schedule email functionality with PDF attachment.</p>
          </div>

          <h2>Weekly Schedule</h2>
          <p><strong>Period:</strong> Jan 20-26, 2025</p>
          <p><strong>Teacher:</strong> Thang Huynh</p>
          <p><strong>Email:</strong> thanghuynh@meraki.edu.vn</p>

          <h3>Schedule Summary:</h3>
          <ul>
            <li>Monday, Jan 20: 2 sessions (GS53)</li>
            <li>Tuesday, Jan 21: 1 session (TATH-A1)</li>
          </ul>

          <p>📎 <strong>Detailed schedule is attached as PDF</strong></p>

          <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>MerakiERP - Schedule Management System (Test)</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: 'schedule_Thang_Huynh_2025-01-20_2025-01-26.pdf',
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    const result = await transporter.sendMail(mailOptions);
    
    console.log('   ✅ Email sent successfully!');
    console.log(`   📧 Message ID: ${result.messageId}`);
    console.log(`   📬 Sent to: thanghuynh@meraki.edu.vn`);
    console.log(`   📎 PDF attachment: schedule_Thang_Huynh_2025-01-20_2025-01-26.pdf`);

    console.log('\n🎉 Test completed successfully!');
    console.log('   Check your email inbox for the schedule with PDF attachment.');

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
testSimpleEmail();
