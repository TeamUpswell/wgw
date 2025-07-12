-- 01 - REBUILD CORE TABLES
-- Run this first to set up the essential tables for your app

-- 1. Enhanced users table (build on what we have)
-- The basic users table already exists, let's add missing columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;

-- 2. Daily entries table (core feature)
CREATE TABLE IF NOT EXISTS public.daily_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  audio_url TEXT,
  transcription TEXT,
  ai_response TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  favorite BOOLEAN DEFAULT false,
  is_private BOOLEAN NOT NULL DEFAULT false,
  image_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. User codes table (for invite system)
CREATE TABLE IF NOT EXISTS public.user_codes (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. User categories table
CREATE TABLE IF NOT EXISTS public.user_categories (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  categories JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. User streaks table
CREATE TABLE IF NOT EXISTS public.user_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_entry_date DATE,
  streak_start_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_entries_user_id ON daily_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_entries_created_at ON daily_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_entries_category ON daily_entries(category);
CREATE INDEX IF NOT EXISTS idx_user_codes_code ON user_codes(code);

-- 7. Disable RLS for now (we'll enable properly later)
ALTER TABLE public.daily_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks DISABLE ROW LEVEL SECURITY;

-- 8. Grant permissions
GRANT ALL ON public.daily_entries TO authenticated, anon, public;
GRANT ALL ON public.user_codes TO authenticated, anon, public;
GRANT ALL ON public.user_categories TO authenticated, anon, public;
GRANT ALL ON public.user_streaks TO authenticated, anon, public;

-- 9. Update the trigger to create related records
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert user profile
  INSERT INTO public.users (id, email, subscription_tier)
  VALUES (NEW.id, NEW.email, 'free')
  ON CONFLICT (id) DO NOTHING;
  
  -- Generate user code
  INSERT INTO public.user_codes (user_id, code)
  VALUES (NEW.id, 'WGW-' || UPPER(SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 4)))
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Initialize user categories
  INSERT INTO public.user_categories (user_id, categories)
  VALUES (NEW.id, '[]'::jsonb)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Initialize user streaks
  INSERT INTO public.user_streaks (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Test the setup
DO $$
DECLARE
    test_id UUID := gen_random_uuid();
    test_email TEXT := 'core-test-' || extract(epoch from now()) || '@example.com';
BEGIN
    -- Test all core tables
    INSERT INTO public.users (id, email, subscription_tier)
    VALUES (test_id, test_email, 'free');
    
    INSERT INTO public.daily_entries (user_id, category)
    VALUES (test_id, 'gratitude');
    
    INSERT INTO public.user_codes (user_id, code)
    VALUES (test_id, 'TEST-1234');
    
    RAISE NOTICE 'SUCCESS: Core tables working - ID: %', test_id;
    
    -- Clean up
    DELETE FROM public.daily_entries WHERE user_id = test_id;
    DELETE FROM public.user_codes WHERE user_id = test_id;
    DELETE FROM public.user_categories WHERE user_id = test_id;
    DELETE FROM public.user_streaks WHERE user_id = test_id;
    DELETE FROM public.users WHERE id = test_id;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR in core setup: % - %', SQLSTATE, SQLERRM;
END $$;

-- 11. Show status
SELECT 'CORE TABLES SETUP COMPLETE' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;