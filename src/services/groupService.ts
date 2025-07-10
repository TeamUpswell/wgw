import { supabase } from "../config/supabase";

export interface GroupSharingSettings {
  groupId: string;
  shareAllCategories: boolean;
  sharedCategories: string[];
  sharePrivateEntries: boolean;
  shareAIResponses: boolean;
  shareImages: boolean;
}

export interface GroupMember {
  userId: string;
  groupId: string;
  addedAt: string;
  addedBy: string;
}

// TODO: These functions will work once we create the database tables
// For now, they serve as the interface for future database integration

export async function saveGroupSettings(userId: string, settings: GroupSharingSettings) {
  try {
    // TODO: Save to group_settings table
    console.log('Saving group settings for user:', userId, settings);
    
    // Placeholder for database save
    // const { data, error } = await supabase
    //   .from('group_settings')
    //   .upsert({
    //     user_id: userId,
    //     group_id: settings.groupId,
    //     share_all_categories: settings.shareAllCategories,
    //     shared_categories: settings.sharedCategories,
    //     share_private_entries: settings.sharePrivateEntries,
    //     share_ai_responses: settings.shareAIResponses,
    //     share_images: settings.shareImages,
    //     updated_at: new Date().toISOString(),
    //   });
    
    return { success: true };
  } catch (error) {
    console.error('Error saving group settings:', error);
    throw error;
  }
}

export async function getGroupSettings(userId: string, groupId: string): Promise<GroupSharingSettings> {
  try {
    // TODO: Load from group_settings table
    console.log('Loading group settings for user:', userId, 'group:', groupId);
    
    // Placeholder - return default settings
    return {
      groupId,
      shareAllCategories: true,
      sharedCategories: [],
      sharePrivateEntries: false,
      shareAIResponses: false,
      shareImages: true,
    };
  } catch (error) {
    console.error('Error loading group settings:', error);
    throw error;
  }
}

export async function addUserToGroup(groupId: string, userId: string, addedBy: string) {
  try {
    // TODO: Add to group_members table
    console.log('Adding user to group:', { groupId, userId, addedBy });
    
    // Placeholder for database save
    // const { data, error } = await supabase
    //   .from('group_members')
    //   .insert({
    //     group_id: groupId,
    //     user_id: userId,
    //     added_by: addedBy,
    //     added_at: new Date().toISOString(),
    //   });
    
    return { success: true };
  } catch (error) {
    console.error('Error adding user to group:', error);
    throw error;
  }
}

export async function removeUserFromGroup(groupId: string, userId: string) {
  try {
    // TODO: Remove from group_members table
    console.log('Removing user from group:', { groupId, userId });
    
    // Placeholder for database operation
    // const { error } = await supabase
    //   .from('group_members')
    //   .delete()
    //   .eq('group_id', groupId)
    //   .eq('user_id', userId);
    
    return { success: true };
  } catch (error) {
    console.error('Error removing user from group:', error);
    throw error;
  }
}

export async function getGroupMembers(groupId: string) {
  try {
    // TODO: Load from group_members table with user details
    console.log('Loading group members for group:', groupId);
    
    // Placeholder - return empty array
    return [];
  } catch (error) {
    console.error('Error loading group members:', error);
    throw error;
  }
}

export async function getEntriesForGroup(userId: string, groupId: string) {
  try {
    // Get user's group settings
    const settings = await getGroupSettings(userId, groupId);
    
    // Build query based on settings
    let query = supabase
      .from('daily_entries')
      .select('*, user:users(id, username, display_name, avatar_url)')
      .eq('user_id', userId);
    
    // Apply category filtering
    if (!settings.shareAllCategories && settings.sharedCategories.length > 0) {
      query = query.in('category', settings.sharedCategories);
    }
    
    // Always exclude private entries (enforced regardless of settings)
    query = query.eq('is_private', false);
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Filter out AI responses if not sharing them
    const filteredData = data?.map(entry => ({
      ...entry,
      ai_response: settings.shareAIResponses ? entry.ai_response : null,
      image_url: settings.shareImages ? entry.image_url : null,
    }));
    
    return filteredData || [];
  } catch (error) {
    console.error('Error loading entries for group:', error);
    throw error;
  }
}

// Database schema for future implementation:
/*

-- Group Settings Table
CREATE TABLE group_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  group_id TEXT NOT NULL,
  share_all_categories BOOLEAN DEFAULT true,
  shared_categories TEXT[] DEFAULT '{}',
  share_private_entries BOOLEAN DEFAULT false,
  share_ai_responses BOOLEAN DEFAULT false,
  share_images BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, group_id)
);

-- Group Members Table
CREATE TABLE group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  added_by UUID REFERENCES users(id) ON DELETE SET NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Indexes
CREATE INDEX idx_group_settings_user_group ON group_settings(user_id, group_id);
CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_user ON group_members(user_id);

*/