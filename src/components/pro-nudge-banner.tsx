import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X } from '@phosphor-icons/react';
import { useAuth } from '@/contexts/auth-context';
import { useProStatus } from '@/contexts/pro-context';

export function ProNudgeBanner() {
  const { user, isDemo } = useAuth();
  const { isPro, isLoading } = useProStatus();
  const [visible, setVisible] = useState(false);

  const dismissKey = user ? `trial-nudge-v1-${user.uid}` : null;

  useEffect(() => {
    if (!user || isDemo || isPro || isLoading || !dismissKey) return;
    const dismissed = localStorage.getItem(dismissKey);
    if (!dismissed) setVisible(true);
  }, [user, isDemo, isPro, isLoading, dismissKey]);

  function dismiss() {
    setVisible(false);
    if (dismissKey) localStorage.setItem(dismissKey, '1');
  }

  if (!visible || isPro || isLoading) return null;

  return (
    <div className="mx-4 mb-4 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 flex items-center gap-3 relative">
      <p className="text-sm text-foreground/80 flex-1 leading-snug">
        Unlock every Pro feature —{' '}
        <span className="font-semibold text-foreground">full analytics history</span>
        , unlimited AI coaching, cloud sync and more. Cancel anytime.
      </p>
      <Link
        to="/pricing"
        className="flex-shrink-0 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-black px-3 py-1.5 rounded-lg transition-colors duration-150 whitespace-nowrap"
      >
        Upgrade to Pro →
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
