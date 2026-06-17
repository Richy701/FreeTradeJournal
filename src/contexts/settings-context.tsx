import { createContext, useContext, useEffect, useCallback, useState, useRef, useMemo, type ReactNode } from 'react';
import { useUserStorage, markSettingsDirty } from '@/utils/user-storage';
import { useAuth } from '@/contexts/auth-context';
import { useAccounts } from '@/contexts/account-context';
import { onSyncChange } from '@/contexts/sync-context';
import { DEFAULT_VALUES } from '@/constants/trading';

export interface AppSettings {
  currency: string;
  riskPerTrade: number;
  accountSize: number;
  showMarketPrices: boolean;
  showMacroSnapshot: boolean;
  dashboardLayout?: { hidden: string[]; order: string[] };
}

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  formatCurrency: (amount: number, showSign?: boolean) => string;
  getCurrencySymbol: () => string;
  loading: boolean;
}

const defaultSettings: AppSettings = {
  currency: DEFAULT_VALUES.CURRENCY,
  riskPerTrade: DEFAULT_VALUES.RISK_PER_TRADE,
  accountSize: DEFAULT_VALUES.STARTING_BALANCE,
  showMarketPrices: true,
  showMacroSnapshot: true,
  dashboardLayout: { hidden: [], order: [] },
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const userStorage = useUserStorage();
  const storageRef = useRef(userStorage);
  storageRef.current = userStorage;
  const { user } = useAuth();
  const userId = user?.uid ?? null;
  const uidRef = useRef<string | null>(userId);
  uidRef.current = userId;
  const { activeAccount } = useAccounts();

  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  // Set when settings state is updated from a remote sync pull, so the
  // save-on-change effect skips re-writing (and re-pushing) the same value.
  const applyingRemoteRef = useRef(false);
  // Set while loading settings from storage (mount / user-scope change) so the
  // save-on-change effect doesn't echo the just-loaded value back to storage/sync.
  const hydratingRef = useRef(false);

  // Active account currency takes priority over global setting
  const effectiveCurrency = activeAccount?.currency || settings.currency;

  // Load settings from per-user storage. Re-runs when the user scope (userId)
  // changes: on first paint userId is null until Firebase auth resolves async,
  // so the initial read hits the GUEST scope and misses the signed-in user's
  // saved settings — which made every dashboard/Customize change reset on
  // refresh. Re-reading once the uid is known loads the real per-user settings.
  useEffect(() => {
    hydratingRef.current = true;
    const savedSettings = storageRef.current.getItem('settings');
    if (savedSettings) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
      } catch (error) {
        console.error('Error loading settings:', error);
        setSettings(defaultSettings);
      }
    } else {
      // No saved settings in this scope — reset so a prior scope's values
      // (e.g. guest defaults read before auth resolved) don't linger.
      setSettings(defaultSettings);
    }
    setLoading(false);
  }, [userId]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (!loading) {
      // Skip when the change came from a remote pull — the sync engine already
      // wrote it to storage (with skipSync), so re-writing would echo it back.
      if (applyingRemoteRef.current) {
        applyingRemoteRef.current = false;
        return;
      }
      // Skip echoing a value we just loaded from storage (mount / scope change).
      // Real user changes persist directly inside updateSettings, so skipping
      // here can't drop a write.
      if (hydratingRef.current) {
        hydratingRef.current = false;
        return;
      }
      storageRef.current.setItem('settings', JSON.stringify(settings));
    }
  }, [settings, loading]);

  // Pro cloud sync: when the sync engine pulls remote changes, re-read settings
  // so the live UI (currency, toggles, dashboard layout) reflects other devices.
  useEffect(() => {
    return onSyncChange(() => {
      const saved = storageRef.current.getItem('settings');
      if (!saved) return;
      let parsed: Partial<AppSettings>;
      try {
        parsed = JSON.parse(saved);
      } catch {
        return;
      }
      setSettings(prev => {
        const next = { ...defaultSettings, ...parsed };
        if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
        applyingRemoteRef.current = true;
        return next;
      });
    });
  }, []);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    // Flag this as a deliberate local edit so the sync engine keeps it
    // authoritative instead of letting a stale remote pull overwrite it.
    markSettingsDirty(uidRef.current);
    setSettings(prev => {
      const next = { ...prev, ...updates };
      // Save immediately to ensure persistence
      storageRef.current.setItem('settings', JSON.stringify(next));
      return next;
    });
  }, []);

  const getCurrencySymbol = useCallback(() => {
    switch (effectiveCurrency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'JPY': return '¥';
      case 'CAD': return 'C$';
      case 'AUD': return 'A$';
      case 'CHF': return 'CHF';
      case 'CNY': return '¥';
      default: return '$';
    }
  }, [effectiveCurrency]);

  const formatCurrency = useCallback((amount: number, showSign: boolean = true) => {
    const symbol = (() => {
      switch (effectiveCurrency) {
        case 'USD': return '$';
        case 'EUR': return '€';
        case 'GBP': return '£';
        case 'JPY': return '¥';
        case 'CAD': return 'C$';
        case 'AUD': return 'A$';
        case 'CHF': return 'CHF';
        case 'CNY': return '¥';
        default: return '$';
      }
    })();
    const formatted = Math.abs(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    // Handle different currency symbol positions
    if (['USD', 'CAD', 'AUD'].includes(effectiveCurrency)) {
      const sign = showSign && amount !== 0 ? (amount > 0 ? '+' : '-') : '';
      return `${sign}${symbol}${formatted}`;
    } else if (effectiveCurrency === 'EUR') {
      const sign = showSign && amount !== 0 ? (amount > 0 ? '+' : '-') : '';
      return `${sign}${formatted}${symbol}`;
    } else {
      const sign = showSign && amount !== 0 ? (amount > 0 ? '+' : '-') : '';
      return `${sign}${symbol}${formatted}`;
    }
  }, [effectiveCurrency]);

  const value: SettingsContextType = useMemo(() => ({
    settings,
    updateSettings,
    formatCurrency,
    getCurrencySymbol,
    loading
  }), [settings, updateSettings, formatCurrency, getCurrencySymbol, loading]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
