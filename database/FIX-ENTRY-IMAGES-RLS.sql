-- FIX ENTRY-IMAGES BUCKET RLS FOR AVATAR UPLOADS
-- This should work with standard permissions

-- First, let's see what policies currently exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Check if RLS is enabled (it might be the problem)
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- If you're getting permission errors, try this simple approach:
-- Disable RLS temporarily to test uploads
-- WARNING: This makes all storage public - only use for testing!

-- Uncomment the line below ONLY for testing:
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- After testing works, you can re-enable RLS:
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;