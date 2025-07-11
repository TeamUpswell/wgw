import { supabase } from '../config/supabase';
import { Platform } from 'react-native';

// Import packages with try-catch to handle missing dependencies gracefully
let Notifications: any = null;
let Device: any = null;

try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');
} catch (error) {
  console.warn('Notification packages not available:', error);
}

export interface NotificationSettings {
  user_id: string;
  daily_reminder_enabled: boolean;
  daily_reminder_time: string; // HH:MM:SS format
  daily_reminder_timezone: string;
  friend_entry_notifications: boolean;
  comment_notifications: boolean;
  like_notifications: boolean;
  follow_request_notifications: boolean;
  weekly_summary_enabled: boolean;
  weekly_summary_day: number;
  weekly_summary_time: string;
  monthly_summary_enabled: boolean;
  monthly_summary_day: number;
  monthly_summary_time: string;
  streak_milestone_notifications: boolean;
  streak_broken_notifications: boolean;
  push_token?: string;
  push_token_updated_at?: string;
}

export interface NotificationData {
  id?: string;
  user_id: string;
  notification_type: 'daily_reminder' | 'friend_entry' | 'comment' | 'like' | 'follow_request' | 'weekly_summary' | 'monthly_summary' | 'streak_milestone' | 'streak_broken';
  title: string;
  body: string;
  data?: any;
  scheduled_for?: string;
  status?: 'pending' | 'sent' | 'failed' | 'cancelled';
}

// Configure notification behavior
if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export class NotificationService {
  
  // Initialize notifications and request permissions
  static async initialize(): Promise<string | null> {
    if (!Notifications || !Device) {
      console.log('Notification packages not available');
      return null;
    }
    
    if (!Device.isDevice) {
      console.log('Notifications only work on physical devices');
      return null;
    }

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Notification permissions not granted');
      return null;
    }

    // Get push token
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Push token:', token);
    
    return token;
  }

  // Register push token for user
  static async registerPushToken(userId: string): Promise<boolean> {
    try {
      const token = await this.initialize();
      
      if (!token) {
        return false;
      }

      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: userId,
          push_token: token,
          push_token_updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error registering push token:', error);
      return false;
    }
  }

  // Get user's notification settings
  static async getNotificationSettings(userId: string): Promise<NotificationSettings | null> {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return null;
    }
  }

  // Update user's notification settings
  static async updateNotificationSettings(userId: string, settings: Partial<NotificationSettings>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: userId,
          ...settings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      
      // If daily reminder settings changed, reschedule reminders
      if (settings.daily_reminder_enabled !== undefined || settings.daily_reminder_time !== undefined) {
        await this.scheduleDailyReminders(userId);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      return false;
    }
  }

  // Schedule daily reminders for a user
  static async scheduleDailyReminders(userId: string, daysAhead: number = 7): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('schedule_daily_reminders', {
        target_user_id: userId,
        days_ahead: daysAhead,
      });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error scheduling daily reminders:', error);
      return 0;
    }
  }

  // Mark that user logged an entry (cancels reminder for that day)
  static async markEntryLogged(userId: string, entryDate?: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('mark_entry_logged', {
        target_user_id: userId,
        entry_date: entryDate || new Date().toISOString().split('T')[0],
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error marking entry as logged:', error);
      return false;
    }
  }

  // Queue a social notification
  static async queueSocialNotification(
    targetUserId: string,
    type: 'friend_entry' | 'comment' | 'like' | 'follow_request',
    title: string,
    body: string,
    data: any = {}
  ): Promise<string | null> {
    try {
      const { data: notificationId, error } = await supabase.rpc('queue_social_notification', {
        target_user_id: targetUserId,
        notif_type: type,
        notif_title: title,
        notif_body: body,
        notif_data: data,
      });

      if (error) throw error;
      return notificationId;
    } catch (error) {
      console.error('Error queueing social notification:', error);
      return null;
    }
  }

  // Send notification when friend posts an entry
  static async notifyFriendEntry(friendUserId: string, entryContent: string, authorName: string): Promise<void> {
    try {
      // Get all users who follow this friend
      const { data: followers, error } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('followed_id', friendUserId);

      if (error) throw error;

      // Queue notifications for each follower
      for (const follower of followers || []) {
        await this.queueSocialNotification(
          follower.follower_id,
          'friend_entry',
          'New entry from a friend!',
          `${authorName} just shared: "${entryContent.substring(0, 100)}${entryContent.length > 100 ? '...' : ''}"`,
          { entry_author: friendUserId, entry_content: entryContent }
        );
      }
    } catch (error) {
      console.error('Error notifying friend entry:', error);
    }
  }

  // Send notification when someone comments on user's entry
  static async notifyComment(entryOwnerId: string, commenterName: string, comment: string, entryId: string): Promise<void> {
    await this.queueSocialNotification(
      entryOwnerId,
      'comment',
      'New comment on your entry!',
      `${commenterName} commented: "${comment.substring(0, 100)}${comment.length > 100 ? '...' : ''}"`,
      { entry_id: entryId, commenter_name: commenterName }
    );
  }

  // Send notification when someone likes user's entry
  static async notifyLike(entryOwnerId: string, likerName: string, entryContent: string, entryId: string): Promise<void> {
    await this.queueSocialNotification(
      entryOwnerId,
      'like',
      'Someone liked your entry!',
      `${likerName} liked your entry: "${entryContent.substring(0, 100)}${entryContent.length > 100 ? '...' : ''}"`,
      { entry_id: entryId, liker_name: likerName }
    );
  }

  // Send notification when someone sends a follow request
  static async notifyFollowRequest(targetUserId: string, requesterName: string, requesterId: string): Promise<void> {
    await this.queueSocialNotification(
      targetUserId,
      'follow_request',
      'New follow request!',
      `${requesterName} wants to follow you`,
      { requester_id: requesterId, requester_name: requesterName }
    );
  }

  // Schedule local notifications (for when user is offline)
  static async scheduleLocalNotification(title: string, body: string, scheduledTime: Date, data?: any): Promise<string> {
    if (!Notifications) {
      console.log('Notifications not available');
      return '';
    }
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: {
        date: scheduledTime,
      },
    });

    return notificationId;
  }

  // Cancel scheduled local notification
  static async cancelLocalNotification(notificationId: string): Promise<void> {
    if (!Notifications) return;
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  // Get pending notification queue for user
  static async getPendingNotifications(userId: string): Promise<NotificationData[]> {
    try {
      const { data, error } = await supabase
        .from('notification_queue')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('scheduled_for', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting pending notifications:', error);
      return [];
    }
  }

  // Get notification history for user
  static async getNotificationHistory(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('notification_history')
        .select('*')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting notification history:', error);
      return [];
    }
  }

  // Generate encouraging daily reminder messages
  static getDailyReminderMessage(): { title: string; body: string } {
    const messages = [
      {
        title: "Time for gratitude! 🌟",
        body: "What went well for you today? Even small moments count!"
      },
      {
        title: "Your daily reflection awaits ✨",
        body: "Take a moment to celebrate something positive from today"
      },
      {
        title: "What's going well? 🌈",
        body: "Share your gratitude and keep your positive streak going"
      },
      {
        title: "Gratitude check-in 💫",
        body: "What made you smile today? Let's capture that moment!"
      },
      {
        title: "Your happiness matters 🌻",
        body: "Record something that brought you joy today"
      },
      {
        title: "Daily positivity reminder 🌸",
        body: "What are you grateful for right now?"
      },
      {
        title: "Time to shine! ⭐",
        body: "Share what went well today and inspire others"
      }
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  // Handle notification response (when user taps notification)
  static setupNotificationResponseHandler(): void {
    if (!Notifications) return;
    
    Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      // Handle different notification types
      switch (data?.notification_type) {
        case 'friend_entry':
          // Navigate to social feed or specific entry
          console.log('Navigate to friend entry:', data);
          break;
        case 'comment':
          // Navigate to entry with comments
          console.log('Navigate to commented entry:', data);
          break;
        case 'like':
          // Navigate to liked entry
          console.log('Navigate to liked entry:', data);
          break;
        case 'follow_request':
          // Navigate to follow requests
          console.log('Navigate to follow requests:', data);
          break;
        case 'daily_reminder':
          // Navigate to entry creation
          console.log('Navigate to create entry');
          break;
        default:
          console.log('Handle notification tap:', data);
      }
    });
  }
}