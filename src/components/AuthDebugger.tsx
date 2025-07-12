// Auth Debugger - Shows current auth state
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '../config/supabase';

interface AuthDebuggerProps {
  isDarkMode?: boolean;
}

export const AuthDebugger: React.FC<AuthDebuggerProps> = ({ isDarkMode = false }) => {
  const [authInfo, setAuthInfo] = useState<any>({});

  const checkAuthState = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      setAuthInfo({
        hasSession: !!session,
        hasUser: !!user,
        userEmail: user?.email || 'None',
        sessionError: sessionError?.message,
        userError: userError?.message,
        timestamp: new Date().toLocaleTimeString()
      });
      
      console.log('🔍 Auth Debug Info:', {
        hasSession: !!session,
        hasUser: !!user,
        userEmail: user?.email || 'None',
        sessionError: sessionError?.message,
        userError: userError?.message
      });
    } catch (error) {
      console.error('❌ Auth debug error:', error);
    }
  };

  useEffect(() => {
    checkAuthState();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth state change detected:', event, session?.user ? 'User present' : 'No user');
      checkAuthState();
    });

    return () => subscription.unsubscribe();
  }, []);

  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Auth Debug Info</Text>
      
      <View style={styles.infoRow}>
        <Text style={styles.label}>Session:</Text>
        <Text style={[styles.value, authInfo.hasSession ? styles.success : styles.error]}>
          {authInfo.hasSession ? '✅ Present' : '❌ Missing'}
        </Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.label}>User:</Text>
        <Text style={[styles.value, authInfo.hasUser ? styles.success : styles.error]}>
          {authInfo.hasUser ? '✅ Present' : '❌ Missing'}
        </Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{authInfo.userEmail}</Text>
      </View>
      
      {authInfo.sessionError && (
        <View style={styles.infoRow}>
          <Text style={styles.label}>Session Error:</Text>
          <Text style={styles.error}>{authInfo.sessionError}</Text>
        </View>
      )}
      
      {authInfo.userError && (
        <View style={styles.infoRow}>
          <Text style={styles.label}>User Error:</Text>
          <Text style={styles.error}>{authInfo.userError}</Text>
        </View>
      )}
      
      <View style={styles.infoRow}>
        <Text style={styles.label}>Last Check:</Text>
        <Text style={styles.value}>{authInfo.timestamp}</Text>
      </View>
      
      <TouchableOpacity style={styles.refreshButton} onPress={checkAuthState}>
        <Text style={styles.refreshText}>Refresh Auth State</Text>
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    right: 10,
    backgroundColor: isDarkMode ? '#2a2a2a' : '#ffffff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: isDarkMode ? '#444' : '#ddd',
    minWidth: 200,
    zIndex: 1000,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: isDarkMode ? '#fff' : '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: isDarkMode ? '#ccc' : '#666',
    minWidth: 60,
  },
  value: {
    fontSize: 12,
    color: isDarkMode ? '#fff' : '#000',
    flex: 1,
  },
  success: {
    color: '#4CAF50',
  },
  error: {
    color: '#F44336',
  },
  refreshButton: {
    marginTop: 8,
    backgroundColor: '#FF6B35',
    padding: 6,
    borderRadius: 4,
    alignItems: 'center',
  },
  refreshText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});