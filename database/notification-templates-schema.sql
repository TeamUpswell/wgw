-- Notification Templates System
-- Allows users to create, edit, and manage notification templates

-- Notification Templates Table - User-defined notification templates
CREATE TABLE notification_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL, -- User-friendly name for the template
  description TEXT, -- Optional description
  
  -- Template content
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  
  -- Notification settings
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'daily_reminder',
    'weekly_summary', 
    'monthly_summary',
    'streak_milestone',
    'custom'
  )),
  
  -- Scheduling options
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT, -- 'daily', 'weekly', 'monthly', 'custom'
  
  -- Timing
  scheduled_time TIME, -- Time of day (for daily/weekly)
  scheduled_days INTEGER[], -- Days of week (0=Sunday, 1=Monday, etc.)
  scheduled_date DATE, -- Specific date (for one-time notifications)
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false, -- Whether this is a default system template
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sent_at TIMESTAMP WITH TIME ZONE,
  send_count INTEGER DEFAULT 0,
  
  -- Template category/tags
  category TEXT DEFAULT 'custom',
  tags TEXT[], -- For filtering and organization
  
  -- Advanced settings
  settings JSONB DEFAULT '{}'::jsonb -- Additional settings like sound, vibration, etc.
);

-- Scheduled Notifications Table - Instances of templates that are scheduled
CREATE TABLE scheduled_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES notification_templates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Computed content (from template)
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  
  -- Scheduling
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  
  -- Execution details
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_notification_templates_user_id ON notification_templates(user_id);
CREATE INDEX idx_notification_templates_type ON notification_templates(notification_type);
CREATE INDEX idx_notification_templates_active ON notification_templates(is_active);
CREATE INDEX idx_notification_templates_default ON notification_templates(is_default);
CREATE INDEX idx_notification_templates_category ON notification_templates(category);

CREATE INDEX idx_scheduled_notifications_template_id ON scheduled_notifications(template_id);
CREATE INDEX idx_scheduled_notifications_user_id ON scheduled_notifications(user_id);
CREATE INDEX idx_scheduled_notifications_scheduled_for ON scheduled_notifications(scheduled_for);
CREATE INDEX idx_scheduled_notifications_status ON scheduled_notifications(status);

-- Enable Row Level Security
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Notification Templates
-- Users can view default templates and their own templates
CREATE POLICY "Users can view accessible templates" ON notification_templates 
  FOR SELECT USING (is_default = true OR auth.uid() = user_id);

-- Users can manage their own templates
CREATE POLICY "Users can manage their own templates" ON notification_templates 
  FOR ALL USING (auth.uid() = user_id);

-- Service can manage default templates
CREATE POLICY "Service can manage default templates" ON notification_templates 
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for Scheduled Notifications
-- Users can view their own scheduled notifications
CREATE POLICY "Users can view their own scheduled notifications" ON scheduled_notifications 
  FOR SELECT USING (auth.uid() = user_id);

-- Service can manage scheduled notifications
CREATE POLICY "Service can manage scheduled notifications" ON scheduled_notifications 
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to duplicate a notification template
CREATE OR REPLACE FUNCTION duplicate_notification_template(
  template_id UUID,
  new_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  original_template RECORD;
  new_template_id UUID;
BEGIN
  -- Get the original template
  SELECT * INTO original_template 
  FROM notification_templates 
  WHERE id = template_id AND user_id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found or access denied';
  END IF;
  
  -- Create the duplicate
  INSERT INTO notification_templates (
    user_id, name, description, title, body, notification_type,
    is_recurring, recurrence_pattern, scheduled_time, scheduled_days,
    category, tags, settings
  ) VALUES (
    auth.uid(),
    COALESCE(new_name, original_template.name || ' (Copy)'),
    original_template.description,
    original_template.title,
    original_template.body,
    original_template.notification_type,
    original_template.is_recurring,
    original_template.recurrence_pattern,
    original_template.scheduled_time,
    original_template.scheduled_days,
    original_template.category,
    original_template.tags,
    original_template.settings
  ) RETURNING id INTO new_template_id;
  
  RETURN new_template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to schedule notifications from a template
CREATE OR REPLACE FUNCTION schedule_from_template(
  template_id UUID,
  days_ahead INTEGER DEFAULT 7
)
RETURNS INTEGER AS $$
DECLARE
  template_record RECORD;
  schedule_date DATE;
  schedule_time TIMESTAMP WITH TIME ZONE;
  scheduled_count INTEGER := 0;
  day_of_week INTEGER;
BEGIN
  -- Get the template
  SELECT * INTO template_record 
  FROM notification_templates 
  WHERE id = template_id AND user_id = auth.uid() AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Schedule based on recurrence pattern
  IF template_record.is_recurring THEN
    CASE template_record.recurrence_pattern
      WHEN 'daily' THEN
        -- Schedule for each day
        FOR i IN 0..days_ahead-1 LOOP
          schedule_date := CURRENT_DATE + i;
          schedule_time := schedule_date + template_record.scheduled_time;
          
          IF schedule_time > NOW() THEN
            INSERT INTO scheduled_notifications (
              template_id, user_id, title, body, scheduled_for
            ) VALUES (
              template_id, auth.uid(), template_record.title, 
              template_record.body, schedule_time
            );
            scheduled_count := scheduled_count + 1;
          END IF;
        END LOOP;
        
      WHEN 'weekly' THEN
        -- Schedule for specified days of the week
        FOR i IN 0..days_ahead-1 LOOP
          schedule_date := CURRENT_DATE + i;
          day_of_week := EXTRACT(DOW FROM schedule_date);
          
          IF template_record.scheduled_days @> ARRAY[day_of_week] THEN
            schedule_time := schedule_date + template_record.scheduled_time;
            
            IF schedule_time > NOW() THEN
              INSERT INTO scheduled_notifications (
                template_id, user_id, title, body, scheduled_for
              ) VALUES (
                template_id, auth.uid(), template_record.title, 
                template_record.body, schedule_time
              );
              scheduled_count := scheduled_count + 1;
            END IF;
          END IF;
        END LOOP;
    END CASE;
  ELSE
    -- One-time notification
    IF template_record.scheduled_date IS NOT NULL THEN
      schedule_time := template_record.scheduled_date + COALESCE(template_record.scheduled_time, '09:00:00'::TIME);
      
      IF schedule_time > NOW() THEN
        INSERT INTO scheduled_notifications (
          template_id, user_id, title, body, scheduled_for
        ) VALUES (
          template_id, auth.uid(), template_record.title, 
          template_record.body, schedule_time
        );
        scheduled_count := 1;
      END IF;
    END IF;
  END IF;
  
  -- Update template last scheduled info
  UPDATE notification_templates 
  SET updated_at = NOW()
  WHERE id = template_id;
  
  RETURN scheduled_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create default notification templates for new users
CREATE OR REPLACE FUNCTION create_default_notification_templates()
RETURNS TRIGGER AS $$
BEGIN
  -- Daily Gratitude Reminder
  INSERT INTO notification_templates (
    user_id, name, description, title, body, notification_type,
    is_recurring, recurrence_pattern, scheduled_time, is_default, category
  ) VALUES (
    NEW.id,
    'Daily Gratitude Reminder',
    'A gentle reminder to log your daily gratitude',
    'Time for gratitude! 🌟',
    'What went well for you today? Even small moments count!',
    'daily_reminder',
    true,
    'daily',
    '20:00:00'::TIME,
    true,
    'reminders'
  );
  
  -- Weekly Reflection
  INSERT INTO notification_templates (
    user_id, name, description, title, body, notification_type,
    is_recurring, recurrence_pattern, scheduled_time, scheduled_days, is_default, category
  ) VALUES (
    NEW.id,
    'Weekly Reflection',
    'Weekly summary of your gratitude journey',
    'Your Weekly Gratitude Summary 📊',
    'Take a moment to reflect on all the positive moments from this week',
    'weekly_summary',
    true,
    'weekly',
    '09:00:00'::TIME,
    ARRAY[0], -- Sunday
    true,
    'summaries'
  );
  
  -- Streak Milestone
  INSERT INTO notification_templates (
    user_id, name, description, title, body, notification_type,
    is_default, category
  ) VALUES (
    NEW.id,
    'Streak Milestone',
    'Celebrate your gratitude streaks',
    'Congratulations! 🎉',
    'You''ve reached a new gratitude milestone! Keep up the amazing work.',
    'streak_milestone',
    true,
    'celebrations'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default templates for new users
CREATE TRIGGER create_default_notification_templates_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_templates();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_notification_templates_updated_at_trigger
  BEFORE UPDATE ON notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_templates_updated_at();

-- Grant permissions
GRANT ALL ON notification_templates TO authenticated;
GRANT ALL ON scheduled_notifications TO authenticated;