-- EXACT CURRENT DATABASE SCHEMA
-- Generated from your actual Supabase database structure (CSV exports)
-- This file recreates your EXACT current database with all columns, types, and constraints

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- MAIN TABLES (matching your exact column structure)
-- ============================================================================

-- Users table (simplified - only what you have)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily entries table (matching your exact structure)
CREATE TABLE IF NOT EXISTS daily_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  audio_url TEXT,
  transcription TEXT,
  ai_response TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  favorite BOOLEAN,
  is_private BOOLEAN NOT NULL DEFAULT false,
  image_url TEXT
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id UUID REFERENCES daily_entries(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Likes table
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id UUID REFERENCES daily_entries(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, entry_id)
);

-- Follows table
CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  followed_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(follower_id, followed_id),
  CHECK (follower_id != followed_id)
);

-- Follow requests table
CREATE TABLE IF NOT EXISTS follow_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'::text,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(requester_id, requested_id),
  CHECK (requester_id != requested_id)
);

-- User codes table
CREATE TABLE IF NOT EXISTS user_codes (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User categories table
CREATE TABLE IF NOT EXISTS user_categories (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  categories JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User streaks table
CREATE TABLE IF NOT EXISTS user_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_entry_date DATE,
  streak_start_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recaps table
CREATE TABLE IF NOT EXISTS recaps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT,
  recap_type TEXT DEFAULT 'weekly',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Entry social stats table (view/materialized table)
CREATE TABLE IF NOT EXISTS entry_social_stats (
  entry_id UUID REFERENCES daily_entries(id) ON DELETE CASCADE,
  entry_owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  likes_count BIGINT,
  comments_count BIGINT
);

-- ============================================================================
-- NOTIFICATION SYSTEM TABLES (matching your exact structure)
-- ============================================================================

-- Notification settings table (with your exact columns)
CREATE TABLE IF NOT EXISTS notification_settings (
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

-- Notification templates table (with your exact columns)
CREATE TABLE IF NOT EXISTS notification_templates (
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

-- Notification queue table (with your exact columns)
CREATE TABLE IF NOT EXISTS notification_queue (
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

-- Notification history table (with your exact columns)
CREATE TABLE IF NOT EXISTS notification_history (
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

-- Notification analytics table
CREATE TABLE IF NOT EXISTS notification_analytics (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT,
  total_sent BIGINT,
  total_opened BIGINT,
  total_clicked BIGINT,
  open_rate NUMERIC,
  click_rate NUMERIC
);

-- Daily reminder schedule table (with your exact columns)
CREATE TABLE IF NOT EXISTS daily_reminder_schedule (
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

-- Scheduled notifications table
CREATE TABLE IF NOT EXISTS scheduled_notifications (
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

-- ============================================================================
-- INDEXES (exactly matching your current database)
-- ============================================================================

-- Comments indexes
CREATE UNIQUE INDEX IF NOT EXISTS comments_pkey ON comments USING btree (id);
CREATE INDEX IF NOT EXISTS idx_comments_entry_id ON comments USING btree (entry_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments USING btree (user_id);

-- Daily entries indexes
CREATE UNIQUE INDEX IF NOT EXISTS daily_entries_pkey ON daily_entries USING btree (id);

-- Daily reminder schedule indexes
CREATE UNIQUE INDEX IF NOT EXISTS daily_reminder_schedule_pkey ON daily_reminder_schedule USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS daily_reminder_schedule_user_id_scheduled_date_key ON daily_reminder_schedule USING btree (user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_daily_reminder_schedule_date ON daily_reminder_schedule USING btree (scheduled_date);
CREATE INDEX IF NOT EXISTS idx_daily_reminder_schedule_time ON daily_reminder_schedule USING btree (scheduled_time);
CREATE INDEX IF NOT EXISTS idx_daily_reminder_schedule_user_id ON daily_reminder_schedule USING btree (user_id);

-- Follow requests indexes
CREATE UNIQUE INDEX IF NOT EXISTS follow_requests_pkey ON follow_requests USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS follow_requests_requester_id_requested_id_key ON follow_requests USING btree (requester_id, requested_id);
CREATE INDEX IF NOT EXISTS idx_follow_requests_requested_id ON follow_requests USING btree (requested_id);
CREATE INDEX IF NOT EXISTS idx_follow_requests_requester_id ON follow_requests USING btree (requester_id);
CREATE INDEX IF NOT EXISTS idx_follow_requests_status ON follow_requests USING btree (status);

-- Follows indexes
CREATE UNIQUE INDEX IF NOT EXISTS follows_follower_id_followed_id_key ON follows USING btree (follower_id, followed_id);
CREATE UNIQUE INDEX IF NOT EXISTS follows_pkey ON follows USING btree (id);

-- Likes indexes
CREATE INDEX IF NOT EXISTS idx_likes_entry_id ON likes USING btree (entry_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS likes_pkey ON likes USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS likes_user_id_entry_id_key ON likes USING btree (user_id, entry_id);

-- Notification history indexes
CREATE INDEX IF NOT EXISTS idx_notification_history_sent_at ON notification_history USING btree (sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_history_user_id ON notification_history USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS notification_history_pkey ON notification_history USING btree (id);

-- Notification queue indexes
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled_for ON notification_queue USING btree (scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue USING btree (status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_user_id ON notification_queue USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS notification_queue_pkey ON notification_queue USING btree (id);

-- Notification settings indexes
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS notification_settings_pkey ON notification_settings USING btree (user_id);

-- Notification templates indexes
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates USING btree (is_active);
CREATE INDEX IF NOT EXISTS idx_notification_templates_category ON notification_templates USING btree (category);
CREATE INDEX IF NOT EXISTS idx_notification_templates_default ON notification_templates USING btree (is_default);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates USING btree (notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_user_id ON notification_templates USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS notification_templates_pkey ON notification_templates USING btree (id);

-- Recaps indexes
CREATE UNIQUE INDEX IF NOT EXISTS recaps_pkey ON recaps USING btree (id);

-- Scheduled notifications indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_for ON scheduled_notifications USING btree (scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_status ON scheduled_notifications USING btree (status);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_template_id ON scheduled_notifications USING btree (template_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user_id ON scheduled_notifications USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS scheduled_notifications_pkey ON scheduled_notifications USING btree (id);

-- User categories indexes
CREATE UNIQUE INDEX IF NOT EXISTS user_categories_pkey ON user_categories USING btree (user_id);

-- User codes indexes
CREATE INDEX IF NOT EXISTS idx_user_codes_code ON user_codes USING btree (code);
CREATE UNIQUE INDEX IF NOT EXISTS user_codes_code_key ON user_codes USING btree (code);
CREATE UNIQUE INDEX IF NOT EXISTS user_codes_pkey ON user_codes USING btree (user_id);

-- User streaks indexes
CREATE UNIQUE INDEX IF NOT EXISTS user_streaks_pkey ON user_streaks USING btree (user_id);

-- Users indexes
CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users USING btree (email);
CREATE UNIQUE INDEX IF NOT EXISTS users_pkey ON users USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON users USING btree (username);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES (exactly matching your current setup)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE recaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reminder_schedule ENABLE ROW LEVEL SECURITY;

-- Users policies (matching your exact policies)
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Daily entries policies
DROP POLICY IF EXISTS "daily_entries_select" ON daily_entries;
CREATE POLICY "daily_entries_select" ON daily_entries FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "daily_entries_insert" ON daily_entries;
CREATE POLICY "daily_entries_insert" ON daily_entries FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "daily_entries_update" ON daily_entries;
CREATE POLICY "daily_entries_update" ON daily_entries FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "daily_entries_delete" ON daily_entries;
CREATE POLICY "daily_entries_delete" ON daily_entries FOR DELETE USING (auth.uid() = user_id);

-- User streaks policies
DROP POLICY IF EXISTS "user_streaks_select" ON user_streaks;
CREATE POLICY "user_streaks_select" ON user_streaks FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_streaks_insert" ON user_streaks;
CREATE POLICY "user_streaks_insert" ON user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_streaks_update" ON user_streaks;
CREATE POLICY "user_streaks_update" ON user_streaks FOR UPDATE USING (auth.uid() = user_id);

-- User categories policies
DROP POLICY IF EXISTS "user_categories_select" ON user_categories;
CREATE POLICY "user_categories_select" ON user_categories FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_categories_insert" ON user_categories;
CREATE POLICY "user_categories_insert" ON user_categories FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_categories_update" ON user_categories;
CREATE POLICY "user_categories_update" ON user_categories FOR UPDATE USING (auth.uid() = user_id);

-- Likes policies
DROP POLICY IF EXISTS "Users can view all likes" ON likes;
CREATE POLICY "Users can view all likes" ON likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their own likes" ON likes;
CREATE POLICY "Users can manage their own likes" ON likes FOR ALL USING (auth.uid() = user_id);

-- Comments policies (complex policy matching your exact setup)
DROP POLICY IF EXISTS "Users can view comments on accessible entries" ON comments;
CREATE POLICY "Users can view comments on accessible entries" ON comments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM daily_entries 
    WHERE daily_entries.id = comments.entry_id 
    AND (daily_entries.is_private = false OR daily_entries.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can add comments to public entries" ON comments;
CREATE POLICY "Users can add comments to public entries" ON comments FOR INSERT WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM daily_entries 
    WHERE daily_entries.id = comments.entry_id 
    AND daily_entries.is_private = false
  )
);

DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;
CREATE POLICY "Users can delete their own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- User codes policies
DROP POLICY IF EXISTS "Users can view all user codes" ON user_codes;
CREATE POLICY "Users can view all user codes" ON user_codes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their own code" ON user_codes;
CREATE POLICY "Users can manage their own code" ON user_codes FOR ALL USING (auth.uid() = user_id);

-- Follow requests policies
DROP POLICY IF EXISTS "Users can view their own requests" ON follow_requests;
CREATE POLICY "Users can view their own requests" ON follow_requests FOR SELECT USING (
  auth.uid() = requester_id OR auth.uid() = requested_id
);

DROP POLICY IF EXISTS "Users can create follow requests" ON follow_requests;
CREATE POLICY "Users can create follow requests" ON follow_requests FOR INSERT WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Users can update requests they received" ON follow_requests;
CREATE POLICY "Users can update requests they received" ON follow_requests FOR UPDATE USING (auth.uid() = requested_id);

-- Notification policies (with service role support)
DROP POLICY IF EXISTS "Users can manage their own notification settings" ON notification_settings;
CREATE POLICY "Users can manage their own notification settings" ON notification_settings FOR ALL USING (auth.uid() = user_id);

-- Notification queue policies
DROP POLICY IF EXISTS "Users can view their own notification queue" ON notification_queue;
CREATE POLICY "Users can view their own notification queue" ON notification_queue FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can manage notification queue" ON notification_queue;
CREATE POLICY "Service can manage notification queue" ON notification_queue FOR ALL USING (
  (auth.jwt() ->> 'role'::text) = 'service_role'::text
);

-- Notification history policies
DROP POLICY IF EXISTS "Users can view their own notification history" ON notification_history;
CREATE POLICY "Users can view their own notification history" ON notification_history FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can manage notification history" ON notification_history;
CREATE POLICY "Service can manage notification history" ON notification_history FOR ALL USING (
  (auth.jwt() ->> 'role'::text) = 'service_role'::text
);

-- Daily reminder schedule policies
DROP POLICY IF EXISTS "Users can view their own reminder schedule" ON daily_reminder_schedule;
CREATE POLICY "Users can view their own reminder schedule" ON daily_reminder_schedule FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can manage reminder schedule" ON daily_reminder_schedule;
CREATE POLICY "Service can manage reminder schedule" ON daily_reminder_schedule FOR ALL USING (
  (auth.jwt() ->> 'role'::text) = 'service_role'::text
);

-- Notification templates policies
DROP POLICY IF EXISTS "Users can view accessible templates" ON notification_templates;
CREATE POLICY "Users can view accessible templates" ON notification_templates FOR SELECT USING (
  is_default = true OR auth.uid() = user_id
);

DROP POLICY IF EXISTS "Users can manage their own templates" ON notification_templates;
CREATE POLICY "Users can manage their own templates" ON notification_templates FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can manage default templates" ON notification_templates;
CREATE POLICY "Service can manage default templates" ON notification_templates FOR ALL USING (
  (auth.jwt() ->> 'role'::text) = 'service_role'::text
);

-- Scheduled notifications policies
DROP POLICY IF EXISTS "Users can view their own scheduled notifications" ON scheduled_notifications;
CREATE POLICY "Users can view their own scheduled notifications" ON scheduled_notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can manage scheduled notifications" ON scheduled_notifications;
CREATE POLICY "Service can manage scheduled notifications" ON scheduled_notifications FOR ALL USING (
  (auth.jwt() ->> 'role'::text) = 'service_role'::text
);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS (matching your current setup)
-- ============================================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check entry visibility for likes
CREATE OR REPLACE FUNCTION check_entry_visibility()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the entry exists and is accessible
    IF NOT EXISTS (
        SELECT 1 FROM daily_entries 
        WHERE id = NEW.entry_id 
        AND (is_private = false OR user_id = auth.uid())
    ) THEN
        RAISE EXCEPTION 'Cannot like private or non-existent entry';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for notification templates updated_at
CREATE OR REPLACE FUNCTION update_notification_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user creation (CRITICAL for signup to work)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into users table
  INSERT INTO users (id, email, subscription_tier)
  VALUES (NEW.id, NEW.email, 'free')
  ON CONFLICT (id) DO NOTHING;
  
  -- Generate user code
  INSERT INTO user_codes (user_id, code)
  VALUES (NEW.id, 'WGW-' || UPPER(SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 4)))
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create default notification settings
  INSERT INTO notification_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Initialize user categories
  INSERT INTO user_categories (user_id, categories)
  VALUES (NEW.id, '[]'::jsonb)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Initialize user streaks
  INSERT INTO user_streaks (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS (matching your current setup)
-- ============================================================================

-- Updated_at triggers
DROP TRIGGER IF EXISTS update_user_categories_updated_at ON user_categories;
CREATE TRIGGER update_user_categories_updated_at 
  BEFORE UPDATE ON user_categories 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_templates_updated_at_trigger ON notification_templates;
CREATE TRIGGER update_notification_templates_updated_at_trigger 
  BEFORE UPDATE ON notification_templates 
  FOR EACH ROW EXECUTE FUNCTION update_notification_templates_updated_at();

-- Entry visibility check trigger
DROP TRIGGER IF EXISTS check_like_entry_visibility ON likes;
CREATE TRIGGER check_like_entry_visibility 
  BEFORE INSERT ON likes 
  FOR EACH ROW EXECUTE FUNCTION check_entry_visibility();

-- CRITICAL: User creation trigger (this fixes the signup error!)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- NOTES
-- ============================================================================

/*
This schema file represents your EXACT current Supabase database structure.

KEY INSIGHTS FROM YOUR DATABASE:
1. You have a sophisticated notification system with analytics
2. Your daily_entries table uses 'category' instead of 'content' 
3. You have audio functionality (audio_url, transcription, ai_response)
4. Your notification system supports service role access
5. You have comprehensive social features (likes, comments, follows)

CRITICAL FOR SIGNUP ERROR:
The handle_new_user() function and trigger are essential for fixing 
the "Database error saving new user" issue. This trigger automatically
creates all necessary related records when a user signs up.
*/