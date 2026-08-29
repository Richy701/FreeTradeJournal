import { useState, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { updatePostHogConsent } from '@/lib/posthog';
import {
  OPEN_COOKIE_SETTINGS_EVENT,
  analyticsConsentGiven,
  isCookieConsentPending,
  writeCookieConsent,
} from '@/lib/cookie-consent';

/**
 * Cookie consent panel. Non-blocking card, bottom-left on desktop and a
 * full-width sheet on mobile. Nothing optional is set until a choice is made;
 * Accept and Decline carry equal weight; Manage exposes the one real choice
 * (analytics) as a switch. Reopens via openCookieSettings() so consent can be
 * withdrawn as easily as it was given.
 */
export const CookieConsent = () => {
  const [open, setOpen] = useState(false);
  const [manage, setManage] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (isCookieConsentPending()) {
      const t = setTimeout(() => setOpen(true), 1000);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    const reopen = () => {
      setAnalytics(analyticsConsentGiven());
      setManage(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
  }, []);

  const decide = (allowAnalytics: boolean) => {
    writeCookieConsent(allowAnalytics);
    updatePostHogConsent(allowAnalytics);
    setOpen(false);
    setManage(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-labelledby={titleId}
          aria-describedby={descId}
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className="fixed inset-x-0 bottom-0 z-50 p-3 sm:inset-x-auto sm:left-4 sm:bottom-4 sm:p-0 sm:w-[380px]"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <div className="rounded-xl border border-border bg-card text-card-foreground shadow-xl p-5">
            <h2 id={titleId} className="text-sm font-semibold">Cookies</h2>
            <p id={descId} className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              We use one optional set of cookies, for analytics, so we can see which features get used.
              Nothing optional is set until you choose.{' '}
              <Link to="/cookie-policy" className="underline underline-offset-2 hover:text-foreground">
                Cookie policy
              </Link>
            </p>

            {manage && (
              <div className="mt-4 rounded-lg border border-border/70 divide-y divide-border/50">
                <div className="flex items-start justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium">Necessary</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Sign-in session and your own journal data. Always on.</p>
                  </div>
                  <Switch checked disabled aria-label="Necessary cookies, always on" className="mt-0.5" />
                </div>
                <div className="flex items-start justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium">Analytics</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">PostHog usage data linked to your account. Off by default.</p>
                  </div>
                  <Switch
                    checked={analytics}
                    onCheckedChange={setAnalytics}
                    aria-label="Analytics cookies"
                    className="mt-0.5"
                  />
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {manage ? (
                <Button size="sm" variant="outline" className="h-8 px-4 text-xs flex-1 sm:flex-none" onClick={() => decide(analytics)}>
                  Save choices
                </Button>
              ) : (
                <>
                  <Button size="sm" variant="outline" className="h-8 px-4 text-xs flex-1 sm:flex-none" onClick={() => decide(true)}>
                    Accept analytics
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 px-4 text-xs flex-1 sm:flex-none" onClick={() => decide(false)}>
                    Decline
                  </Button>
                </>
              )}
              <button
                type="button"
                onClick={() => setManage((m) => !m)}
                className="ml-auto text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                {manage ? 'Back' : 'Manage'}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
