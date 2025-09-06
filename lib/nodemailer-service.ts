import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: {
    filename: string;
    content: Buffer;
    contentType: string;
  }[];
}

export class NodemailerService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean;

  constructor() {
    // Check if Gmail credentials are configured
    this.isConfigured = !!(
      process.env.GMAIL_USER && 
      process.env.GMAIL_APP_PASSWORD
    );

    if (this.isConfigured) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        }
      });
    }
  }

  /**
   * Check if email service is properly configured
   */
  isReady(): boolean {
    return this.isConfigured;
  }

  /**
   * Send email with optional PDF attachment
   */
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string; fallbackUrl?: string }> {
    if (!this.isConfigured || !this.transporter) {
      // Fallback to Gmail compose URL
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(options.to)}&su=${encodeURIComponent(options.subject)}&body=${encodeURIComponent(options.html.replace(/<[^>]*>/g, ''))}&from=${process.env.GMAIL_USER || 'your-email@gmail.com'}`;
      
      return {
        success: false,
        error: 'Gmail credentials not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD environment variables.',
        fallbackUrl: gmailUrl
      };
    }

    try {
      const mailOptions: nodemailer.SendMailOptions = {
        from: process.env.GMAIL_USER,
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType
        }))
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error: any) {
      console.error('Email sending error:', error);
      
      // Fallback to Gmail compose URL
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(options.to)}&su=${encodeURIComponent(options.subject)}&body=${encodeURIComponent(options.html.replace(/<[^>]*>/g, ''))}&from=${process.env.GMAIL_USER || 'your-email@gmail.com'}`;
      
      return {
        success: false,
        error: error.message || 'Failed to send email',
        fallbackUrl: gmailUrl
      };
    }
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email connection test failed:', error);
      return false;
    }
  }
}

// Singleton instance
let nodemailerService: NodemailerService | null = null;

export function getNodemailerService(): NodemailerService {
  if (!nodemailerService) {
    nodemailerService = new NodemailerService();
  }
  return nodemailerService;
}
