import { supabase } from "../config/supabase";

export async function followUser(followerId: string, followedId: string) {
  return supabase.from("follows").insert([{ follower_id: followerId, followed_id: followedId }]);
}

export async function unfollowUser(followerId: string, followedId: string) {
  return supabase.from("follows").delete().match({ follower_id: followerId, followed_id: followedId });
}

export async function getFollowing(userId: string) {
  return supabase.from("follows").select("followed_id").eq("follower_id", userId);
}

export async function getFollowers(userId: string) {
  return supabase.from("follows").select("follower_id").eq("followed_id", userId);
}

export async function isFollowing(followerId: string, followedId: string) {
  const { data, error } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("followed_id", followedId)
    .single();
  return !!data && !error;
}