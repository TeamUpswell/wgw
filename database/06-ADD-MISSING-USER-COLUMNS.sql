-- ADD MISSING USER COLUMNS FOR SOCIAL FEED
-- Run this in your Supabase SQL editor

-- Add username column (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'username') THEN
        ALTER TABLE public.users ADD COLUMN username text;
        RAISE NOTICE 'Added username column';
    ELSE
        RAISE NOTICE 'Username column already exists';
    END IF;
END $$;

-- Add display_name column (if it doesn't exist)  
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'display_name') THEN
        ALTER TABLE public.users ADD COLUMN display_name text;
        RAISE NOTICE 'Added display_name column';
    ELSE
        RAISE NOTICE 'Display_name column already exists';
    END IF;
END $$;

-- Update existing user with default values
UPDATE public.users 
SET 
  username = COALESCE(username, 'user_' || SUBSTRING(id::text, 1, 8)),
  display_name = COALESCE(display_name, email)
WHERE username IS NULL OR display_name IS NULL;

-- Verify the columns were added
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
  AND column_name IN ('username', 'display_name')
ORDER BY column_name;

-- Check current user data
SELECT id, email, username, display_name, avatar_url, bio 
FROM public.users 
LIMIT 5;