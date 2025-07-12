-- FIX FOREIGN KEY RELATIONSHIP BETWEEN daily_entries AND users
-- The issue is that daily_entries.user_id points to auth.users, but we need it to point to public.users

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE public.daily_entries 
DROP CONSTRAINT IF EXISTS daily_entries_user_id_fkey;

-- Step 2: Create the correct foreign key relationship to public.users
ALTER TABLE public.daily_entries 
ADD CONSTRAINT daily_entries_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id);

-- Step 3: Also update other tables that might have the same issue
ALTER TABLE public.comments 
DROP CONSTRAINT IF EXISTS comments_user_id_fkey;

ALTER TABLE public.comments 
ADD CONSTRAINT comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id);

-- Step 4: Update follow_requests table
ALTER TABLE public.follow_requests 
DROP CONSTRAINT IF EXISTS follow_requests_requester_id_fkey;

ALTER TABLE public.follow_requests 
DROP CONSTRAINT IF EXISTS follow_requests_requested_id_fkey;

ALTER TABLE public.follow_requests 
ADD CONSTRAINT follow_requests_requester_id_fkey 
FOREIGN KEY (requester_id) REFERENCES public.users(id);

ALTER TABLE public.follow_requests 
ADD CONSTRAINT follow_requests_requested_id_fkey 
FOREIGN KEY (requested_id) REFERENCES public.users(id);

-- Step 5: Update follows table
ALTER TABLE public.follows 
DROP CONSTRAINT IF EXISTS follows_follower_id_fkey;

ALTER TABLE public.follows 
DROP CONSTRAINT IF EXISTS follows_followed_id_fkey;

ALTER TABLE public.follows 
ADD CONSTRAINT follows_follower_id_fkey 
FOREIGN KEY (follower_id) REFERENCES public.users(id);

ALTER TABLE public.follows 
ADD CONSTRAINT follows_followed_id_fkey 
FOREIGN KEY (followed_id) REFERENCES public.users(id);

-- Step 6: Update likes table
ALTER TABLE public.likes 
DROP CONSTRAINT IF EXISTS likes_user_id_fkey;

ALTER TABLE public.likes 
ADD CONSTRAINT likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id);

-- Step 7: Update notification tables
ALTER TABLE public.notification_history 
DROP CONSTRAINT IF EXISTS notification_history_user_id_fkey;

ALTER TABLE public.notification_history 
ADD CONSTRAINT notification_history_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE public.notification_queue 
DROP CONSTRAINT IF EXISTS notification_queue_user_id_fkey;

ALTER TABLE public.notification_queue 
ADD CONSTRAINT notification_queue_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE public.notification_settings 
DROP CONSTRAINT IF EXISTS notification_settings_user_id_fkey;

ALTER TABLE public.notification_settings 
ADD CONSTRAINT notification_settings_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE public.notification_templates 
DROP CONSTRAINT IF EXISTS notification_templates_user_id_fkey;

ALTER TABLE public.notification_templates 
ADD CONSTRAINT notification_templates_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE public.scheduled_notifications 
DROP CONSTRAINT IF EXISTS scheduled_notifications_user_id_fkey;

ALTER TABLE public.scheduled_notifications 
ADD CONSTRAINT scheduled_notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id);

-- Step 8: Update user-related tables
ALTER TABLE public.user_categories 
DROP CONSTRAINT IF EXISTS user_categories_user_id_fkey;

ALTER TABLE public.user_categories 
ADD CONSTRAINT user_categories_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE public.user_codes 
DROP CONSTRAINT IF EXISTS user_codes_user_id_fkey;

ALTER TABLE public.user_codes 
ADD CONSTRAINT user_codes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE public.user_streaks 
DROP CONSTRAINT IF EXISTS user_streaks_user_id_fkey;

ALTER TABLE public.user_streaks 
ADD CONSTRAINT user_streaks_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE public.daily_reminder_schedule 
DROP CONSTRAINT IF EXISTS daily_reminder_schedule_user_id_fkey;

ALTER TABLE public.daily_reminder_schedule 
ADD CONSTRAINT daily_reminder_schedule_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id);

-- Verify the relationships are now correct
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND ccu.table_name = 'users'
ORDER BY tc.table_name;