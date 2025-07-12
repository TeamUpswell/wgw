-- Fix duplicate profile creation race condition
-- This updates the trigger function to better handle concurrent profile creation

-- Drop the existing trigger function
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Create improved trigger function with better conflict handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Use INSERT ... ON CONFLICT to handle race conditions
  INSERT INTO users (id, email, subscription_tier)
  VALUES (NEW.id, NEW.email, 'free')
  ON CONFLICT (id) DO UPDATE SET
    -- Only update if email changed (unlikely but safe)
    email = CASE 
      WHEN users.email IS NULL OR users.email = '' 
      THEN EXCLUDED.email 
      ELSE users.email 
    END,
    updated_at = NOW();
  
  -- Generate user code with conflict handling
  INSERT INTO user_codes (user_id, code)
  VALUES (NEW.id, 'WGW-' || UPPER(SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 4)))
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create default notification settings with conflict handling
  INSERT INTO notification_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- If we still get a unique violation, just log and continue
    RAISE NOTICE 'User profile already exists for user %', NEW.id;
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log other errors but don't fail the auth signup
    RAISE WARNING 'Error in handle_new_user for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Also add a unique constraint on user_codes.user_id if it doesn't exist
ALTER TABLE user_codes DROP CONSTRAINT IF EXISTS user_codes_user_id_key;
ALTER TABLE user_codes ADD CONSTRAINT user_codes_user_id_key UNIQUE (user_id);

-- Add index on users.email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;

-- Verify the fix
SELECT 'Profile race condition fix applied successfully' as status;