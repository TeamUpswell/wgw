import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../config/supabase';
import { sessionManager } from '../services/sessionService';
import { useDispatch } from 'react-redux';
import { clearAuth } from '../store/authSlice';

interface UseSessionMonitorOptions {
  // Show alerts for session events
  showAlerts?: boolean;
  // Custom callback for session expiry
  onSessionExpired?: () => void;
  // Custom callback for session refresh
  onSessionRefreshed?: () => void;
}

export const useSessionMonitor = (options: UseSessionMonitorOptions = {}) => {
  const dispatch = useDispatch();
  const [sessionStatus, setSessionStatus] = useState<'active' | 'refreshing' | 'expired'>('active');
  const [minutesUntilExpiry, setMinutesUntilExpiry] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      if (!mounted) return;
      
      const info = await sessionManager.getSessionInfo();
      
      if (info) {
        setMinutesUntilExpiry(info.minutesUntilExpiry);
        
        if (info.isExpired) {
          setSessionStatus('expired');
          
          if (options.onSessionExpired) {
            options.onSessionExpired();
          }
          
          if (options.showAlerts) {
            Alert.alert(
              'Session Expired',
              'Your session has expired. Please log in again.',
              [{ text: 'OK', onPress: () => dispatch(clearAuth()) }]
            );
          }
        } else if (info.needsRefresh) {
          setSessionStatus('refreshing');
        } else {
          setSessionStatus('active');
        }
      }
    };

    // Initial check
    checkSession();

    // Set up interval
    const interval = setInterval(checkSession, 30000); // Check every 30 seconds

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return;
      
      if (event === 'TOKEN_REFRESHED') {
        setSessionStatus('active');
        
        if (options.onSessionRefreshed) {
          options.onSessionRefreshed();
        }
        
        if (options.showAlerts) {
          Alert.alert('Session Refreshed', 'Your session has been extended.');
        }
      } else if (event === 'SIGNED_OUT') {
        setSessionStatus('expired');
      }
    });

    return () => {
      mounted = false;
      clearInterval(interval);
      subscription?.unsubscribe();
    };
  }, [options.showAlerts, options.onSessionExpired, options.onSessionRefreshed]);

  const refreshSession = async () => {
    setSessionStatus('refreshing');
    await sessionManager.forceRefresh();
    const info = await sessionManager.getSessionInfo();
    
    if (info && !info.isExpired) {
      setSessionStatus('active');
      setMinutesUntilExpiry(info.minutesUntilExpiry);
    }
  };

  return {
    sessionStatus,
    minutesUntilExpiry,
    refreshSession,
    isExpiringSoon: minutesUntilExpiry !== null && minutesUntilExpiry < 10,
  };
};