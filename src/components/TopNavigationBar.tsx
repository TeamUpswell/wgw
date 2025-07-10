import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserProfile } from '../hooks/useUserProfile';

interface TopNavigationBarProps {
  user: any;
  title?: string;
  onProfilePress: () => void;
  onBackPress?: () => void;
  showBackButton?: boolean;
  isDarkMode?: boolean;
}

export const TopNavigationBar: React.FC<TopNavigationBarProps> = ({
  user,
  title = '',
  onProfilePress,
  onBackPress,
  showBackButton = false,
  isDarkMode = false,
}) => {
  const styles = getStyles(isDarkMode);
  const { profile } = useUserProfile(user?.id);
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.leftSection}>
          {showBackButton ? (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={onBackPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color={isDarkMode ? "#fff" : "#333"} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.avatarButton}
              onPress={onProfilePress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={20} color="#999" />
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.centerSection}>
          {title && <Text style={styles.title}>{title}</Text>}
        </View>

        <View style={styles.rightSection}>
          {/* Reserved for future actions like notifications, etc. */}
        </View>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  safeArea: {
    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? '#3a3a3a' : '#e0e0e0',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 56,
  },
  leftSection: {
    width: 40,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    width: 40,
    alignItems: 'flex-end',
  },
  avatarButton: {
    borderRadius: 20,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    padding: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: isDarkMode ? '#fff' : '#333',
  },
});