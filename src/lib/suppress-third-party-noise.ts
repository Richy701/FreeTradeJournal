// Ad/privacy blockers block TradingView's embed chunks, which makes TradingView's
// own loader throw an uncaught ChunkLoadError we can't try/catch (it happens
// inside their dynamic import). The widgets already degrade gracefully in the UI;
// this swallows just those rejections so they don't spam the console or get
// reported to error tracking as app errors.
//
// Registered in the capture phase so it runs before PostHog's global exception
// handler and can stop the event from reaching it.
export function installThirdPartyErrorFilter() {
  if (typeof window === 'undefined') return;

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      const reason: any = event.reason;
      const message =
        typeof reason === 'string' ? reason : reason?.message || '';
      const isChunkError =
        reason?.name === 'ChunkLoadError' ||
        /Loading chunk\s+\S+\s+failed/i.test(message);

      if (isChunkError && /tradingview/i.test(message)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );
}
