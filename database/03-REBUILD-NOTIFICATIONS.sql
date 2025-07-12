-- 03 - REBUILD NOTIFICATIONS SYSTEM
-- Run this after social features to add the complete notification system

-- 1. Notification settings table
CREATE TABLE IF NOT EXISTS public.notification_settings (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_reminder_enabled BOOLEAN DEFAULT true,
  daily_reminder_time TIME WITHOUT TIME ZONE DEFAULT '20:00:00'::time,
  daily_reminder_timezone TEXT DEFAULT 'UTC'::text,
  friend_entry_notifications BOOLEAN DEFAULT true,
  comment_notifications BOOLEAN DEFAULT true,
  like_notifications BOOLEAN DEFAULT true,
  follow_request_notifications BOOLEAN DEFAULT true,
  weekly_summary_enabled BOOLEAN DEFAULT true,
  weekly_summary_day INTEGER DEFAULT 0,
  weekly_summary_time TIME WITHOUT TIME ZONE DEFAULT '09:00:00'::time,
  monthly_summary_enabled BOOLEAN DEFAULT true,
  monthly_summary_day INTEGER DEFAULT 1,
  monthly_summary_time TIME WITHOUT TIME ZONE DEFAULT '09:00:00'::time,
  streak_milestone_notifications BOOLEAN DEFAULT true,
  streak_broken_notifications BOOLEAN DEFAULT true,
  push_token TEXT,
  push_token_updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Notification templates table
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT,
  schedule_time TIME,
  schedule_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7],
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  category TEXT DEFAULT 'personal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Notification queue table
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'::text,
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Notification history table
CREATE TABLE IF NOT EXISTS public.notification_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  delivery_status TEXT NOT NULL DEFAULT 'sent'::text,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Daily reminder schedule table
CREATE TABLE IF NOT EXISTS public.daily_reminder_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'::text,
  sent_at TIMESTAMP WITH TIME ZONE,
  entry_logged BOOLEAN DEFAULT false,
  entry_logged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, scheduled_date)
);

-- 6. Scheduled notifications table
CREATE TABLE IF NOT EXISTS public.scheduled_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES notification_templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_templates_user_id ON notification_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_notification_queue_user_id ON notification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled_for ON notification_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_history_user_id ON notification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_sent_at ON notification_history(sent_at);
CREATE INDEX IF NOT EXISTS idx_daily_reminder_schedule_user_id ON daily_reminder_schedule(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_reminder_schedule_date ON daily_reminder_schedule(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user_id ON scheduled_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_for ON scheduled_notifications(scheduled_for);

-- 8. Disable RLS for now
ALTER TABLE public.notification_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reminder_schedule DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_notifications DISABLE ROW LEVEL SECURITY;

-- 9. Grant permissions
GRANT ALL ON public.notification_settings TO authenticated, anon, public;
GRANT ALL ON public.notification_templates TO authenticated, anon, public;
GRANT ALL ON public.notification_queue TO authenticated, anon, public;
GRANT ALL ON public.notification_history TO authenticated, anon, public;
GRANT ALL ON public.daily_reminder_schedule TO authenticated, anon, public;
GRANT ALL ON public.scheduled_notifications TO authenticated, anon, public;

-- 10. Update trigger to include notification settings
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert user profile
  INSERT INTO public.users (id, email, subscription_tier)
  VALUES (NEW.id, NEW.email, 'free')
  ON CONFLICT (id) DO NOTHING;
  
  -- Generate user code
  INSERT INTO public.user_codes (user_id, code)
  VALUES (NEW.id, 'WGW-' || UPPER(SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 4)))
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Initialize user categories
  INSERT INTO public.user_categories (user_id, categories)
  VALUES (NEW.id, '[]'::jsonb)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Initialize user streaks
  INSERT INTO public.user_streaks (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create default notification settings
  INSERT INTO public.notification_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Test notifications
DO $$
DECLARE
    test_id UUID := gen_random_uuid();
    test_email TEXT := 'notification-test-' || extract(epoch from now()) || '@example.com';
    template_id UUID;
BEGIN
    -- Create test user
    INSERT INTO public.users (id, email) VALUES (test_id, test_email);
    
    -- Test notification settings
    INSERT INTO public.notification_settings (user_id) VALUES (test_id);
    
    -- Test notification template
    INSERT INTO public.notification_templates (user_id, name, title, body, notification_type)
    VALUES (test_id, 'Test Template', 'Test Title', 'Test Body', 'daily_reminder')
    RETURNING id INTO template_id;
    
    RAISE NOTICE 'SUCCESS: Notifications working - User: %, Template: %', test_id, template_id;
    
    -- Clean up
    DELETE FROM public.notification_templates WHERE user_id = test_id;
    DELETE FROM public.notification_settings WHERE user_id = test_id;
    DELETE FROM public.users WHERE id = test_id;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR in notifications setup: % - %', SQLSTATE, SQLERRM;
END $$;

-- 12. Show status
SELECT 'NOTIFICATIONS SYSTEM SETUP COMPLETE' as status;
SELECT count(*) as templates_count FROM notification_templates;
SELECT count(*) as settings_count FROM notification_settings;