import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

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
  addAccount: (account: Omit<TradingAccount, 'id' | 'createdAt'>) => void;
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
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [activeAccount, setActiveAccountState] = useState<TradingAccount | null>(null);
  const [loading, setLoading] = useState(true);

  // Load accounts from localStorage on mount
  useEffect(() => {
    const savedAccounts = localStorage.getItem('trading-accounts');
    const savedActiveAccountId = localStorage.getItem('active-account-id');
    
    if (savedAccounts) {
      const parsedAccounts = JSON.parse(savedAccounts);
      setAccounts(parsedAccounts);
      
      // Set active account
      if (savedActiveAccountId) {
        const activeAcc = parsedAccounts.find((acc: TradingAccount) => acc.id === savedActiveAccountId);
        if (activeAcc) {
          setActiveAccountState(activeAcc);
        } else {
          // Fallback to default account
          const defaultAcc = parsedAccounts.find((acc: TradingAccount) => acc.isDefault);
          setActiveAccountState(defaultAcc || parsedAccounts[0] || null);
        }
      } else {
        // No saved active account, use default or first
        const defaultAcc = parsedAccounts.find((acc: TradingAccount) => acc.isDefault);
        setActiveAccountState(defaultAcc || parsedAccounts[0] || null);
      }
    } else {
      // Create default account for first-time users
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
      localStorage.setItem('trading-accounts', JSON.stringify([defaultAccount]));
      localStorage.setItem('active-account-id', defaultAccount.id);
    }
    
    setLoading(false);
  }, []);

  // Save accounts to localStorage whenever accounts change
  useEffect(() => {
    if (accounts.length > 0 && !loading) {
      localStorage.setItem('trading-accounts', JSON.stringify(accounts));
    }
  }, [accounts, loading]);

  const setActiveAccount = (account: TradingAccount) => {
    setActiveAccountState(account);
    localStorage.setItem('active-account-id', account.id);
  };

  const addAccount = (accountData: Omit<TradingAccount, 'id' | 'createdAt'>) => {
    const newAccount: TradingAccount = {
      ...accountData,
      id: 'account-' + Date.now(),
      createdAt: new Date().toISOString()
    };

    // If this is the first account or marked as default, make it default
    if (accounts.length === 0 || accountData.isDefault) {
      setAccounts(prev => prev.map(acc => ({ ...acc, isDefault: false })));
    }

    setAccounts(prev => [...prev, newAccount]);
    
    // Set as active if it's the first account or marked as default
    if (accounts.length === 0 || accountData.isDefault) {
      setActiveAccount(newAccount);
    }
  };

  const updateAccount = (id: string, updates: Partial<TradingAccount>) => {
    setAccounts(prev => {
      const updatedAccounts = prev.map(acc => {
        if (acc.id === id) {
          const updated = { ...acc, ...updates };
          
          // Update active account if it's the one being updated
          if (activeAccount?.id === id) {
            setActiveAccountState(updated);
          }
          
          return updated;
        }
        return acc;
      });
      
      // If setting as default, remove default from others
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

    setAccounts(prev => prev.filter(acc => acc.id !== id));
    
    // If deleting active account, switch to another one
    if (activeAccount?.id === id) {
      const remainingAccounts = accounts.filter(acc => acc.id !== id);
      const newActive = remainingAccounts.find(acc => acc.isDefault) || remainingAccounts[0];
      setActiveAccount(newActive);
    }
  };

  const value: AccountContextType = {
    accounts,
    activeAccount,
    setActiveAccount,
    addAccount,
    updateAccount,
    deleteAccount,
    loading
  };

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
}