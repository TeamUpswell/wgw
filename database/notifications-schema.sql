-- Notification System Database Schema
-- Handles user notification preferences, scheduling, and delivery

-- Notification Settings Table - User preferences for different notification types
CREATE TABLE notification_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Daily reminder settings
  daily_reminder_enabled BOOLEAN DEFAULT true,
  daily_reminder_time TIME DEFAULT '20:00:00', -- 8 PM default
  daily_reminder_timezone TEXT DEFAULT 'UTC',
  
  -- Social notification settings
  friend_entry_notifications BOOLEAN DEFAULT true,
  comment_notifications BOOLEAN DEFAULT true,
  like_notifications BOOLEAN DEFAULT true,
  follow_request_notifications BOOLEAN DEFAULT true,
  
  -- Weekly/Monthly summaries
  weekly_summary_enabled BOOLEAN DEFAULT true,
  weekly_summary_day INTEGER DEFAULT 0 CHECK (weekly_summary_day >= 0 AND weekly_summary_day <= 6), -- 0 = Sunday
  weekly_summary_time TIME DEFAULT '09:00:00',
  
  monthly_summary_enabled BOOLEAN DEFAULT true,
  monthly_summary_day INTEGER DEFAULT 1 CHECK (monthly_summary_day >= 1 AND monthly_summary_day <= 28),
  monthly_summary_time TIME DEFAULT '09:00:00',
  
  -- Streak notifications
  streak_milestone_notifications BOOLEAN DEFAULT true,
  streak_broken_notifications BOOLEAN DEFAULT true,
  
  -- Push notification token for mobile
  push_token TEXT,
  push_token_updated_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification Queue Table - Scheduled and pending notifications
CREATE TABLE notification_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'daily_reminder',
    'friend_entry',
    'comment',
    'like',
    'follow_request',
    'weekly_summary',
    'monthly_summary',
    'streak_milestone',
    'streak_broken'
  )),
  
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB, -- Additional data for the notification (entry_id, user_id, etc.)
  
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification History Table - Record of all sent notifications
CREATE TABLE notification_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  
  -- Delivery status
  delivery_status TEXT NOT NULL DEFAULT 'sent' CHECK (delivery_status IN ('sent', 'delivered', 'failed')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily Reminder Schedule Table - Track when reminders should be sent
CREATE TABLE daily_reminder_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  scheduled_date DATE NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled')),
  sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Track if user has already logged an entry for this date
  entry_logged BOOLEAN DEFAULT false,
  entry_logged_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, scheduled_date)
);

-- Indexes for performance
CREATE INDEX idx_notification_settings_user_id ON notification_settings(user_id);
CREATE INDEX idx_notification_queue_user_id ON notification_queue(user_id);
CREATE INDEX idx_notification_queue_scheduled_for ON notification_queue(scheduled_for);
CREATE INDEX idx_notification_queue_status ON notification_queue(status);
CREATE INDEX idx_notification_history_user_id ON notification_history(user_id);
CREATE INDEX idx_notification_history_sent_at ON notification_history(sent_at);
CREATE INDEX idx_daily_reminder_schedule_user_id ON daily_reminder_schedule(user_id);
CREATE INDEX idx_daily_reminder_schedule_date ON daily_reminder_schedule(scheduled_date);
CREATE INDEX idx_daily_reminder_schedule_time ON daily_reminder_schedule(scheduled_time);

-- Enable Row Level Security
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reminder_schedule ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Notification Settings
CREATE POLICY "Users can manage their own notification settings" ON notification_settings 
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for Notification Queue
CREATE POLICY "Users can view their own notification queue" ON notification_queue 
  FOR SELECT USING (auth.uid() = user_id);

-- Service account can manage queue (for background processes)
CREATE POLICY "Service can manage notification queue" ON notification_queue 
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for Notification History
CREATE POLICY "Users can view their own notification history" ON notification_history 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can manage notification history" ON notification_history 
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for Daily Reminder Schedule
CREATE POLICY "Users can view their own reminder schedule" ON daily_reminder_schedule 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can manage reminder schedule" ON daily_reminder_schedule 
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to create default notification settings for new users
CREATE OR REPLACE FUNCTION create_default_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_settings (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default settings for new users
CREATE TRIGGER create_default_notification_settings_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_settings();

-- Function to schedule daily reminders for a user
CREATE OR REPLACE FUNCTION schedule_daily_reminders(target_user_id UUID, days_ahead INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
  user_settings RECORD;
  reminder_date DATE;
  reminder_time TIMESTAMP WITH TIME ZONE;
  scheduled_count INTEGER := 0;
BEGIN
  -- Get user's notification settings
  SELECT * INTO user_settings 
  FROM notification_settings 
  WHERE user_id = target_user_id AND daily_reminder_enabled = true;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Schedule reminders for the next N days
  FOR i IN 0..days_ahead-1 LOOP
    reminder_date := CURRENT_DATE + i;
    reminder_time := reminder_date + user_settings.daily_reminder_time;
    
    -- Only schedule if not already scheduled and time hasn't passed
    IF reminder_time > NOW() THEN
      INSERT INTO daily_reminder_schedule (user_id, scheduled_date, scheduled_time)
      VALUES (target_user_id, reminder_date, reminder_time)
      ON CONFLICT (user_id, scheduled_date) DO NOTHING;
      
      IF FOUND THEN
        scheduled_count := scheduled_count + 1;
      END IF;
    END IF;
  END LOOP;
  
  RETURN scheduled_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark entry as logged (cancels reminder for that day)
CREATE OR REPLACE FUNCTION mark_entry_logged(target_user_id UUID, entry_date DATE DEFAULT CURRENT_DATE)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE daily_reminder_schedule 
  SET 
    entry_logged = true,
    entry_logged_at = NOW(),
    status = CASE 
      WHEN status = 'pending' AND scheduled_time > NOW() THEN 'cancelled'
      ELSE status
    END
  WHERE user_id = target_user_id AND scheduled_date = entry_date;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to queue social notifications
CREATE OR REPLACE FUNCTION queue_social_notification(
  target_user_id UUID,
  notif_type TEXT,
  notif_title TEXT,
  notif_body TEXT,
  notif_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
  user_settings RECORD;
  should_send BOOLEAN := false;
BEGIN
  -- Check user's notification preferences
  SELECT * INTO user_settings FROM notification_settings WHERE user_id = target_user_id;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Check if this type of notification is enabled
  should_send := CASE notif_type
    WHEN 'friend_entry' THEN user_settings.friend_entry_notifications
    WHEN 'comment' THEN user_settings.comment_notifications
    WHEN 'like' THEN user_settings.like_notifications
    WHEN 'follow_request' THEN user_settings.follow_request_notifications
    ELSE false
  END;
  
  IF NOT should_send THEN
    RETURN NULL;
  END IF;
  
  -- Queue the notification
  INSERT INTO notification_queue (user_id, notification_type, title, body, data, scheduled_for)
  VALUES (target_user_id, notif_type, notif_title, notif_body, notif_data, NOW())
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for notification analytics
CREATE VIEW notification_analytics AS
SELECT 
  user_id,
  notification_type,
  COUNT(*) as total_sent,
  COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END) as total_opened,
  COUNT(CASE WHEN clicked_at IS NOT NULL THEN 1 END) as total_clicked,
  ROUND(
    COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END)::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as open_rate,
  ROUND(
    COUNT(CASE WHEN clicked_at IS NOT NULL THEN 1 END)::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as click_rate
FROM notification_history
WHERE sent_at >= NOW() - INTERVAL '30 days'
GROUP BY user_id, notification_type;

-- Grant permissions
GRANT ALL ON notification_settings TO authenticated;
GRANT SELECT ON notification_queue TO authenticated;
GRANT SELECT ON notification_history TO authenticated;
GRANT SELECT ON daily_reminder_schedule TO authenticated;
GRANT SELECT ON notification_analytics TO authenticated;