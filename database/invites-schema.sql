-- Invites table for tracking email and SMS invitations
CREATE TABLE IF NOT EXISTS invites (
  id TEXT PRIMARY KEY, -- Unique invite code (e.g., 'inv_abc123def456')
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact TEXT NOT NULL, -- Email address or phone number
  type TEXT NOT NULL CHECK (type IN ('email', 'sms')),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'accepted', 'expired')),
  personal_message TEXT,
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- User who accepted the invite
  opened_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_invites_inviter_id ON invites(inviter_id);
CREATE INDEX IF NOT EXISTS idx_invites_contact ON invites(contact);
CREATE INDEX IF NOT EXISTS idx_invites_status ON invites(status);
CREATE INDEX IF NOT EXISTS idx_invites_created_at ON invites(created_at);

-- Row Level Security
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own sent invites
CREATE POLICY "Users can view their own invites"
  ON invites FOR SELECT
  USING (auth.uid() = inviter_id);

-- Policy: Users can create invites
CREATE POLICY "Users can create invites"
  ON invites FOR INSERT
  WITH CHECK (auth.uid() = inviter_id);

-- Policy: Users can update their own invites (for tracking opens/accepts)
CREATE POLICY "Users can update their own invites"
  ON invites FOR UPDATE
  USING (auth.uid() = inviter_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_invites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_invites_updated_at_trigger
  BEFORE UPDATE ON invites
  FOR EACH ROW
  EXECUTE FUNCTION update_invites_updated_at();

-- Function to mark invite as opened (called when invite link is clicked)
CREATE OR REPLACE FUNCTION mark_invite_opened(invite_code TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE invites 
  SET 
    status = 'opened',
    opened_at = NOW()
  WHERE 
    id = invite_code 
    AND status = 'sent'
    AND expires_at > NOW();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept invite (called when user signs up with invite code)
CREATE OR REPLACE FUNCTION accept_invite(invite_code TEXT, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE invites 
  SET 
    status = 'accepted',
    accepted_by = user_id,
    accepted_at = NOW()
  WHERE 
    id = invite_code 
    AND status IN ('sent', 'opened')
    AND expires_at > NOW();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for invite analytics
CREATE OR REPLACE VIEW invite_analytics AS
SELECT 
  inviter_id,
  COUNT(*) as total_sent,
  COUNT(CASE WHEN status = 'opened' THEN 1 END) as total_opened,
  COUNT(CASE WHEN status = 'accepted' THEN 1 END) as total_accepted,
  COUNT(CASE WHEN type = 'email' THEN 1 END) as email_invites,
  COUNT(CASE WHEN type = 'sms' THEN 1 END) as sms_invites,
  ROUND(
    COUNT(CASE WHEN status = 'accepted' THEN 1 END)::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as acceptance_rate
FROM invites
GROUP BY inviter_id;