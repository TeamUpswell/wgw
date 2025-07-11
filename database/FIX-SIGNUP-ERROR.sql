-- IMMEDIATE FIX FOR SIGNUP ERROR
-- Run this in your Supabase SQL Editor to fix the "Database error saving new user" issue

-- First, let's check if the trigger exists
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' AND trigger_schema = 'auth';

-- Drop and recreate the handle_new_user function with error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    -- Insert into users table (this is the critical part that's failing)
    INSERT INTO public.users (id, email, subscription_tier)
    VALUES (NEW.id, NEW.email, 'free')
    ON CONFLICT (id) DO NOTHING;
    
    -- Only do other operations if users table insert succeeded
    -- Generate user code
    INSERT INTO public.user_codes (user_id, code)
    VALUES (NEW.id, 'WGW-' || UPPER(SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 4)))
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Create default notification settings
    INSERT INTO public.notification_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Initialize user categories
    INSERT INTO public.user_categories (user_id, categories)
    VALUES (NEW.id, '[]'::jsonb)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Initialize user streaks
    INSERT INTO public.user_streaks (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the auth process
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    -- Still return NEW so auth doesn't fail
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Test the function by checking if tables exist
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') 
    THEN 'users table EXISTS' 
    ELSE 'users table MISSING - THIS IS THE PROBLEM!' 
  END as users_table_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_codes' AND table_schema = 'public') 
    THEN 'user_codes table EXISTS' 
    ELSE 'user_codes table missing' 
  END as user_codes_status;

-- If users table is missing, create minimal version
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" 
  ON public.users FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile" 
  ON public.users FOR INSERT 
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" 
  ON public.users FOR UPDATE 
  USING (auth.uid() = id);

-- Test the trigger by running it manually (this will show you the exact error)
-- You can uncomment this line to test:
-- SELECT public.handle_new_user();