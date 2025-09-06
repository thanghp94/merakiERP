// @ts-ignore - html-pdf-node doesn't have types
const htmlPdf = require('html-pdf-node');

export interface PDFOptions {
  format?: 'A4' | 'A3' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}

export class PDFService {
  /**
   * Generate PDF from HTML content
   */
  static async generatePDF(html: string, options: PDFOptions = {}): Promise<Buffer> {
    const defaultOptions = {
      format: 'A4' as const,
      orientation: 'portrait' as const,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      },
      ...options
    };

    try {
      const file = { content: html };
      const pdfBuffer = await htmlPdf.generatePdf(file, {
        format: defaultOptions.format,
        landscape: defaultOptions.orientation === 'landscape',
        margin: defaultOptions.margin,
        printBackground: true,
        preferCSSPageSize: true
      });

      return pdfBuffer;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  /**
   * Generate schedule PDF with optimized styling
   */
  static async generateSchedulePDF(
    teacher: any,
    sessions: any[],
    startDate: string,
    endDate: string
  ): Promise<Buffer> {
    const html = this.generateCalendarHTML(teacher, sessions, startDate, endDate);
    
    return this.generatePDF(html, {
      format: 'A4',
      orientation: 'landscape', // Calendar format works better in landscape
      margin: {
        top: '15px',
        right: '15px',
        bottom: '15px',
        left: '15px'
      }
    });
  }

  /**
   * Generate HTML content optimized for PDF in calendar format
   */
  private static generateCalendarHTML(
    teacher: any,
    sessions: any[],
    startDate: string,
    endDate: string
  ): string {
    const formatTime = (timeString: string) => {
      return timeString.substring(11, 16);
    };

    const formatDateRange = (start: string, end: string) => {
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      const startStr = startDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      const endStr = endDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      
      return `${startStr} - ${endStr}`;
    };

    // Generate week dates
    const weekDates = this.getWeekDates(startDate, endDate);
    const dayNames = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

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
        const className = session.main_sessions?.classes?.class_name || session.data?.class_name || 'Class';
        const room = session.data?.room || session.data?.location || '';
        const subjectType = session.subject_type || '';
        const startTime = formatTime(session.start_time);
        const endTime = formatTime(session.end_time);
        
        // Color coding based on subject type
        let backgroundColor = '#e3f2fd'; // Default blue
        if (subjectType === 'TSI') backgroundColor = '#e8f5e8'; // Green
        if (subjectType === 'REP') backgroundColor = '#fff3e0'; // Orange
        if (subjectType === 'Other') backgroundColor = '#f3e5f5'; // Purple

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
            <div style="font-weight: bold; color: #333;">${className}</div>
            <div style="color: #666;">${teacher.full_name}</div>
            <div style="color: #666;">${startTime}-${endTime}</div>
            ${room ? `<div style="color: #666;">Room: ${room}</div>` : ''}
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

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Weekly Schedule - ${teacher.full_name}</title>
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
          <h2>${formatDateRange(startDate, endDate)}</h2>
        </div>
        
        <div class="teacher-info">
          <strong>Teacher:</strong> ${teacher.full_name} | <strong>Email:</strong> ${teacher.email}
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
  }

  /**
   * Generate week dates starting from Monday
   */
  private static getWeekDates(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Find the Monday of the week containing startDate
    const monday = new Date(start);
    const dayOfWeek = monday.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(monday.getDate() + daysToMonday);
    
    // Generate 7 days starting from Monday
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  }
}
