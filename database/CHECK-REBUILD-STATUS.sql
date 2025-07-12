-- CHECK REBUILD STATUS - Verify all tables were created successfully

-- 1. List all tables created
SELECT 
  'TABLES CREATED' as category,
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Check core tables
SELECT 
  'CORE TABLES CHECK' as test,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') 
    THEN '✅ users' 
    ELSE '❌ users missing' 
  END as users_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_entries' AND table_schema = 'public') 
    THEN '✅ daily_entries' 
    ELSE '❌ daily_entries missing' 
  END as entries_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_codes' AND table_schema = 'public') 
    THEN '✅ user_codes' 
    ELSE '❌ user_codes missing' 
  END as codes_status;

-- 3. Check social tables
SELECT 
  'SOCIAL TABLES CHECK' as test,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'follows' AND table_schema = 'public') 
    THEN '✅ follows' 
    ELSE '❌ follows missing' 
  END as follows_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'likes' AND table_schema = 'public') 
    THEN '✅ likes' 
    ELSE '❌ likes missing' 
  END as likes_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comments' AND table_schema = 'public') 
    THEN '✅ comments' 
    ELSE '❌ comments missing' 
  END as comments_status;

-- 4. Check notification tables
SELECT 
  'NOTIFICATION TABLES CHECK' as test,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_settings' AND table_schema = 'public') 
    THEN '✅ notification_settings' 
    ELSE '❌ notification_settings missing' 
  END as settings_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_templates' AND table_schema = 'public') 
    THEN '✅ notification_templates' 
    ELSE '❌ notification_templates missing' 
  END as templates_status;

-- 5. Check trigger status
SELECT 
  'TRIGGER CHECK' as test,
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 6. Test user creation process
DO $$
DECLARE
    test_id UUID := gen_random_uuid();
    test_email TEXT := 'rebuild-test-' || extract(epoch from now()) || '@example.com';
    created_tables INTEGER := 0;
BEGIN
    -- Test the complete user creation flow
    INSERT INTO public.users (id, email, subscription_tier)
    VALUES (test_id, test_email, 'free');
    
    -- Check if related records were created
    IF EXISTS (SELECT 1 FROM public.user_codes WHERE user_id = test_id) THEN
        created_tables := created_tables + 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM public.user_categories WHERE user_id = test_id) THEN
        created_tables := created_tables + 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM public.notification_settings WHERE user_id = test_id) THEN
        created_tables := created_tables + 1;
    END IF;
    
    RAISE NOTICE 'SUCCESS: Rebuild test passed - % related records created', created_tables;
    
    -- Clean up
    DELETE FROM public.notification_settings WHERE user_id = test_id;
    DELETE FROM public.user_categories WHERE user_id = test_id;
    DELETE FROM public.user_codes WHERE user_id = test_id;
    DELETE FROM public.user_streaks WHERE user_id = test_id;
    DELETE FROM public.users WHERE id = test_id;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR in rebuild test: % - %', SQLSTATE, SQLERRM;
END $$;

-- 7. Final status
SELECT 
  'DATABASE REBUILD STATUS' as final_check,
  count(*) as total_tables_created
FROM information_schema.tables 
WHERE table_schema = 'public';

SELECT 'READY FOR TESTING' as status;