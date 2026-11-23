import type { ExtendedTrade as Trade, JournalEntry, AccountInfo } from '@/types'
import type { PropFirmAccount, PropFirmTransaction } from '@/types/prop-tracker'
import type { TradingAccount } from '@/contexts/account-context'

// Stable id for the seeded demo trading account. Contains "default" so legacy
// demo trades without an explicit accountId still resolve to it.
export const DEMO_ACCOUNT_ID = 'default-demo-account'

// Helper to generate dates relative to today so demo data is always recent
function daysAgo(days: number, time?: string): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  if (time) {
    const [h, m] = time.split(':').map(Number)
    d.setHours(h, m, 0, 0)
  } else {
    d.setHours(0, 0, 0, 0)
  }
  return d
}

// LOCAL date-only key. PropTracker parses date-only strings ("YYYY-MM-DD");
// a full ISO string concatenated with "T12:00:00" there produced Invalid Date
// across every demo card. And toISOString() is UTC — for UTC+ visitors the
// "today" key landed on yesterday, hiding the demo daily-loss bar.
function localDayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Demo user data
export const DEMO_USER = {
  uid: 'demo-user',
  email: 'demo@freetradejournal.com',
  displayName: 'Alex Morgan',
  photoURL: null,
  isDemo: true,
}

// Fictional practice history, never presented as live market data or a forecast.
const STARTING_BALANCE = 2500
const grossResults = [-12, 24, 18, -12, 28, -18, 16, 0, 24, -12, 18, 30, -12, 15, -12, 22, -12, 26, 12, -12, 18, -24, 24, 16]
const round = (value: number) => Math.round(value * 100) / 100

function tradingDaysAgo(count: number, hour: number): Date {
  const date = new Date()
  while (count > 0) {
    date.setDate(date.getDate() - 1)
    if (date.getDay() !== 0 && date.getDay() !== 6) count--
  }
  date.setHours(hour, 15, 0, 0)
  return date
}

type PracticeTrade = Trade & { accountId: string; date: string; entryTime: Date; exitTime: Date; lotSize: number }

export const DEMO_TRADES: PracticeTrade[] = grossResults.map((gross, i) => {
  const entryTime = tradingDaysAgo(Math.floor(i / 2) + 1, i % 2 ? 9 : 8)
  const exitTime = new Date(entryTime.getTime() + (45 + (i % 4) * 30) * 60000)
  const long = i % 3 !== 0
  const entryPrice = i % 2 ? 1.271 : 1.084
  const direction = long ? 1 : -1
  // 0.10 lots of USD-quoted FX = $1 per pip; commission is included in net P&L.
  const exitPrice = Number((entryPrice + direction * gross / 10000).toFixed(5))
  const pnl = round(gross - 0.7)
  return {
    id: 'demo-trade-' + (i + 1), userId: 'demo-user', accountId: DEMO_ACCOUNT_ID,
    symbol: i % 2 ? 'GBPUSD' : 'EURUSD', instrumentType: 'forex',
    side: long ? 'long' : 'short', action: long ? 'buy' : 'sell',
    quantity: 10000, lotSize: 0.1, entryPrice, exitPrice, entryTime, exitTime,
    stopLoss: Number((entryPrice - direction * Math.max(12, -gross) / 10000).toFixed(5)),
    takeProfit: Number((entryPrice + direction * 30 / 10000).toFixed(5)),
    commission: 0.7, swap: 0, profit: gross, netProfit: pnl, pnl,
    pnlPercentage: round(pnl / STARTING_BALANCE * 100),
    date: exitTime.toISOString(), exitDate: exitTime.toISOString(),
    time: entryTime.toTimeString().slice(0, 5), status: 'closed',
    strategy: i % 3 === 0 ? 'Range breakout' : 'Pullback',
    notes: gross > 0 ? 'Waited for my entry and kept the same size. Reviewing the decision matters more than this one result.'
      : gross === 0 ? 'Closed near entry when the setup faded. Commission still makes this a small loss.'
      : i % 3 === 0 ? 'The breakout did not hold. Took the planned loss and stepped away before another entry.'
      : 'I rushed the entry while distracted. Next session I will write the reason down before clicking.',
    emotions: gross > 0 ? 'focused' : 'reflective',
    screenshots: [], tags: [i % 3 === 0 ? 'breakout' : 'pullback', gross > 0 ? 'followed-plan' : 'review'],
    createdAt: entryTime.toISOString(), updatedAt: exitTime.toISOString(),
  }
})

const wins = DEMO_TRADES.filter(t => t.pnl > 0)
const losses = DEMO_TRADES.filter(t => t.pnl < 0)
const totalProfit = round(wins.reduce((sum, t) => sum + t.pnl, 0))
const totalLoss = round(losses.reduce((sum, t) => sum + t.pnl, 0))
export const DEMO_STATS = {
  totalTrades: DEMO_TRADES.length, winningTrades: wins.length, losingTrades: losses.length,
  winRate: round(wins.length / DEMO_TRADES.length * 100), totalProfit, totalLoss,
  netProfit: round(totalProfit + totalLoss),
  averageWin: round(totalProfit / wins.length), averageLoss: round(totalLoss / losses.length),
  profitFactor: round(totalProfit / Math.abs(totalLoss)),
  bestTrade: Math.max(...DEMO_TRADES.map(t => t.pnl)), worstTrade: Math.min(...DEMO_TRADES.map(t => t.pnl)),
  accountGrowth: round((totalProfit + totalLoss) / STARTING_BALANCE * 100),
}
export const DEMO_ACCOUNT: AccountInfo = {
  userId: 'demo-user', accountName: "Alex’s practice account", brokerName: 'Practice account',
  accountNumber: 'EXAMPLE', startingBalance: STARTING_BALANCE,
  currentBalance: round(STARTING_BALANCE + DEMO_STATS.netProfit), currency: 'USD', accountType: 'demo',
  createdAt: daysAgo(30).toISOString(), updatedAt: new Date().toISOString(),
}

const journalNotes = [
  ['A loss I can explain', 'The breakout did not hold. I kept the planned size and closed the trade. Tonight I will compare my entry with the level I marked before the session. One loss does not need another trade to fix it.'],
  ['A short session before work', 'I had a limited window today, so I waited for one clear setup. The trade worked, but the useful part was staying with the plan instead of adding more positions.'],
  ['Reviewing after dinner', 'Looked back at the entry with a clearer head. I want to keep screenshots and a short reason for each trade so the weekly review is easier.'],
  ['The cost of rushing', 'I was distracted and entered before I had written down the reason. Next time I will finish the checklist first. I do not need to trade every session.'],
  ['Small size, clearer thinking', 'Keeping the same size made it easier to stick to the exit. I am practising a repeatable routine, not trying to reach a daily money target.'],
  ['A weekly check-in', 'Some trades worked and some did not. My next focus is simple: note the entry reason before placing a trade and take a break after a loss.'],
]
export const DEMO_JOURNAL_ENTRIES: (JournalEntry & { accountId: string })[] = journalNotes.map(([title, content], i) => ({
  id: 'demo-journal-' + (i + 1), userId: 'demo-user', accountId: DEMO_ACCOUNT_ID,
  date: DEMO_TRADES[i].exitTime instanceof Date ? DEMO_TRADES[i].exitTime.toISOString() : String(DEMO_TRADES[i].exitTime),
  title, content, mood: i === 1 || i === 4 ? 'bullish' : 'neutral', tags: ['process', 'weekly-review'],
  emotions: ['reflective'], entryType: 'post-trade', tradeId: DEMO_TRADES[i].id,
  createdAt: String(DEMO_TRADES[i].createdAt), updatedAt: String(DEMO_TRADES[i].updatedAt),
}))

// Demo PropTracker accounts
export const DEMO_PROP_ACCOUNTS: PropFirmAccount[] = [
  {
    id: 'demo-prop-1',
    firmName: 'FTMO',
    accountSize: 100000,
    accountType: 'funded',
    status: 'active',
    startDate: localDayKey(daysAgo(30)),
    notes: 'Phase 1 passed on first attempt. Currently in funded phase.',
    challengeRules: {
      profitTarget: 10000,
      maxDailyDrawdown: 5,
      maxTotalDrawdown: 10,
      minTradingDays: 4,
    },
    challengeProgress: {
      currentBalance: 106340,
      highWaterMark: 107200,
      tradingDaysCount: 18,
      todayPnL: -860,
      lastUpdated: localDayKey(daysAgo(0)),
    },
    createdAt: daysAgo(30).toISOString(),
  },
  {
    id: 'demo-prop-2',
    firmName: 'Apex Trader Funding',
    accountSize: 50000,
    accountType: 'evaluation',
    status: 'passed',
    startDate: localDayKey(daysAgo(60)),
    endDate: localDayKey(daysAgo(20)),
    notes: 'Passed evaluation. Waiting for funded account activation.',
    createdAt: daysAgo(60).toISOString(),
  },
  {
    id: 'demo-prop-3',
    firmName: 'Tradeify',
    accountSize: 50000,
    accountType: 'evaluation',
    status: 'failed',
    startDate: localDayKey(daysAgo(90)),
    endDate: localDayKey(daysAgo(75)),
    notes: 'Hit max drawdown on a bad week. Reset and restarted.',
    createdAt: daysAgo(90).toISOString(),
  },
  {
    id: 'demo-prop-4',
    firmName: 'The5ers',
    accountSize: 20000,
    accountType: 'instant',
    status: 'active',
    startDate: localDayKey(daysAgo(45)),
    notes: 'Bootcamp plan. Steady progress.',
    challengeRules: {
      profitTarget: 1600,
      maxDailyDrawdown: 3,
      maxTotalDrawdown: 6,
    },
    challengeProgress: {
      currentBalance: 20840,
      highWaterMark: 20840,
      tradingDaysCount: 12,
      lastUpdated: localDayKey(daysAgo(1)),
    },
    createdAt: daysAgo(45).toISOString(),
  },
]

// Demo PropTracker transactions
export const DEMO_PROP_TRANSACTIONS: PropFirmTransaction[] = [
  // FTMO $100k — fees + payouts
  { id: 'demo-tx-1', propAccountId: 'demo-prop-1', type: 'evaluation-fee', amount: 540, description: 'FTMO $100k Challenge fee', date: daysAgo(60).toISOString(), createdAt: daysAgo(60).toISOString() },
  { id: 'demo-tx-2', propAccountId: 'demo-prop-1', type: 'payout', amount: 3200, description: 'First payout — Month 1', date: daysAgo(5).toISOString(), createdAt: daysAgo(5).toISOString() },

  // Apex $50k — evaluation fee
  { id: 'demo-tx-3', propAccountId: 'demo-prop-2', type: 'evaluation-fee', amount: 167, description: 'Apex $50k Evaluation', date: daysAgo(60).toISOString(), createdAt: daysAgo(60).toISOString() },
  { id: 'demo-tx-4', propAccountId: 'demo-prop-2', type: 'payout', amount: 980, description: 'Apex payout after passing', date: daysAgo(18).toISOString(), createdAt: daysAgo(18).toISOString() },

  // Tradeify — fees, reset, failure
  { id: 'demo-tx-5', propAccountId: 'demo-prop-3', type: 'evaluation-fee', amount: 150, description: 'Tradeify $50k Evaluation fee', date: daysAgo(90).toISOString(), createdAt: daysAgo(90).toISOString() },
  { id: 'demo-tx-6', propAccountId: 'demo-prop-3', type: 'reset-fee', amount: 75, description: 'Reset after drawdown breach', date: daysAgo(76).toISOString(), createdAt: daysAgo(76).toISOString() },

  // The5ers $20k
  { id: 'demo-tx-7', propAccountId: 'demo-prop-4', type: 'evaluation-fee', amount: 95, description: 'The5ers Bootcamp $20k', date: daysAgo(45).toISOString(), createdAt: daysAgo(45).toISOString() },
  { id: 'demo-tx-8', propAccountId: 'demo-prop-4', type: 'payout', amount: 620, description: 'The5ers first profit share', date: daysAgo(10).toISOString(), createdAt: daysAgo(10).toISOString() },
]

// Trading account shown in the account switcher for the demo sandbox.
export const DEMO_ACCOUNTS: TradingAccount[] = [
  {
    id: DEMO_ACCOUNT_ID,
    name: "Alex’s practice account",
    type: 'demo',
    broker: 'Practice account',
    currency: 'USD',
    balance: STARTING_BALANCE,
    isDefault: true,
    createdAt: daysAgo(30).toISOString(),
  },
]

// Performance goals + risk rules for the demo sandbox. These seed the
// `tradingGoals` / `riskRules` storage keys that PerformanceGoals and the AI
// coaches read. `current` values are kept in sync with DEMO_TRADES.
export const DEMO_TRADING_GOALS = [
  {
    id: 'demo-pg-1',
    type: 'profit',
    period: 'monthly',
    target: 150,
    current: DEMO_STATS.netProfit,
    achieved: false,
    createdAt: daysAgo(30).toISOString(),
  },
  {
    id: 'demo-pg-2',
    type: 'winRate',
    period: 'monthly',
    target: 55,
    current: DEMO_STATS.winRate,
    achieved: false,
    createdAt: daysAgo(30).toISOString(),
  },
  {
    id: 'demo-pg-3',
    type: 'trades',
    period: 'weekly',
    target: 8,
    current: 0,
    achieved: false,
    createdAt: daysAgo(30).toISOString(),
    achievedAt: daysAgo(2).toISOString(),
  },
]

// Limits sit close to how this trader actually sizes, so the sandbox shows a
// realistic mix: mostly disciplined days with a few that crossed a limit. Set
// them far above the worst day (the old 500/250) and the Risk section can only
// ever say "all clear", which is not what the feature is for.
export const DEMO_TRADING_RISK_RULES = [
  { id: 'demo-rr-1', type: 'maxLossPerDay', value: 35, enabled: true, violations: 0 },
  { id: 'demo-rr-2', type: 'maxLossPerTrade', value: 20, enabled: true, violations: 0 },
  { id: 'demo-rr-3', type: 'maxDrawdown', value: 200, enabled: true, violations: 0 },
]
