import { NotificationService } from './notificationService';

/**
 * Notification Triggers
 * This module integrates notification triggers with existing app functionality
 */

export class NotificationTriggers {
  
  // Initialize notification system for a user
  static async initializeForUser(userId: string): Promise<void> {
    try {
      // Register for push notifications
      await NotificationService.registerPushToken(userId);
      
      // Schedule initial daily reminders
      await NotificationService.scheduleDailyReminders(userId, 7);
      
      // Setup notification response handler
      NotificationService.setupNotificationResponseHandler();
      
      console.log('Notification system initialized for user:', userId);
    } catch (error) {
      console.error('Error initializing notifications for user:', error);
    }
  }

  // Trigger when user creates a new entry
  static async onEntryCreated(userId: string, entryContent: string, userName: string): Promise<void> {
    try {
      // Mark that user logged an entry today (cancels daily reminder)
      await NotificationService.markEntryLogged(userId);
      
      // Notify friends who follow this user
      await NotificationService.notifyFriendEntry(userId, entryContent, userName);
      
      console.log('Entry creation notifications triggered');
    } catch (error) {
      console.error('Error triggering entry notifications:', error);
    }
  }

  // Trigger when someone comments on an entry
  static async onCommentAdded(
    entryOwnerId: string, 
    commenterUserId: string, 
    commenterName: string, 
    comment: string, 
    entryId: string
  ): Promise<void> {
    try {
      // Don't notify if user commented on their own entry
      if (entryOwnerId === commenterUserId) {
        return;
      }

      await NotificationService.notifyComment(entryOwnerId, commenterName, comment, entryId);
      console.log('Comment notification triggered');
    } catch (error) {
      console.error('Error triggering comment notification:', error);
    }
  }

  // Trigger when someone likes an entry
  static async onEntryLiked(
    entryOwnerId: string, 
    likerUserId: string, 
    likerName: string, 
    entryContent: string, 
    entryId: string
  ): Promise<void> {
    try {
      // Don't notify if user liked their own entry
      if (entryOwnerId === likerUserId) {
        return;
      }

      await NotificationService.notifyLike(entryOwnerId, likerName, entryContent, entryId);
      console.log('Like notification triggered');
    } catch (error) {
      console.error('Error triggering like notification:', error);
    }
  }

  // Trigger when someone sends a follow request
  static async onFollowRequestSent(
    targetUserId: string, 
    requesterId: string, 
    requesterName: string
  ): Promise<void> {
    try {
      await NotificationService.notifyFollowRequest(targetUserId, requesterName, requesterId);
      console.log('Follow request notification triggered');
    } catch (error) {
      console.error('Error triggering follow request notification:', error);
    }
  }

  // Trigger when user reaches a streak milestone
  static async onStreakMilestone(userId: string, streakCount: number): Promise<void> {
    try {
      // Only notify on significant milestones
      const milestones = [3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 250, 300, 365];
      
      if (!milestones.includes(streakCount)) {
        return;
      }

      const title = `🎉 ${streakCount}-Day Streak!`;
      let body = '';
      
      if (streakCount === 3) {
        body = 'You\'re building a great habit! Keep the momentum going.';
      } else if (streakCount === 7) {
        body = 'One week of gratitude! You\'re creating positive change.';
      } else if (streakCount === 14) {
        body = 'Two weeks strong! Your gratitude practice is growing.';
      } else if (streakCount === 30) {
        body = 'One month of daily gratitude! This is becoming a beautiful habit.';
      } else if (streakCount === 100) {
        body = '100 days of gratitude! You\'re a gratitude champion! 🏆';
      } else if (streakCount === 365) {
        body = 'One full year of daily gratitude! You\'re truly inspiring! 🌟';
      } else {
        body = `${streakCount} days of gratitude! You\'re amazing!`;
      }

      await NotificationService.queueSocialNotification(
        userId,
        'streak_milestone',
        title,
        body,
        { streak_count: streakCount }
      );

      console.log(`Streak milestone notification triggered: ${streakCount} days`);
    } catch (error) {
      console.error('Error triggering streak milestone notification:', error);
    }
  }

  // Trigger when user's streak is about to break
  static async onStreakWarning(userId: string, streakCount: number): Promise<void> {
    try {
      const title = 'Don\'t break your streak! 🔥';
      const body = `You have a ${streakCount}-day gratitude streak. Take a moment to reflect on what went well today.`;

      await NotificationService.queueSocialNotification(
        userId,
        'streak_broken',
        title,
        body,
        { streak_count: streakCount, type: 'warning' }
      );

      console.log(`Streak warning notification triggered: ${streakCount} days`);
    } catch (error) {
      console.error('Error triggering streak warning notification:', error);
    }
  }

  // Check and trigger daily reminders for users who haven't logged entries
  static async checkDailyReminders(): Promise<void> {
    try {
      // This would typically be called by a background job/cron
      // For now, this is a placeholder for the logic
      console.log('Checking daily reminders...');
      
      // In a real implementation, this would:
      // 1. Query users who have daily reminders enabled
      // 2. Check if they've logged an entry today
      // 3. Send reminders to those who haven't
      // 4. Respect their preferred reminder time and timezone
      
    } catch (error) {
      console.error('Error checking daily reminders:', error);
    }
  }

  // Generate and queue weekly summary notifications
  static async generateWeeklySummary(userId: string): Promise<void> {
    try {
      // This would analyze the user's entries from the past week
      // and generate an encouraging summary
      
      const title = 'Your Weekly Gratitude Summary 📊';
      const body = 'See how your gratitude practice brightened your week!';

      await NotificationService.queueSocialNotification(
        userId,
        'weekly_summary',
        title,
        body,
        { type: 'weekly_summary', week: new Date().toISOString() }
      );

      console.log('Weekly summary notification queued');
    } catch (error) {
      console.error('Error generating weekly summary:', error);
    }
  }

  // Generate and queue monthly summary notifications
  static async generateMonthlySummary(userId: string): Promise<void> {
    try {
      const title = 'Your Monthly Gratitude Journey 🌙';
      const body = 'Celebrate a month of positive reflections and growth!';

      await NotificationService.queueSocialNotification(
        userId,
        'monthly_summary',
        title,
        body,
        { type: 'monthly_summary', month: new Date().toISOString() }
      );

      console.log('Monthly summary notification queued');
    } catch (error) {
      console.error('Error generating monthly summary:', error);
    }
  }

  // Helper to get user display name for notifications
  static async getUserDisplayName(userId: string): Promise<string> {
    try {
      // This would fetch from your users table
      // For now, return a placeholder
      return `User ${userId.slice(0, 8)}`;
    } catch (error) {
      console.error('Error getting user display name:', error);
      return 'Someone';
    }
  }

  // Batch process notifications (for background jobs)
  static async processPendingNotifications(): Promise<void> {
    try {
      // This would be called by a background service to:
      // 1. Query pending notifications from the queue
      // 2. Send them via push notification service
      // 3. Move successful sends to history
      // 4. Retry failed sends
      
      console.log('Processing pending notifications...');
    } catch (error) {
      console.error('Error processing pending notifications:', error);
    }
  }
}

// Helper functions to integrate with existing code

// Add this to your entry creation logic
export const notifyEntryCreated = NotificationTriggers.onEntryCreated;

// Add this to your comment creation logic
export const notifyCommentAdded = NotificationTriggers.onCommentAdded;

// Add this to your like toggle logic
export const notifyEntryLiked = NotificationTriggers.onEntryLiked;

// Add this to your follow request logic
export const notifyFollowRequestSent = NotificationTriggers.onFollowRequestSent;

// Add this to your streak calculation logic
export const notifyStreakMilestone = NotificationTriggers.onStreakMilestone;
export const notifyStreakWarning = NotificationTriggers.onStreakWarning;