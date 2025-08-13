import { NextApiRequest, NextApiResponse } from 'next';
import { getGmailService } from '../../lib/gmail-service';
import { getTemplateById, renderTemplate } from '../../lib/email-templates';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { templateId, recipientEmail, admissionData } = req.body;

    if (!templateId || !recipientEmail || !admissionData) {
      return res.status(400).json({ 
        error: 'Missing required fields: templateId, recipientEmail, admissionData' 
      });
    }

    // Get email template
    const template = getTemplateById(templateId);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Prepare template data
    const templateData = {
      customerName: admissionData.parent_name || admissionData.student_name,
      studentName: admissionData.student_name,
      phone: admissionData.phone,
      interestedProgram: admissionData.data?.interested_program,
      budget: admissionData.data?.budget,
      consultantName: 'Tư vấn viên Meraki' // This could be dynamic based on user
    };

    // Render template
    const { subject, body } = renderTemplate(template, templateData);

    // Send email using Gmail API
    const gmailService = getGmailService();
    const result = await gmailService.sendEmail({
      to: recipientEmail,
      subject,
      body,
      from: 'khachhang@meraki.edu.vn'
    });

    if (result.success) {
      res.status(200).json({ 
        success: true, 
        messageId: result.messageId,
        message: 'Email sent successfully' 
      });
    } else {
      // If there's a fallback URL, return it for the client to handle
      if (result.fallbackUrl) {
        res.status(200).json({ 
          success: false, 
          error: result.error || 'Gmail API not configured',
          fallbackUrl: result.fallbackUrl,
          message: 'Opening Gmail compose window...'
        });
      } else {
        res.status(500).json({ 
          success: false, 
          error: result.error || 'Failed to send email' 
        });
      }
    }

  } catch (error: any) {
    console.error('Send email error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
}
