-- Daily Entries Table
-- This table stores users' daily journal entries for "What's Going Well"

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
  UNIQUE(user_id, entry_date) -- One entry per user per day
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_entries_user_id ON daily_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_entries_entry_date ON daily_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_daily_entries_created_at ON daily_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_entries_is_private ON daily_entries(is_private);

-- Enable Row Level Security
ALTER TABLE daily_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy: Users can view their own entries
CREATE POLICY "Users can view their own entries"
  ON daily_entries FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can view others' public entries
CREATE POLICY "Users can view public entries"
  ON daily_entries FOR SELECT
  USING (is_private = false);

-- Policy: Users can only insert their own entries
CREATE POLICY "Users can insert their own entries"
  ON daily_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own entries
CREATE POLICY "Users can update their own entries"
  ON daily_entries FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can only delete their own entries
CREATE POLICY "Users can delete their own entries"
  ON daily_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_daily_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update the updated_at field
CREATE TRIGGER update_daily_entries_updated_at_trigger
  BEFORE UPDATE ON daily_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_entries_updated_at();

-- View for social feed (public entries with user info)
CREATE OR REPLACE VIEW social_feed AS
SELECT 
  de.id,
  de.user_id,
  de.content,
  de.mood,
  de.tags,
  de.image_url,
  de.created_at,
  de.entry_date,
  u.username,
  u.display_name,
  u.avatar_url
FROM daily_entries de
JOIN users u ON de.user_id = u.id
WHERE de.is_private = false
ORDER BY de.created_at DESC;

-- Grant permissions
GRANT ALL ON daily_entries TO authenticated;
GRANT SELECT ON social_feed TO authenticated;