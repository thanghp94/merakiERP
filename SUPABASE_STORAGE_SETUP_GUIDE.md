# Supabase Storage Setup Guide for Session Media Upload

This guide explains how to set up Supabase Storage for the session media upload feature.

## Prerequisites

- Supabase project already set up
- Supabase environment variables configured in `.env.local`

## Required Environment Variables

Add these to your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Storage Bucket Setup

### Option 1: Automatic Setup (Recommended)
The application will automatically create the `session-media` bucket when you first upload a file.

### Option 2: Manual Setup via Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the sidebar
3. Click **Create Bucket**
4. Set bucket name: `session-media`
5. Make it **Public** (check the public option)
6. Set file size limit: `50MB` (or as needed)
7. Allowed MIME types: `image/*,video/*`

## Storage Policies (RLS)

If you want to set up Row Level Security policies for the storage bucket:

1. Go to **Storage** > **Policies** in Supabase Dashboard
2. Create policies for the `session-media` bucket:

### Policy for SELECT (View files)
```sql
CREATE POLICY "Allow authenticated users to view session media" ON storage.objects
FOR SELECT USING (bucket_id = 'session-media' AND auth.role() = 'authenticated');
```

### Policy for INSERT (Upload files)
```sql
CREATE POLICY "Allow authenticated users to upload session media" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'session-media' AND auth.role() = 'authenticated');
```

### Policy for DELETE (Delete files)
```sql
CREATE POLICY "Allow authenticated users to delete their session media" ON storage.objects
FOR DELETE USING (bucket_id = 'session-media' AND auth.role() = 'authenticated');
```

## Folder Structure

Files will be organized in the following structure:
```
session-media/
├── sessions/
│   ├── {ClassName}/
│   │   ├── {SessionName}/
│   │   │   ├── {YYYY-MM-DD}/
│   │   │   │   ├── image1.jpg
│   │   │   │   ├── video1.mp4
│   │   │   │   └── ...
```

Example:
```
session-media/
├── sessions/
│   ├── GrapeSEED_Test_Class_U6_L6/
│   │   ├── U6_L6_TSI/
│   │   │   ├── 2025-01-08/
│   │   │   │   ├── classroom_photo.jpg
│   │   │   │   └── lesson_video.mp4
```

## File Access

### Public URLs
All uploaded files will have public URLs that can be accessed directly:
```
https://your-project.supabase.co/storage/v1/object/public/session-media/sessions/ClassName/SessionName/2025-01-08/filename.jpg
```

### Programmatic Access
Use the Supabase client to access files:
```typescript
const { data } = supabase.storage
  .from('session-media')
  .getPublicUrl('sessions/ClassName/SessionName/2025-01-08/filename.jpg');
```

## File Size and Type Limits

- **Maximum file size**: 100MB per file
- **Allowed file types**: 
  - Images: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
  - Videos: `video/mp4`, `video/webm`, `video/quicktime`

## Database Integration

Media file information is stored in the `sessions` table in the `data` JSONB column:

```json
{
  "media_files": [
    {
      "id": "unique-file-id",
      "name": "classroom_photo.jpg",
      "url": "https://..../public/session-media/...",
      "path": "sessions/ClassName/SessionName/2025-01-08/classroom_photo.jpg",
      "type": "image",
      "size": 1024000,
      "uploadedAt": "2025-01-08T10:30:00.000Z"
    }
  ]
}
```

## Testing the Setup

1. Start your development server: `npm run dev`
2. Navigate to the Sessions tab
3. Click the camera button (📷) on any session
4. Upload a test image or video
5. Check your Supabase Storage dashboard to confirm the file was uploaded
6. Verify the session data was updated in the database

## Troubleshooting

### Common Issues

1. **"Storage bucket not available"**
   - Check if the bucket exists in Supabase Dashboard
   - Verify your service role key has storage permissions

2. **"Failed to upload to Supabase Storage"**
   - Check file size (must be under 100MB)
   - Verify file type is allowed (images/videos only)
   - Check network connectivity

3. **"Failed to update session data"**
   - Verify the session ID exists in the database
   - Check if the user has permission to update sessions

4. **Environment variable errors**
   - Ensure all required environment variables are set
   - Restart your development server after adding variables

### Debug Mode

To enable debug logging, add this to your environment:
```env
DEBUG=supabase-storage
```

## Security Considerations

1. **File validation**: The system validates file types and sizes
2. **Authentication**: Only authenticated users can upload files
3. **Folder isolation**: Files are organized by class and session
4. **Public access**: Files are publicly accessible via URL (consider if this meets your security requirements)

## Backup and Maintenance

- Supabase automatically handles backups for storage
- Consider implementing a cleanup policy for old files
- Monitor storage usage in your Supabase dashboard
