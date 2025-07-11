-- DIAGNOSTIC SCRIPT - Run this to understand the signup issue
-- Copy and paste this entire script into Supabase SQL Editor

-- 1. Check if users table exists and its structure
SELECT 
  'USERS TABLE CHECK' as test_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as result;

-- 2. Check users table columns
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check if trigger exists
SELECT 
  'TRIGGER CHECK' as test_name,
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers 
WHERE event_object_table = 'users' AND trigger_schema = 'auth'
UNION ALL
SELECT 
  'TRIGGER CHECK' as test_name,
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 4. Check RLS policies on users table
SELECT 
  'RLS POLICY CHECK' as test_name,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- 5. Check if RLS is enabled
SELECT 
  'RLS STATUS' as test_name,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- 6. Test the trigger function manually (this will show us the exact error)
-- First, let's see if the function exists
SELECT 
  'FUNCTION CHECK' as test_name,
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name LIKE '%handle_new_user%' AND routine_schema = 'public';

-- 7. Check auth.users table structure (to ensure the reference is valid)
SELECT 
  'AUTH USERS CHECK' as test_name,
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'auth'
LIMIT 5;

-- 8. Try to manually test user creation (this will show the exact error)
-- IMPORTANT: Replace 'test-user-id' with a real UUID in the next section

-- 9. Check if there are any existing users
SELECT 
  'EXISTING USERS COUNT' as test_name,
  COUNT(*) as user_count
FROM public.users;

-- 10. Test permissions on auth schema
SELECT 
  'AUTH SCHEMA ACCESS' as test_name,
  has_schema_privilege('auth', 'USAGE') as can_access_auth_schema;

-- 11. Check for any foreign key constraints that might be failing
SELECT 
  'FOREIGN KEY CHECK' as test_name,
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table
FROM pg_constraint 
WHERE contype = 'f' 
AND (conrelid::regclass::text = 'public.users' OR confrelid::regclass::text = 'public.users');

-- 12. Final diagnostic - let's see what happens when we try to manually create a user
-- (This will fail but show us the exact error)
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_email TEXT := 'test-' || extract(epoch from now()) || '@example.com';
BEGIN
    BEGIN
        -- Try to insert directly into users table
        INSERT INTO public.users (id, email, subscription_tier)
        VALUES (test_user_id, test_email, 'free');
        
        RAISE NOTICE 'SUCCESS: Direct insert into users table worked';
        
        -- Clean up the test record
        DELETE FROM public.users WHERE id = test_user_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR in direct users insert: % - %', SQLSTATE, SQLERRM;
    END;
    
    BEGIN
        -- Try to call the trigger function
        PERFORM public.handle_new_user_simple();
        RAISE NOTICE 'SUCCESS: Trigger function exists and can be called';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR in trigger function: % - %', SQLSTATE, SQLERRM;
    END;
END $$;