import { supabase } from '../config/supabase';
import { store } from '../store';
import { setUser, clearAuth, setLoading } from '../store/authSlice';
import { ensureUserProfile } from './userProfileService';

interface SessionConfig {
  // Refresh session when it has less than this many minutes left
  refreshThresholdMinutes: number;
  // Check session validity every X minutes
  checkIntervalMinutes: number;
  // Retry failed refreshes
  maxRefreshRetries: number;
}

const DEFAULT_CONFIG: SessionConfig = {
  refreshThresholdMinutes: 10, // Refresh when less than 10 minutes left
  checkIntervalMinutes: 5, // Check every 5 minutes
  maxRefreshRetries: 3,
};

class SessionManager {
  private checkInterval: NodeJS.Timeout | null = null;
  private config: SessionConfig;
  private isRefreshing = false;
  private lastRefreshTime = 0;

  constructor(config: SessionConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  /**
   * Start monitoring the session
   */
  startSessionMonitoring() {
    console.log('🔐 Starting session monitoring...');
    
    // Initial check
    this.checkAndRefreshSession();
    
    // Stop any existing interval
    this.stopSessionMonitoring();
    
    // Set up periodic checks
    this.checkInterval = setInterval(
      () => this.checkAndRefreshSession(),
      this.config.checkIntervalMinutes * 60 * 1000
    );
  }

  /**
   * Stop monitoring the session
   */
  stopSessionMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('🔐 Stopped session monitoring');
    }
  }

  /**
   * Check session validity and refresh if needed
   */
  async checkAndRefreshSession() {
    try {
      // Prevent concurrent refresh attempts
      if (this.isRefreshing) {
        console.log('🔄 Session refresh already in progress...');
        return;
      }

      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Error getting session:', error);
        return;
      }

      if (!session) {
        console.log('📝 No active session found');
        store.dispatch(clearAuth());
        return;
      }

      // Check if session needs refresh
      const expiresAt = session.expires_at;
      if (!expiresAt) return;

      const expiresAtMs = expiresAt * 1000; // Convert to milliseconds
      const now = Date.now();
      const timeUntilExpiry = expiresAtMs - now;
      const minutesUntilExpiry = timeUntilExpiry / (1000 * 60);

      console.log(`⏰ Session expires in ${Math.round(minutesUntilExpiry)} minutes`);

      // Refresh if approaching expiry
      if (minutesUntilExpiry < this.config.refreshThresholdMinutes) {
        await this.refreshSession();
      }
    } catch (error) {
      console.error('❌ Session check error:', error);
    }
  }

  /**
   * Refresh the current session
   */
  async refreshSession() {
    // Prevent refresh spam
    const now = Date.now();
    const timeSinceLastRefresh = now - this.lastRefreshTime;
    if (timeSinceLastRefresh < 60000) { // Less than 1 minute
      console.log('⏳ Skipping refresh - too soon since last refresh');
      return;
    }

    this.isRefreshing = true;
    let retries = this.config.maxRefreshRetries;

    while (retries > 0) {
      try {
        console.log('🔄 Refreshing session...');
        
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) throw error;
        
        if (data.session && data.user) {
          console.log('✅ Session refreshed successfully');
          this.lastRefreshTime = Date.now();
          
          // Ensure user profile exists
          await ensureUserProfile(data.user.id, data.user.email || '');
          
          // Update Redux store
          const mappedUser = {
            id: data.user.id,
            email: data.user.email || '',
            created_at: data.user.created_at || new Date().toISOString(),
          };
          store.dispatch(setUser(mappedUser));
          
          break;
        }
      } catch (error: any) {
        retries--;
        console.error(`❌ Session refresh failed (${retries} retries left):`, error);
        
        if (retries === 0) {
          // Final failure - clear auth
          console.error('❌ Session refresh failed after all retries');
          
          // Special handling for specific errors
          if (error.message?.includes('refresh_token_not_found')) {
            console.log('🔐 Refresh token expired - user needs to login again');
            store.dispatch(clearAuth());
          }
        } else {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    this.isRefreshing = false;
  }

  /**
   * Manually trigger a session refresh
   */
  async forceRefresh() {
    console.log('🔄 Force refreshing session...');
    await this.refreshSession();
  }

  /**
   * Get current session info
   */
  async getSessionInfo() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        return null;
      }

      const expiresAt = session.expires_at;
      const expiresAtMs = expiresAt ? expiresAt * 1000 : 0;
      const now = Date.now();
      const timeUntilExpiry = expiresAtMs - now;
      const minutesUntilExpiry = timeUntilExpiry / (1000 * 60);

      return {
        user: session.user,
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: new Date(expiresAtMs),
        minutesUntilExpiry: Math.round(minutesUntilExpiry),
        isExpired: timeUntilExpiry <= 0,
        needsRefresh: minutesUntilExpiry < this.config.refreshThresholdMinutes,
      };
    } catch (error) {
      console.error('❌ Error getting session info:', error);
      return null;
    }
  }
}

// Create singleton instance
export const sessionManager = new SessionManager();

// Helper hooks for React components
export const useSessionRefresh = () => {
  return {
    refreshSession: () => sessionManager.forceRefresh(),
    getSessionInfo: () => sessionManager.getSessionInfo(),
  };
};