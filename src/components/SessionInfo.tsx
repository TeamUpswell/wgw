import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSessionRefresh } from '../services/sessionService';

interface SessionInfoProps {
  isDarkMode: boolean;
  showDebugInfo?: boolean;
}

export const SessionInfo: React.FC<SessionInfoProps> = ({ 
  isDarkMode, 
  showDebugInfo = false 
}) => {
  const { refreshSession, getSessionInfo } = useSessionRefresh();
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  const styles = getStyles(isDarkMode);

  const loadSessionInfo = async () => {
    const info = await getSessionInfo();
    setSessionInfo(info);
    setLastCheck(new Date());
  };

  useEffect(() => {
    loadSessionInfo();
    
    // Refresh info every 30 seconds
    const interval = setInterval(loadSessionInfo, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshSession();
      await loadSessionInfo();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!sessionInfo) {
    return null;
  }

  const getStatusColor = () => {
    if (sessionInfo.isExpired) return '#FF3B30';
    if (sessionInfo.needsRefresh) return '#FF9500';
    if (sessionInfo.minutesUntilExpiry < 30) return '#FFCC00';
    return '#34C759';
  };

  const getStatusText = () => {
    if (sessionInfo.isExpired) return 'Expired';
    if (sessionInfo.needsRefresh) return 'Needs Refresh';
    if (sessionInfo.minutesUntilExpiry < 30) return 'Expiring Soon';
    return 'Active';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <Text style={styles.statusText}>Session {getStatusText()}</Text>
        </View>
        
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color={isDarkMode ? '#fff' : '#000'} />
          ) : (
            <Ionicons name="refresh" size={20} color={isDarkMode ? '#fff' : '#000'} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Expires in:</Text>
          <Text style={[
            styles.value,
            sessionInfo.minutesUntilExpiry < 10 && styles.warningText
          ]}>
            {sessionInfo.minutesUntilExpiry > 0 
              ? `${sessionInfo.minutesUntilExpiry} minutes`
              : 'Expired'
            }
          </Text>
        </View>

        {showDebugInfo && (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.label}>User:</Text>
              <Text style={styles.value} numberOfLines={1}>
                {sessionInfo.user?.email || 'Unknown'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Last Check:</Text>
              <Text style={styles.value}>
                {lastCheck.toLocaleTimeString()}
              </Text>
            </View>
          </>
        )}
      </View>

      {sessionInfo.needsRefresh && !sessionInfo.isExpired && (
        <View style={styles.warningContainer}>
          <Ionicons name="warning" size={16} color="#FF9500" />
          <Text style={styles.warningMessage}>
            Session will expire soon. Tap refresh to extend.
          </Text>
        </View>
      )}
    </View>
  );
};

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: isDarkMode ? '#2a2a2a' : '#f8f8f8',
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 8,
    },
    statusText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode ? '#fff' : '#000',
    },
    refreshButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDarkMode ? '#3a3a3a' : '#e0e0e0',
    },
    infoContainer: {
      gap: 8,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    label: {
      fontSize: 14,
      color: isDarkMode ? '#aaa' : '#666',
    },
    value: {
      fontSize: 14,
      fontWeight: '500',
      color: isDarkMode ? '#fff' : '#000',
      flex: 1,
      textAlign: 'right',
    },
    warningText: {
      color: '#FF9500',
      fontWeight: '600',
    },
    warningContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      padding: 12,
      backgroundColor: isDarkMode ? '#3a3a3a' : '#FFF3CD',
      borderRadius: 8,
      gap: 8,
    },
    warningMessage: {
      flex: 1,
      fontSize: 13,
      color: isDarkMode ? '#FFCC00' : '#856404',
    },
  });