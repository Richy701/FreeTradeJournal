import { Link } from 'react-router-dom';
import { X, Sparkles } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';

const DISMISS_KEY = 'prop-tracker-announcement-v1-dismissed';

export function PropTrackerAnnouncement() {
  const { user, isDemo } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed] = useState(() => {
    return localStorage.getItem(DISMISS_KEY) === 'true';
  });
  const bannerRef = useRef<HTMLDivElement>(null);

  const updateHeight = useCallback(() => {
    const height = bannerRef.current?.offsetHeight ?? 0;
    document.documentElement.style.setProperty('--announcement-banner-height', `${height}px`);
  }, []);

  useEffect(() => {
    if (user && !isDemo && !isDismissed) {
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    } else {
      document.documentElement.style.setProperty('--announcement-banner-height', '0px');
    }
  }, [user, isDemo, isDismissed]);

  useEffect(() => {
    if (!isVisible) return;
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [isVisible, updateHeight]);

  if (!user || isDemo || isDismissed) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    document.documentElement.style.setProperty('--announcement-banner-height', '0px');
    localStorage.setItem(DISMISS_KEY, 'true');
  };

  return (
    <div
      ref={bannerRef}
      className={`fixed top-0 left-0 right-0 z-50 border-b border-amber-500/30 bg-background/95 backdrop-blur-sm px-3 sm:px-4 py-2.5 shadow-sm transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
      style={{ paddingTop: `calc(env(safe-area-inset-top, 0px) + 0.625rem)` }}
    >
      <div className="container mx-auto flex items-center justify-between gap-2 max-w-6xl">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">New</span>
          </div>
          <p className="text-xs sm:text-sm text-foreground/80 truncate">
            <span className="sm:hidden font-medium text-foreground">PropTracker is live!</span>
            <span className="hidden sm:inline">
              <span className="font-semibold text-foreground">PropTracker is live</span>
              {' — '}track every prop firm fee, payout, and net P&L across all your accounts. Free.
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <Link
            to="/prop-tracker"
            onClick={handleDismiss}
            className="text-xs sm:text-sm font-semibold text-amber-500 hover:text-amber-400 transition-colors whitespace-nowrap"
          >
            Try it →
          </Link>
          <button
            onClick={handleDismiss}
            className="p-1.5 hover:bg-muted rounded-md transition-colors touch-manipulation text-muted-foreground hover:text-foreground"
            aria-label="Dismiss announcement"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
