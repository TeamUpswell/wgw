-- Create table for storing Two Truths and a Lie guesses
CREATE TABLE IF NOT EXISTS truths_and_lie_guesses (
  id SERIAL PRIMARY KEY,
  profile_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  guesser_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  guessed_position INTEGER NOT NULL CHECK (guessed_position IN (1, 2, 3)),
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_user_id, guesser_user_id)
);

-- Add RLS policies
ALTER TABLE truths_and_lie_guesses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all guesses for profiles they can view
CREATE POLICY "Users can read truths_and_lie_guesses for viewable profiles" ON truths_and_lie_guesses
  FOR SELECT USING (
    -- Profile owner can see all guesses on their profile
    profile_user_id = auth.uid()
    OR 
    -- Users can see their own guesses
    guesser_user_id = auth.uid()
  );

-- Policy: Users can insert their own guesses
CREATE POLICY "Users can insert their own guesses" ON truths_and_lie_guesses
  FOR INSERT WITH CHECK (guesser_user_id = auth.uid());

-- Policy: Users can update their own guesses (in case they want to change before submitting)
CREATE POLICY "Users can update their own guesses" ON truths_and_lie_guesses
  FOR UPDATE USING (guesser_user_id = auth.uid());

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_truths_and_lie_guesses_profile_user_id ON truths_and_lie_guesses(profile_user_id);
CREATE INDEX IF NOT EXISTS idx_truths_and_lie_guesses_guesser_user_id ON truths_and_lie_guesses(guesser_user_id);

-- Add column to users table for storing truths and lie data
ALTER TABLE users ADD COLUMN IF NOT EXISTS truths_and_lie JSONB;

-- Add comment for documentation
COMMENT ON TABLE truths_and_lie_guesses IS 'Stores user guesses for Two Truths and a Lie game on profiles';
COMMENT ON COLUMN users.truths_and_lie IS 'Stores the users Two Truths and a Lie statements and which one is the lie';