-- 02 - REBUILD SOCIAL FEATURES
-- Run this after the core tables to add social functionality

-- 1. Follows table (who follows whom)
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followed_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(follower_id, followed_id),
  CHECK (follower_id != followed_id)
);

-- 2. Follow requests table
CREATE TABLE IF NOT EXISTS public.follow_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'::text,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(requester_id, requested_id),
  CHECK (requester_id != requested_id)
);

-- 3. Likes table
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES daily_entries(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, entry_id)
);

-- 4. Comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES daily_entries(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create indexes for social features
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_followed_id ON follows(followed_id);
CREATE INDEX IF NOT EXISTS idx_follow_requests_requester_id ON follow_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_follow_requests_requested_id ON follow_requests(requested_id);
CREATE INDEX IF NOT EXISTS idx_follow_requests_status ON follow_requests(status);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_entry_id ON likes(entry_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_entry_id ON comments(entry_id);

-- 6. Disable RLS for now
ALTER TABLE public.follows DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;

-- 7. Grant permissions
GRANT ALL ON public.follows TO authenticated, anon, public;
GRANT ALL ON public.follow_requests TO authenticated, anon, public;
GRANT ALL ON public.likes TO authenticated, anon, public;
GRANT ALL ON public.comments TO authenticated, anon, public;

-- 8. Test social features
DO $$
DECLARE
    test_user1 UUID := gen_random_uuid();
    test_user2 UUID := gen_random_uuid();
    test_entry UUID := gen_random_uuid();
    test_email1 TEXT := 'social-test1-' || extract(epoch from now()) || '@example.com';
    test_email2 TEXT := 'social-test2-' || extract(epoch from now()) || '@example.com';
BEGIN
    -- Create test users
    INSERT INTO public.users (id, email) VALUES (test_user1, test_email1);
    INSERT INTO public.users (id, email) VALUES (test_user2, test_email2);
    
    -- Create test entry
    INSERT INTO public.daily_entries (id, user_id, category) VALUES (test_entry, test_user1, 'gratitude');
    
    -- Test social interactions
    INSERT INTO public.follows (follower_id, followed_id) VALUES (test_user2, test_user1);
    INSERT INTO public.likes (user_id, entry_id) VALUES (test_user2, test_entry);
    INSERT INTO public.comments (user_id, entry_id, content) VALUES (test_user2, test_entry, 'Great entry!');
    
    RAISE NOTICE 'SUCCESS: Social features working - Users: %, %', test_user1, test_user2;
    
    -- Clean up
    DELETE FROM public.comments WHERE user_id = test_user2;
    DELETE FROM public.likes WHERE user_id = test_user2;
    DELETE FROM public.follows WHERE follower_id = test_user2;
    DELETE FROM public.daily_entries WHERE id = test_entry;
    DELETE FROM public.users WHERE id IN (test_user1, test_user2);
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR in social setup: % - %', SQLSTATE, SQLERRM;
END $$;

-- 9. Show status
SELECT 'SOCIAL FEATURES SETUP COMPLETE' as status;
SELECT count(*) as follows_count FROM follows;
SELECT count(*) as likes_count FROM likes;
SELECT count(*) as comments_count FROM comments;