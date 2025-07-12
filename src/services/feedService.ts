import { supabase } from '../config/supabase';

export async function fetchFeedEntries(userId?: string) {
  try {
    // If no userId provided, get all public entries
    if (!userId) {
      const { data, error } = await supabase
        .from('daily_entries')
        .select('*, user:users(id, username, display_name, avatar_url)')
        .eq('is_private', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    }

    // Get user's own entries and entries from people they follow
    const { data: following } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId)
      .eq('status', 'accepted');

    const followingIds = following?.map(f => f.following_id) || [];
    const userIds = [userId, ...followingIds];

    const { data, error } = await supabase
      .from('daily_entries')
      .select('*, user:users(id, username, display_name, avatar_url)')
      .in('user_id', userIds)
      .or(`is_private.eq.false,user_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching feed entries:', error);
    return [];
  }
}