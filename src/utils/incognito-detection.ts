/**
 * Detect if the browser is in incognito/private mode
 * Uses various browser-specific detection methods
 */
export async function isIncognitoMode(): Promise<boolean> {
  // Method 1: Check localStorage persistence
  try {
    localStorage.setItem('__incognito_test__', '1');
    localStorage.removeItem('__incognito_test__');
  } catch {
    return true; // localStorage not available = likely incognito
  }

  // Method 2: Check if storage quota is reduced (common in incognito)
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota || 0;

      // Incognito mode typically has much smaller quota (few MB vs GB)
      // Normal: ~several GB, Incognito: ~10-120MB
      if (quota < 120000000) { // Less than 120MB
        return true;
      }
    } catch {
      // Ignore errors
    }
  }

  // Method 3: FileSystem API check (Safari)
  if ('webkitRequestFileSystem' in window) {
    try {
      await new Promise((resolve, reject) => {
        (window as any).webkitRequestFileSystem(
          0, // TEMPORARY
          0,
          resolve,
          reject
        );
      });
    } catch {
      return true; // Failed = likely incognito in Safari
    }
  }

  return false;
}

/**
 * Show a warning if user is in incognito mode
 * Should be called on app load for free users
 */
export async function warnIfIncognito(isPro: boolean): Promise<void> {
  if (isPro) return; // Pro users have cloud sync, so incognito is fine

  const isIncognito = await isIncognitoMode();
  if (isIncognito) {
    // Will be imported and used where toast is available
    return;
  }
}
