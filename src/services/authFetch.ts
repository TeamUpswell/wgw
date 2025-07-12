import { supabase } from '../config/supabase';
import { sessionManager } from './sessionService';

/**
 * Wrapper for authenticated API calls that handles session refresh
 */
export async function authFetch(url: string, options: RequestInit = {}) {
  try {
    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      throw new Error('No active session');
    }

    // Check if session needs refresh
    const sessionInfo = await sessionManager.getSessionInfo();
    if (sessionInfo?.needsRefresh) {
      console.log('🔄 Refreshing session before API call...');
      await sessionManager.forceRefresh();
      
      // Get fresh session after refresh
      const { data: { session: freshSession } } = await supabase.auth.getSession();
      if (!freshSession) {
        throw new Error('Failed to refresh session');
      }
    }

    // Add auth header
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${session.access_token}`,
    };

    // Make the request
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized
    if (response.status === 401) {
      console.log('🔄 Got 401, attempting session refresh...');
      await sessionManager.forceRefresh();
      
      // Retry with fresh token
      const { data: { session: newSession } } = await supabase.auth.getSession();
      if (newSession) {
        const retryResponse = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${newSession.access_token}`,
          },
        });
        return retryResponse;
      }
    }

    return response;
  } catch (error) {
    console.error('❌ authFetch error:', error);
    throw error;
  }
}

/**
 * Helper to get current auth headers
 */
export async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('No active session');
  }

  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}