-- CREATE AVATARS BUCKET (Simplified for standard permissions)
-- Run this in your Supabase SQL editor

-- 1. Create the avatars storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars', 
  true,
  5242880, -- 5MB limit (smaller than entry images)
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- 2. Verify bucket creation
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'avatars';

-- NOTE: Since you don't have owner permissions, you'll need to:
-- 1. Go to Storage > Settings in your Supabase dashboard
-- 2. Create policies through the UI instead of SQL
-- OR
-- 3. Use the existing entry-images bucket with updated policies