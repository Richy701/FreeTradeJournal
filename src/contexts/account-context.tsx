import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { migrateTradesToAccountId } from '@/utils/trade-migration';
import { useAuth } from '@/contexts/auth-context';
import { useProStatus } from '@/contexts/pro-context';
import { useDemoGuard } from '@/hooks/use-demo-guard';
import { useSync } from '@/contexts/sync-context';
import { getChangeVersion, onSyncChange, notifyDataChange } from '@/contexts/sync-context';
import { UserStorage } from '@/utils/user-storage';
import { isLegacyRecord } from '@/lib/account-scope';

// Free-plan cap on trading accounts. Enforced here (the only write path) —
// UI gates in Settings are messaging, not enforcement.
export const FREE_TRADING_ACCOUNT_LIMIT = 2;

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
  const { isPro } = useProStatus();
  const demoGuard = useDemoGuard();
  const userId = user?.uid || null;
  const { initialSyncDone } = useSync();
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [activeAccount, setActiveAccountState] = useState<TradingAccount | null>(null);
  const [loading, setLoading] = useState(true);

  const [syncVersion, setSyncVersion] = useState(() => getChangeVersion());
  useEffect(() => {
    return onSyncChange(() => setSyncVersion(getChangeVersion()));
  }, []);

  // Load accounts from user-scoped localStorage (waits for cloud sync if applicable)
  useEffect(() => {
    const savedAccounts = UserStorage.getItem(userId, 'accounts');

    // If no local data and sync is still in progress, wait for it
    // (prevents creating a default account that would overwrite real synced data)
    if (!savedAccounts && !initialSyncDone) {
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
      let parsedAccounts: TradingAccount[];
      try {
        parsedAccounts = JSON.parse(currentAccounts);
      } catch {
        console.error('[AccountProvider] Corrupted accounts data in storage, resetting.');
        UserStorage.removeItem(userId, 'accounts');
        return;
      }
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
  }, [userId, initialSyncDone, syncVersion]);

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
    if (demoGuard('manage accounts')) {
      throw new Error('Not available in demo mode');
    }
    if (!isPro && accounts.length >= FREE_TRADING_ACCOUNT_LIMIT) {
      toast.error(`Free plan is limited to ${FREE_TRADING_ACCOUNT_LIMIT} trading accounts. Upgrade to Pro for unlimited accounts.`);
      throw new Error('Free account limit reached');
    }
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
    if (demoGuard('manage accounts')) return;
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
    if (demoGuard('manage accounts')) return;
    if (accounts.length <= 1) {
      throw new Error('Cannot delete the last account');
    }

    const remainingAccounts = accounts.filter(acc => acc.id !== id);
    // Exactly one survivor must remain the default — deleting the default
    // account previously left NO default, and legacy (accountId-less) records
    // only resolve to a default account, so they vanished from every view.
    const survivorDefault = remainingAccounts.find(acc => acc.isDefault) || remainingAccounts[0];
    // Legacy-bucket records belonged to the account being deleted only if it
    // was the default-id account (belongsToAccount maps them by id substring).
    // Re-stamp them onto the surviving default instead of deleting them.
    const deletedOwnedLegacy = id.includes('default');
    const restamp = (record: any) =>
      deletedOwnedLegacy && isLegacyRecord(record)
        ? { ...record, accountId: survivorDefault.id }
        : record;

    const savedTrades = UserStorage.getItem(userId, 'trades');
    if (savedTrades) {
      try {
        const allTrades = JSON.parse(savedTrades);
        const filteredTrades = allTrades
          .filter((t: any) => t.accountId !== id)
          .map(restamp);
        UserStorage.setItem(userId, 'trades', JSON.stringify(filteredTrades));
      } catch {
        // If parsing fails, leave trades as-is
      }
    }

    // Journal entries are account-scoped too — purge exact matches only
    // (legacy/unscoped entries are re-stamped, not deleted).
    const savedEntries = UserStorage.getItem(userId, 'journalEntries');
    if (savedEntries) {
      try {
        const allEntries = JSON.parse(savedEntries);
        const filteredEntries = allEntries
          .filter((e: any) => e.accountId !== id)
          .map(restamp);
        UserStorage.setItem(userId, 'journalEntries', JSON.stringify(filteredEntries));
      } catch {
        // If parsing fails, leave entries as-is
      }
    }

    setAccounts(prev => {
      const remaining = prev.filter(acc => acc.id !== id);
      if (!remaining.some(acc => acc.isDefault)) {
        return remaining.map(acc =>
          acc.id === survivorDefault.id ? { ...acc, isDefault: true } : acc
        );
      }
      return remaining;
    });
    notifyDataChange();

    if (activeAccount?.id === id) {
      setActiveAccount({ ...survivorDefault, isDefault: survivorDefault.isDefault || !remainingAccounts.some(a => a.isDefault) });
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
