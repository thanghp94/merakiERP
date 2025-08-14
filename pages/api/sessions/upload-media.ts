import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, File, Fields, Files } from 'formidable';
import fs from 'fs';
import path from 'path';
import GoogleDriveService from '../../../lib/google-drive-service';
import { createClient } from '@supabase/supabase-js';

// Disable default body parser to handle multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface UploadedFile extends File {
  filepath: string;
  originalFilename: string;
  mimetype: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Parse the multipart form data
    const form = new IncomingForm({
      uploadDir: '/tmp',
      keepExtensions: true,
      maxFileSize: 100 * 1024 * 1024, // 100MB
    });

    const [fields, files] = await new Promise<[Fields, Files]>((resolve, reject) => {
      form.parse(req, (err: any, fields: Fields, files: Files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const sessionId = Array.isArray(fields.sessionId) ? fields.sessionId[0] : fields.sessionId;
    const className = Array.isArray(fields.className) ? fields.className[0] : fields.className;
    const sessionName = Array.isArray(fields.sessionName) ? fields.sessionName[0] : fields.sessionName;

    if (!sessionId || !className || !sessionName) {
      return res.status(400).json({ 
        message: 'Missing required fields: sessionId, className, sessionName' 
      });
    }

    // Get the uploaded file
    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!uploadedFile) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = uploadedFile as UploadedFile;

    // Read file buffer
    const fileBuffer = fs.readFileSync(file.filepath);
    
    // Initialize Google Drive service
    const driveService = new GoogleDriveService();
    
    // Set credentials (you might want to get these from user session or environment)
    // For now, using service account or default credentials
    if (process.env.GOOGLE_ACCESS_TOKEN && process.env.GOOGLE_REFRESH_TOKEN) {
      driveService.setCredentials(
        process.env.GOOGLE_ACCESS_TOKEN,
        process.env.GOOGLE_REFRESH_TOKEN
      );
    }

    // Upload to Google Drive
    const uploadResult = await driveService.uploadSessionMedia(
      fileBuffer,
      file.originalFilename || 'unnamed_file',
      file.mimetype || 'application/octet-stream',
      className,
      sessionName
    );

    if (!uploadResult.success) {
      // Clean up temp file
      fs.unlinkSync(file.filepath);
      return res.status(500).json({ 
        message: 'Failed to upload to Google Drive',
        error: uploadResult.error 
      });
    }

    // Update session data in database with media URL
    const { data: sessionData, error: fetchError } = await supabase
      .from('sessions')
      .select('data')
      .eq('id', sessionId)
      .single();

    if (fetchError) {
      console.error('Error fetching session:', fetchError);
      // Clean up temp file
      fs.unlinkSync(file.filepath);
      return res.status(500).json({ message: 'Failed to fetch session data' });
    }

    // Add media info to session data
    const currentData = sessionData?.data || {};
    const mediaFiles = currentData.media_files || [];
    
    mediaFiles.push({
      id: uploadResult.file!.id,
      name: uploadResult.file!.name,
      url: uploadResult.file!.webViewLink,
      downloadUrl: uploadResult.file!.webContentLink,
      uploadedAt: new Date().toISOString(),
      type: file.mimetype?.startsWith('image/') ? 'image' : 'video',
      size: fs.statSync(file.filepath).size,
    });

    // Update session with new media info
    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        data: {
          ...currentData,
          media_files: mediaFiles
        }
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Error updating session:', updateError);
      // Clean up temp file
      fs.unlinkSync(file.filepath);
      return res.status(500).json({ message: 'Failed to update session data' });
    }

    // Clean up temp file
    fs.unlinkSync(file.filepath);

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        id: uploadResult.file!.id,
        name: uploadResult.file!.name,
        url: uploadResult.file!.webViewLink,
        type: file.mimetype?.startsWith('image/') ? 'image' : 'video',
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
