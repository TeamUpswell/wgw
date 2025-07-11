import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Import DateTimePicker conditionally to handle missing dependency
let DateTimePicker: any = null;
try {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch (error) {
  console.warn('DateTimePicker not available:', error);
}
import { NotificationService, NotificationSettings } from '../services/notificationService';
import { TopNavigationBar } from '../components/TopNavigationBar';

interface NotificationSettingsScreenProps {
  user: any;
  isDarkMode?: boolean;
  onBack: () => void;
}

export const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = ({
  user,
  isDarkMode = false,
  onBack,
}) => {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());

  const styles = getStyles(isDarkMode);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const userSettings = await NotificationService.getNotificationSettings(user.id);
      
      if (userSettings) {
        setSettings(userSettings);
        // Parse time string to Date object for picker
        if (userSettings.daily_reminder_time) {
          const [hours, minutes] = userSettings.daily_reminder_time.split(':');
          const timeDate = new Date();
          timeDate.setHours(parseInt(hours, 10));
          timeDate.setMinutes(parseInt(minutes, 10));
          setTempTime(timeDate);
        }
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
      Alert.alert('Error', 'Failed to load notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: keyof NotificationSettings, value: any) => {
    if (!settings) return;

    const updatedSettings = { ...settings, [key]: value };
    setSettings(updatedSettings);

    try {
      setIsSaving(true);
      const success = await NotificationService.updateNotificationSettings(user.id, { [key]: value });
      
      if (!success) {
        // Revert on failure
        setSettings(settings);
        Alert.alert('Error', 'Failed to update setting');
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      setSettings(settings);
      Alert.alert('Error', 'Failed to update setting');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    if (selectedTime) {
      setTempTime(selectedTime);
      
      if (Platform.OS === 'android') {
        // Update immediately on Android
        const timeString = `${selectedTime.getHours().toString().padStart(2, '0')}:${selectedTime.getMinutes().toString().padStart(2, '0')}:00`;
        updateSetting('daily_reminder_time', timeString);
      }
    }
  };

  const confirmTimeChange = () => {
    const timeString = `${tempTime.getHours().toString().padStart(2, '0')}:${tempTime.getMinutes().toString().padStart(2, '0')}:00`;
    updateSetting('daily_reminder_time', timeString);
    setShowTimePicker(false);
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const registerForNotifications = async () => {
    try {
      const success = await NotificationService.registerPushToken(user.id);
      if (success) {
        Alert.alert('Success', 'Notifications have been enabled for this device');
        loadSettings(); // Refresh to show updated token
      } else {
        Alert.alert('Error', 'Failed to enable notifications. Please check your device settings.');
      }
    } catch (error) {
      console.error('Error registering for notifications:', error);
      Alert.alert('Error', 'Failed to enable notifications');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <TopNavigationBar
          user={user}
          title="Notification Settings"
          showBackButton={true}
          onBackPress={onBack}
          isDarkMode={isDarkMode}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!settings) {
    return (
      <SafeAreaView style={styles.container}>
        <TopNavigationBar
          user={user}
          title="Notification Settings"
          showBackButton={true}
          onBackPress={onBack}
          isDarkMode={isDarkMode}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load notification settings</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadSettings}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TopNavigationBar
        user={user}
        title="Notification Settings"
        showBackButton={true}
        onBackPress={onBack}
        isDarkMode={isDarkMode}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Push Notifications Setup */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Push Notifications</Text>
          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications" size={24} color="#FF6B35" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Enable Push Notifications</Text>
                <Text style={styles.settingDescription}>
                  {settings.push_token ? 'Notifications are enabled' : 'Tap to enable notifications'}
                </Text>
              </View>
            </View>
            {!settings.push_token && (
              <TouchableOpacity style={styles.enableButton} onPress={registerForNotifications}>
                <Text style={styles.enableButtonText}>Enable</Text>
              </TouchableOpacity>
            )}
            {settings.push_token && (
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            )}
          </View>
        </View>

        {/* Daily Reminders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Reminders</Text>
          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <Ionicons name="alarm" size={24} color="#FF6B35" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Daily Reminder</Text>
                <Text style={styles.settingDescription}>
                  Remind me to log my daily gratitude
                </Text>
              </View>
            </View>
            <Switch
              value={settings.daily_reminder_enabled}
              onValueChange={(value) => updateSetting('daily_reminder_enabled', value)}
              trackColor={{ false: '#767577', true: '#FF6B35' }}
              thumbColor={settings.daily_reminder_enabled ? '#fff' : '#f4f3f4'}
            />
          </View>

          {settings.daily_reminder_enabled && (
            <TouchableOpacity style={styles.timeCard} onPress={() => setShowTimePicker(true)}>
              <View style={styles.settingInfo}>
                <Ionicons name="time" size={24} color="#FF6B35" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Reminder Time</Text>
                  <Text style={styles.settingDescription}>
                    {formatTime(settings.daily_reminder_time)}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDarkMode ? "#666" : "#999"} />
            </TouchableOpacity>
          )}
        </View>

        {/* Social Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social Notifications</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <Ionicons name="people" size={24} color="#FF6B35" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Friend Activity</Text>
                <Text style={styles.settingDescription}>
                  When friends you follow post new entries
                </Text>
              </View>
            </View>
            <Switch
              value={settings.friend_entry_notifications}
              onValueChange={(value) => updateSetting('friend_entry_notifications', value)}
              trackColor={{ false: '#767577', true: '#FF6B35' }}
              thumbColor={settings.friend_entry_notifications ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <Ionicons name="chatbubble" size={24} color="#FF6B35" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Comments</Text>
                <Text style={styles.settingDescription}>
                  When someone comments on your entries
                </Text>
              </View>
            </View>
            <Switch
              value={settings.comment_notifications}
              onValueChange={(value) => updateSetting('comment_notifications', value)}
              trackColor={{ false: '#767577', true: '#FF6B35' }}
              thumbColor={settings.comment_notifications ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <Ionicons name="heart" size={24} color="#FF6B35" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Likes</Text>
                <Text style={styles.settingDescription}>
                  When someone likes your entries
                </Text>
              </View>
            </View>
            <Switch
              value={settings.like_notifications}
              onValueChange={(value) => updateSetting('like_notifications', value)}
              trackColor={{ false: '#767577', true: '#FF6B35' }}
              thumbColor={settings.like_notifications ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <Ionicons name="person-add" size={24} color="#FF6B35" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Follow Requests</Text>
                <Text style={styles.settingDescription}>
                  When someone wants to follow you
                </Text>
              </View>
            </View>
            <Switch
              value={settings.follow_request_notifications}
              onValueChange={(value) => updateSetting('follow_request_notifications', value)}
              trackColor={{ false: '#767577', true: '#FF6B35' }}
              thumbColor={settings.follow_request_notifications ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Weekly & Monthly Summaries */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summaries</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <Ionicons name="calendar" size={24} color="#FF6B35" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Weekly Summary</Text>
                <Text style={styles.settingDescription}>
                  Weekly reflection on your gratitude journey
                </Text>
              </View>
            </View>
            <Switch
              value={settings.weekly_summary_enabled}
              onValueChange={(value) => updateSetting('weekly_summary_enabled', value)}
              trackColor={{ false: '#767577', true: '#FF6B35' }}
              thumbColor={settings.weekly_summary_enabled ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <Ionicons name="calendar-outline" size={24} color="#FF6B35" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Monthly Summary</Text>
                <Text style={styles.settingDescription}>
                  Monthly insights and progress report
                </Text>
              </View>
            </View>
            <Switch
              value={settings.monthly_summary_enabled}
              onValueChange={(value) => updateSetting('monthly_summary_enabled', value)}
              trackColor={{ false: '#767577', true: '#FF6B35' }}
              thumbColor={settings.monthly_summary_enabled ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Streak Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Streak Notifications</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <Ionicons name="trophy" size={24} color="#FF6B35" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Streak Milestones</Text>
                <Text style={styles.settingDescription}>
                  Celebrate when you reach streak milestones
                </Text>
              </View>
            </View>
            <Switch
              value={settings.streak_milestone_notifications}
              onValueChange={(value) => updateSetting('streak_milestone_notifications', value)}
              trackColor={{ false: '#767577', true: '#FF6B35' }}
              thumbColor={settings.streak_milestone_notifications ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <Ionicons name="warning" size={24} color="#FF6B35" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Streak Reminders</Text>
                <Text style={styles.settingDescription}>
                  Gentle reminders to maintain your streak
                </Text>
              </View>
            </View>
            <Switch
              value={settings.streak_broken_notifications}
              onValueChange={(value) => updateSetting('streak_broken_notifications', value)}
              trackColor={{ false: '#767577', true: '#FF6B35' }}
              thumbColor={settings.streak_broken_notifications ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Time Picker Modal */}
      {showTimePicker && (
        <View style={styles.timePickerContainer}>
          <View style={styles.timePickerModal}>
            <View style={styles.timePickerHeader}>
              <Text style={styles.timePickerTitle}>Set Reminder Time</Text>
            </View>
            {DateTimePicker ? (
              <DateTimePicker
                value={tempTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'wheels' : 'default'}
                onChange={handleTimeChange}
                style={styles.timePicker}
              />
            ) : (
              <Text style={styles.errorText}>Date picker not available</Text>
            )}
            {Platform.OS === 'ios' && (
              <View style={styles.timePickerButtons}>
                <TouchableOpacity
                  style={styles.timePickerButton}
                  onPress={() => setShowTimePicker(false)}
                >
                  <Text style={styles.timePickerButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.timePickerButton, styles.timePickerConfirmButton]}
                  onPress={confirmTimeChange}
                >
                  <Text style={[styles.timePickerButtonText, styles.timePickerConfirmText]}>Confirm</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}

      {isSaving && (
        <View style={styles.savingOverlay}>
          <Text style={styles.savingText}>Saving...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? "#1a1a1a" : "#f8f9fa",
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      fontSize: 16,
      color: isDarkMode ? "#888" : "#666",
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    errorText: {
      fontSize: 16,
      color: isDarkMode ? "#888" : "#666",
      textAlign: "center",
      marginBottom: 20,
    },
    retryButton: {
      backgroundColor: "#FF6B35",
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    retryButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: isDarkMode ? "#fff" : "#333",
      marginBottom: 12,
      marginTop: 8,
    },
    settingCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: isDarkMode ? "#3a3a3a" : "#e0e0e0",
    },
    timeCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: isDarkMode ? "#3a3a3a" : "#e0e0e0",
      marginLeft: 16,
    },
    settingInfo: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    settingText: {
      marginLeft: 12,
      flex: 1,
    },
    settingLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: isDarkMode ? "#fff" : "#333",
      marginBottom: 2,
    },
    settingDescription: {
      fontSize: 14,
      color: isDarkMode ? "#888" : "#666",
      lineHeight: 18,
    },
    enableButton: {
      backgroundColor: "#FF6B35",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    enableButtonText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
    },
    timePickerContainer: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    timePickerModal: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderRadius: 16,
      margin: 20,
      minWidth: 300,
    },
    timePickerHeader: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? "#3a3a3a" : "#e0e0e0",
    },
    timePickerTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: isDarkMode ? "#fff" : "#333",
      textAlign: "center",
    },
    timePicker: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
    },
    timePickerButtons: {
      flexDirection: "row",
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? "#3a3a3a" : "#e0e0e0",
    },
    timePickerButton: {
      flex: 1,
      padding: 16,
      alignItems: "center",
    },
    timePickerConfirmButton: {
      borderLeftWidth: 1,
      borderLeftColor: isDarkMode ? "#3a3a3a" : "#e0e0e0",
    },
    timePickerButtonText: {
      fontSize: 16,
      color: isDarkMode ? "#888" : "#666",
    },
    timePickerConfirmText: {
      color: "#FF6B35",
      fontWeight: "600",
    },
    savingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.3)",
      justifyContent: "center",
      alignItems: "center",
    },
    savingText: {
      fontSize: 16,
      color: "#fff",
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    bottomPadding: {
      height: 20,
    },
  });