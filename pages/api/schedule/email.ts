import { NextApiRequest, NextApiResponse } from 'next';
import { getNodemailerService } from '../../../lib/nodemailer-service';
import { PDFService } from '../../../lib/pdf-service';

interface EmailScheduleRequest {
  teacherId: string;
  startDate: string;
  endDate: string;
  sessions: any[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { teacherId, startDate, endDate, sessions }: EmailScheduleRequest = req.body;

    if (!teacherId || !startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: teacherId, startDate, endDate' 
      });
    }

    // Get teacher information with detailed logging
    console.log(`🔍 Looking up teacher with ID: ${teacherId}`);
    
    const teacherResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/employees?id=eq.${teacherId}`, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
      },
    });

    console.log(`📡 Teacher lookup response status: ${teacherResponse.status}`);
    
    const teacherData = await teacherResponse.json();
    console.log(`📋 Teacher data received:`, teacherData);
    
    const teacher = teacherData[0];
    console.log(`👤 Teacher found:`, teacher ? `${teacher.full_name} (${teacher.data?.email || 'NO EMAIL'})` : 'None');

    if (!teacher) {
      console.log(`❌ No teacher found with ID: ${teacherId}`);
      return res.status(404).json({
        success: false,
        message: `Teacher not found with ID: ${teacherId}`
      });
    }

    if (!teacher.data?.email) {
      console.log(`❌ Teacher ${teacher.full_name} has no email address in data field`);
      return res.status(404).json({
        success: false,
        message: `Teacher ${teacher.full_name} has no email address`
      });
    }

    console.log(`✅ Teacher validation passed: ${teacher.full_name} (${teacher.data.email})`);

    // Generate HTML schedule for email body
    const scheduleHtml = generateScheduleHtml(teacher, sessions, startDate, endDate);

    // Generate PDF attachment
    const pdfBuffer = await PDFService.generateSchedulePDF(teacher, sessions, startDate, endDate);
    const pdfFilename = `schedule_${teacher.full_name.replace(/\s+/g, '_')}_${startDate}_${endDate}.pdf`;

    // Send email with PDF attachment
    const emailService = getNodemailerService();
    const emailResult = await emailService.sendEmail({
      to: teacher.data.email,
      subject: `Weekly Schedule - ${formatDateRange(startDate, endDate)}`,
      html: scheduleHtml,
      attachments: [
        {
          filename: pdfFilename,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });

    if (emailResult.success) {
      return res.status(200).json({ 
        success: true, 
        message: 'Schedule email sent successfully' 
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send email' 
      });
    }

  } catch (error) {
    console.error('Error sending schedule email:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}

function generateScheduleHtml(teacher: any, sessions: any[], startDate: string, endDate: string): string {
  const formatTime = (timeString: string) => {
    return timeString.substring(11, 16);
  };

  // Generate week dates (Monday to Sunday)
  const getWeekDates = (startDate: string) => {
    const dates: string[] = [];
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

  const weekDates = getWeekDates(startDate);
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Group sessions by date
  const sessionsByDate: { [key: string]: any[] } = {};
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

  // Generate session summary for email body
  const sessionSummary = weekDates.map((date, index) => {
    const dayName = dayNames[index];
    const daySessions = sessionsByDate[date] || [];
    const formattedDate = new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });

    if (daySessions.length === 0) {
      return `<li><strong>${dayName}, ${formattedDate}:</strong> No sessions</li>`;
    }

    const sessionList = daySessions.map(session => {
      const className = session.main_sessions?.classes?.class_name || session.data?.class_name || 'Class';
      const startTime = formatTime(session.start_time);
      const endTime = formatTime(session.end_time);
      const room = session.data?.room || session.data?.location || '';
      const subjectType = session.subject_type || '';
      
      return `${className} (${startTime}-${endTime}${room ? `, Room ${room}` : ''}${subjectType ? `, ${subjectType}` : ''})`;
    }).join(', ');

    return `<li><strong>${dayName}, ${formattedDate}:</strong> ${sessionList}</li>`;
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
        .header h1 { color: #2c3e50; margin-bottom: 10px; }
        .header h2 { color: #4CAF50; font-weight: normal; }
        .teacher-info { 
          background-color: #f8f9fa; 
          padding: 15px; 
          border-radius: 5px; 
          margin-bottom: 20px;
          border-left: 4px solid #4CAF50;
        }
        .schedule-summary { margin-bottom: 20px; }
        .schedule-summary ul { padding-left: 20px; }
        .schedule-summary li { margin-bottom: 8px; line-height: 1.4; }
        .pdf-notice {
          background-color: #e8f5e8;
          border: 1px solid #4CAF50;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .pdf-notice h3 { margin-top: 0; color: #2c3e50; }
        .footer { 
          margin-top: 30px; 
          text-align: center; 
          color: #666; 
          font-size: 12px;
          border-top: 1px solid #ddd;
          padding-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Weekly Schedule</h1>
        <h2>${formatDateRange(startDate, endDate)}</h2>
      </div>
      
      <div class="teacher-info">
        <h3>Teacher: ${teacher.full_name}</h3>
        <p>Email: ${teacher.data.email}</p>
      </div>

      <div class="pdf-notice">
        <h3>📅 Calendar Format Schedule</h3>
        <p>Your detailed weekly schedule is attached as a PDF in <strong>calendar format</strong> with the following features:</p>
        <ul>
          <li>📅 Weekly calendar layout (Monday-Sunday columns)</li>
          <li>🎨 Color-coded session blocks by subject type</li>
          <li>📄 Landscape orientation for better viewing</li>
          <li>🏷️ Professional styling with legend</li>
        </ul>
      </div>

      <div class="schedule-summary">
        <h3>Schedule Summary:</h3>
        <ul>
          ${sessionSummary}
        </ul>
        <p><strong>Total Sessions:</strong> ${sessions.length}</p>
      </div>

      <div class="footer">
        <p>Generated on ${new Date().toLocaleString()}</p>
        <p>MerakiERP - Schedule Management System</p>
      </div>
    </body>
    </html>
  `;
}

function formatDateRange(startDate: string, endDate: string): string {
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
