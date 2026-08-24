import { Link } from 'react-router-dom';
import { X, Timer, ArrowRight } from '@phosphor-icons/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useProStatus } from '@/contexts/pro-context';
import { useThemePresets } from '@/contexts/theme-presets';
import { trackEvent } from '@/lib/analytics';
import { BIRTHDAY_LIFETIME_PRICE, isBirthdayLifetimeWindow } from '@/constants/pricing';
import {
  birthdayCountdownBadge,
  birthdayDaysLeft,
  isBirthdayDialogAudience,
  isBirthdayDialogPending,
} from '@/lib/birthday-lifetime';

const snoozeKeyFor = (uid: string | undefined) => `birthday-banner-snoozed-until-${uid || 'anon'}`;
const dismissKeyFor = (uid: string | undefined) => `birthday-banner-dismissed-${uid || 'anon'}`;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Dev-only ?birthday=banner previews the banner outside the window; it still
// writes the normal snooze/dismiss keys, which is fine for a dev account.
const previewBanner = () =>
  import.meta.env.DEV &&
  (new URLSearchParams(window.location.search).get('birthday') === 'banner' ||
    sessionStorage.getItem('birthday-preview') === 'banner');

function shouldShowBanner(uid: string | undefined): boolean {
  if (!isBirthdayLifetimeWindow() && !previewBanner()) return false;
  if (localStorage.getItem(dismissKeyFor(uid)) === 'true') return false;

  // X = snoozed for 24h. On the last day an earlier snooze is stale news
  // ("closes tonight" is new), so it gets one more showing.
  const snoozedUntil = localStorage.getItem(snoozeKeyFor(uid));
  if (snoozedUntil && Date.now() < parseInt(snoozedUntil, 10)) {
    const snoozedAtDay = Math.floor((parseInt(snoozedUntil, 10) - ONE_DAY_MS) / ONE_DAY_MS);
    const todayDay = Math.floor(Date.now() / ONE_DAY_MS);
    if (birthdayDaysLeft() > 0 || snoozedAtDay === todayDay) return false;
  }
  return true;
}

/**
 * Sticky top banner for the birthday lifetime week (28 Aug to 4 Sep 2026).
 * Structure mirrors FounderOfferAnnouncement. The dialog owns the first load
 * for users who qualify for it; the banner takes every load after.
 */
export function BirthdayLifetimeAnnouncement() {
  const { user, isDemo } = useAuth();
  const { isPro, trialEndsAt } = useProStatus();
  const { themeColors } = useThemePresets();
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(true);
  const [show] = useState(() => shouldShowBanner(user?.uid));
  const bannerRef = useRef<HTMLDivElement>(null);

  // The demo account reads as paying Pro; the dev preview ignores that.
  const isPayingPro = isPro && !trialEndsAt && !previewBanner();

  const [dialogPending] = useState(() => isBirthdayDialogPending(user?.uid));
  const dialogWillShow =
    dialogPending &&
    isBirthdayDialogAudience({ uid: user?.uid, isDemo, isPayingPro, isTrialing: !!trialEndsAt });

  const updateHeight = useCallback(() => {
    const height = bannerRef.current?.offsetHeight ?? 0;
    document.documentElement.style.setProperty('--announcement-banner-height', `${height}px`);
  }, []);

  useEffect(() => {
    if (user && (!isDemo || previewBanner()) && !isPayingPro && show && !dialogWillShow) {
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    } else {
      document.documentElement.style.setProperty('--announcement-banner-height', '0px');
    }
  }, [user, isDemo, isPayingPro, show, dialogWillShow]);

  useEffect(() => {
    if (!isVisible) return;
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [isVisible, updateHeight]);

  if (!user || (isDemo && !previewBanner()) || isPayingPro || !show || !mounted || dialogWillShow) return null;

  const lastDay = birthdayDaysLeft() <= 0;

  const dismiss = () => {
    setIsVisible(false);
    document.documentElement.style.setProperty('--announcement-banner-height', '0px');
    setTimeout(() => setMounted(false), 500);
  };

  const handleSnooze = () => {
    localStorage.setItem(snoozeKeyFor(user?.uid), String(Date.now() + ONE_DAY_MS));
    dismiss();
  };

  const handleCta = () => {
    trackEvent('pricing_cta_clicked', { plan: 'lifetime', source: 'birthday_banner' });
    localStorage.setItem(dismissKeyFor(user?.uid), 'true');
    dismiss();
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
        <div className="absolute inset-0 bg-black/25 pointer-events-none" aria-hidden="true" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" aria-hidden="true" />

        <div className="relative container mx-auto flex items-center justify-between gap-3 max-w-6xl">
          <div className="flex items-center gap-3 min-w-0">
            <span className="hidden sm:inline-flex shrink-0 items-center gap-1 rounded-full bg-white/20 border border-white/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
              <Timer className="h-2.5 w-2.5" aria-hidden="true" />
              {birthdayCountdownBadge()}
            </span>
            <p className="text-xs sm:text-sm font-medium text-white">
              <span className="sm:hidden">
                <span className="font-bold">Lifetime Pro is back: ${BIRTHDAY_LIFETIME_PRICE}</span>
                {lastDay ? ', closes tonight.' : ', one week only.'}
              </span>
              <span className="hidden sm:inline">
                <span className="font-bold">
                  {lastDay
                    ? 'Last day: Lifetime Pro closes tonight'
                    : 'FreeTradeJournal is one. Lifetime Pro is back for one week'}
                </span>
                <span className="text-white/90">
                  {' '}at ${BIRTHDAY_LIFETIME_PRICE} instead of $249. One payment, no renewal.
                </span>
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              to="/pricing"
              onClick={handleCta}
              className="flex items-center gap-1.5 rounded-full bg-white/95 hover:bg-white active:scale-95 px-3.5 py-1 text-xs font-bold transition-[colors,transform] whitespace-nowrap shadow-md"
              style={{ color: themeColors.primary }}
            >
              Get Lifetime
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
