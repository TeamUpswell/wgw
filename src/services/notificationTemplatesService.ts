import { supabase } from '../config/supabase';

export interface NotificationTemplate {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  title: string;
  body: string;
  notification_type: 'daily_reminder' | 'weekly_summary' | 'monthly_summary' | 'streak_milestone' | 'custom';
  is_recurring: boolean;
  recurrence_pattern?: string;
  scheduled_time?: string;
  scheduled_days?: number[];
  scheduled_date?: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  last_sent_at?: string;
  send_count: number;
  category: string;
  tags?: string[];
  settings?: any;
}

export interface ScheduledNotification {
  id: string;
  template_id: string;
  user_id: string;
  title: string;
  body: string;
  scheduled_for: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  sent_at?: string;
  error_message?: string;
  retry_count: number;
  created_at: string;
}

export class NotificationTemplatesService {
  
  // Get all notification templates for a user
  static async getTemplates(userId: string): Promise<NotificationTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notification templates:', error);
      return [];
    }
  }

  // Get templates by category
  static async getTemplatesByCategory(userId: string, category: string): Promise<NotificationTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('user_id', userId)
        .eq('category', category)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching templates by category:', error);
      return [];
    }
  }

  // Create a new notification template
  static async createTemplate(userId: string, template: Partial<NotificationTemplate>): Promise<NotificationTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .insert({
          user_id: userId,
          name: template.name,
          description: template.description,
          title: template.title,
          body: template.body,
          notification_type: template.notification_type,
          is_recurring: template.is_recurring || false,
          recurrence_pattern: template.recurrence_pattern,
          scheduled_time: template.scheduled_time,
          scheduled_days: template.scheduled_days,
          scheduled_date: template.scheduled_date,
          is_active: template.is_active !== undefined ? template.is_active : true,
          category: template.category || 'custom',
          tags: template.tags,
          settings: template.settings || {},
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating notification template:', error);
      return null;
    }
  }

  // Update an existing template
  static async updateTemplate(templateId: string, updates: Partial<NotificationTemplate>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notification_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', templateId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating notification template:', error);
      return false;
    }
  }

  // Delete a template
  static async deleteTemplate(templateId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notification_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting notification template:', error);
      return false;
    }
  }

  // Duplicate a template
  static async duplicateTemplate(templateId: string, newName?: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('duplicate_notification_template', {
        template_id: templateId,
        new_name: newName,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error duplicating notification template:', error);
      return null;
    }
  }

  // Toggle template active status
  static async toggleTemplateStatus(templateId: string, isActive: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notification_templates')
        .update({ is_active: isActive })
        .eq('id', templateId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error toggling template status:', error);
      return false;
    }
  }

  // Schedule notifications from a template
  static async scheduleFromTemplate(templateId: string, daysAhead: number = 7): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('schedule_from_template', {
        template_id: templateId,
        days_ahead: daysAhead,
      });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error scheduling from template:', error);
      return 0;
    }
  }

  // Get scheduled notifications for a user
  static async getScheduledNotifications(userId: string, limit: number = 50): Promise<ScheduledNotification[]> {
    try {
      const { data, error } = await supabase
        .from('scheduled_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('scheduled_for', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching scheduled notifications:', error);
      return [];
    }
  }

  // Cancel a scheduled notification
  static async cancelScheduledNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('scheduled_notifications')
        .update({ status: 'cancelled' })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error cancelling scheduled notification:', error);
      return false;
    }
  }

  // Get template categories
  static getTemplateCategories(): Array<{ key: string; title: string; icon: string; color: string }> {
    return [
      {
        key: 'reminders',
        title: 'Reminders',
        icon: 'alarm',
        color: '#FF6B35'
      },
      {
        key: 'summaries',
        title: 'Summaries',
        icon: 'calendar',
        color: '#4ECDC4'
      },
      {
        key: 'celebrations',
        title: 'Celebrations',
        icon: 'trophy',
        color: '#F39C12'
      },
      {
        key: 'motivation',
        title: 'Motivation',
        icon: 'rocket',
        color: '#9B59B6'
      },
      {
        key: 'custom',
        title: 'Custom',
        icon: 'create',
        color: '#3498DB'
      }
    ];
  }

  // Get recurrence patterns
  static getRecurrencePatterns(): Array<{ key: string; title: string; description: string }> {
    return [
      {
        key: 'daily',
        title: 'Daily',
        description: 'Every day at the specified time'
      },
      {
        key: 'weekly',
        title: 'Weekly',
        description: 'On specific days of the week'
      },
      {
        key: 'monthly',
        title: 'Monthly',
        description: 'On a specific day each month'
      },
      {
        key: 'custom',
        title: 'Custom',
        description: 'Custom scheduling pattern'
      }
    ];
  }

  // Get default template suggestions based on type
  static getTemplateSuggestions(type: string): Array<{ title: string; body: string }> {
    const suggestions: Record<string, Array<{ title: string; body: string }>> = {
      daily_reminder: [
        {
          title: 'Time for gratitude! 🌟',
          body: 'What went well for you today? Even small moments count!'
        },
        {
          title: 'Your daily reflection awaits ✨',
          body: 'Take a moment to celebrate something positive from today'
        },
        {
          title: 'What\'s going well? 🌈',
          body: 'Share your gratitude and keep your positive streak going'
        },
        {
          title: 'Gratitude check-in 💫',
          body: 'What made you smile today? Let\'s capture that moment!'
        }
      ],
      weekly_summary: [
        {
          title: 'Your Weekly Gratitude Summary 📊',
          body: 'See how your gratitude practice brightened your week!'
        },
        {
          title: 'Week in Review 🌻',
          body: 'Celebrate all the positive moments from this week'
        }
      ],
      monthly_summary: [
        {
          title: 'Your Monthly Gratitude Journey 🌙',
          body: 'Celebrate a month of positive reflections and growth!'
        }
      ],
      streak_milestone: [
        {
          title: 'Congratulations! 🎉',
          body: 'You\'ve reached a new gratitude milestone! Keep up the amazing work.'
        },
        {
          title: 'Streak Achievement Unlocked! 🏆',
          body: 'Your dedication to gratitude is inspiring!'
        }
      ]
    };

    return suggestions[type] || [];
  }

  // Validate template data
  static validateTemplate(template: Partial<NotificationTemplate>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!template.name?.trim()) {
      errors.push('Template name is required');
    }

    if (!template.title?.trim()) {
      errors.push('Notification title is required');
    }

    if (!template.body?.trim()) {
      errors.push('Notification body is required');
    }

    if (!template.notification_type) {
      errors.push('Notification type is required');
    }

    if (template.is_recurring && !template.recurrence_pattern) {
      errors.push('Recurrence pattern is required for recurring notifications');
    }

    if (template.recurrence_pattern === 'weekly' && (!template.scheduled_days || template.scheduled_days.length === 0)) {
      errors.push('At least one day must be selected for weekly notifications');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}