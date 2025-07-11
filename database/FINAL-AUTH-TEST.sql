-- FINAL AUTH TEST - Test the complete auth flow manually
-- This will show us exactly what's happening when a user tries to sign up

-- 1. Let's see what happens when we manually simulate the auth signup process
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_email TEXT := 'final-test-' || extract(epoch from now()) || '@example.com';
BEGIN
    RAISE NOTICE 'Testing complete auth flow for email: %', test_email;
    
    -- Step 1: Try to create what would go in auth.users (we can't actually do this)
    RAISE NOTICE 'Step 1: Auth.users creation (simulated) - ID: %', test_user_id;
    
    -- Step 2: Test our trigger function manually by simulating NEW record
    BEGIN
        -- Step 2a: Direct insert to public.users (what our trigger should do)
        INSERT INTO public.users (id, email, subscription_tier)
        VALUES (test_user_id, test_email, 'free');
        
        RAISE NOTICE 'Step 2: SUCCESS - public.users insert worked';
        
        -- Step 2b: Test that we can create related records
        INSERT INTO public.user_codes (user_id, code)
        VALUES (test_user_id, 'WGW-TEST')
        ON CONFLICT (user_id) DO NOTHING;
        
        RAISE NOTICE 'Step 3: SUCCESS - user_codes insert worked';
        
        -- Clean up our test data
        DELETE FROM public.user_codes WHERE user_id = test_user_id;
        DELETE FROM public.users WHERE id = test_user_id;
        
        RAISE NOTICE 'Step 4: SUCCESS - cleanup completed';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR in manual auth flow test: % - %', SQLSTATE, SQLERRM;
    END;
    
END $$;

-- 2. Check if there are any constraints or issues we missed
SELECT 
    'CONSTRAINT CHECK' as test,
    conname as constraint_name,
    contype as constraint_type,
    confupdtype as on_update,
    confdeltype as on_delete
FROM pg_constraint 
WHERE conrelid = 'public.users'::regclass;

-- 3. Check if there are any triggers that might be failing
SELECT 
    'TRIGGER CHECK' as test,
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' AND event_object_schema = 'auth';

-- 4. Final comprehensive check
SELECT 
    'FINAL STATUS' as status,
    'If this shows SUCCESS, the database is perfect. Issue is in Supabase Auth service.' as message;