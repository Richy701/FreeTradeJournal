import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useProStatus } from '@/contexts/pro-context';
import { useUserStorage } from '@/utils/user-storage';

const TRADE_THRESHOLD = 5;

export function ProNudgeBanner() {
  const { user, isDemo } = useAuth();
  const { isPro, isLoading } = useProStatus();
  const userStorage = useUserStorage();
  const [visible, setVisible] = useState(false);
  const [tradeCount, setTradeCount] = useState(0);

  const dismissKey = user ? `pro-nudge-v1-dismissed-${user.uid}` : null;

  useEffect(() => {
    if (!user || isDemo || isPro || isLoading || !dismissKey) return;

    const dismissed = localStorage.getItem(dismissKey);
    if (dismissed) return;

    const raw = userStorage.getItem('trades');
    if (!raw) return;

    try {
      const trades = JSON.parse(raw);
      const count = Array.isArray(trades) ? trades.length : 0;
      if (count >= TRADE_THRESHOLD) {
        setTradeCount(count);
        setVisible(true);
      }
    } catch {
      // malformed data, skip
    }
  }, [user, isDemo, isPro, isLoading, userStorage, dismissKey]);

  function dismiss() {
    setVisible(false);
    if (dismissKey) localStorage.setItem(dismissKey, '1');
  }

  if (!visible) return null;

  return (
    <div className="mx-4 mb-4 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 flex items-center gap-3 relative">
      <p className="text-sm text-foreground/80 flex-1 leading-snug">
        You've logged{' '}
        <span className="font-semibold text-foreground">{tradeCount} trades</span>.
        {' '}Unlock AI coaching to find out what's actually costing you money.
      </p>
      <Link
        to="/pricing"
        className="flex-shrink-0 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-black px-3 py-1.5 rounded-lg transition-colors duration-150"
      >
        Unlock Pro →
      </Link>
      <button
        onClick={dismiss}
        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
