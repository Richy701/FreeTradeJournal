import { useEffect, useState } from 'react';

// A clock for timed offers. Re-renders every `intervalMs` and whenever the tab
// comes back into view, so a page left open across a sale boundary flips its
// prices, cards and banners on its own instead of advertising a dead offer.
export function useSaleClock(intervalMs = 15_000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', tick);
    };
  }, [intervalMs]);

  return now;
}
