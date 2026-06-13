import { createContext, useContext, useEffect, useCallback, useState, useRef, useMemo, type ReactNode } from 'react';
import { useUserStorage } from '@/utils/user-storage';
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
  const { activeAccount } = useAccounts();

  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  // Set when settings state is updated from a remote sync pull, so the
  // save-on-change effect skips re-writing (and re-pushing) the same value.
  const applyingRemoteRef = useRef(false);

  // Active account currency takes priority over global setting
  const effectiveCurrency = activeAccount?.currency || settings.currency;

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = storageRef.current.getItem('settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({
          ...defaultSettings,
          ...parsed,
        });
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
    setLoading(false);
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (!loading) {
      // Skip when the change came from a remote pull — the sync engine already
      // wrote it to storage (with skipSync), so re-writing would echo it back.
      if (applyingRemoteRef.current) {
        applyingRemoteRef.current = false;
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
