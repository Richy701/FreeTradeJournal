/**
 * Cookie consent record. One optional category (analytics); everything else
 * the app stores is strictly necessary (auth session, your own trade data,
 * this record). Versioned so a policy change can re-prompt, and expiring
 * after 12 months so consent is refreshed as regulators expect.
 */
export const COOKIE_CONSENT_KEY = 'cookieConsent';
export const COOKIE_CONSENT_VERSION = 2;
const CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

export const OPEN_COOKIE_SETTINGS_EVENT = 'ftj:open-cookie-settings';

export interface CookieConsent {
  necessary: true;
  analytics: boolean;
  timestamp: string;
  version?: number;
}

export function readCookieConsent(): CookieConsent | null {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CookieConsent>;
    if (typeof parsed.analytics !== 'boolean' || typeof parsed.timestamp !== 'string') return null;
    return { necessary: true, analytics: parsed.analytics, timestamp: parsed.timestamp, version: parsed.version };
  } catch {
    return null;
  }
}

/** True when there is no usable record: never asked, expired, or from an older policy version. */
export function isCookieConsentPending(now: number = Date.now()): boolean {
  const c = readCookieConsent();
  if (!c) return true;
  if ((c.version ?? 1) < COOKIE_CONSENT_VERSION) return true;
  const at = Date.parse(c.timestamp);
  return !Number.isFinite(at) || now - at > CONSENT_MAX_AGE_MS;
}

export function analyticsConsentGiven(): boolean {
  return !isCookieConsentPending() && readCookieConsent()?.analytics === true;
}

export function writeCookieConsent(analytics: boolean): CookieConsent {
  const record: CookieConsent = {
    necessary: true,
    analytics,
    timestamp: new Date().toISOString(),
    version: COOKIE_CONSENT_VERSION,
  };
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(record));
  } catch {
    // Storage blocked (private mode): the choice still applies for this load.
  }
  return record;
}

/** Reopen the consent panel from anywhere (footer link, Settings, Cookie Policy). */
export function openCookieSettings(): void {
  window.dispatchEvent(new CustomEvent(OPEN_COOKIE_SETTINGS_EVENT));
}
