-- Instructions for creating audio storage bucket in Supabase
-- Note: Storage buckets must be created through the Supabase dashboard UI

-- 1. Go to your Supabase project dashboard
-- 2. Navigate to Storage section
-- 3. Click "Create a new bucket"
-- 4. Use these settings:
--    - Name: audio-recordings
--    - Public bucket: Yes (toggle on)
--    - File size limit: 50MB
--    - Allowed MIME types: audio/*

-- After creating the bucket, you can set up RLS policies:

-- Allow authenticated users to upload their own audio files
CREATE POLICY "Users can upload own audio files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'audio-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to view their own audio files
CREATE POLICY "Users can view own audio files" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'audio-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own audio files
CREATE POLICY "Users can delete own audio files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'audio-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Make sure the daily_entries table has the audio_url column
-- (This should already exist from your schema)
-- ALTER TABLE daily_entries ADD COLUMN IF NOT EXISTS audio_url TEXT;