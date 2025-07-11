-- CURRENT DATABASE SCHEMA - MATCHES EXISTING SUPABASE STRUCTURE
-- Generated from actual database structure
-- This file recreates your exact current database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (main profile table)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'enterprise')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily entries table
CREATE TABLE IF NOT EXISTS daily_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mood TEXT CHECK (mood IN ('excellent', 'good', 'okay', 'difficult', 'challenging')),
  is_private BOOLEAN DEFAULT false,
  tags TEXT[],
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  entry_date DATE DEFAULT CURRENT_DATE,
  UNIQUE(user_id, entry_date)
);

-- User codes table (for invite system)
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

-- Follows table (who follows whom)
CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followed_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, followed_id),
  CHECK (follower_id != followed_id)
);

-- Follow requests table
CREATE TABLE IF NOT EXISTS follow_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(requester_id, requested_id),
  CHECK (requester_id != requested_id)
);

-- Likes table
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES daily_entries(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, entry_id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES daily_entries(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recaps table
CREATE TABLE IF NOT EXISTS recaps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT,
  recap_type TEXT DEFAULT 'weekly' CHECK (recap_type IN ('weekly', 'monthly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_reminders BOOLEAN DEFAULT true,
  friend_activity BOOLEAN DEFAULT true,
  comments BOOLEAN DEFAULT true,
  likes BOOLEAN DEFAULT true,
  streak_milestones BOOLEAN DEFAULT true,
  weekly_recaps BOOLEAN DEFAULT true,
  reminder_time TIME DEFAULT '20:00:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification templates table
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('daily_reminder', 'weekly_recap', 'streak_milestone', 'friend_activity', 'comment', 'like')),
  schedule_time TIME,
  schedule_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7], -- Array of weekday numbers (1=Monday, 7=Sunday)
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  category TEXT DEFAULT 'personal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Notification queue table
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification history table
CREATE TABLE IF NOT EXISTS notification_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivery_status TEXT DEFAULT 'delivered' CHECK (delivery_status IN ('delivered', 'failed', 'pending')),
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily reminder schedule table
CREATE TABLE IF NOT EXISTS daily_reminder_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'skipped')),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, scheduled_date)
);

-- ============================================================================
-- INDEXES (matching your current database)
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS users_email_key ON users(email);
CREATE INDEX IF NOT EXISTS users_username_key ON users(username);

-- Daily entries indexes
CREATE INDEX IF NOT EXISTS daily_entries_pkey ON daily_entries(id);

-- User codes indexes
CREATE INDEX IF NOT EXISTS idx_user_codes_code ON user_codes(code);
CREATE INDEX IF NOT EXISTS user_codes_code_key ON user_codes(code);

-- Follows indexes
CREATE INDEX IF NOT EXISTS follows_follower_id_followed_id_key ON follows(follower_id, followed_id);

-- Follow requests indexes
CREATE INDEX IF NOT EXISTS follow_requests_requester_id_requested_id_key ON follow_requests(requester_id, requested_id);
CREATE INDEX IF NOT EXISTS idx_follow_requests_requested_id ON follow_requests(requested_id);
CREATE INDEX IF NOT EXISTS idx_follow_requests_requester_id ON follow_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_follow_requests_status ON follow_requests(status);

-- Likes indexes
CREATE INDEX IF NOT EXISTS idx_likes_entry_id ON likes(entry_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS likes_user_id_entry_id_key ON likes(user_id, entry_id);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_entry_id ON comments(entry_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

-- Notification settings indexes
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);

-- Notification templates indexes
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_notification_templates_category ON notification_templates(category);
CREATE INDEX IF NOT EXISTS idx_notification_templates_default ON notification_templates(is_default);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_user_id ON notification_templates(user_id);

-- Scheduled notifications indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_for ON scheduled_notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_status ON scheduled_notifications(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_template_id ON scheduled_notifications(template_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user_id ON scheduled_notifications(user_id);

-- Notification queue indexes
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled_for ON notification_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_user_id ON notification_queue(user_id);

-- Notification history indexes
CREATE INDEX IF NOT EXISTS idx_notification_history_sent_at ON notification_history(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_history_user_id ON notification_history(user_id);

-- Daily reminder schedule indexes
CREATE INDEX IF NOT EXISTS daily_reminder_schedule_user_id_scheduled_date_key ON daily_reminder_schedule(user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_daily_reminder_schedule_date ON daily_reminder_schedule(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_daily_reminder_schedule_time ON daily_reminder_schedule(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_daily_reminder_schedule_user_id ON daily_reminder_schedule(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
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

-- Users policies
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can delete their own profile" ON users FOR DELETE USING (auth.uid() = id);

-- Daily entries policies
CREATE POLICY "Users can view public entries and their own" ON daily_entries FOR SELECT USING (
  is_private = false OR user_id = auth.uid()
);
CREATE POLICY "Users can insert their own entries" ON daily_entries FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own entries" ON daily_entries FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own entries" ON daily_entries FOR DELETE USING (user_id = auth.uid());

-- User codes policies
CREATE POLICY "Users can view all user codes" ON user_codes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own user code" ON user_codes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own user code" ON user_codes FOR UPDATE USING (user_id = auth.uid());

-- Other table policies (similar pattern)
CREATE POLICY "Users manage own data" ON user_categories FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users manage own data" ON user_streaks FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can view follows" ON follows FOR SELECT USING (true);
CREATE POLICY "Users manage own follows" ON follows FOR ALL USING (follower_id = auth.uid());
CREATE POLICY "Users can view follow requests" ON follow_requests FOR SELECT USING (requester_id = auth.uid() OR requested_id = auth.uid());
CREATE POLICY "Users manage own follow requests" ON follow_requests FOR ALL USING (requester_id = auth.uid() OR requested_id = auth.uid());
CREATE POLICY "Users can view likes" ON likes FOR SELECT USING (true);
CREATE POLICY "Users manage own likes" ON likes FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can view comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Users manage own comments" ON comments FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users manage own data" ON recaps FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users manage own data" ON notification_settings FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users manage own data" ON notification_templates FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users manage own data" ON scheduled_notifications FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users manage own data" ON notification_queue FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users manage own data" ON notification_history FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users manage own data" ON daily_reminder_schedule FOR ALL USING (user_id = auth.uid());

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to handle new user creation
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

-- Trigger to create user profile after signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_daily_entries_updated_at BEFORE UPDATE ON daily_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_user_codes_updated_at BEFORE UPDATE ON user_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_user_categories_updated_at BEFORE UPDATE ON user_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_user_streaks_updated_at BEFORE UPDATE ON user_streaks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_follow_requests_updated_at BEFORE UPDATE ON follow_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON notification_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON notification_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();