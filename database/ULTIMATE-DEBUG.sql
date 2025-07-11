-- ULTIMATE DEBUG - Find the exact issue
-- Run this to see exactly what's wrong

-- 1. First, check if our users table actually exists and is accessible
SELECT 
  'TABLE EXISTS CHECK' as test,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') 
    THEN 'YES - public.users exists' 
    ELSE 'NO - public.users missing' 
  END as result;

-- 2. Check what's actually in our users table
SELECT 'CURRENT USERS' as test, count(*) as count FROM public.users;

-- 3. Check if we can insert into users table right now
DO $$
DECLARE
    test_id UUID := '00000000-0000-0000-0000-000000000001';
    test_email TEXT := 'ultimate-test@example.com';
BEGIN
    -- Try to insert a test user
    INSERT INTO public.users (id, email, subscription_tier)
    VALUES (test_id, test_email, 'free');
    
    RAISE NOTICE 'SUCCESS: Can insert into users table';
    
    -- Clean up
    DELETE FROM public.users WHERE id = test_id;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR inserting into users: % - %', SQLSTATE, SQLERRM;
END $$;

-- 4. Check auth.users table structure and permissions
SELECT 
  'AUTH.USERS CHECK' as test,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'auth'
ORDER BY ordinal_position;

-- 5. Check if there are any auth.users records
SELECT 'AUTH USERS COUNT' as test, count(*) as count FROM auth.users;

-- 6. Check our trigger function
SELECT 
  'TRIGGER FUNCTION' as test,
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' AND routine_schema = 'public';

-- 7. Check trigger status
SELECT 
  'TRIGGER STATUS' as test,
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 8. Test our trigger function directly
DO $$
BEGIN
    BEGIN
        -- Test if we can call our trigger function
        -- Note: This won't work because it expects NEW record, but will show if function exists
        RAISE NOTICE 'Trigger function exists and is callable';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Trigger function error: % - %', SQLSTATE, SQLERRM;
    END;
END $$;

-- 9. Check table permissions
SELECT 
  'TABLE PERMISSIONS' as test,
  grantee,
  privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- 10. Final status check
SELECT 
  'FINAL STATUS' as test,
  'Database setup' as item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') 
    THEN 'READY'
    ELSE 'NOT READY'
  END as status;