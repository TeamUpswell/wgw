-- CREATE STORAGE BUCKET FOR ENTRY IMAGES
-- Run this in your Supabase SQL editor

-- 1. Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'entry-images',
  'entry-images', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- 2. Set up Row Level Security (RLS) policies for the bucket

-- Allow authenticated users to upload images
CREATE POLICY "Users can upload entry images" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'entry-images');

-- Allow authenticated users to view images
CREATE POLICY "Users can view entry images" ON storage.objects
FOR SELECT 
TO authenticated
USING (bucket_id = 'entry-images');

-- Allow users to update their own images
CREATE POLICY "Users can update entry images" ON storage.objects
FOR UPDATE 
TO authenticated
USING (bucket_id = 'entry-images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete entry images" ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'entry-images');

-- Enable RLS on the storage.objects table if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Verify bucket creation
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'entry-images';