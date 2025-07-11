import { supabase } from '../config/supabase';

export interface UserCode {
  user_id: string;
  code: string;
  email?: string;
  created_at: string;
}

export interface FollowRequest {
  id: string;
  requester_id: string;
  requested_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  requester?: {
    id: string;
    email: string;
  };
}

// Generate a unique user code (like WGW-AB4M or USER123)
export function generateUserCode(): string {
  const prefix = 'WGW';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `${prefix}-${code}`;
}

// Create or get user's unique code
export async function createOrGetUserCode(userId: string): Promise<string> {
  try {
    // First check if user already has a code
    const { data: existingCode, error: fetchError } = await supabase
      .from('user_codes')
      .select('code')
      .eq('user_id', userId)
      .single();

    if (existingCode && !fetchError) {
      return existingCode.code;
    }

    // Generate a new unique code
    let attempts = 0;
    let newCode: string;
    
    do {
      newCode = generateUserCode();
      attempts++;
      
      // Check if this code already exists
      const { data: existing } = await supabase
        .from('user_codes')
        .select('code')
        .eq('code', newCode)
        .single();
      
      if (!existing) {
        break; // Code is unique
      }
    } while (attempts < 10);

    if (attempts >= 10) {
      throw new Error('Failed to generate unique code');
    }

    // Insert the new code
    const { error: insertError } = await supabase
      .from('user_codes')
      .insert({
        user_id: userId,
        code: newCode,
      });

    if (insertError) throw insertError;

    return newCode;
  } catch (error) {
    console.error('Error creating user code:', error);
    throw error;
  }
}

// Find user by their code
export async function findUserByCode(code: string): Promise<UserCode | null> {
  try {
    const { data, error } = await supabase
      .from('user_codes')
      .select(`
        user_id,
        code,
        created_at
      `)
      .eq('code', code.toUpperCase())
      .single();

    if (error || !data) {
      return null;
    }

    return {
      user_id: data.user_id,
      code: data.code,
      email: `User ${data.user_id.slice(0, 8)}`,
      created_at: data.created_at,
    };
  } catch (error) {
    console.error('Error finding user by code:', error);
    return null;
  }
}

// Send follow request using user code
export async function sendFollowRequest(requesterId: string, targetCode: string): Promise<{ success: boolean; message: string; user?: UserCode }> {
  try {
    // Find the target user
    const targetUser = await findUserByCode(targetCode);
    
    if (!targetUser) {
      return { success: false, message: 'User code not found. Please check the code and try again.' };
    }

    if (targetUser.user_id === requesterId) {
      return { success: false, message: 'You cannot send a follow request to yourself.' };
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', requesterId)
      .eq('followed_id', targetUser.user_id)
      .single();

    if (existingFollow) {
      return { success: false, message: 'You are already following this user.' };
    }

    // Check if request already exists
    const { data: existingRequest } = await supabase
      .from('follow_requests')
      .select('id, status')
      .eq('requester_id', requesterId)
      .eq('requested_id', targetUser.user_id)
      .single();

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return { success: false, message: 'Follow request already pending.' };
      } else if (existingRequest.status === 'declined') {
        // Update existing declined request to pending
        const { error: updateError } = await supabase
          .from('follow_requests')
          .update({ status: 'pending' })
          .eq('id', existingRequest.id);

        if (updateError) throw updateError;

        return { 
          success: true, 
          message: `Follow request sent to ${targetUser.email}!`,
          user: targetUser 
        };
      }
    }

    // Create new follow request
    const { error: insertError } = await supabase
      .from('follow_requests')
      .insert({
        requester_id: requesterId,
        requested_id: targetUser.user_id,
        status: 'pending',
      });

    if (insertError) throw insertError;

    return { 
      success: true, 
      message: `Follow request sent to ${targetUser.email}!`,
      user: targetUser 
    };
  } catch (error) {
    console.error('Error sending follow request:', error);
    return { success: false, message: 'Failed to send follow request. Please try again.' };
  }
}

// Get pending follow requests for a user
export async function getFollowRequests(userId: string): Promise<FollowRequest[]> {
  try {
    const { data, error } = await supabase
      .from('follow_requests')
      .select(`
        id,
        requester_id,
        requested_id,
        status,
        created_at
      `)
      .eq('requested_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map requests with requester info (just show user ID for now)
    const requestsWithRequester = (data || []).map(request => ({
      ...request,
      requester: { id: request.requester_id, email: `User ${request.requester_id.slice(0, 8)}` }
    }));

    return requestsWithRequester;
  } catch (error) {
    console.error('Error getting follow requests:', error);
    return [];
  }
}

// Accept follow request
export async function acceptFollowRequest(requestId: string): Promise<boolean> {
  try {
    // Get the request details
    const { data: request, error: fetchError } = await supabase
      .from('follow_requests')
      .select('requester_id, requested_id')
      .eq('id', requestId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !request) {
      throw new Error('Follow request not found');
    }

    // Start a transaction-like operation
    // 1. Update request status
    const { error: updateError } = await supabase
      .from('follow_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (updateError) throw updateError;

    // 2. Create the follow relationship
    const { error: followError } = await supabase
      .from('follows')
      .insert({
        follower_id: request.requester_id,
        followed_id: request.requested_id,
      });

    if (followError) throw followError;

    return true;
  } catch (error) {
    console.error('Error accepting follow request:', error);
    return false;
  }
}

// Decline follow request
export async function declineFollowRequest(requestId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('follow_requests')
      .update({ status: 'declined' })
      .eq('id', requestId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error declining follow request:', error);
    return false;
  }
}

// Get user's own code
export async function getUserCode(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('user_codes')
      .select('code')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.code;
  } catch (error) {
    console.error('Error getting user code:', error);
    return null;
  }
}

/*
Additional Database Schema needed for user codes:

-- User Codes Table
CREATE TABLE user_codes (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Follow Requests Table
CREATE TABLE follow_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(requester_id, requested_id)
);

-- Indexes
CREATE INDEX idx_user_codes_code ON user_codes(code);
CREATE INDEX idx_follow_requests_requested_id ON follow_requests(requested_id);
CREATE INDEX idx_follow_requests_requester_id ON follow_requests(requester_id);
CREATE INDEX idx_follow_requests_status ON follow_requests(status);

-- RLS Policies
ALTER TABLE user_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_requests ENABLE ROW LEVEL SECURITY;

-- User codes policies
CREATE POLICY "Users can view all user codes" ON user_codes FOR SELECT USING (true);
CREATE POLICY "Users can manage their own code" ON user_codes FOR ALL USING (auth.uid() = user_id);

-- Follow requests policies
CREATE POLICY "Users can view their own requests" ON follow_requests 
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = requested_id);
CREATE POLICY "Users can create follow requests" ON follow_requests 
  FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update requests they received" ON follow_requests 
  FOR UPDATE USING (auth.uid() = requested_id);
*/