// Migration utility to add accountId to existing trades
export function migrateTradesToAccountId(): { migrated: number; total: number } {
  const MIGRATION_KEY = 'trades-accountId-migration-v1';
  
  // Check if migration already ran
  if (localStorage.getItem(MIGRATION_KEY) === 'completed') {
    return { migrated: 0, total: 0 };
  }
  
  try {
    const storedTrades = localStorage.getItem('trades');
    if (!storedTrades) {
      localStorage.setItem(MIGRATION_KEY, 'completed');
      return { migrated: 0, total: 0 };
    }
    
    const trades = JSON.parse(storedTrades);
    if (!Array.isArray(trades)) {
      localStorage.setItem(MIGRATION_KEY, 'completed');
      return { migrated: 0, total: 0 };
    }
    
    let migratedCount = 0;
    const defaultAccountId = 'default-main-account';
    
    // Update trades that don't have accountId
    const updatedTrades = trades.map((trade: any) => {
      if (!trade.accountId) {
        migratedCount++;
        return {
          ...trade,
          accountId: defaultAccountId
        };
      }
      return trade;
    });
    
    // Save updated trades if any were migrated
    if (migratedCount > 0) {
      localStorage.setItem('trades', JSON.stringify(updatedTrades));
      // Trade Migration: Added accountId to trades
    }
    
    // Mark migration as completed
    localStorage.setItem(MIGRATION_KEY, 'completed');
    
    return { migrated: migratedCount, total: trades.length };
    
  } catch (error) {
    console.error('Trade migration failed:', error);
    // Mark as completed to prevent retry loops
    localStorage.setItem(MIGRATION_KEY, 'completed');
    return { migrated: 0, total: 0 };
  }
}