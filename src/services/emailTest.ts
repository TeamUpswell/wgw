// Simple email test utility
import { TwilioService } from './twilioService';

export async function testEmail(toEmail: string) {
  console.log('🧪 Testing email functionality...');
  
  const testSubject = 'Test Email from What\'s Going Well App';
  const testHtml = `
    <h2>Test Email</h2>
    <p>This is a test email from your What's Going Well app.</p>
    <p>If you receive this, your email integration is working! 🎉</p>
    <p>Timestamp: ${new Date().toISOString()}</p>
  `;

  try {
    const result = await TwilioService.sendEmail(toEmail, testSubject, testHtml);
    
    if (result) {
      console.log('✅ Test email sent successfully!');
      return true;
    } else {
      console.log('❌ Test email failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Test email error:', error);
    return false;
  }
}

// Test invite email template
export async function testInviteEmail(toEmail: string) {
  console.log('🧪 Testing invite email template...');
  
  const mockInviter = {
    display_name: 'Test User',
    username: 'testuser'
  };
  
  const personalMessage = 'Hey! I\'ve been loving this gratitude app and thought you might enjoy it too!';
  const inviteLink = 'https://your-app-download-link.com?invite=test_invite_code';
  
  const subject = `${mockInviter.display_name} invited you to join What's Going Well!`;
  const html = generateTestEmailTemplate(personalMessage, inviteLink, mockInviter);
  
  try {
    const result = await TwilioService.sendEmail(toEmail, subject, html);
    
    if (result) {
      console.log('✅ Test invite email sent successfully!');
      return true;
    } else {
      console.log('❌ Test invite email failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Test invite email error:', error);
    return false;
  }
}

function generateTestEmailTemplate(
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
        This is a test email. <br>
        Test timestamp: ${new Date().toISOString()}
      </p>
    </body>
    </html>
  `;
}