-- User Codes System Database Schema
-- This enables users to share simple codes instead of using email/SMS

-- User Codes Table - Each user gets a unique shareable code
CREATE TABLE user_codes (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Follow Requests Table - Manages follow requests sent via user codes
CREATE TABLE follow_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(requester_id, requested_id)
);

-- Indexes for performance
CREATE INDEX idx_user_codes_code ON user_codes(code);
CREATE INDEX idx_follow_requests_requested_id ON follow_requests(requested_id);
CREATE INDEX idx_follow_requests_requester_id ON follow_requests(requester_id);
CREATE INDEX idx_follow_requests_status ON follow_requests(status);

-- Enable Row Level Security
ALTER TABLE user_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for User Codes
-- Anyone can view user codes (needed for code lookup)
CREATE POLICY "Users can view all user codes" ON user_codes 
  FOR SELECT USING (true);

-- Users can only manage their own code
CREATE POLICY "Users can manage their own code" ON user_codes 
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for Follow Requests
-- Users can view requests they sent or received
CREATE POLICY "Users can view their own requests" ON follow_requests 
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = requested_id);

-- Users can only create requests as themselves
CREATE POLICY "Users can create follow requests" ON follow_requests 
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- Users can only update requests they received
CREATE POLICY "Users can update requests they received" ON follow_requests 
  FOR UPDATE USING (auth.uid() = requested_id);

-- Function to automatically generate user code on user creation
CREATE OR REPLACE FUNCTION generate_user_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
  attempt_count INTEGER := 0;
BEGIN
  -- Generate unique code
  LOOP
    -- Generate code like WGW-AB4M
    new_code := 'WGW-' || 
                upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 4));
    
    -- Check if code exists
    SELECT EXISTS(SELECT 1 FROM user_codes WHERE code = new_code) INTO code_exists;
    
    -- Exit if unique or too many attempts
    EXIT WHEN NOT code_exists OR attempt_count > 10;
    attempt_count := attempt_count + 1;
  END LOOP;
  
  -- Insert the code
  INSERT INTO user_codes (user_id, code) VALUES (NEW.id, new_code);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-generate code for new users
CREATE TRIGGER auto_generate_user_code
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION generate_user_code();

-- Function to clean up old declined requests (optional maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_follow_requests()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM follow_requests 
  WHERE status = 'declined' 
  AND created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for user code lookup with user info
CREATE VIEW user_code_lookup AS
SELECT 
  uc.code,
  uc.user_id,
  u.username,
  u.display_name,
  u.avatar_url,
  u.bio,
  uc.created_at
FROM user_codes uc
JOIN auth.users au ON uc.user_id = au.id
LEFT JOIN users u ON au.id = u.id;

-- Grant permissions
GRANT SELECT ON user_code_lookup TO authenticated;
GRANT ALL ON user_codes TO authenticated;
GRANT ALL ON follow_requests TO authenticated;