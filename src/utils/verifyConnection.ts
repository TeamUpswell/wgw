// Verify which Supabase project we're connected to
import { supabase } from '../config/supabase';

export const verifyConnection = async () => {
  try {
    console.log('🔍 Verifying Supabase connection...');
    
    // Check the URL from the client
    const url = (supabase as any).supabaseUrl;
    console.log('📍 Connected to:', url);
    
    if (url.includes('xtukypwzqnhqyufavenn')) {
      console.log('✅ Connected to NEW project');
    } else if (url.includes('nwitofekeafekjvafzln')) {
      console.log('❌ Still connected to OLD project - environment not updated');
    } else {
      console.log('❓ Connected to unknown project');
    }
    
    // Try to check if users table exists
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ Users table issue:', error.message);
      if (error.message.includes('does not exist')) {
        console.log('💡 Users table does not exist - run the minimal setup SQL!');
      }
    } else {
      console.log('✅ Users table accessible, count:', data?.length || 0);
    }
    
    return { url, error };
    
  } catch (err) {
    console.error('❌ Connection verification failed:', err);
    return { url: null, error: err };
  }
};