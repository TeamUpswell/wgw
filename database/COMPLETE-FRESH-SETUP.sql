-- COMPLETE FRESH SETUP - Overwrites everything in new Supabase project
-- This will wipe everything and start completely fresh

-- 1. DROP EVERYTHING that might exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.user_codes CASCADE;
DROP TABLE IF EXISTS public.daily_entries CASCADE;
DROP TABLE IF EXISTS public.follows CASCADE;
DROP TABLE IF EXISTS public.follow_requests CASCADE;
DROP TABLE IF EXISTS public.likes CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.recaps CASCADE;
DROP TABLE IF EXISTS public.notification_settings CASCADE;
DROP TABLE IF EXISTS public.notification_templates CASCADE;
DROP TABLE IF EXISTS public.notification_queue CASCADE;
DROP TABLE IF EXISTS public.notification_history CASCADE;
DROP TABLE IF EXISTS public.daily_reminder_schedule CASCADE;
DROP TABLE IF EXISTS public.scheduled_notifications CASCADE;
DROP TABLE IF EXISTS public.user_categories CASCADE;
DROP TABLE IF EXISTS public.user_streaks CASCADE;
DROP TABLE IF EXISTS public.notification_analytics CASCADE;
DROP TABLE IF EXISTS public.entry_social_stats CASCADE;

-- 2. Create ONLY the essential users table (super simple)
CREATE TABLE public.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  display_name TEXT,
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Completely disable RLS for testing
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 4. Drop any existing policies
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON public.users;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.users;

-- 5. Grant FULL permissions to everyone (for testing)
GRANT ALL PRIVILEGES ON public.users TO authenticated;
GRANT ALL PRIVILEGES ON public.users TO anon;
GRANT ALL PRIVILEGES ON public.users TO public;
GRANT ALL PRIVILEGES ON public.users TO postgres;

-- 6. Create the simplest possible trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, subscription_tier)
  VALUES (NEW.id, NEW.email, 'free')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 8. Test that everything works
DO $$
DECLARE
    test_id UUID := gen_random_uuid();
    test_email TEXT := 'fresh-setup-test@example.com';
BEGIN
    -- Test direct insert
    INSERT INTO public.users (id, email, subscription_tier)
    VALUES (test_id, test_email, 'free');
    
    RAISE NOTICE 'SUCCESS: Fresh setup works - ID: %', test_id;
    
    -- Clean up test
    DELETE FROM public.users WHERE id = test_id;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR in fresh setup: % - %', SQLSTATE, SQLERRM;
END $$;

-- 9. Show final status
SELECT 'COMPLETE FRESH SETUP DONE' as status;
SELECT count(*) as users_count FROM public.users;
SELECT trigger_name FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';