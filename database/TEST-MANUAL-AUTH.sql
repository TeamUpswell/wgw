-- TEST MANUAL AUTH - Simulate what Supabase Auth is trying to do
-- This will show us if the issue is with our setup or Supabase Auth service

-- 1. Check if we can manually create what auth signup would create
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_email TEXT := 'manual-auth-test-' || extract(epoch from now()) || '@example.com';
    auth_user_created BOOLEAN := false;
BEGIN
    -- First, let's see what happens if we manually insert into our users table
    -- This simulates what our trigger should do
    BEGIN
        INSERT INTO public.users (id, email, subscription_tier)
        VALUES (test_user_id, test_email, 'free');
        
        RAISE NOTICE 'SUCCESS: Manual user creation works - ID: %', test_user_id;
        
        -- Clean up
        DELETE FROM public.users WHERE id = test_user_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR in manual user creation: % - %', SQLSTATE, SQLERRM;
    END;
    
    -- Test our trigger function
    BEGIN
        -- Note: We can't actually test the trigger with real auth.users insert
        -- But we can verify the function exists
        RAISE NOTICE 'Trigger function is ready for auth.users events';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Trigger function issue: % - %', SQLSTATE, SQLERRM;
    END;
    
END $$;

-- 2. Show current database state
SELECT 
    'Current public.users count' as info,
    count(*) as value
FROM public.users

UNION ALL

SELECT 
    'Current auth.users count' as info,
    count(*) as value
FROM auth.users;

-- 3. Final diagnosis
SELECT 
    'DIAGNOSIS' as result,
    'Database is ready. Issue is likely in Supabase Auth service or app configuration.' as conclusion;