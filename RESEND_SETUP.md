# Resend Email Service Setup

FreeTradeJournal now includes comprehensive email notifications powered by [Resend](https://resend.com/). This guide will help you set up email services for your application.

## Features

### 🎯 Automated Email Types
- **Welcome Emails**: Sent when new users sign up
- **Trade Alerts**: Notifications for significant trading events
- **Big Win/Loss Alerts**: Configurable thresholds for important P&L events
- **Password Reset**: Secure password reset functionality

### 📧 Email Templates
All emails use professionally designed HTML templates with:
- Responsive design for mobile and desktop
- Beautiful gradients and modern styling
- Clear call-to-action buttons
- Consistent branding with FreeTradeJournal

## Setup Instructions

### 1. Create a Resend Account

1. Go to [resend.com](https://resend.com/) and create an account
2. Verify your email address
3. Navigate to **API Keys** in your dashboard

### 2. Domain Setup (Recommended)

For production use, you'll want to verify your sending domain:

1. Go to **Domains** in your Resend dashboard
2. Add your domain: `freetradejournal.com`
3. Add the required DNS records to verify domain ownership
4. Wait for verification (usually takes a few minutes)

### 3. Get Your API Key

1. In your Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Give it a name like "FreeTradeJournal Production"
4. Copy the API key (it starts with `re_`)

### 4. Configure Environment Variables

Add your Resend API key to your environment variables:

```bash
# In your .env file
VITE_RESEND_API_KEY=re_your_actual_api_key_here
```

**Important**: Never commit your API key to version control. Always use environment variables.

### 5. Verify Setup

1. Build and deploy your application
2. Go to **Settings → Notifications** in your FreeTradeJournal dashboard
3. Click **Send Test Email**
4. Check your email inbox for the test message

## Configuration Options

### Email Notification Settings

Users can configure their email preferences in **Settings → Notifications**:

- **Welcome Emails**: Enable/disable welcome emails for new signups
- **All Trade Alerts**: Get notified for every trade that closes
- **Big Win Alerts**: Email alerts for profitable trades above threshold
- **Big Loss Alerts**: Email alerts for losing trades above threshold
- **Win/Loss Thresholds**: Configure dollar amounts for "big" trades

### Default Settings

```typescript
{
  welcomeEmails: true,
  tradeAlerts: false,
  bigWinAlerts: true,
  bigLossAlerts: true,
  winThreshold: 500,    // $500 wins
  lossThreshold: 500    // $500 losses
}
```

## Email Templates

### Welcome Email
- Professional greeting with user's name
- Quick start guide and tips
- Links to documentation and community
- Call-to-action to complete setup

### Trade Alert Email
- Trade summary with symbol, type, and P&L
- Color-coded for wins (green) vs losses (red)
- Direct link to view full trade details
- Professional branding and layout

### Test Email
- Simple confirmation that email service is working
- Includes FreeTradeJournal branding
- Used for troubleshooting email delivery

## API Usage

### Sending Custom Emails

```typescript
import { EmailService } from '@/lib/resend';

// Send custom email
await EmailService.sendEmail({
  to: 'user@example.com',
  subject: 'Your Custom Subject',
  html: '<h1>Your HTML content</h1>',
  text: 'Your text content'
});

// Send welcome email
await EmailService.sendWelcomeEmail({
  firstName: 'John',
  email: 'john@example.com'
});

// Send trade alert
await EmailService.sendTradeAlert('user@example.com', {
  traderName: 'John',
  tradeSymbol: 'EURUSD',
  pnl: 125.50,
  tradeType: 'LONG FOREX'
});
```

### Using Email Notifications Hook

```typescript
import { useEmailNotifications } from '@/hooks/use-email-notifications';

function YourComponent() {
  const {
    getNotificationSettings,
    updateNotificationSettings,
    sendTradeAlert
  } = useEmailNotifications();

  // Get current settings
  const settings = getNotificationSettings();

  // Update settings
  updateNotificationSettings({
    bigWinAlerts: true,
    winThreshold: 1000
  });

  // Send manual trade alert
  await sendTradeAlert(trade);
}
```

## Troubleshooting

### Common Issues

**1. API Key Not Working**
- Verify the API key is correct and starts with `re_`
- Make sure the environment variable is properly set
- Check that you're using `VITE_` prefix for Vite applications

**2. Emails Not Sending**
- Check your Resend dashboard for delivery logs
- Verify your domain is properly configured
- Test with the "Send Test Email" button first

**3. Domain Verification Issues**
- Ensure all DNS records are added correctly
- Wait 24-48 hours for DNS propagation
- Use a DNS checker tool to verify records

**4. Rate Limits**
- Resend has rate limits based on your plan
- Free tier: 100 emails/day
- Check your usage in the Resend dashboard

### Getting Help

- **Resend Documentation**: [resend.com/docs](https://resend.com/docs)
- **FreeTradeJournal Community**: [Telegram Group](https://t.me/+UI6uTKgfswUwNzhk)
- **Email Issues**: Check browser console for error messages

## Security Best Practices

1. **Never expose API keys** in client-side code
2. **Use environment variables** for all sensitive data
3. **Rotate API keys** regularly
4. **Monitor email usage** to detect abuse
5. **Implement rate limiting** on your email endpoints

## Cost Considerations

Resend pricing (as of 2024):
- **Free Tier**: 100 emails/month
- **Pro**: $20/month for 50,000 emails
- **Business**: $80/month for 100,000 emails

For most trading journal users, the free tier should be sufficient for welcome emails and occasional trade alerts.

## Production Deployment

When deploying to production:

1. Add `VITE_RESEND_API_KEY` to your hosting platform's environment variables
2. Verify your domain with Resend
3. Update the `defaultFrom` email address in `/src/lib/resend.ts`
4. Test email delivery thoroughly
5. Monitor email logs and delivery rates

## Support

If you encounter issues with email setup:

1. Check the browser console for JavaScript errors
2. Verify your API key in the Resend dashboard
3. Test with a simple email first
4. Join our community for help: [Telegram](https://t.me/+UI6uTKgfswUwNzhk)