-- Fix Supabase Storage RLS policies for session-media bucket

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload session media" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to session media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete session media" ON storage.objects;

-- Create policy to allow authenticated users to upload to session-media bucket
CREATE POLICY "Allow authenticated users to upload session media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'session-media');

-- Create policy to allow public read access to session-media bucket
CREATE POLICY "Allow public access to session media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'session-media');

-- Create policy to allow authenticated users to delete their own uploads
CREATE POLICY "Allow authenticated users to delete session media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'session-media');

-- Create policy to allow authenticated users to update session media
CREATE POLICY "Allow authenticated users to update session media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'session-media')
WITH CHECK (bucket_id = 'session-media');

-- Enable RLS on storage.buckets if not already enabled
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Drop existing bucket policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to access session-media bucket" ON storage.buckets;

-- Create policy to allow access to session-media bucket
CREATE POLICY "Allow authenticated users to access session-media bucket"
ON storage.buckets FOR SELECT
TO authenticated
USING (id = 'session-media');

-- Also allow public access to the bucket for reading
CREATE POLICY "Allow public access to session-media bucket"
ON storage.buckets FOR SELECT
TO public
USING (id = 'session-media');
