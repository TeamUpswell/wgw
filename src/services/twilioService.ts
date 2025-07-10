// React Native compatible Twilio and SendGrid service using HTTP requests

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;

// Check configuration
const twilioConfigured = TWILIO_ACCOUNT_SID && TWILIO_ACCOUNT_SID.startsWith('AC') && TWILIO_AUTH_TOKEN;
const sendGridConfigured = SENDGRID_API_KEY && SENDGRID_FROM_EMAIL;

if (twilioConfigured) {
  console.log('✅ Twilio SMS configured');
} else {
  console.log('⚠️ Twilio SMS not configured - need Account SID (AC...) and Auth Token');
}

if (sendGridConfigured) {
  console.log('✅ SendGrid email configured');
} else {
  console.log('⚠️ SendGrid not configured - need API key and verified from email');
}

export class TwilioService {
  // Send SMS using Twilio REST API
  static async sendSMS(to: string, message: string): Promise<boolean> {
    if (!twilioConfigured) {
      console.log(`📱 SMS not configured - would send to ${to}: ${message}`);
      return false;
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
      
      // Create form data for Twilio API
      const formData = new URLSearchParams();
      formData.append('To', to);
      formData.append('From', TWILIO_PHONE_NUMBER || '');
      formData.append('Body', message);

      // Create basic auth header
      const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`📱 SMS sent successfully to ${to}:`, result.sid);
        return true;
      } else {
        const error = await response.text();
        console.error('Twilio SMS error:', error);
        return false;
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      return false;
    }
  }

  // Send email using SendGrid REST API
  static async sendEmail(to: string, subject: string, htmlContent: string): Promise<boolean> {
    if (!sendGridConfigured) {
      console.log(`📧 Email not configured - would send to ${to}: ${subject}`);
      return false;
    }

    try {
      const url = 'https://api.sendgrid.com/v3/mail/send';
      
      const emailData = {
        personalizations: [
          {
            to: [{ email: to }],
            subject: subject,
          },
        ],
        from: { email: SENDGRID_FROM_EMAIL },
        content: [
          {
            type: 'text/html',
            value: htmlContent,
          },
        ],
      };

      console.log(`📧 Attempting to send email to ${to}...`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (response.ok || response.status === 202) {
        console.log(`📧 Email sent successfully to ${to}`);
        return true;
      } else {
        const error = await response.text();
        console.error('SendGrid email error:', error);
        console.error('Response status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Error sending email:', error);
      console.error('Email details:', { to, subject, from: SENDGRID_FROM_EMAIL });
      return false;
    }
  }

  // Send multiple emails
  static async sendBulkEmails(emails: Array<{
    to: string;
    subject: string;
    html: string;
  }>): Promise<boolean> {
    if (!sendGridConfigured) {
      console.log(`📧 Email not configured - would send ${emails.length} emails`);
      emails.forEach(email => console.log(`📧 Would send to ${email.to}: ${email.subject}`));
      return false;
    }

    try {
      // Send emails one by one (could be optimized with SendGrid's bulk API)
      const promises = emails.map(email => 
        this.sendEmail(email.to, email.subject, email.html)
      );

      const results = await Promise.all(promises);
      const successCount = results.filter(result => result).length;
      
      console.log(`📧 Bulk emails: ${successCount}/${emails.length} sent successfully`);
      return successCount === emails.length;
    } catch (error) {
      console.error('Error sending bulk emails:', error);
      return false;
    }
  }

  // Send multiple SMS messages
  static async sendBulkSMS(messages: Array<{
    to: string;
    body: string;
  }>): Promise<boolean> {
    if (!twilioConfigured) {
      console.log(`📱 SMS not configured - would send ${messages.length} messages`);
      messages.forEach(msg => console.log(`📱 Would send to ${msg.to}: ${msg.body}`));
      return false;
    }

    try {
      // Send SMS one by one
      const promises = messages.map(msg => 
        this.sendSMS(msg.to, msg.body)
      );

      const results = await Promise.all(promises);
      const successCount = results.filter(result => result).length;
      
      console.log(`📱 Bulk SMS: ${successCount}/${messages.length} sent successfully`);
      return successCount === messages.length;
    } catch (error) {
      console.error('Error sending bulk SMS:', error);
      return false;
    }
  }
}