import { Link } from 'react-router-dom';
import { X, Timer, ArrowRight } from '@phosphor-icons/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useProStatus } from '@/contexts/pro-context';
import { useThemePresets } from '@/contexts/theme-presets';
import { trackEvent } from '@/lib/analytics';
import { LIFETIME_RETIRES_AT } from '@/constants/pricing';

const snoozeKeyFor = (uid: string | undefined) => `founder-offer-banner-snoozed-until-${uid || 'anon'}`;
const dismissKeyFor = (uid: string | undefined) => `founder-offer-banner-dismissed-${uid || 'anon'}`;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function shouldShowBanner(uid: string | undefined): boolean {
  // The banner removes itself when the offer stops being redeemable.
  if (Date.now() > LIFETIME_RETIRES_AT) return false;

  // Permanently dismissed (clicked the CTA)
  if (localStorage.getItem(dismissKeyFor(uid)) === 'true') return false;

  // Snoozed (clicked X) — hidden until snooze expires
  const snoozedUntil = localStorage.getItem(snoozeKeyFor(uid));
  if (snoozedUntil && Date.now() < parseInt(snoozedUntil, 10)) return false;

  return true;
}

export function FounderOfferAnnouncement() {
  const { user, isDemo } = useAuth();
  // Trial users still see the offer — they are exactly the founders audience.
  // Only users whose Pro comes from a real subscription (or referral) are exempt.
  const { isPro, trialEndsAt } = useProStatus();
  const { themeColors } = useThemePresets();
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(true);
  const [show] = useState(() => shouldShowBanner(user?.uid));
  const bannerRef = useRef<HTMLDivElement>(null);

  const isPayingPro = isPro && !trialEndsAt;

  const updateHeight = useCallback(() => {
    const height = bannerRef.current?.offsetHeight ?? 0;
    document.documentElement.style.setProperty('--announcement-banner-height', `${height}px`);
  }, []);

  useEffect(() => {
    if (user && !isDemo && !isPayingPro && show) {
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    } else {
      document.documentElement.style.setProperty('--announcement-banner-height', '0px');
    }
  }, [user, isDemo, isPayingPro, show]);

  useEffect(() => {
    if (!isVisible) return;
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [isVisible, updateHeight]);

  if (!user || isDemo || isPayingPro || !show || !mounted) return null;

  const dismiss = () => {
    setIsVisible(false);
    document.documentElement.style.setProperty('--announcement-banner-height', '0px');
    setTimeout(() => setMounted(false), 500);
  };

  // X = snooze for 24h
  const handleSnooze = () => {
    localStorage.setItem(snoozeKeyFor(user?.uid), String(Date.now() + ONE_DAY_MS));
    dismiss();
  };

  // CTA = permanently dismissed
  const handleCta = () => {
    trackEvent('pricing_cta_clicked', { plan: 'lifetime', source: 'founder_banner' });
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
            <span className="hidden sm:inline-flex shrink-0 items-center gap-1 rounded-full bg-white/20 border border-white/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
              <Timer className="h-2.5 w-2.5" aria-hidden="true" />
              Last chance
            </span>
            <p className="text-xs sm:text-sm font-medium text-white">
              <span className="sm:hidden">
                <span className="font-bold">Lifetime Pro: $149</span> — retiring in August.
              </span>
              <span className="hidden sm:inline">
                <span className="font-bold">Lifetime Pro retires in August</span>
                <span className="text-white/90"> — $149 instead of $249 with code FOUNDER149.</span>
              </span>
            </p>
          </div>

          {/* Right: CTA + dismiss */}
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
