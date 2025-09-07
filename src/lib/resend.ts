import { Resend } from 'resend';

// Initialize Resend with API key - only on server side
const getResendClient = () => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    return null; // Return null in browser
  }
  
  const apiKey = process.env.VITE_RESEND_API_KEY;
  if (!apiKey) {
    console.warn('VITE_RESEND_API_KEY not found');
    return null;
  }
  
  return new Resend(apiKey);
};

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

export interface WelcomeEmailData {
  firstName: string;
  email: string;
}

export interface TradeAlertData {
  traderName: string;
  tradeSymbol: string;
  pnl: number;
  tradeType: string;
}

export class EmailService {
  // Use resend.dev domain until custom domain is verified
  // Change this to 'FreeTradeJournal <noreply@freetradejournal.com>' once domain is set up
  private static defaultFrom = 'FreeTradeJournal <onboarding@resend.dev>';

  static async sendEmail(options: EmailOptions) {
    try {
      const resendClient = getResendClient();
      
      // If no Resend client available (browser environment or missing API key)
      if (!resendClient) {
        console.warn('Resend client not available - email not sent');
        return { 
          success: false, 
          error: 'Email service not available in browser environment' 
        };
      }

      const emailData: any = {
        from: options.from || this.defaultFrom,
        to: options.to,
        subject: options.subject,
      };

      if (options.html) {
        emailData.html = options.html;
      }
      if (options.text) {
        emailData.text = options.text;
      }

      const result = await resendClient.emails.send(emailData);

      return { success: true, data: result };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async sendWelcomeEmail(data: WelcomeEmailData) {
    const html = this.getWelcomeEmailTemplate(data);
    
    return this.sendEmail({
      to: data.email,
      subject: 'Welcome to FreeTradeJournal! 🚀',
      html,
      text: `Welcome to FreeTradeJournal, ${data.firstName}! We're excited to help you track and improve your trading performance.`,
    });
  }

  static async sendTradeAlert(email: string, data: TradeAlertData) {
    const html = this.getTradeAlertTemplate(data);
    const pnlText = data.pnl >= 0 ? `+$${data.pnl.toFixed(2)}` : `-$${Math.abs(data.pnl).toFixed(2)}`;
    
    return this.sendEmail({
      to: email,
      subject: `Trade Alert: ${data.tradeSymbol} ${pnlText}`,
      html,
      text: `${data.traderName}, your ${data.tradeType} trade on ${data.tradeSymbol} closed with ${pnlText} P&L.`,
    });
  }

  static async sendPasswordReset(email: string, resetLink: string) {
    const html = this.getPasswordResetTemplate(resetLink);
    
    return this.sendEmail({
      to: email,
      subject: 'Reset Your FreeTradeJournal Password',
      html,
      text: `Reset your password by clicking this link: ${resetLink}`,
    });
  }

  private static getWelcomeEmailTemplate(data: WelcomeEmailData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to FreeTradeJournal</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Welcome to FreeTradeJournal! 🚀</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your journey to better trading starts now</p>
    </div>
    
    <div style="padding: 0 20px;">
        <h2 style="color: #1f2937; margin-bottom: 20px;">Hey ${data.firstName}! 👋</h2>
        
        <p style="margin-bottom: 20px; font-size: 16px; color: #4b5563;">
            We're thrilled to have you join the FreeTradeJournal community! You've just taken a crucial step towards becoming a more disciplined and profitable trader.
        </p>
        
        <div style="background: #f9fafb; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
            <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">🎯 What you can do now:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                <li style="margin-bottom: 8px;">Complete your trading profile setup</li>
                <li style="margin-bottom: 8px;">Log your first trade and see the magic happen</li>
                <li style="margin-bottom: 8px;">Explore our performance analytics dashboard</li>
                <li>Set up your trading goals and risk management rules</li>
            </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://www.freetradejournal.com/dashboard" 
               style="background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
                Start Trading Smarter →
            </a>
        </div>
        
        <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h4 style="margin: 0 0 10px 0; color: #92400e; font-size: 16px;">💡 Pro Tip</h4>
            <p style="margin: 0; color: #92400e; font-size: 14px;">
                Consistency is key! Try to log every trade, even the small ones. The insights you'll gain will be worth it.
            </p>
        </div>
        
        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            Need help getting started? Check out our <a href="https://www.freetradejournal.com/documentation" style="color: #10b981;">documentation</a> or join our <a href="https://t.me/+UI6uTKgfswUwNzhk" style="color: #10b981;">Telegram community</a>.
        </p>
        
        <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; text-align: center;">
            <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                Happy trading!<br>
                The FreeTradeJournal Team
            </p>
        </div>
    </div>
</body>
</html>`;
  }

  private static getTradeAlertTemplate(data: TradeAlertData): string {
    const isProfit = data.pnl >= 0;
    const pnlColor = isProfit ? '#059669' : '#dc2626';
    const pnlText = isProfit ? `+$${data.pnl.toFixed(2)}` : `-$${Math.abs(data.pnl).toFixed(2)}`;
    const emoji = isProfit ? '🚀' : '⚠️';
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trade Alert - ${data.tradeSymbol}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: ${isProfit ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'}; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">Trade Alert ${emoji}</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">${data.tradeSymbol} position closed</p>
    </div>
    
    <div style="padding: 0 20px;">
        <h2 style="color: #1f2937; margin-bottom: 20px;">Hey ${data.traderName}!</h2>
        
        <div style="background: #f9fafb; border: 2px solid ${pnlColor}; padding: 25px; margin: 25px 0; border-radius: 12px; text-align: center;">
            <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">Trade Summary</h3>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <span style="color: #6b7280; font-weight: 600;">Symbol:</span>
                <span style="color: #1f2937; font-weight: bold; font-size: 18px;">${data.tradeSymbol}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <span style="color: #6b7280; font-weight: 600;">Type:</span>
                <span style="color: #1f2937; font-weight: 600;">${data.tradeType}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-weight: 600;">P&L:</span>
                <span style="color: ${pnlColor}; font-weight: bold; font-size: 24px;">${pnlText}</span>
            </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://www.freetradejournal.com/trades" 
               style="background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
                View Full Trade Details →
            </a>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; text-align: center;">
            <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                Keep tracking, keep improving!<br>
                FreeTradeJournal
            </p>
        </div>
    </div>
</body>
</html>`;
  }

  private static getPasswordResetTemplate(resetLink: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Password Reset 🔐</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Secure your FreeTradeJournal account</p>
    </div>
    
    <div style="padding: 0 20px;">
        <h2 style="color: #1f2937; margin-bottom: 20px;">Reset Your Password</h2>
        
        <p style="margin-bottom: 20px; font-size: 16px; color: #4b5563;">
            You recently requested to reset your password for your FreeTradeJournal account. Click the button below to reset it.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
                Reset Password →
            </a>
        </div>
        
        <div style="background: #fef2f2; border: 1px solid #f87171; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h4 style="margin: 0 0 10px 0; color: #dc2626; font-size: 16px;">🔒 Security Notice</h4>
            <p style="margin: 0; color: #dc2626; font-size: 14px;">
                This link will expire in 1 hour. If you didn't request this password reset, please ignore this email.
            </p>
        </div>
        
        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetLink}" style="color: #3b82f6; word-break: break-all;">${resetLink}</a>
        </p>
        
        <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; text-align: center;">
            <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                Stay secure!<br>
                The FreeTradeJournal Team
            </p>
        </div>
    </div>
</body>
</html>`;
  }
}

export default EmailService;