-- FIX STORAGE RLS POLICIES
-- Run this in your Supabase SQL editor to fix upload permissions

-- Option 1: Disable RLS for storage.objects (simplest fix)
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Option 2: If you prefer to keep RLS enabled, create permissive policies
-- (Comment out Option 1 above and uncomment the policies below)

/*
-- Drop any existing conflicting policies first
DROP POLICY IF EXISTS "Users can upload entry images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view entry images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update entry images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete entry images" ON storage.objects;

-- Create permissive policies for authenticated users
CREATE POLICY "Allow authenticated uploads to entry-images" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'entry-images');

CREATE POLICY "Allow authenticated reads from entry-images" ON storage.objects
FOR SELECT 
TO authenticated
USING (bucket_id = 'entry-images');

CREATE POLICY "Allow public reads from entry-images" ON storage.objects
FOR SELECT 
TO anon
USING (bucket_id = 'entry-images');

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
*/

-- Verify current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';