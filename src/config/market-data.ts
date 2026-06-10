// Public feature flag (non-secret) gating the market-data widgets.
// API keys themselves live server-side and are injected by the api/ proxies.
export const MARKET_DATA_ENABLED = import.meta.env.VITE_MARKET_DATA_ENABLED === 'true'
