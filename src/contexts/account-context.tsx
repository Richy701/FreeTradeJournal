import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { migrateTradesToAccountId } from '@/utils/trade-migration';
import { useAuth } from '@/contexts/auth-context';
import { useSync } from '@/contexts/sync-context';
import { UserStorage } from '@/utils/user-storage';

export interface TradingAccount {
  id: string;
  name: string;
  type: 'demo' | 'live' | 'prop-firm' | 'paper';
  broker: string;
  currency: string;
  balance?: number;
  isDefault: boolean;
  createdAt: string;
}

interface AccountContextType {
  accounts: TradingAccount[];
  activeAccount: TradingAccount | null;
  setActiveAccount: (account: TradingAccount) => void;
  addAccount: (account: Omit<TradingAccount, 'id' | 'createdAt'>) => TradingAccount;
  updateAccount: (id: string, updates: Partial<TradingAccount>) => void;
  deleteAccount: (id: string) => void;
  loading: boolean;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function useAccounts() {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccounts must be used within an AccountProvider');
  }
  return context;
}

interface AccountProviderProps {
  children: ReactNode;
}

export function AccountProvider({ children }: AccountProviderProps) {
  const { user } = useAuth();
  const userId = user?.uid || null;
  const { initialSyncDone } = useSync();
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [activeAccount, setActiveAccountState] = useState<TradingAccount | null>(null);
  const [loading, setLoading] = useState(true);

  // Load accounts from user-scoped localStorage (waits for cloud sync if applicable)
  useEffect(() => {
    const savedAccounts = UserStorage.getItem(userId, 'accounts');

    // DEBUG: Log what we found
    console.log('[AccountProvider] userId:', userId, 'savedAccounts:', savedAccounts?.substring(0, 50), 'initialSyncDone:', initialSyncDone);

    // If no local data and sync is still in progress, wait for it
    // (prevents creating a default account that would overwrite real synced data)
    if (!savedAccounts && !initialSyncDone) {
      console.log('[AccountProvider] No local data and sync not done, waiting...');
      return;
    }

    // Migrate legacy unscoped key if it exists
    const legacyAccounts = localStorage.getItem('trading-accounts');
    if (legacyAccounts && userId) {
      const existing = UserStorage.getItem(userId, 'accounts');
      if (!existing) {
        UserStorage.setItem(userId, 'accounts', legacyAccounts);
      }
      localStorage.removeItem('trading-accounts');
    }
    const legacyActiveId = localStorage.getItem('active-account-id');
    if (legacyActiveId && userId) {
      const existing = UserStorage.getItem(userId, 'active-account-id');
      if (!existing) {
        UserStorage.setItem(userId, 'active-account-id', legacyActiveId);
      }
      localStorage.removeItem('active-account-id');
    }

    // Re-read after legacy migration may have written data
    const currentAccounts = UserStorage.getItem(userId, 'accounts');
    const savedActiveAccountId = UserStorage.getItem(userId, 'active-account-id');

    if (currentAccounts) {
      const parsedAccounts = JSON.parse(currentAccounts);
      setAccounts(parsedAccounts);

      if (savedActiveAccountId) {
        const activeAcc = parsedAccounts.find((acc: TradingAccount) => acc.id === savedActiveAccountId);
        if (activeAcc) {
          setActiveAccountState(activeAcc);
        } else {
          const defaultAcc = parsedAccounts.find((acc: TradingAccount) => acc.isDefault);
          setActiveAccountState(defaultAcc || parsedAccounts[0] || null);
        }
      } else {
        const defaultAcc = parsedAccounts.find((acc: TradingAccount) => acc.isDefault);
        setActiveAccountState(defaultAcc || parsedAccounts[0] || null);
      }
    } else {
      const defaultAccount: TradingAccount = {
        id: 'default-' + Date.now(),
        name: 'Main Account',
        type: 'demo',
        broker: 'Demo Broker',
        currency: 'USD',
        isDefault: true,
        createdAt: new Date().toISOString()
      };
      setAccounts([defaultAccount]);
      setActiveAccountState(defaultAccount);
      UserStorage.setItem(userId, 'accounts', JSON.stringify([defaultAccount]));
      UserStorage.setItem(userId, 'active-account-id', defaultAccount.id);
    }

    migrateTradesToAccountId();
    setLoading(false);
  }, [userId, initialSyncDone]);

  // Save accounts whenever they change
  useEffect(() => {
    if (accounts.length > 0 && !loading) {
      UserStorage.setItem(userId, 'accounts', JSON.stringify(accounts));
    }
  }, [accounts, loading, userId]);

  const setActiveAccount = (account: TradingAccount) => {
    setActiveAccountState(account);
    UserStorage.setItem(userId, 'active-account-id', account.id);
  };

  const addAccount = (accountData: Omit<TradingAccount, 'id' | 'createdAt'>): TradingAccount => {
    const newAccount: TradingAccount = {
      ...accountData,
      id: 'account-' + Date.now(),
      createdAt: new Date().toISOString()
    };

    if (accounts.length === 0 || accountData.isDefault) {
      setAccounts(prev => prev.map(acc => ({ ...acc, isDefault: false })));
    }

    setAccounts(prev => [...prev, newAccount]);

    if (accounts.length === 0 || accountData.isDefault) {
      setActiveAccount(newAccount);
    }

    return newAccount;
  };

  const updateAccount = (id: string, updates: Partial<TradingAccount>) => {
    setAccounts(prev => {
      const updatedAccounts = prev.map(acc => {
        if (acc.id === id) {
          const updated = { ...acc, ...updates };
          if (activeAccount?.id === id) {
            setActiveAccountState(updated);
          }
          return updated;
        }
        return acc;
      });

      if (updates.isDefault) {
        return updatedAccounts.map(acc =>
          acc.id === id ? acc : { ...acc, isDefault: false }
        );
      }

      return updatedAccounts;
    });
  };

  const deleteAccount = (id: string) => {
    if (accounts.length <= 1) {
      throw new Error('Cannot delete the last account');
    }

    const savedTrades = UserStorage.getItem(userId, 'trades');
    if (savedTrades) {
      try {
        const allTrades = JSON.parse(savedTrades);
        const filteredTrades = allTrades.filter((t: any) => t.accountId !== id);
        UserStorage.setItem(userId, 'trades', JSON.stringify(filteredTrades));
      } catch {
        // If parsing fails, leave trades as-is
      }
    }

    setAccounts(prev => prev.filter(acc => acc.id !== id));

    if (activeAccount?.id === id) {
      const remainingAccounts = accounts.filter(acc => acc.id !== id);
      const newActive = remainingAccounts.find(acc => acc.isDefault) || remainingAccounts[0];
      setActiveAccount(newActive);
    }
  };

  const value: AccountContextType = useMemo(() => ({
    accounts,
    activeAccount,
    setActiveAccount,
    addAccount,
    updateAccount,
    deleteAccount,
    loading
  }), [accounts, activeAccount, setActiveAccount, addAccount, updateAccount, deleteAccount, loading]);

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
}
