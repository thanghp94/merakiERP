import { NextApiRequest, NextApiResponse } from 'next';
import GoogleDriveService from '../../../lib/google-drive-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const driveService = new GoogleDriveService();
  
  if (req.query.code) {
    try {
      const tokens = await driveService.getTokens(req.query.code as string);
      res.json({ 
        success: true,
        tokens,
        message: 'Copy these tokens to your .env.local file',
        instructions: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          env_format: `
GOOGLE_ACCESS_TOKEN=${tokens.access_token}
GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}
          `
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  } else {
    const authUrl = driveService.getAuthUrl();
    res.redirect(authUrl);
  }
}
