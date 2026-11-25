import type { ExtendedTrade as Trade, JournalEntry, AccountInfo } from '@/types'
import type { PropFirmAccount, PropFirmTransaction } from '@/types/prop-tracker'
import type { TradingAccount } from '@/contexts/account-context'
import { calculateGrossPnl, computePnlPercentage } from '@/lib/pnl'

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

// Example history: an established trader's last three months on a $50,000
// account, never presented as live market data or a forecast. Seeded, so the
// same trades come out every time (stable screenshots and tests), and every
// P&L goes through the app's own P&L math, so prices, size, costs and totals
// always reconcile. Losing weeks, mistakes and costs are left in on purpose.
const STARTING_BALANCE = 50000
const RISK_PER_TRADE = 250 // 0.5% of the account per trade
const TRADING_DAYS = 64 // about three months of weekdays
const COMMISSION_PER_LOT = 7 // round turn, raw-spread account
const SEED = 3097 // picked by a seed search: see the profile checks in demo-data.test.ts
const round = (value: number) => Math.round(value * 100) / 100

// mulberry32: tiny deterministic PRNG.
function seeded(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
let rand = seeded(SEED)
const pick = <T,>(items: readonly T[]): T => items[Math.floor(rand() * items.length)]
function weighted<T>(entries: ReadonlyArray<readonly [T, number]>): T {
  const total = entries.reduce((sum, [, w]) => sum + w, 0)
  let roll = rand() * total
  for (const [value, w] of entries) { if ((roll -= w) < 0) return value }
  return entries[entries.length - 1][0]
}

function tradingDaysAgo(count: number): Date {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  while (count > 0) {
    date.setDate(date.getDate() - 1)
    if (date.getDay() !== 0 && date.getDay() !== 6) count--
  }
  return date
}
const at = (day: Date, minutes: number) => new Date(day.getTime() + minutes * 60000)

type Symbol = 'EURUSD' | 'GBPUSD' | 'XAUUSD' | 'USDJPY' | 'AUDUSD'
// pip = smallest move the stop is measured in; edge nudges the win rate so the
// Insights pages have real differences to find (gold strong, cable weak).
const SYMBOLS: Record<Symbol, { weight: number; price: number; dailyMove: number; stop: [number, number]; pip: number; decimals: number; edge: number }> = {
  EURUSD: { weight: 26, price: 1.162, dailyMove: 0.0035, stop: [10, 20], pip: 0.0001, decimals: 5, edge: 0.02 },
  GBPUSD: { weight: 18, price: 1.338, dailyMove: 0.0045, stop: [12, 24], pip: 0.0001, decimals: 5, edge: -0.22 },
  XAUUSD: { weight: 30, price: 3340, dailyMove: 18, stop: [35, 75], pip: 0.1, decimals: 2, edge: 0.08 },
  USDJPY: { weight: 16, price: 147.6, dailyMove: 0.45, stop: [14, 26], pip: 0.01, decimals: 3, edge: 0 },
  AUDUSD: { weight: 10, price: 0.664, dailyMove: 0.0025, stop: [9, 17], pip: 0.0001, decimals: 5, edge: 0 },
}
type Slot = 'london' | 'ny' | 'late'
const STRATEGIES: Record<Slot, readonly string[]> = {
  london: ['London breakout', 'Liquidity sweep'],
  ny: ['NY open pullback', 'Trend continuation'],
  late: ['Trend continuation', 'Liquidity sweep'],
}
const slug = (strategy: string) => strategy.toLowerCase().replace(/[^a-z0-9]+/g, '-')

const NOTES = {
  win: [
    'Waited for the retest instead of chasing the first push. Entry, stop and target were all set before the open.',
    'Clean setup on my plan. Took partials at 1R and let the rest run to the target.',
    'Patient entry. I almost passed on it, but every item on the checklist was there.',
    'Textbook. Same size as always, no need to touch it once it was running.',
    'Good read on the session. Price swept the low first, then gave the entry I wanted.',
  ],
  loss: [
    'Valid setup, it just did not work. Full stop, planned size, nothing to fix.',
    'Stopped out at the level I picked. Fine. This is the cost of the strategy.',
    'Entry was fine, news spike took the stop. I will check the calendar more carefully before the NY open.',
  ],
  breakeven: [
    'Moved to breakeven after 1R as the plan says. Got out flat before the reversal.',
  ],
  revenge: [
    'Took this straight after the earlier loss. No real setup, I just wanted the money back. Should have closed the platform.',
  ],
  movedStop: [
    'Moved my stop because I was sure it would turn. It did not. The loss ended up bigger than planned.',
  ],
  chased: [
    'Chased the move after missing the first entry. Bad price, tight stop, predictable result.',
    'Entered early before the candle closed. Impatience cost me here.',
  ],
}

type PracticeTrade = Trade & { accountId: string; date: string; entryTime: Date; exitTime: Date; lotSize: number; market: 'forex'; riskReward: number }

// Exported for the seed search in scripts; the app only uses DEMO_TRADES.
export function generateDemoTrades(seed = SEED): PracticeTrade[] {
  rand = seeded(seed)
  const prices = Object.fromEntries(Object.entries(SYMBOLS).map(([sym, cfg]) => [sym, cfg.price])) as Record<Symbol, number>
  const trades: Omit<PracticeTrade, 'id'>[] = []
  for (let daysBack = TRADING_DAYS; daysBack >= 1; daysBack--) {
    const day = tradingDaysAgo(daysBack)
    for (const sym of Object.keys(SYMBOLS) as Symbol[]) prices[sym] += (rand() - 0.5) * 2 * SYMBOLS[sym].dailyMove
    const count = weighted([[0, 8], [1, 22], [2, 40], [3, 30]] as const)
    const slots: Slot[] = count === 1 ? [rand() < 0.55 ? 'london' : 'ny'] : (['london', 'ny', 'late'] as Slot[]).slice(0, count)
    let dayPnl = 0
    for (const slot of slots) {
      const symbol = weighted((Object.keys(SYMBOLS) as Symbol[]).map(s => [s, SYMBOLS[s].weight] as const))
      const cfg = SYMBOLS[symbol]
      const strategy = pick(STRATEGIES[slot])
      const revenge = slot === 'late' && dayPnl < 0 && rand() < 0.6
      const pWin = 0.57 + cfg.edge + (slot === 'london' ? 0.03 : slot === 'late' ? -0.25 : 0) + (revenge ? -0.15 : 0)
      const plannedRR = pick([1.5, 2, 2, 2.5, 3] as const)
      let r: number
      let mistake: string | null = null
      let kind: keyof typeof NOTES
      if (rand() < 0.04) { r = 0; kind = 'breakeven' }
      else if (rand() < pWin) { r = rand() < 0.35 ? plannedRR : 1 + (plannedRR - 1) * Math.pow(rand(), 0.7); kind = 'win' }
      else {
        const roll = rand()
        if (roll < 0.07) { r = -(1.2 + 0.3 * rand()); mistake = '!moved-stop'; kind = 'movedStop' }
        else if (roll < 0.32) { r = -(0.3 + 0.5 * rand()); kind = 'loss' }
        else { r = -1; kind = 'loss' }
        if (revenge) { mistake = '!revenge'; kind = 'revenge' }
        else if (!mistake && rand() < 0.2) { mistake = pick(['!chased', '!early-entry'] as const); kind = 'chased' }
      }
      const side = rand() < 0.55 ? 'long' : 'short'
      const dir = side === 'long' ? 1 : -1
      const stopDistance = Math.round(cfg.stop[0] + rand() * (cfg.stop[1] - cfg.stop[0])) * cfg.pip
      const entryPrice = Number((prices[symbol] + (rand() - 0.5) * cfg.dailyMove * 0.5).toFixed(cfg.decimals))
      // Size the position so a full stop costs RISK_PER_TRADE.
      const usdPerLotPerUnit = symbol === 'XAUUSD' ? 100 : symbol === 'USDJPY' ? 100000 / entryPrice : 100000
      const lotSize = Math.max(0.1, round(RISK_PER_TRADE / (stopDistance * usdPerLotPerUnit)))
      const exitPrice = Number((entryPrice + dir * r * stopDistance).toFixed(cfg.decimals))
      const gross = round(calculateGrossPnl({ symbol, market: 'forex', side, entryPrice, exitPrice, quantity: lotSize }))
      const commission = round(COMMISSION_PER_LOT * lotSize)
      const pnl = round(gross - commission)
      dayPnl += pnl
      const startMinutes = slot === 'london' ? 8 * 60 + Math.floor(rand() * 150) : slot === 'ny' ? 14 * 60 + 30 + Math.floor(rand() * 100) : 16 * 60 + 10 + Math.floor(rand() * 120)
      const entryTime = at(day, startMinutes)
      const exitTime = at(day, startMinutes + Math.floor(r > 0 ? 25 + rand() * 140 : 10 + rand() * 70))
      const tags = [slug(strategy)]
      if (r >= 2) tags.push('a-plus')
      if (!mistake) tags.push('followed-plan')
      else tags.push(mistake)
      const emotions = kind === 'win' ? pick(['Confident', 'Patient', 'Disciplined'] as const)
        : kind === 'revenge' ? 'Revenge,Frustrated' : kind === 'chased' ? 'FOMO' : kind === 'movedStop' ? 'Uncertain' : kind === 'breakeven' ? 'Patient' : pick(['Disciplined', 'Frustrated'] as const)
      trades.push({
        userId: 'demo-user', accountId: DEMO_ACCOUNT_ID,
        symbol, instrumentType: 'forex', market: 'forex',
        side, action: side === 'long' ? 'buy' : 'sell',
        quantity: lotSize * (symbol === 'XAUUSD' ? 100 : 100000), lotSize, entryPrice, exitPrice, entryTime, exitTime,
        stopLoss: Number((entryPrice - dir * stopDistance).toFixed(cfg.decimals)),
        takeProfit: Number((entryPrice + dir * plannedRR * stopDistance).toFixed(cfg.decimals)),
        riskReward: plannedRR,
        commission, swap: 0, profit: gross, netProfit: pnl, pnl,
        pnlPercentage: round(computePnlPercentage({ pnl, symbol, market: 'forex', entryPrice, quantity: lotSize })),
        date: exitTime.toISOString(), exitDate: exitTime.toISOString(),
        time: entryTime.toTimeString().slice(0, 5), status: 'closed',
        strategy,
        // Most trades get a line or two; some are left blank, like a real journal.
        notes: kind === 'win' && rand() < 0.4 ? '' : pick(NOTES[kind]),
        emotions,
        screenshots: [], tags,
        createdAt: entryTime.toISOString(), updatedAt: exitTime.toISOString(),
      })
    }
  }
  // Newest first, matching how the app lists trades.
  return trades.reverse().map((t, i) => ({ ...t, id: 'demo-trade-' + (i + 1) }))
}

export const DEMO_TRADES: PracticeTrade[] = generateDemoTrades()

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
const ACCOUNT_NAME = 'Alex’s trading account'
export const DEMO_ACCOUNT: AccountInfo = {
  userId: 'demo-user', accountName: ACCOUNT_NAME, brokerName: 'MetaTrader 5',
  accountNumber: 'EXAMPLE', startingBalance: STARTING_BALANCE,
  currentBalance: round(STARTING_BALANCE + DEMO_STATS.netProfit), currency: 'USD', accountType: 'live',
  createdAt: tradingDaysAgo(TRADING_DAYS + 5).toISOString(), updatedAt: new Date().toISOString(),
}

// Journal entries hang off specific trades, so the notes always match the
// trade they sit next to (biggest win, worst loss, the revenge trade...).
const money = (value: number) => `${value < 0 ? '-' : '+'}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const byPnl = [...DEMO_TRADES].sort((a, b) => b.pnl - a.pnl)
// Each entry links a different trade; `used` stops two notes sharing one.
const used = new Set<string>()
const take = (trade: PracticeTrade | undefined) => {
  if (!trade || used.has(trade.id)) return undefined
  used.add(trade.id)
  return trade
}
const find = (test: (t: PracticeTrade, i: number) => boolean) => take(DEMO_TRADES.find((t, i) => !used.has(t.id) && test(t, i)))
type Mood = 'bullish' | 'bearish' | 'neutral'
// Weekly totals, so the weekly-review notes describe weeks that really were up or down.
const weekKey = (d: Date) => { const w = new Date(d); w.setHours(0, 0, 0, 0); w.setDate(w.getDate() - ((w.getDay() + 6) % 7)); return w.getTime() }
const weekTotals = new Map<number, number>()
for (const t of DEMO_TRADES) weekTotals.set(weekKey(t.exitTime), (weekTotals.get(weekKey(t.exitTime)) ?? 0) + t.pnl)
const weeksRanked = [...weekTotals].sort((a, b) => b[1] - a[1])
const bestWeek = weeksRanked[0][0]
const worstWeek = weeksRanked[weeksRanked.length - 1][0]
const journalPicks: Array<[PracticeTrade | undefined, string, (t: PracticeTrade) => string, Mood]> = [
  [take(byPnl[0]), 'Best trade of the quarter', t => `${t.symbol} ${t.side}, ${money(t.pnl)}. Nothing special about the entry. The difference was that I left it alone and let it reach the target instead of closing at 1R like I used to.`, 'bullish'],
  [take(byPnl[byPnl.length - 1]), 'The worst one', t => `${t.symbol}, ${money(t.pnl)}. I knew where my stop was and I moved it anyway. Rule from today: if I want to touch the stop, I close the trade instead.`, 'bearish'],
  [find(t => t.symbol === 'XAUUSD' && t.pnl > 0), 'Why gold works for me', t => `Another clean gold trade (${money(t.pnl)}). Gold is my best market by a distance. It moves enough in the London session that my stops are not getting clipped by noise.`, 'bullish'],
  [find(t => t.tags?.includes('!revenge') ?? false), 'Revenge trade, again', t => `Lost earlier in the day, then took ${t.symbol} late with no real setup (${money(t.pnl)}). My trades after 4pm lose money overall. On red days I am done after the New York open.`, 'bearish'],
  [find(t => t.tags?.includes('!chased') ?? false), 'Chasing costs more than it looks', t => `Missed the first entry on ${t.symbol} and chased it. ${money(t.pnl)}. Chasing is one of my most expensive habits in the tag report, so this is the one I am working on.`, 'neutral'],
  [find(t => t.symbol === 'GBPUSD' && t.pnl < 0), 'Cutting back on GBPUSD', t => `GBPUSD again (${money(t.pnl)}). Over three months it has made me nothing. I will only take it on my best setups and give that risk to gold and EURUSD.`, 'bearish'],
  [find(t => t.pnl < -RISK_PER_TRADE * 0.95 && (t.tags?.includes('followed-plan') ?? false)), 'A good loss', t => `${t.symbol}, ${money(t.pnl)}. Right setup, right size, full stop where it should be. It just did not work. I would take this trade again tomorrow.`, 'neutral'],
  [find(t => weekKey(t.exitTime) === bestWeek && t.pnl > 0), 'Weekly review: best week so far', t => `${money(weekTotals.get(bestWeek)!)} on the week. ${t.symbol} (${money(t.pnl)}) is the kind of trade I want more of: waited for the level, fixed risk, no fiddling once it was running.`, 'bullish'],
  [find(t => weekKey(t.exitTime) === worstWeek && t.pnl < 0), 'Weekly review: a red week', t => `Down ${money(weekTotals.get(worstWeek)!).slice(1)} on the week. ${t.symbol} (${money(t.pnl)}) was typical: decent setups, bad timing. The process held, so I am keeping the same size. A losing week is not a reason to change a plan that works.`, 'neutral'],
  [find(() => true), 'End of day', t => `One ${t.symbol} trade worth writing up (${money(t.pnl)}). Stuck to my two sessions and did not go looking for more. Quiet days like this are most of the job.`, 'neutral'],
]
export const DEMO_JOURNAL_ENTRIES: (JournalEntry & { accountId: string })[] = journalPicks
  .filter((pick): pick is [PracticeTrade, string, (t: PracticeTrade) => string, Mood] => Boolean(pick[0]))
  .map(([trade, title, content, mood], i) => ({
    id: 'demo-journal-' + (i + 1), userId: 'demo-user', accountId: DEMO_ACCOUNT_ID,
    date: trade.exitTime.toISOString(),
    title, content: content(trade), mood, tags: ['review'],
    emotions: ['reflective'], entryType: 'post-trade', tradeId: trade.id,
    createdAt: String(trade.createdAt), updatedAt: String(trade.updatedAt),
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
    name: ACCOUNT_NAME,
    type: 'live',
    broker: 'MetaTrader 5',
    currency: 'USD',
    balance: STARTING_BALANCE,
    isDefault: true,
    createdAt: DEMO_ACCOUNT.createdAt,
  },
]

// Performance goals + risk rules for the demo sandbox. These seed the
// `tradingGoals` / `riskRules` storage keys that PerformanceGoals and the AI
// coaches read. `current` values are kept in sync with DEMO_TRADES.
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
const thisMonthNet = round(DEMO_TRADES.filter(t => t.exitTime >= monthStart).reduce((sum, t) => sum + t.pnl, 0))
export const DEMO_TRADING_GOALS = [
  {
    id: 'demo-pg-1',
    type: 'profit',
    period: 'monthly',
    target: 4000,
    current: thisMonthNet,
    achieved: thisMonthNet >= 4000,
    createdAt: daysAgo(30).toISOString(),
  },
  {
    id: 'demo-pg-2',
    type: 'winRate',
    period: 'monthly',
    target: 55,
    current: DEMO_STATS.winRate,
    achieved: DEMO_STATS.winRate >= 55,
    createdAt: daysAgo(30).toISOString(),
  },
  {
    id: 'demo-pg-3',
    type: 'trades',
    period: 'weekly',
    target: 10,
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
  { id: 'demo-rr-1', type: 'maxLossPerDay', value: 500, enabled: true, violations: 0 },
  { id: 'demo-rr-2', type: 'maxLossPerTrade', value: 300, enabled: true, violations: 0 },
  { id: 'demo-rr-3', type: 'maxDrawdown', value: 3000, enabled: true, violations: 0 },
]
