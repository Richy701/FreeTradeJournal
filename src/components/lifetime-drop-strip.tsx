import { Link } from 'react-router-dom';
import { X, Timer, ArrowRight } from '@phosphor-icons/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useProStatus } from '@/contexts/pro-context';
import { useThemePresets } from '@/contexts/theme-presets';
import { trackEvent } from '@/lib/analytics';
import { LIFETIME_DROP_PRICE, type LifetimeDropPhase } from '@/constants/pricing';
import {
  LIFETIME_DROP_PATH,
  dropCountdownBadge,
  dropDaysLeft,
  dropTargetFor,
  effectiveDropPhase,
  isDropStripAudience,
  isDropStripSnoozed,
  previewDropPhase,
  shortCountdown,
  snoozeDropStrip,
} from '@/lib/lifetime-drop';

/**
 * One slim strip for the whole lifetime drop, in two phases. Before the open
 * it names the offer and counts down live to 9:30 AM New York; from the open
 * it counts down to the close.
 * No modal this time. X snoozes for a day, per phase, so the open re-shows
 * it to anyone who dismissed the teaser. Paying Pro and the demo never see it.
 */
export function LifetimeDropStrip() {
  const { user, isDemo } = useAuth();
  const { isPro, trialEndsAt } = useProStatus();
  const { themeColors } = useThemePresets();
  const [now, setNow] = useState(() => Date.now());
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(true);
  const stripRef = useRef<HTMLDivElement>(null);

  const preview = previewDropPhase();
  // The demo account reads as paying Pro; the dev preview ignores that.
  const isPayingPro = isPro && !trialEndsAt && !preview;

  // Phase is read once per mount; a page load at 9:30 flips it. Refreshing
  // mid-tick would otherwise swap the wording under the user's cursor.
  const [phase] = useState<LifetimeDropPhase>(() => effectiveDropPhase());
  const [show] = useState(() => phase !== 'closed' && !isDropStripSnoozed(user?.uid, phase));

  const eligible =
    show && (preview ? !!user : isDropStripAudience({ uid: user?.uid, isDemo, isPayingPro }));

  const updateHeight = useCallback(() => {
    const height = stripRef.current?.offsetHeight ?? 0;
    document.documentElement.style.setProperty('--announcement-banner-height', `${height}px`);
  }, []);

  useEffect(() => {
    if (!eligible) {
      document.documentElement.style.setProperty('--announcement-banner-height', '0px');
      return;
    }
    const timer = setTimeout(() => setIsVisible(true), 800);
    return () => clearTimeout(timer);
  }, [eligible]);

  useEffect(() => {
    if (!isVisible) return;
    updateHeight();
    window.addEventListener('resize', updateHeight);
    const tick = setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      window.removeEventListener('resize', updateHeight);
      clearInterval(tick);
    };
  }, [isVisible, updateHeight]);

  if (!eligible || !mounted) return null;

  const lastDay = phase === 'open' && dropDaysLeft(now) <= 0;
  const remaining = shortCountdown(dropTargetFor(phase), now);

  const dismiss = () => {
    setIsVisible(false);
    document.documentElement.style.setProperty('--announcement-banner-height', '0px');
    setTimeout(() => setMounted(false), 500);
  };

  const handleSnooze = () => {
    snoozeDropStrip(user?.uid, phase);
    trackEvent('lifetime_drop_strip_dismissed', { phase });
    dismiss();
  };

  const handleCta = () => {
    trackEvent('pricing_cta_clicked', { plan: 'lifetime', source: `drop_strip_${phase}` });
  };

  return (
    <div
      ref={stripRef}
      role="region"
      aria-label="Announcement"
      className={`sticky top-0 z-40 transition-transform duration-500 ease-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div
        className="relative border-b px-3 py-2.5 sm:px-6"
        style={{
          background: themeColors.primary,
          borderColor: `${themeColors.primary}80`,
          boxShadow: `0 8px 32px -8px ${themeColors.primary}40`,
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-black/25" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" aria-hidden="true" />

        <div className="container relative mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/30 bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest tabular-nums text-white">
              <Timer className="h-2.5 w-2.5" aria-hidden="true" />
              {phase === 'before' ? `Opens in ${remaining}` : lastDay ? 'Last day' : dropCountdownBadge(now)}
            </span>
            <p className="truncate text-xs font-medium text-white sm:text-sm">
              {phase === 'before' ? (
                <>
                  <span className="font-bold">Lifetime Pro is back Friday 9:30 AM New York</span>
                  <span className="hidden text-white/90 sm:inline"> at ${LIFETIME_DROP_PRICE} instead of $249, for one week only.</span>
                  <span className="text-white/90 sm:hidden"> at ${LIFETIME_DROP_PRICE}.</span>
                </>
              ) : (
                <>
                  <span className="font-bold">
                    {lastDay ? 'Last day: Lifetime Pro closes tonight' : 'Lifetime Pro is back for one week'}
                  </span>
                  <span className="hidden text-white/90 sm:inline"> at ${LIFETIME_DROP_PRICE} instead of $249. One payment, no renewal.</span>
                  <span className="text-white/90 sm:hidden"> at ${LIFETIME_DROP_PRICE}.</span>
                </>
              )}
            </p>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            <Link
              to={LIFETIME_DROP_PATH}
              onClick={handleCta}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white/95 px-3.5 py-1 text-xs font-bold shadow-md transition-[colors,transform] hover:bg-white active:scale-95"
              style={{ color: themeColors.primary }}
            >
              {phase === 'before' ? 'See the drop' : 'Get Lifetime'}
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
            <button
              onClick={handleSnooze}
              className="touch-manipulation rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/15 hover:text-white"
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
