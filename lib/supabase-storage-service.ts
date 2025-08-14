import { createClient } from '@supabase/supabase-js';

interface UploadResult {
  success: boolean;
  file?: {
    id: string;
    name: string;
    publicUrl: string;
    path: string;
  };
  error?: string;
}

class SupabaseStorageService {
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  // Create folder path for session media
  private createSessionPath(className: string, sessionName: string, fileName: string): string {
    // Clean up names for file system compatibility
    const cleanClassName = className.replace(/[^a-zA-Z0-9-_]/g, '_');
    const cleanSessionName = sessionName.replace(/[^a-zA-Z0-9-_]/g, '_');
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    return `sessions/${cleanClassName}/${cleanSessionName}/${timestamp}/${fileName}`;
  }

  // Upload file to Supabase Storage
  async uploadSessionMedia(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    className: string,
    sessionName: string
  ): Promise<UploadResult> {
    try {
      // Create the file path
      const filePath = this.createSessionPath(className, sessionName, fileName);

      // Upload file to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from('session-media')
        .upload(filePath, fileBuffer, {
          contentType: mimeType,
          upsert: false, // Don't overwrite existing files
        });

      if (error) {
        console.error('Supabase upload error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      // Get public URL for the uploaded file
      const { data: publicUrlData } = this.supabase.storage
        .from('session-media')
        .getPublicUrl(filePath);

      return {
        success: true,
        file: {
          id: data.id || filePath,
          name: fileName,
          publicUrl: publicUrlData.publicUrl,
          path: filePath,
        },
      };
    } catch (error) {
      console.error('Error uploading session media:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get all media files for a session
  async getSessionMedia(className: string, sessionName: string): Promise<any[]> {
    try {
      const cleanClassName = className.replace(/[^a-zA-Z0-9-_]/g, '_');
      const cleanSessionName = sessionName.replace(/[^a-zA-Z0-9-_]/g, '_');
      const folderPath = `sessions/${cleanClassName}/${cleanSessionName}/`;

      const { data, error } = await this.supabase.storage
        .from('session-media')
        .list(folderPath, {
          limit: 100,
          offset: 0,
        });

      if (error) {
        console.error('Error fetching session media:', error);
        return [];
      }

      // Get public URLs for all files
      const filesWithUrls = data?.map((file: any) => {
        const { data: publicUrlData } = this.supabase.storage
          .from('session-media')
          .getPublicUrl(`${folderPath}${file.name}`);

        return {
          ...file,
          publicUrl: publicUrlData.publicUrl,
          path: `${folderPath}${file.name}`,
        };
      }) || [];

      return filesWithUrls;
    } catch (error) {
      console.error('Error getting session media:', error);
      return [];
    }
  }

  // Delete a media file
  async deleteSessionMedia(filePath: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage
        .from('session-media')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting file:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting session media:', error);
      return false;
    }
  }

  // Check if storage bucket exists and create if needed
  async ensureBucketExists(): Promise<boolean> {
    try {
      // Try to get bucket info
      const { data: buckets, error: listError } = await this.supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Error listing buckets:', listError);
        return false;
      }

      const bucketExists = buckets?.some((bucket: any) => bucket.name === 'session-media');
      
      if (!bucketExists) {
        // Create the bucket if it doesn't exist
        const { error: createError } = await this.supabase.storage.createBucket('session-media', {
          public: true,
          allowedMimeTypes: ['image/*', 'video/*'],
          fileSizeLimit: 50 * 1024 * 1024, // 50MB limit
        });

        if (createError) {
          console.error('Error creating bucket:', createError);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error ensuring bucket exists:', error);
      return false;
    }
  }
}

export default SupabaseStorageService;
