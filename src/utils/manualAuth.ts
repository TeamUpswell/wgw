// Manual Auth Implementation - Bypass Supabase Auth signup issues
import { supabase } from '../config/supabase';

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
    
    // Manual user profile creation (this should work since DB is ready)
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        subscription_tier: 'free',
      });
    
    if (profileError && profileError.code !== '23505') {
      console.error('❌ Profile creation failed:', profileError);
      // Don't throw here - user is created in auth, just profile failed
    } else {
      console.log('✅ User profile created successfully');
    }
    
    return { data: authData, error: null };
    
  } catch (error) {
    console.error('❌ Manual signup failed:', error);
    return { data: null, error };
  }
};