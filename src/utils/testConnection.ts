// Test if basic Supabase connection works
import { supabase } from '../config/supabase';

export const testSupabaseConnection = async () => {
  try {
    console.log('🔍 Testing basic Supabase connection...');
    
    // Test 1: Simple table query (fixed PostgREST syntax)
    const { data, error } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .limit(1);
    
    if (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
    
    console.log('✅ Basic connection works:', data);
    
    // Test 2: Try to insert a test record directly
    const testId = '00000000-0000-0000-0000-000000000999';
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: testId,
        email: 'connection-test@example.com',
        subscription_tier: 'free'
      });
    
    if (insertError && insertError.code !== '23505') {
      console.error('❌ Insert test failed:', insertError);
      return false;
    }
    
    // Clean up
    await supabase.from('users').delete().eq('id', testId);
    
    console.log('✅ Insert/delete test works');
    return true;
    
  } catch (error) {
    console.error('❌ Connection test exception:', error);
    return false;
  }
};