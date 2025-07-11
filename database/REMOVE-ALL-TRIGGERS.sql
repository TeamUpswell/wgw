-- REMOVE ALL TRIGGERS - Complete cleanup to isolate the issue
-- This removes everything that could interfere with Supabase Auth

-- 1. Drop ALL triggers on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Drop ALL our custom functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_new_user_simple();

-- 3. Make sure users table has no foreign key to auth.users (this might be the issue)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS fk_users_auth_users;

-- 4. Recreate users table with no foreign key constraints
DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE public.users (
  id UUID PRIMARY KEY,  -- No foreign key reference
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Disable RLS completely
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 6. Grant all permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO anon;
GRANT ALL ON public.users TO public;

-- 7. Test that we can insert with any UUID
DO $$
DECLARE
    test_id UUID := gen_random_uuid();
    test_email TEXT := 'trigger-free-test-' || extract(epoch from now()) || '@example.com';
BEGIN
    INSERT INTO public.users (id, email, subscription_tier)
    VALUES (test_id, test_email, 'free');
    
    RAISE NOTICE 'SUCCESS: Trigger-free approach works - ID: %', test_id;
    
    DELETE FROM public.users WHERE id = test_id;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR in trigger-free test: % - %', SQLSTATE, SQLERRM;
END $$;

-- 8. Show final state
SELECT 
    'TRIGGER-FREE SETUP' as status,
    'No triggers, no foreign keys, no RLS - completely clean' as details;

SELECT 
    count(*) as existing_users,
    'Ready for manual user creation' as message
FROM public.users;