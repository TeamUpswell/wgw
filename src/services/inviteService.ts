import { supabase } from '../config/supabase';

export interface Invite {
  id: string;
  inviter_id: string;
  contact: string;
  type: 'email' | 'sms';
  status: 'sent' | 'opened' | 'accepted' | 'expired';
  personal_message?: string;
  accepted_by?: string;
  opened_at?: string;
  accepted_at?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface InviteAnalytics {
  total_sent: number;
  total_opened: number;
  total_accepted: number;
  email_invites: number;
  sms_invites: number;
  acceptance_rate: number;
}

export class InviteService {
  // Generate unique invite code
  static generateInviteCode(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substr(2, 9);
    return `inv_${randomPart}${timestamp}`;
  }

  // Create invite record in database
  static async createInvite(
    inviterId: string,
    contact: string,
    type: 'email' | 'sms',
    personalMessage?: string
  ): Promise<Invite> {
    const inviteCode = this.generateInviteCode();
    
    const { data, error } = await supabase
      .from('invites')
      .insert({
        id: inviteCode,
        inviter_id: inviterId,
        contact,
        type,
        personal_message: personalMessage,
        status: 'sent',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating invite:', error);
      throw error;
    }

    return data;
  }

  // Get user's sent invites
  static async getUserInvites(userId: string): Promise<Invite[]> {
    const { data, error } = await supabase
      .from('invites')
      .select('*')
      .eq('inviter_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invites:', error);
      throw error;
    }

    return data || [];
  }

  // Get invite analytics for user
  static async getInviteAnalytics(userId: string): Promise<InviteAnalytics> {
    const { data, error } = await supabase
      .from('invite_analytics')
      .select('*')
      .eq('inviter_id', userId)
      .single();

    if (error) {
      // If no analytics found, return zeros
      if (error.code === 'PGRST116') {
        return {
          total_sent: 0,
          total_opened: 0,
          total_accepted: 0,
          email_invites: 0,
          sms_invites: 0,
          acceptance_rate: 0,
        };
      }
      console.error('Error fetching invite analytics:', error);
      throw error;
    }

    return data;
  }

  // Mark invite as opened (when someone clicks the link)
  static async markInviteOpened(inviteCode: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('mark_invite_opened', {
      invite_code: inviteCode,
    });

    if (error) {
      console.error('Error marking invite as opened:', error);
      return false;
    }

    return data === true;
  }

  // Accept invite (when someone signs up with invite code)
  static async acceptInvite(inviteCode: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('accept_invite', {
      invite_code: inviteCode,
      user_id: userId,
    });

    if (error) {
      console.error('Error accepting invite:', error);
      return false;
    }

    return data === true;
  }

  // Get invite details by code (for invite landing page)
  static async getInviteByCode(inviteCode: string): Promise<Invite | null> {
    const { data, error } = await supabase
      .from('invites')
      .select(`
        *,
        inviter:profiles!inviter_id(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('id', inviteCode)
      .eq('status', 'sent')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Invite not found or expired
      }
      console.error('Error fetching invite:', error);
      throw error;
    }

    return data;
  }

  // Validate email format
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate phone number format
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  // Parse contact list (emails or phones)
  static parseContactList(contactList: string, type: 'email' | 'sms'): string[] {
    const contacts = contactList
      .split(/[,\n]/)
      .map(contact => contact.trim())
      .filter(contact => {
        if (!contact) return false;
        if (type === 'email') {
          return this.isValidEmail(contact);
        } else {
          return this.isValidPhone(contact);
        }
      });

    return contacts;
  }

  // Generate invite link
  static generateInviteLink(inviteCode: string): string {
    // This should be your actual app download URL
    const baseUrl = 'https://your-app-download-link.com';
    return `${baseUrl}?invite=${inviteCode}`;
  }

  // Send email invites (placeholder - implement with your email service)
  static async sendEmailInvites(
    emails: string[],
    inviter: any,
    personalMessage: string,
    inviteCodes: string[]
  ): Promise<void> {
    console.log('📧 Sending email invites...');
    
    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      const inviteCode = inviteCodes[i];
      const inviteLink = this.generateInviteLink(inviteCode);
      
      // TODO: Implement actual email sending
      // This would integrate with your email service (SendGrid, Resend, etc.)
      
      const emailData = {
        to: email,
        subject: `${inviter.display_name || inviter.username} invited you to join What's Going Well!`,
        html: this.generateEmailTemplate(personalMessage, inviteLink, inviter),
      };
      
      console.log(`📧 Would send email to ${email}:`, emailData);
      
      // Example with a hypothetical email service:
      // await emailService.send(emailData);
    }
  }

  // Send SMS invites (placeholder - implement with SMS service like Twilio)
  static async sendSMSInvites(
    phones: string[],
    inviter: any,
    personalMessage: string,
    inviteCodes: string[]
  ): Promise<void> {
    console.log('📱 Sending SMS invites...');
    
    for (let i = 0; i < phones.length; i++) {
      const phone = phones[i];
      const inviteCode = inviteCodes[i];
      const inviteLink = this.generateInviteLink(inviteCode);
      
      const smsMessage = `${personalMessage}\n\nDownload: ${inviteLink}`;
      
      console.log(`📱 Would send SMS to ${phone}:`, smsMessage);
      
      // TODO: Implement actual SMS sending with Twilio or similar
      // await smsService.send({
      //   to: phone,
      //   body: smsMessage
      // });
    }
  }

  // Generate email template
  private static generateEmailTemplate(
    personalMessage: string,
    inviteLink: string,
    inviter: any
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're invited to What's Going Well!</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #FF6B35, #F7931E); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">You're Invited!</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 18px;">Join What's Going Well</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <p style="margin: 0 0 15px 0;"><strong>From ${inviter.display_name || inviter.username}:</strong></p>
          <p style="margin: 0; font-style: italic;">"${personalMessage}"</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteLink}" style="background: #FF6B35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 18px; display: inline-block;">Download What's Going Well</a>
        </div>
        
        <div style="background: #fff; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px;">
          <h3 style="color: #FF6B35; margin-top: 0;">What's Going Well?</h3>
          <p>It's a gratitude and positivity app that helps you:</p>
          <ul style="margin: 15px 0; padding-left: 20px;">
            <li>Practice daily gratitude with AI coaching</li>
            <li>Track positive moments and build resilience</li>
            <li>Connect with friends on your wellness journey</li>
            <li>Build lasting habits for happiness</li>
          </ul>
        </div>
        
        <p style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
          This invitation expires in 30 days. <br>
          Questions? Reply to this email for support.
        </p>
      </body>
      </html>
    `;
  }
}