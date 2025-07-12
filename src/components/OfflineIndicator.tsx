import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { RootState } from '../store';

interface OfflineIndicatorProps {
  isDarkMode?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ isDarkMode = false }) => {
  const { isOnline, pendingActions, syncStatus } = useSelector((state: RootState) => state.offline);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isOnline || pendingActions.length > 0) {
      // Slide in
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Pulse animation for sync status
      if (syncStatus === 'syncing') {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.2,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    } else {
      // Slide out
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOnline, pendingActions.length, syncStatus]);

  if (isOnline && pendingActions.length === 0) {
    return null;
  }

  const backgroundColor = !isOnline 
    ? '#FF6B35' 
    : syncStatus === 'syncing' 
      ? '#4CAF50' 
      : '#FFA726';

  const message = !isOnline
    ? 'Offline Mode'
    : syncStatus === 'syncing'
      ? `Syncing ${pendingActions.length} item${pendingActions.length !== 1 ? 's' : ''}...`
      : `${pendingActions.length} item${pendingActions.length !== 1 ? 's' : ''} pending`;

  return (
    <Animated.View 
      style={[
        styles.container,
        { 
          transform: [{ translateY: slideAnim }],
          backgroundColor,
        }
      ]}
    >
      <View style={styles.content}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Ionicons 
            name={!isOnline ? 'cloud-offline' : syncStatus === 'syncing' ? 'sync' : 'time-outline'} 
            size={20} 
            color="#fff" 
          />
        </Animated.View>
        <Text style={styles.text}>{message}</Text>
        {pendingActions.length > 0 && isOnline && syncStatus !== 'syncing' && (
          <TouchableOpacity 
            onPress={() => {
              // Trigger manual sync
              import('../services/offlineSyncService').then(({ syncOfflineQueue }) => {
                syncOfflineQueue();
              });
            }}
          >
            <Text style={styles.syncButton}>Sync Now</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: 50, // Account for status bar
    paddingBottom: 10,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  },
  syncButton: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 15,
    textDecorationLine: 'underline',
  },
});