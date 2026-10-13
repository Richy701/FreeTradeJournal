export interface WeeklyDigestStats {
  tradeCount: number
  winRate: number
  pnl: string
  bestTrade: string
  multipleCurrencies: boolean
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// Missing/corrupt sync data is not evidence of an empty trading week.
export function weeklyDigestStats(tradesValue: string | null | undefined, settingsValue: string | null | undefined, accountsValue: string | null | undefined, start: number, end: number): WeeklyDigestStats {
  if (!tradesValue) throw new Error('Trade sync unavailable')
  const trades: unknown = JSON.parse(tradesValue)
  const settings: unknown = settingsValue ? JSON.parse(settingsValue) : {}
  const accounts: unknown = accountsValue ? JSON.parse(accountsValue) : []
  if (!Array.isArray(trades) || !record(settings) || !Array.isArray(accounts)) throw new Error('Invalid sync data')
  const currency = (value: unknown) => {
    if (typeof value !== 'string' || !/^[A-Z]{3}$/.test(value)) throw new Error('Invalid currency')
    return value
  }
  const defaultCurrency = settings.currency === undefined ? 'USD' : currency(settings.currency)
  const accountCurrencies = new Map<string, string>()
  for (const account of accounts) {
    if (!record(account) || typeof account.id !== 'string') throw new Error('Invalid account data')
    accountCurrencies.set(account.id, account.currency === undefined ? defaultCurrency : currency(account.currency))
  }
  const groups = new Map<string, { total: number; best: number }>()
  let tradeCount = 0
  let wins = 0
  for (const trade of trades) {
    if (!record(trade)) throw new Error('Invalid trade data')
    const date = trade.exitTime || trade.date
    const timestamp = typeof date === 'string' || typeof date === 'number' ? new Date(date).getTime() : NaN
    if (!Number.isFinite(timestamp)) throw new Error('Invalid trade date')
    if (timestamp < start || timestamp > end) continue
    if ((typeof trade.pnl !== 'number' && typeof trade.pnl !== 'string') || trade.pnl === '' || !Number.isFinite(Number(trade.pnl))) throw new Error('Invalid trade result')
    const pnl = Number(trade.pnl)
    const code = typeof trade.accountId === 'string' ? accountCurrencies.get(trade.accountId) : undefined
    if (trade.accountId && !code) throw new Error('Trade account currency unavailable')
    const groupCode = code || defaultCurrency
    const group = groups.get(groupCode) || { total: 0, best: -Infinity }
    group.total += pnl
    group.best = Math.max(group.best, pnl)
    groups.set(groupCode, group)
    tradeCount++
    if (pnl > 0) wins++
  }
  const format = (code: string, value: number) => `${code} ${value < 0 ? '−' : '+'}${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const ordered = [...groups].sort(([a], [b]) => a.localeCompare(b))
  return {
    tradeCount, winRate: tradeCount ? Math.round(wins / tradeCount * 100) : 0,
    pnl: ordered.map(([code, group]) => format(code, group.total)).join(' · '),
    bestTrade: ordered.map(([code, group]) => format(code, group.best)).join(' · '),
    multipleCurrencies: groups.size > 1,
  }
}
