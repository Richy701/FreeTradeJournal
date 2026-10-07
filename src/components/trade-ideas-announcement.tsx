import { Link, useLocation } from 'react-router-dom';
import { X, UsersThree, ArrowRight } from '@phosphor-icons/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useThemePresets } from '@/contexts/theme-presets';
import { useUserStorage } from '@/utils/user-storage';
import { trackEvent } from '@/lib/analytics';

const DISMISSED_KEY = 'tradeIdeasBannerDismissed';
/** Stamped by the Trade Ideas page when the welcome dialog opens — the feed has been found. */
const WELCOME_SEEN_KEY = 'tradeIdeasWelcomeSeen';
const TRADE_IDEAS_PATH = '/trade-ideas';

/**
 * One-time strip at the top of every app page announcing the Trade Ideas feed.
 * Goes away for good on X, on the CTA, or once the user has opened the feed.
 */
export function TradeIdeasAnnouncement() {
  const { user, isDemo } = useAuth();
  const { themeColors } = useThemePresets();
  const userStorage = useUserStorage();
  const location = useLocation();
  const bannerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(true);
  // Read once at mount: opening the feed stamps the welcome key, and a live
  // read would pull the strip out from under the user mid-navigation.
  const [show] = useState(
    () => userStorage.getItem(DISMISSED_KEY) !== '1' && userStorage.getItem(WELCOME_SEEN_KEY) !== '1',
  );

  const onFeed = location.pathname === TRADE_IDEAS_PATH;
  const eligible = !!user && !isDemo && show && !onFeed;

  const updateHeight = useCallback(() => {
    const height = bannerRef.current?.offsetHeight ?? 0;
    document.documentElement.style.setProperty('--announcement-banner-height', `${height}px`);
  }, []);

  useEffect(() => {
    if (eligible) {
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
    setIsVisible(false);
    document.documentElement.style.setProperty('--announcement-banner-height', '0px');
  }, [eligible]);

  useEffect(() => {
    if (!isVisible) return;
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [isVisible, updateHeight]);

  useEffect(() => {
    if (isVisible) trackEvent('trade_ideas_banner_shown');
  }, [isVisible]);

  if (!eligible || !mounted) return null;

  const dismiss = (source: 'close' | 'cta') => {
    trackEvent('trade_ideas_banner_dismissed', { source });
    void userStorage.setItem(DISMISSED_KEY, '1');
    setIsVisible(false);
    document.documentElement.style.setProperty('--announcement-banner-height', '0px');
    setTimeout(() => setMounted(false), 500);
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
      <div
        className="relative border-b px-3 sm:px-6 py-3"
        style={{
          background: themeColors.primary,
          borderColor: `${themeColors.primary}80`,
          boxShadow: `0 8px 32px -8px ${themeColors.primary}40`,
        }}
      >
        {/* Dark overlay to keep white text readable on light presets */}
        <div className="absolute inset-0 bg-black/25 pointer-events-none" aria-hidden="true" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" aria-hidden="true" />

        <div className="relative container mx-auto flex items-center justify-between gap-3 max-w-6xl">
          <div className="flex items-center gap-3 min-w-0">
            <span className="hidden sm:inline-flex shrink-0 items-center gap-1 rounded-full bg-white/20 border border-white/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
              <UsersThree className="h-2.5 w-2.5" aria-hidden="true" />
              New
            </span>
            <p className="text-xs sm:text-sm font-medium text-white">
              <span className="sm:hidden">
                <span className="font-bold">Trade Ideas is live.</span> Post setups, link the result.
              </span>
              <span className="hidden sm:inline">
                <span className="font-bold">Trade Ideas is live.</span>
                <span className="text-white/90"> Post a setup, link the trade afterwards, and the result shows next to it for everyone.</span>
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              to={TRADE_IDEAS_PATH}
              onClick={() => dismiss('cta')}
              className="flex items-center gap-1.5 rounded-full bg-white/95 hover:bg-white active:scale-95 px-3.5 py-1 text-xs font-bold transition-[colors,transform] whitespace-nowrap shadow-md"
              style={{ color: themeColors.primary }}
            >
              Take a look
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
            <button
              onClick={() => dismiss('close')}
              className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/15 transition-colors touch-manipulation"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
