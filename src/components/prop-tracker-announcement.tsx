import { Link } from 'react-router-dom';
import { X, TrendingUp, ArrowRight } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useThemePresets } from '@/contexts/theme-presets';

const FIRST_SHOWN_KEY = 'prop-tracker-announcement-v2-first-shown';
const SNOOZED_UNTIL_KEY = 'prop-tracker-announcement-v2-snoozed-until';
const DISMISSED_KEY = 'prop-tracker-announcement-v2-dismissed';
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function shouldShowBanner(): boolean {
  // Permanently dismissed (clicked "Try it")
  if (localStorage.getItem(DISMISSED_KEY) === 'true') return false;

  const now = Date.now();

  // Snoozed (clicked X) — hidden until snooze expires
  const snoozedUntil = localStorage.getItem(SNOOZED_UNTIL_KEY);
  if (snoozedUntil && now < parseInt(snoozedUntil, 10)) return false;

  // Record first-shown timestamp
  let firstShown = localStorage.getItem(FIRST_SHOWN_KEY);
  if (!firstShown) {
    localStorage.setItem(FIRST_SHOWN_KEY, String(now));
    firstShown = String(now);
  }

  // Hide after 2 weeks from first shown
  if (now - parseInt(firstShown, 10) > TWO_WEEKS_MS) return false;

  return true;
}

export function PropTrackerAnnouncement() {
  const { user, isDemo } = useAuth();
  const { themeColors } = useThemePresets();
  const [isVisible, setIsVisible] = useState(false);
  const [show] = useState(() => shouldShowBanner());
  const bannerRef = useRef<HTMLDivElement>(null);

  const updateHeight = useCallback(() => {
    const height = bannerRef.current?.offsetHeight ?? 0;
    document.documentElement.style.setProperty('--announcement-banner-height', `${height}px`);
  }, []);

  useEffect(() => {
    if (user && !isDemo && show) {
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    } else {
      document.documentElement.style.setProperty('--announcement-banner-height', '0px');
    }
  }, [user, isDemo, show]);

  useEffect(() => {
    if (!isVisible) return;
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [isVisible, updateHeight]);

  if (!user || isDemo || !show) return null;

  // X = snooze for 24h
  const handleSnooze = () => {
    setIsVisible(false);
    document.documentElement.style.setProperty('--announcement-banner-height', '0px');
    localStorage.setItem(SNOOZED_UNTIL_KEY, String(Date.now() + ONE_DAY_MS));
  };

  // "Try it" = permanently dismissed
  const handleTry = () => {
    setIsVisible(false);
    document.documentElement.style.setProperty('--announcement-banner-height', '0px');
    localStorage.setItem(DISMISSED_KEY, 'true');
  };

  return (
    <div
      ref={bannerRef}
      role="region"
      aria-label="Announcement"
      className={`sticky top-0 z-40 transition-transform duration-500 ease-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      {/* Banner */}
      <div
        className="relative border-b px-3 sm:px-6 py-3"
        style={{
          background: themeColors.primary,
          borderColor: `${themeColors.primary}80`,
          boxShadow: `0 8px 32px -8px ${themeColors.primary}40`,
        }}
      >
        {/* Dark overlay to ensure white text contrast */}
        <div className="absolute inset-0 bg-black/25 pointer-events-none" aria-hidden="true" />
        {/* Top highlight streak */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" aria-hidden="true" />

        <div className="relative container mx-auto flex items-center justify-between gap-3 max-w-6xl">
          {/* Left: badge + text */}
          <div className="flex items-center gap-3 min-w-0">
            {/* NEW pill */}
            <span className="hidden sm:inline-flex shrink-0 items-center gap-1 rounded-full bg-white/20 border border-white/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
              <TrendingUp className="h-2.5 w-2.5" aria-hidden="true" />
              New
            </span>
            <p className="text-xs sm:text-sm font-medium text-white truncate">
              <span className="sm:hidden">
                <span className="font-bold">PropTracker is live</span> — track every prop firm fee & payout.
              </span>
              <span className="hidden sm:inline">
                <span className="font-bold">PropTracker is live</span>
                <span className="text-white/90"> — finally know if your prop firm journey is actually profitable. Free.</span>
              </span>
            </p>
          </div>

          {/* Right: CTA + dismiss */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              to="/prop-tracker"
              onClick={handleTry}
              className="flex items-center gap-1.5 rounded-full bg-white/95 hover:bg-white active:scale-95 px-3.5 py-1 text-xs font-bold transition-[colors,transform] whitespace-nowrap shadow-md"
              style={{ color: themeColors.primary }}
            >
              Try it free
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
            <button
              onClick={handleSnooze}
              className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/15 transition-colors touch-manipulation"
              aria-label="Dismiss for today"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
