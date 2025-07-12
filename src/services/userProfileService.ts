import { supabase } from '../config/supabase';

export interface UserProfile {
  id: string;
  email: string;
  subscription_tier: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Creates or ensures a user profile exists.
 * This is idempotent - safe to call multiple times.
 * Uses upsert to avoid race conditions and duplicates.
 */
export const ensureUserProfile = async (userId: string, email: string) => {
  try {
    console.log('🔄 Ensuring user profile exists for:', userId);
    
    // First, check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (existingProfile) {
      console.log('✅ User profile already exists');
      return { data: existingProfile, error: null };
    }
    
    // If not exists, create it with retry logic
    let retries = 3;
    let lastError = null;
    
    while (retries > 0) {
      const { data, error } = await supabase
        .from('users')
        .upsert({
          id: userId,
          email: email,
          subscription_tier: 'free',
        }, {
          onConflict: 'id',
          ignoreDuplicates: true
        })
        .select()
        .single();
      
      if (!error) {
        console.log('✅ User profile created/updated successfully');
        return { data, error: null };
      }
      
      // Handle specific errors
      if (error.code === '23505') { // Duplicate key
        console.log('ℹ️ Profile already exists (handled race condition)');
        // Try to fetch the existing profile
        const { data: existing } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (existing) {
          return { data: existing, error: null };
        }
      }
      
      lastError = error;
      retries--;
      
      if (retries > 0) {
        console.log(`⏳ Retrying profile creation... (${retries} attempts left)`);
        // Small delay before retry
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.error('❌ Failed to create profile after all retries:', lastError);
    return { data: null, error: lastError };
    
  } catch (error) {
    console.error('❌ Unexpected error in ensureUserProfile:', error);
    return { data: null, error };
  }
};

/**
 * Checks if a user profile exists
 */
export const checkUserProfileExists = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
    
    return !error && !!data;
  } catch {
    return false;
  }
};