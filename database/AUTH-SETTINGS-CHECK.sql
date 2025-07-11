-- AUTH SETTINGS DIAGNOSTIC
-- This checks Supabase Auth configuration that might be causing the issue

-- 1. Check if there are any auth-related tables or constraints we're missing
SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_schema IN ('auth', 'public') 
  AND table_name LIKE '%user%'
ORDER BY table_schema, table_name;

-- 2. Check for any foreign key constraints pointing to auth.users
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND (ccu.table_name = 'users' OR tc.table_name = 'users');

-- 3. Check current trigger status
SELECT 
  trigger_name,
  event_object_schema,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
  AND event_object_schema = 'auth';

-- 4. Try to understand what might be in auth.users table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'auth'
ORDER BY ordinal_position;

-- 5. Check if there are any existing users in auth.users (this might show if auth signup is actually working)
SELECT 
  'Auth users count' as info,
  count(*) as count
FROM auth.users;

-- 6. Final test - try to manually create a user in auth.users to see what the exact error is
-- This will show us what Supabase Auth is trying to do
DO $$
DECLARE
    test_email TEXT := 'test-manual-' || extract(epoch from now()) || '@example.com';
BEGIN
    -- Note: We can't actually insert into auth.users as it's managed by Supabase
    -- But this will show us the table structure and constraints
    RAISE NOTICE 'Auth.users table exists and is accessible for reading';
    
    -- Check what happens if we try to access our trigger
    PERFORM public.handle_new_user();
    RAISE NOTICE 'Our trigger function is working';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error testing auth setup: % - %', SQLSTATE, SQLERRM;
END $$;

-- 7. Show permissions on our users table
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'users' 
  AND table_schema = 'public';