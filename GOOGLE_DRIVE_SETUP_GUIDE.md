# Google Drive Integration Setup Guide

This guide will help you set up Google Drive integration for the media upload feature in the Sessions tab.

## Prerequisites

- Google Cloud Console account
- Google Drive API enabled
- OAuth 2.0 credentials configured

## Step 1: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"

## Step 2: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure the OAuth consent screen if prompted
4. Choose "Web application" as the application type
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback` (for development)
   - Your production domain callback URL

## Step 3: Environment Variables

Add these variables to your `.env.local` file:

```env
# Google Drive API Configuration
GOOGLE_CLIENT_ID=946908178422-82rh3p01mffskbqd7562cclgd52ksiqf.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback

# These will be obtained through OAuth flow
GOOGLE_ACCESS_TOKEN=your_access_token_here
GOOGLE_REFRESH_TOKEN=your_refresh_token_here
```

## Step 4: Obtain Access and Refresh Tokens

You need to complete the OAuth flow to get the access and refresh tokens. Here are two methods:

### Method 1: Using Google OAuth Playground

1. Go to [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Click the gear icon (⚙️) in the top right
3. Check "Use your own OAuth credentials"
4. Enter your Client ID and Client Secret
5. In the left panel, find "Drive API v3"
6. Select the scopes you need:
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/drive.metadata.readonly`
7. Click "Authorize APIs"
8. Complete the authorization flow
9. Click "Exchange authorization code for tokens"
10. Copy the `access_token` and `refresh_token`

### Method 2: Using the Application

1. Create a temporary endpoint in your Next.js app:

```typescript
// pages/api/auth/google-drive.ts
import { NextApiRequest, NextApiResponse } from 'next';
import GoogleDriveService from '../../../lib/google-drive-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const driveService = new GoogleDriveService();
  
  if (req.query.code) {
    try {
      const tokens = await driveService.getTokens(req.query.code as string);
      res.json({ tokens });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    const authUrl = driveService.getAuthUrl();
    res.redirect(authUrl);
  }
}
```

2. Visit `http://localhost:3000/api/auth/google-drive`
3. Complete the OAuth flow
4. Copy the tokens from the response

## Step 5: Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to the Sessions tab
3. Click the camera button (📷) on any session
4. Try uploading an image or video
5. Check your Google Drive for the uploaded files

## Folder Structure

Files will be organized in Google Drive as follows:

```
MerakiERP/
├── Classes/
│   ├── [Class Name]/
│   │   ├── Sessions/
│   │   │   ├── [Session Name]/
│   │   │   │   ├── uploaded_image.jpg
│   │   │   │   ├── uploaded_video.mp4
│   │   │   │   └── ...
```

## Troubleshooting

### Common Issues

1. **"Invalid client" error**
   - Check that your Client ID and Secret are correct
   - Ensure the redirect URI matches exactly

2. **"Access denied" error**
   - Make sure the Google Drive API is enabled
   - Check that the required scopes are included

3. **"Token expired" error**
   - The access token has expired
   - The refresh token should automatically get a new access token
   - If refresh token is invalid, you'll need to re-authorize

### Token Refresh

The Google Drive service automatically handles token refresh using the refresh token. If you encounter persistent authentication issues, you may need to:

1. Delete the current tokens from your environment
2. Re-run the OAuth flow to get new tokens
3. Update your `.env.local` file

## Security Notes

- Never commit your `.env.local` file to version control
- Keep your Client Secret secure
- Consider using environment-specific credentials for production
- Regularly rotate your tokens for security

## Production Deployment

For production deployment:

1. Update the redirect URI to your production domain
2. Use environment variables in your hosting platform
3. Consider using a service account for server-to-server authentication
4. Implement proper error handling and logging

## Support

If you encounter issues:

1. Check the Google Cloud Console logs
2. Verify your API quotas and limits
3. Review the Google Drive API documentation
4. Check the browser console for client-side errors
