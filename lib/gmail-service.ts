import { google } from 'googleapis';

export interface EmailData {
  to: string;
  subject: string;
  body: string;
  from?: string;
}

export class GmailService {
  private gmail: any;
  private auth: any;
  private isConfigured: boolean;

  constructor() {
    // Check if all required environment variables are present
    this.isConfigured = !!(
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN
    );

    if (this.isConfigured) {
      // Initialize OAuth2 client
      this.auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      // Set credentials if available
      this.auth.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
        access_token: process.env.GOOGLE_ACCESS_TOKEN,
      });

      this.gmail = google.gmail({ version: 'v1', auth: this.auth });
    }
  }

  /**
   * Check if Gmail service is properly configured
   */
  isReady(): boolean {
    return this.isConfigured;
  }

  /**
   * Create email message in RFC 2822 format
   */
  private createMessage(emailData: EmailData): string {
    const { to, subject, body, from = 'khachhang@meraki.edu.vn' } = emailData;
    
    const message = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      body
    ].join('\n');

    // Encode message in base64url format
    return Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * Send email using Gmail API or fallback to Gmail compose URL
   */
  async sendEmail(emailData: EmailData): Promise<{ success: boolean; messageId?: string; error?: string; fallbackUrl?: string }> {
    // If not configured, return Gmail compose URL as fallback
    if (!this.isConfigured) {
      const { to, subject, body } = emailData;
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}&from=khachhang@meraki.edu.vn`;
      
      return {
        success: false,
        error: 'Gmail API not configured. Please set up OAuth credentials.',
        fallbackUrl: gmailUrl
      };
    }

    try {
      // Refresh token if needed
      await this.auth.refreshAccessToken();
      
      const raw = this.createMessage(emailData);
      
      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: raw
        }
      });

      return {
        success: true,
        messageId: response.data.id
      };
    } catch (error: any) {
      console.error('Gmail API Error:', error);
      
      // Fallback to Gmail compose URL
      const { to, subject, body } = emailData;
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}&from=khachhang@meraki.edu.vn`;
      
      return {
        success: false,
        error: error.message || 'Failed to send email',
        fallbackUrl: gmailUrl
      };
    }
  }

  /**
   * Get OAuth2 authorization URL
   */
  getAuthUrl(): string {
    if (!this.auth) {
      throw new Error('Gmail service not configured');
    }

    const scopes = [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.compose'
    ];

    return this.auth.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokens(code: string): Promise<any> {
    if (!this.auth) {
      throw new Error('Gmail service not configured');
    }

    try {
      const { tokens } = await this.auth.getToken(code);
      this.auth.setCredentials(tokens);
      return tokens;
    } catch (error) {
      console.error('Error getting tokens:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<void> {
    if (!this.auth) {
      throw new Error('Gmail service not configured');
    }

    try {
      await this.auth.refreshAccessToken();
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }
}

// Singleton instance
let gmailService: GmailService | null = null;

export function getGmailService(): GmailService {
  if (!gmailService) {
    gmailService = new GmailService();
  }
  return gmailService;
}
