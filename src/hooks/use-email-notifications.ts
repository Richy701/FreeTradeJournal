import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { EmailService } from '@/lib/resend';
import type { ExtendedTrade } from '@/types';

interface EmailNotificationSettings {
  welcomeEmails: boolean;
  tradeAlerts: boolean;
  bigWinAlerts: boolean;
  bigLossAlerts: boolean;
  winThreshold: number; // Dollar amount for big wins
  lossThreshold: number; // Dollar amount for big losses
}

const DEFAULT_SETTINGS: EmailNotificationSettings = {
  welcomeEmails: true,
  tradeAlerts: false,
  bigWinAlerts: true,
  bigLossAlerts: true,
  winThreshold: 500,
  lossThreshold: 500,
};

export function useEmailNotifications() {
  const { user } = useAuth();
  const lastTradeRef = useRef<string | null>(null);

  // Get notification settings from localStorage or use defaults
  const getNotificationSettings = (): EmailNotificationSettings => {
    if (!user) return DEFAULT_SETTINGS;
    
    const saved = localStorage.getItem(`emailSettings_${user.uid}`);
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  };

  // Save notification settings
  const updateNotificationSettings = (settings: Partial<EmailNotificationSettings>) => {
    if (!user) return;
    
    const current = getNotificationSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(`emailSettings_${user.uid}`, JSON.stringify(updated));
  };

  // Send trade alert email for significant trades
  const sendTradeAlert = async (trade: ExtendedTrade) => {
    if (!user || !user.email) return;
    
    const settings = getNotificationSettings();
    const absAmount = Math.abs(trade.pnl);
    
    // Check if we should send an alert based on settings
    const shouldSendWinAlert = trade.pnl > 0 && settings.bigWinAlerts && absAmount >= settings.winThreshold;
    const shouldSendLossAlert = trade.pnl < 0 && settings.bigLossAlerts && absAmount >= settings.lossThreshold;
    const shouldSendTradeAlert = settings.tradeAlerts;
    
    if (!shouldSendWinAlert && !shouldSendLossAlert && !shouldSendTradeAlert) return;

    try {
      await EmailService.sendTradeAlert(user.email, {
        traderName: user.displayName?.split(' ')[0] || 'Trader',
        tradeSymbol: trade.symbol,
        pnl: trade.pnl,
        tradeType: `${trade.side.toUpperCase()} ${trade.instrumentType || 'FX'}`,
      });
    } catch (error) {
      console.error('Failed to send trade alert:', error);
    }
  };

  // Check for new trades and send alerts
  const checkForNewTrades = (trades: ExtendedTrade[]) => {
    if (!trades.length) return;
    
    // Sort trades by creation date (most recent first)
    const sortedTrades = [...trades].sort((a, b) => {
      const aDate = new Date(a.createdAt || a.exitTime || a.date || Date.now());
      const bDate = new Date(b.createdAt || b.exitTime || b.date || Date.now());
      return bDate.getTime() - aDate.getTime();
    });
    
    const latestTrade = sortedTrades[0];
    
    // If this is a new trade (not seen before)
    if (lastTradeRef.current !== latestTrade.id) {
      lastTradeRef.current = latestTrade.id;
      
      // Don't send alert for the very first check (page load)
      // Only send for subsequent new trades
      if (lastTradeRef.current !== null) {
        sendTradeAlert(latestTrade);
      }
    }
  };

  return {
    getNotificationSettings,
    updateNotificationSettings,
    sendTradeAlert,
    checkForNewTrades,
  };
}

// Helper hook to monitor trades and send alerts
export function useTradeAlerts(trades: ExtendedTrade[]) {
  const { checkForNewTrades } = useEmailNotifications();
  
  useEffect(() => {
    checkForNewTrades(trades);
  }, [trades]);
}

// Utility function to send a test email
export async function sendTestEmail(email: string) {
  try {
    const result = await EmailService.sendEmail({
      to: email,
      subject: 'FreeTradeJournal Test Email 🧪',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; max-width: 500px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px;">🧪 Test Email</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your email notifications are working perfectly!</p>
          </div>
          <div style="padding: 20px; text-align: center;">
            <p style="color: #4b5563; margin: 0;">
              This is a test email to confirm your FreeTradeJournal email notifications are set up correctly.
            </p>
            <p style="color: #9ca3af; font-size: 14px; margin: 20px 0 0 0;">
              FreeTradeJournal Team
            </p>
          </div>
        </div>
      `,
      text: 'This is a test email from FreeTradeJournal. Your email notifications are working correctly!',
    });
    
    return result;
  } catch (error) {
    console.error('Failed to send test email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}