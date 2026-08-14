import { useCallback } from 'react';
import { useSettings } from '@/contexts/settings-context';
import { useAccounts } from '@/contexts/account-context';

export type PnlDisplayMode = 'currency' | 'percent';

// Shared money-vs-percent display preference for P&L values (per-trade and
// stats). Percent is P&L over the account balance — the same denominator the
// "Percentage of account balance" badges already use — NOT the per-trade
// notional stored in trade.pnlPercentage.
export function usePnlDisplay() {
  const { settings, updateSettings, formatCurrency } = useSettings();
  const { scopeStartingBalance } = useAccounts();

  const mode: PnlDisplayMode = settings.pnlDisplayMode === 'percent' ? 'percent' : 'currency';
  // Starting balance across the account scope — the single active account, or
  // the summed currency group in the combined "All accounts" view
  const accountBalance = scopeStartingBalance || settings.accountSize || 10000;

  const setMode = useCallback(
    (m: PnlDisplayMode) => updateSettings({ pnlDisplayMode: m }),
    [updateSettings]
  );

  const formatPnl = useCallback(
    (amount: number, opts?: { showSign?: boolean }) => {
      const showSign = opts?.showSign !== false;
      const value = Number.isFinite(amount) ? amount : 0;
      if (mode === 'percent') {
        const pct = accountBalance > 0 ? (value / accountBalance) * 100 : 0;
        const sign = showSign && pct !== 0 ? (pct > 0 ? '+' : '-') : '';
        return `${sign}${Math.abs(pct).toFixed(2)}%`;
      }
      return formatCurrency(showSign ? value : Math.abs(value), showSign);
    },
    [mode, accountBalance, formatCurrency]
  );

  return { mode, setMode, formatPnl, accountBalance };
}
