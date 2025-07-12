// Manual Auth Implementation - Bypass Supabase Auth signup issues
import { supabase } from '../config/supabase';
import { ensureUserProfile } from '../services/userProfileService';

export const manualSignup = async (email: string, password: string) => {
  try {
    console.log('🔧 Attempting manual signup bypass...');
    
    // Try the regular Supabase auth first
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined,
      }
    });
    
    if (authError) {
      console.error('❌ Supabase Auth failed:', authError);
      throw authError;
    }
    
    if (!authData.user) {
      throw new Error('No user data returned from signup');
    }
    
    console.log('✅ Auth signup successful:', authData.user.id);
    
    // Use centralized profile creation service to handle race conditions
    const { error: profileError } = await ensureUserProfile(
      authData.user.id,
      authData.user.email || ''
    );
    
    if (profileError) {
      console.error('⚠️ Profile creation had issues:', profileError);
      // Don't throw here - user is created in auth, profile might exist from trigger
    }
    
    return { data: authData, error: null };
    
  } catch (error) {
    console.error('❌ Manual signup failed:', error);
    return { data: null, error };
  }
};