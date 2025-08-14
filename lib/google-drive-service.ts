import { google } from 'googleapis';

interface DriveFile {
  id: string;
  name: string;
  webViewLink: string;
  webContentLink: string;
}

interface UploadResult {
  success: boolean;
  file?: DriveFile;
  error?: string;
}

class GoogleDriveService {
  private auth: any;
  private drive: any;

  constructor() {
    // Initialize OAuth2 client
    this.auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google-drive'
    );

    // Set credentials if available
    if (process.env.GOOGLE_ACCESS_TOKEN && process.env.GOOGLE_REFRESH_TOKEN) {
      this.auth.setCredentials({
        access_token: process.env.GOOGLE_ACCESS_TOKEN,
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      });
    }

    this.drive = google.drive({ version: 'v3', auth: this.auth });
  }

  // Set credentials dynamically (for user-specific tokens)
  setCredentials(accessToken: string, refreshToken: string) {
    this.auth.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  // Create folder if it doesn't exist
  async createFolder(name: string, parentId?: string): Promise<string | null> {
    try {
      // Check if folder already exists
      const existingFolder = await this.findFolder(name, parentId);
      if (existingFolder) {
        return existingFolder.id;
      }

      const folderMetadata = {
        name: name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : undefined,
      };

      const folder = await this.drive.files.create({
        resource: folderMetadata,
        fields: 'id',
      });

      return folder.data.id;
    } catch (error) {
      console.error('Error creating folder:', error);
      return null;
    }
  }

  // Find folder by name
  async findFolder(name: string, parentId?: string): Promise<any> {
    try {
      let query = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      if (parentId) {
        query += ` and '${parentId}' in parents`;
      }

      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id, name)',
      });

      return response.data.files && response.data.files.length > 0 
        ? response.data.files[0] 
        : null;
    } catch (error) {
      console.error('Error finding folder:', error);
      return null;
    }
  }

  // Create folder structure for session media
  async createSessionFolderStructure(className: string, sessionName: string): Promise<string | null> {
    try {
      // Create root MerakiERP folder
      const rootFolderId = await this.createFolder('MerakiERP');
      if (!rootFolderId) return null;

      // Create Classes folder
      const classesFolderId = await this.createFolder('Classes', rootFolderId);
      if (!classesFolderId) return null;

      // Create specific class folder
      const classFolderId = await this.createFolder(className, classesFolderId);
      if (!classFolderId) return null;

      // Create Sessions folder
      const sessionsFolderId = await this.createFolder('Sessions', classFolderId);
      if (!sessionsFolderId) return null;

      // Create specific session folder
      const sessionFolderId = await this.createFolder(sessionName, sessionsFolderId);
      
      return sessionFolderId;
    } catch (error) {
      console.error('Error creating session folder structure:', error);
      return null;
    }
  }

  // Upload file to Google Drive
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    folderId?: string
  ): Promise<UploadResult> {
    try {
      const fileMetadata = {
        name: fileName,
        parents: folderId ? [folderId] : undefined,
      };

      const media = {
        mimeType: mimeType,
        body: fileBuffer,
      };

      const file = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, name, webViewLink, webContentLink',
      });

      // Make file publicly viewable
      await this.drive.permissions.create({
        fileId: file.data.id,
        resource: {
          role: 'reader',
          type: 'anyone',
        },
      });

      return {
        success: true,
        file: {
          id: file.data.id,
          name: file.data.name,
          webViewLink: file.data.webViewLink,
          webContentLink: file.data.webContentLink,
        },
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Upload session media (images/videos)
  async uploadSessionMedia(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    className: string,
    sessionName: string
  ): Promise<UploadResult> {
    try {
      // Create folder structure
      const sessionFolderId = await this.createSessionFolderStructure(className, sessionName);
      if (!sessionFolderId) {
        return {
          success: false,
          error: 'Failed to create folder structure',
        };
      }

      // Upload file to session folder
      return await this.uploadFile(fileBuffer, fileName, mimeType, sessionFolderId);
    } catch (error) {
      console.error('Error uploading session media:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get authorization URL for OAuth flow
  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.metadata.readonly',
    ];

    return this.auth.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });
  }

  // Exchange authorization code for tokens
  async getTokens(code: string): Promise<any> {
    try {
      const { tokens } = await this.auth.getToken(code);
      return tokens;
    } catch (error) {
      console.error('Error getting tokens:', error);
      throw error;
    }
  }
}

export default GoogleDriveService;
