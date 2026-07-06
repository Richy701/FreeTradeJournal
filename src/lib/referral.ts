const REF_KEY = 'ftj_referral';

// Deliberately plain localStorage, not UserStorage: the ref arrives before
// signup, when no user scope exists yet.
export function captureReferral(): void {
  try {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (!ref) return;
    const clean = ref.trim().toLowerCase().slice(0, 50);
    if (!/^[a-z0-9_-]+$/.test(clean)) return;
    localStorage.setItem(REF_KEY, clean);
  } catch {
    // Storage unavailable (private mode) — attribution falls back to promo codes
  }
}

export function getReferral(): string | null {
  try {
    return localStorage.getItem(REF_KEY);
  } catch {
    return null;
  }
}
