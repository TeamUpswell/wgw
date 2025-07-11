import { supabase } from '../config/supabase';

export interface Like {
  id: string;
  user_id: string;
  entry_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  entry_id: string;
  content: string;
  created_at: string;
  user?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

export interface EntryWithSocialData {
  id: string;
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
}

// Like functions
export async function toggleLike(userId: string, entryId: string): Promise<{ isLiked: boolean; likeCount: number }> {
  try {
    // Check if user has already liked this entry
    const { data: existingLike, error: checkError } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('entry_id', entryId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    let isLiked: boolean;

    if (existingLike) {
      // Unlike: Remove the like
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) throw deleteError;
      isLiked = false;
    } else {
      // Like: Add the like
      const { error: insertError } = await supabase
        .from('likes')
        .insert({
          user_id: userId,
          entry_id: entryId,
        });

      if (insertError) throw insertError;
      isLiked = true;
    }

    // Get updated like count
    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('entry_id', entryId);

    return {
      isLiked,
      likeCount: count || 0,
    };
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
}

export async function getLikeStatus(userId: string, entryId: string): Promise<{ isLiked: boolean; likeCount: number }> {
  try {
    // Check if user has liked this entry
    const { data: userLike, error: likeError } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('entry_id', entryId)
      .single();

    if (likeError && likeError.code !== 'PGRST116') {
      throw likeError;
    }

    // Get total like count
    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('entry_id', entryId);

    return {
      isLiked: !!userLike,
      likeCount: count || 0,
    };
  } catch (error) {
    console.error('Error getting like status:', error);
    throw error;
  }
}

// Comment functions
export async function addComment(userId: string, entryId: string, content: string): Promise<Comment> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        user_id: userId,
        entry_id: entryId,
        content: content.trim(),
      })
      .select(`
        *,
        user:users(id, username, display_name, avatar_url)
      `)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
}

export async function getComments(entryId: string): Promise<Comment[]> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:users(id, username, display_name, avatar_url)
      `)
      .eq('entry_id', entryId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error getting comments:', error);
    throw error;
  }
}

export async function deleteComment(commentId: string, userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId); // Ensure user can only delete their own comments

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
}

export async function getEntryWithSocialData(entryId: string, userId: string): Promise<EntryWithSocialData> {
  try {
    // Get like count and user's like status
    const { isLiked, likeCount } = await getLikeStatus(userId, entryId);

    // Get comment count
    const { count: commentCount } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('entry_id', entryId);

    return {
      id: entryId,
      likes_count: likeCount,
      comments_count: commentCount || 0,
      user_has_liked: isLiked,
    };
  } catch (error) {
    console.error('Error getting entry social data:', error);
    throw error;
  }
}

// Get social data for multiple entries (for feed)
export async function getEntriesSocialData(entryIds: string[], userId: string): Promise<Record<string, EntryWithSocialData>> {
  try {
    const socialData: Record<string, EntryWithSocialData> = {};

    // Get all likes for these entries
    const { data: likes, error: likesError } = await supabase
      .from('likes')
      .select('entry_id, user_id')
      .in('entry_id', entryIds);

    if (likesError) throw likesError;

    // Get all comments count for these entries
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('entry_id')
      .in('entry_id', entryIds);

    if (commentsError) throw commentsError;

    // Process data for each entry
    entryIds.forEach(entryId => {
      const entryLikes = likes?.filter(like => like.entry_id === entryId) || [];
      const entryComments = comments?.filter(comment => comment.entry_id === entryId) || [];
      const userHasLiked = entryLikes.some(like => like.user_id === userId);

      socialData[entryId] = {
        id: entryId,
        likes_count: entryLikes.length,
        comments_count: entryComments.length,
        user_has_liked: userHasLiked,
      };
    });

    return socialData;
  } catch (error) {
    console.error('Error getting entries social data:', error);
    throw error;
  }
}

/*
Database Schema for Social Features:

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

-- RLS Policies
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Users can read all likes
CREATE POLICY "Users can view all likes" ON likes FOR SELECT USING (true);

-- Users can only insert/delete their own likes
CREATE POLICY "Users can manage their own likes" ON likes 
  FOR ALL USING (auth.uid() = user_id);

-- Users can read all comments on public entries
CREATE POLICY "Users can view comments on public entries" ON comments 
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
*/