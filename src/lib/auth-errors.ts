// Returns a user-facing message for a failed Google sign-in, or null when the
// user closed the popup themselves and no error should be shown.
export function googleAuthErrorMessage(error: unknown): string | null {
  const code = (error as { code?: string })?.code;
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return null;
  }
  if (code === 'auth/popup-blocked') {
    return 'Your browser blocked the sign-in window. Allow popups for this site and try again.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network error. Check your connection and try again.';
  }
  if (code === 'auth/account-exists-with-different-credential') {
    return 'An account already exists with this email. Sign in with your email and password instead.';
  }
  return 'Google sign-in failed. Please try again.';
}
