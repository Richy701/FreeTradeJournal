import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useUserStorage } from '@/utils/user-storage';
import { DEFAULT_VALUES } from '@/constants/trading';

export interface AppSettings {
  currency: string;
  riskPerTrade: number;
  accountSize: number;
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
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = userStorage.getItem('settings');
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
      userStorage.setItem('settings', JSON.stringify(settings));
    }
  }, [settings, loading]);

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...updates,
    }));
  };

  const getCurrencySymbol = () => {
    switch (settings.currency) {
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
  };

  const formatCurrency = (amount: number, showSign: boolean = true) => {
    const symbol = getCurrencySymbol();
    const formatted = Math.abs(amount).toFixed(2);

    // Handle different currency symbol positions
    if (['USD', 'CAD', 'AUD'].includes(settings.currency)) {
      // Symbol before amount
      const sign = showSign && amount !== 0 ? (amount > 0 ? '+' : '-') : '';
      return `${sign}${symbol}${formatted}`;
    } else if (settings.currency === 'EUR') {
      // Symbol after amount for EUR
      const sign = showSign && amount !== 0 ? (amount > 0 ? '+' : '-') : '';
      return `${sign}${formatted}${symbol}`;
    } else {
      // Default: symbol before amount
      const sign = showSign && amount !== 0 ? (amount > 0 ? '+' : '-') : '';
      return `${sign}${symbol}${formatted}`;
    }
  };

  const value: SettingsContextType = {
    settings,
    updateSettings,
    formatCurrency,
    getCurrencySymbol,
    loading
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
