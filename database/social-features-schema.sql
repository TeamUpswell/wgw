-- Social Features Database Schema for What's Going Well App

-- Likes Table
CREATE TABLE likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  entry_id UUID REFERENCES daily_entries(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, entry_id)
);

-- Comments Table
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  entry_id UUID REFERENCES daily_entries(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_likes_entry_id ON likes(entry_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_comments_entry_id ON comments(entry_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);

-- Enable Row Level Security
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Likes
-- Users can read all likes
CREATE POLICY "Users can view all likes" ON likes FOR SELECT USING (true);

-- Users can only insert/delete their own likes
CREATE POLICY "Users can manage their own likes" ON likes 
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for Comments
-- Users can read all comments on public entries (and their own private entries)
CREATE POLICY "Users can view comments on accessible entries" ON comments 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM daily_entries 
      WHERE daily_entries.id = comments.entry_id 
      AND (daily_entries.is_private = false OR daily_entries.user_id = auth.uid())
    )
  );

-- Users can insert comments on public entries
CREATE POLICY "Users can add comments to public entries" ON comments 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM daily_entries 
      WHERE daily_entries.id = comments.entry_id 
      AND daily_entries.is_private = false
    )
  );

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments" ON comments 
  FOR DELETE USING (auth.uid() = user_id);

-- Optional: Add trigger to prevent liking private entries
CREATE OR REPLACE FUNCTION check_entry_visibility()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the entry is public or belongs to the user
  IF NOT EXISTS (
    SELECT 1 FROM daily_entries 
    WHERE id = NEW.entry_id 
    AND (is_private = false OR user_id = NEW.user_id)
  ) THEN
    RAISE EXCEPTION 'Cannot like private entries that do not belong to you';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_like_entry_visibility
  BEFORE INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION check_entry_visibility();

-- Views for easier querying (optional)
CREATE VIEW entry_social_stats AS
SELECT 
  e.id as entry_id,
  e.user_id as entry_owner_id,
  COUNT(DISTINCT l.id) as likes_count,
  COUNT(DISTINCT c.id) as comments_count
FROM daily_entries e
LEFT JOIN likes l ON e.id = l.entry_id
LEFT JOIN comments c ON e.id = c.entry_id
WHERE e.is_private = false
GROUP BY e.id, e.user_id;

-- Grant permissions
GRANT SELECT ON entry_social_stats TO authenticated;
GRANT ALL ON likes TO authenticated;
GRANT ALL ON comments TO authenticated;