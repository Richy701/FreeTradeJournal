import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { trackGateHit } from '@/lib/track-activity'
import DOMPurify from 'dompurify'
import {
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
} from "recharts"
import {
  Plus,
  Buildings,
  TrendUp,
  CaretDown,
  CaretUp,
  Pencil,
  Trash,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  X,
  Info,
  Brain,
  Lock,
  Warning,
  CheckCircle,
  ChartBar,
  UploadSimple,
  Tag,
  ArrowsClockwise,
  Target,
  ListChecks,
  Calculator,
  ClipboardText,
  ArrowRight,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { NoticeBanner } from '@/components/notice-banner'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { SiteHeader } from '@/components/site-header'
import { AppFooter } from '@/components/app-footer'
import { useUserStorage } from '@/utils/user-storage'
import { useDemoGuard } from '@/hooks/use-demo-guard'
import { useThemePresets } from '@/contexts/theme-presets'
import { useProStatus } from '@/contexts/pro-context'
import { useAuth } from '@/contexts/auth-context'
import { getDemoPropAnalysis, DEMO_AI_USAGE } from '@/lib/demo-ai'
import { ProGate } from '@/components/pro-gate'
import { toast } from 'sonner'
import { requestPropAnalysis, requestScreenshotParse } from '@/services/ai-analysis'
import type { ParsedTransaction } from '@/services/ai-analysis'
import { Link } from 'react-router-dom'
import { trackEvent } from '@/lib/analytics'
import { ProUpgradeCard } from '@/components/pro-upgrade-card'
import type {
  PropFirmAccount,
  PropFirmTransaction,
  PropAccountType,
  PropAccountStatus,
  PropCurrency,
  TransactionType,
  ChallengeRules,
  ChallengeProgress,
} from '@/types/prop-tracker'

// ─── Constants ───────────────────────────────────────────────────────────────

const PROP_FIRMS = [
  'TopStep',
  'Apex Trader Funding',
  'My Funded Futures (MFFU)',
  'FTMO',
  'The5ers',
  'E8 Markets',
  'FundedNext',
  'Funded Trading Plus',
  'Tradeday',
  'Tradeify',
  'Take Profit Trader',
  'Funding Pips',
  'Lucid Trading',
  'Alpha Futures',
  'Aqua Funded',
  'Custom...',
] as const

type PropTab = 'accounts' | 'performance' | 'coach'
type PerfRange = '3m' | '6m' | '12m' | 'all'

const FREE_ACCOUNT_LIMIT = 1

const ACCOUNT_SIZES = [10000, 25000, 50000, 75000, 80000, 100000, 150000, 200000, 300000]

const CURRENCY_OPTIONS: { value: PropCurrency; label: string; symbol: string }[] = [
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'EUR', label: 'EUR (\u20AC)', symbol: '\u20AC' },
  { value: 'GBP', label: 'GBP (\u00A3)', symbol: '\u00A3' },
  { value: 'CHF', label: 'CHF', symbol: 'CHF ' },
  { value: 'AUD', label: 'AUD (A$)', symbol: 'A$' },
  { value: 'CAD', label: 'CAD (C$)', symbol: 'C$' },
  { value: 'JPY', label: 'JPY (\u00A5)', symbol: '\u00A5' },
  { value: 'CZK', label: 'CZK', symbol: 'CZK ' },
]

const ACCOUNT_TYPE_OPTIONS: { value: PropAccountType; label: string }[] = [
  { value: 'evaluation', label: 'Evaluation' },
  { value: 'funded', label: 'Funded' },
  { value: 'instant', label: 'Instant Funding' },
  { value: 'express', label: 'Express' },
]

const STATUS_OPTIONS: {
  value: PropAccountStatus
  label: string
  badgeClass: string
}[] = [
  { value: 'active',    label: 'Active',    badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  { value: 'passed',    label: 'Passed',    badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  { value: 'failed',    label: 'Failed',    badgeClass: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20' },
  { value: 'withdrawn', label: 'Withdrawn', badgeClass: 'bg-muted text-muted-foreground border-border' },
]

const TX_TYPE_OPTIONS: { value: TransactionType; label: string; isExpense: boolean; badgeClass: string }[] = [
  { value: 'evaluation-fee', label: 'Evaluation Fee', isExpense: true,  badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  { value: 'reset-fee',      label: 'Reset Fee',      isExpense: true,  badgeClass: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20' },
  { value: 'monthly-fee',    label: 'Monthly Fee',    isExpense: true,  badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  { value: 'payout',         label: 'Payout',         isExpense: false, badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  { value: 'other-expense',  label: 'Other Expense',  isExpense: true,  badgeClass: 'bg-muted text-muted-foreground border-border' },
]


const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
]

const FIRM_BRAND_COLORS: Record<string, string> = {
  'TopStep':                    '#FFCC06',
  'Apex Trader Funding':        '#007BFF',
  'My Funded Futures (MFFU)':   '#D8AE5E',
  'FTMO':                       '#0781FE',
  'The5ers':                    '#FFD000',
  'E8 Markets':                 '#30D5F1',
  'FundedNext':                 '#635BFF',
  'Funded Trading Plus':        '#4169E1',
  'Tradeday':                   '#4D65FF',
  'Tradeify':                   '#00C853',
  'Take Profit Trader':         '#22C55E',
  'Funding Pips':               '#1E3A5F',
  'Lucid Trading':              '#FFFFFF',
  'Alpha Futures':              '#00E676',
  'Aqua Funded':                '#2979FF',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// YYYY-MM-DD in the user's local timezone. toISOString() would roll evening
// entries onto the next UTC day, so every stored date goes through this.
function localDateStr(d = new Date()) {
  return d.toLocaleDateString('en-CA')
}

// Whole calendar days between a stored YYYY-MM-DD and today, in local time.
// Comparing Date.now() with a noon-anchored date read one day short before noon.
function daysSinceLocalDate(ymd: string) {
  const today = new Date(localDateStr() + 'T12:00:00').getTime()
  const then = new Date(ymd.slice(0, 10) + 'T12:00:00').getTime()
  return Math.round((today - then) / 86400000)
}

// Stored dates are YYYY-MM-DD, but imported or seeded rows can carry a full ISO
// timestamp. Parse either without turning the plain form into an Invalid Date.
function parseStoredDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T12:00:00') : new Date(s)
}

// todayPnL is only meaningful on the day it was recorded — a stale value would
// keep yesterday's loss on today's daily-drawdown bar and fire false breach
// alerts, so anything not recorded today reads as "no daily loss yet".
function effectiveTodayPnL(progress?: ChallengeProgress) {
  if (!progress || progress.todayPnL === undefined) return undefined
  return progress.lastUpdated === localDateStr() ? progress.todayPnL : undefined
}

function currencySymbol(currency?: PropCurrency) {
  return CURRENCY_OPTIONS.find(c => c.value === currency)?.symbol ?? '$'
}

function fmt(n: number, currency?: PropCurrency) {
  const sym = currencySymbol(currency)
  return sym + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function isExpenseTx(type: TransactionType) {
  return TX_TYPE_OPTIONS.find(t => t.value === type)?.isExpense ?? true
}

// Fall back to a muted badge for unknown values (legacy or synced data) instead
// of crashing the whole page render on a non-null assertion.
function statusMeta(status: PropAccountStatus) {
  return STATUS_OPTIONS.find(s => s.value === status)
    ?? { value: status, label: String(status), badgeClass: 'bg-muted text-muted-foreground border-border' }
}

function firmInitials(name: string) {
  // Split on spaces AND camelCase boundaries so "TopStep" → ["Top","Step"] → "TS"
  const words = name.replace(/[()]/g, '').split(/(?=[A-Z])|\s+/).filter(Boolean)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

function firmAvatarColor(name: string) {
  if (FIRM_BRAND_COLORS[name]) return FIRM_BRAND_COLORS[name]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function defaultAccountForm() {
  return {
    firmName: '',
    customFirm: '',
    accountSizeStr: '100000',
    customSizeStr: '',
    currency: 'USD' as PropCurrency,
    accountType: 'evaluation' as PropAccountType,
    status: 'active' as PropAccountStatus,
    startDate: localDateStr(),
    endDate: '',
    notes: '',
    rulesEnabled: false,
    profitTarget: '',
    maxDailyDrawdown: '',
    maxTotalDrawdown: '',
    minTradingDays: '',
    // True while profitTarget is the preset-derived dollar amount. The preset
    // fills a DOLLAR target from the size selected at that moment, so changing
    // the size later must rescale it — but never over a hand-entered value.
    targetAutoFilled: false,
  }
}

type AccountForm = ReturnType<typeof defaultAccountForm>

// Apply a size-field change and, if the profit target is still the auto-filled
// preset value, rescale it to the new size.
function applySizeChange(p: AccountForm, patch: Partial<AccountForm>): AccountForm {
  const next = { ...p, ...patch }
  const preset = FIRM_RULE_PRESETS[next.firmName]
  if (preset && next.rulesEnabled && next.targetAutoFilled) {
    const size = Number(next.accountSizeStr === 'custom' ? next.customSizeStr : next.accountSizeStr)
    if (size > 0) next.profitTarget = String((preset.profitTarget / 100) * size)
  }
  return next
}

function defaultTxForm(accountId = '') {
  return {
    propAccountId: accountId,
    type: 'evaluation-fee' as TransactionType,
    amount: '',
    description: '',
    date: localDateStr(),
  }
}

// ─── Firm Logos ──────────────────────────────────────────────────────────────

const FIRM_LOGOS: Record<string, string> = {
  'TopStep':                    '/images/firms/topstep.png',
  'Apex Trader Funding':        '/images/firms/apex.png',
  'My Funded Futures (MFFU)':   '/images/firms/mffu.png',
  'FTMO':                       '/images/firms/ftmo.png',
  'The5ers':                    '/images/firms/the5ers.png',
  'FundedNext':                 '/images/firms/fundednext.png',
  'Funded Trading Plus':        '/images/firms/fundedplus.png',
  'Tradeday':                   '/images/firms/tradeday.png',
  'Tradeify':                   '/images/firms/tradeify.png',
  'Funding Pips':               '/images/firms/fundingpips.png',
  'Alpha Futures':              '/images/firms/alphafutures.png',
  'Lucid Trading':              '/images/firms/lucidtrading.png',
  'E8 Markets':                 '/images/firms/e8markets.png',
  'Aqua Funded':                '/images/firms/aquafunded.png',
  'Take Profit Trader':         '/images/firms/takeprofittrader.png',
}

// ─── Challenge Rules ─────────────────────────────────────────────────────────

const FIRM_RULE_PRESETS: Record<string, { profitTarget: number; maxDailyDrawdown: number; maxTotalDrawdown: number; minTradingDays?: number }> = {
  'FTMO':                     { profitTarget: 10, maxDailyDrawdown: 5,   maxTotalDrawdown: 10, minTradingDays: 4 },
  'The5ers':                  { profitTarget: 8,  maxDailyDrawdown: 5,   maxTotalDrawdown: 10, minTradingDays: 3 },
  'Apex Trader Funding':      { profitTarget: 5,  maxDailyDrawdown: 0,   maxTotalDrawdown: 6 },
  'TopStep':                  { profitTarget: 6,  maxDailyDrawdown: 4,   maxTotalDrawdown: 5 },
  'FundedNext':               { profitTarget: 10, maxDailyDrawdown: 5,   maxTotalDrawdown: 10, minTradingDays: 5 },
  'E8 Markets':               { profitTarget: 6,  maxDailyDrawdown: 3,   maxTotalDrawdown: 4 },
  'Tradeday':                 { profitTarget: 6,  maxDailyDrawdown: 0,   maxTotalDrawdown: 5 },
  'Tradeify':                 { profitTarget: 6,  maxDailyDrawdown: 0,   maxTotalDrawdown: 4 },
  'Take Profit Trader':       { profitTarget: 6,  maxDailyDrawdown: 0,   maxTotalDrawdown: 4, minTradingDays: 5 },
  'Funding Pips':             { profitTarget: 8,  maxDailyDrawdown: 4,   maxTotalDrawdown: 8, minTradingDays: 5 },
  'Lucid Trading':            { profitTarget: 8,  maxDailyDrawdown: 5,   maxTotalDrawdown: 10 },
  'Alpha Futures':            { profitTarget: 6,  maxDailyDrawdown: 0,   maxTotalDrawdown: 4 },
  'Aqua Funded':              { profitTarget: 8,  maxDailyDrawdown: 5,   maxTotalDrawdown: 8 },
}

function getChallengeStatus(account: PropFirmAccount) {
  const rules = account.challengeRules
  const progress = account.challengeProgress
  if (!rules || !progress) return null

  const { accountSize } = account
  const { currentBalance, highWaterMark, tradingDaysCount } = progress
  const todayPnL = effectiveTodayPnL(progress)

  const profitGain = currentBalance - accountSize
  const profitPct = rules.profitTarget > 0 ? Math.min((profitGain / rules.profitTarget) * 100, 100) : 0

  const totalDDDollars = Math.max(0, highWaterMark - currentBalance)
  const maxTotalDDDollars = (rules.maxTotalDrawdown / 100) * accountSize
  const totalDDUsedPct = maxTotalDDDollars > 0 ? (totalDDDollars / maxTotalDDDollars) * 100 : 0

  const dailyDDDollars = todayPnL !== undefined && todayPnL < 0 ? Math.abs(todayPnL) : 0
  const maxDailyDDDollars = rules.maxDailyDrawdown > 0 ? (rules.maxDailyDrawdown / 100) * accountSize : 0
  const dailyDDUsedPct = maxDailyDDDollars > 0 ? (dailyDDDollars / maxDailyDDDollars) * 100 : 0

  const tradingDaysPct = rules.minTradingDays ? Math.min((tradingDaysCount / rules.minTradingDays) * 100, 100) : null

  return {
    profitGain, profitPct,
    totalDDDollars, totalDDUsedPct, maxTotalDDDollars,
    dailyDDDollars, dailyDDUsedPct, maxDailyDDDollars,
    tradingDaysCount, tradingDaysPct,
  }
}

// The coach prompt asks for "**Heading** — text" sections, but models vary:
// heading and text on one line, "## Heading", "Heading:", different case.
// Scan line by line so any of those still land in the right section, and keep
// anything before the first heading (other than the score) as the big picture.
const COACH_SECTION_KEYS = ['verdict', 'roi', 'challenge', 'firms', 'warnings', 'next'] as const
type CoachSectionKey = typeof COACH_SECTION_KEYS[number]
const COACH_HEADINGS: Record<CoachSectionKey, string> = {
  verdict: 'The Big Picture',
  roi: 'Your Money',
  challenge: 'Where You Stand',
  firms: 'Which Firms Work',
  warnings: 'Watch Out For',
  next: 'Your Game Plan',
}
function parseCoachReview(text: string): { score: number | null; sections: Record<CoachSectionKey, string> } {
  const scoreMatch = text.match(/SCORE:?\s*\**\s*(\d+)\s*\/\s*10/i)
  const score = scoreMatch ? parseInt(scoreMatch[1], 10) : null
  const sections = Object.fromEntries(COACH_SECTION_KEYS.map(k => [k, ''])) as Record<CoachSectionKey, string>
  const buffers = Object.fromEntries(COACH_SECTION_KEYS.map(k => [k, [] as string[]])) as Record<CoachSectionKey, string[]>
  const preamble: string[] = []
  let current: CoachSectionKey | null = null
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue
    if (/^\**\s*SCORE:?/i.test(line)) continue
    const stripped = line.replace(/^#{1,6}\s*/, '').replace(/^\*+\s*/, '').replace(/^_+/, '')
    let matched: CoachSectionKey | null = null
    let remainder = ''
    const hasMarkup = /^(#{1,6}\s*|\*\*|__)/.test(line)
    for (const key of COACH_SECTION_KEYS) {
      const heading = COACH_HEADINGS[key]
      if (stripped.slice(0, heading.length).toLowerCase() !== heading.toLowerCase()) continue
      const after = stripped.slice(heading.length).replace(/^\s*\**\s*/, '').replace(/^_+\s*/, '')
      // "Watch out for the Apex limit" is prose, not the Watch Out For heading:
      // require bold/# markup, or a separator right after the phrase, or nothing after it
      const separated = after === '' || /^[:\-\u2013\u2014]/.test(after)
      if (!hasMarkup && !separated) continue
      matched = key
      remainder = after.replace(/^[:\-\u2013\u2014]\s*/, '').replace(/^\**\s*/, '').trim()
      break
    }
    if (matched) {
      current = matched
      if (remainder) buffers[matched].push(remainder)
    } else if (current) {
      buffers[current].push(line)
    } else {
      preamble.push(line)
    }
  }
  for (const key of COACH_SECTION_KEYS) sections[key] = buffers[key].join('\n')
  if (!sections.verdict && preamble.length > 0) sections.verdict = preamble.join('\n')
  return { score, sections }
}

// What a balance the user is about to save would mean for the challenge, so
// the balance and check-in forms can show drawdown and target live as they type.
function previewChallenge(account: PropFirmAccount, balanceStr: string, todayPnLStr: string, tradingDaysStr: string) {
  const balance = Number(balanceStr)
  if (!account.challengeRules || balanceStr.trim() === '' || isNaN(balance) || balance < 0) return null
  const prev = account.challengeProgress
  const todayPnLNum = todayPnLStr.trim() === '' ? NaN : Number(todayPnLStr)
  return getChallengeStatus({
    ...account,
    challengeProgress: {
      currentBalance: balance,
      highWaterMark: Math.max(prev?.highWaterMark ?? account.accountSize, balance),
      tradingDaysCount: Number(tradingDaysStr) || 0,
      todayPnL: isNaN(todayPnLNum) ? undefined : todayPnLNum,
      lastUpdated: localDateStr(),
    },
  })
}

function ddBarColor(usedPct: number, themeColors: { profit: string; loss: string }) {
  if (usedPct >= 80) return themeColors.loss
  if (usedPct >= 50) return '#f59e0b'
  return themeColors.profit
}

function profitBarColor(pct: number, themeColors: { profit: string; primary: string }) {
  if (pct >= 100) return themeColors.profit
  return themeColors.primary
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PropTracker() {
  const storage = useUserStorage()
  const { themeColors, alpha } = useThemePresets()
  const { isPro } = useProStatus()
  const { isDemo } = useAuth()
  const demoGuard = useDemoGuard()
  // ── Data ──
  const [accounts, setAccounts] = useState<PropFirmAccount[]>([])
  const [transactions, setTransactions] = useState<PropFirmTransaction[]>([])
  const [tipDismissed, setTipDismissed] = useState(false)
  const [showDealsBanner, setShowDealsBanner] = useState(() => !localStorage.getItem('ftj-dismiss-deals-pt'))

  useEffect(() => {
    // Demo mode seeds prop accounts/transactions into demo-user storage, so the
    // same read/write path works for both demo and real accounts.
    const savedAccounts = storage.getItem('propFirmAccounts')
    const savedTxs = storage.getItem('propFirmTransactions')
    const dismissed = storage.getItem('propTrackerTipDismissed')
    try {
      setAccounts(savedAccounts ? JSON.parse(savedAccounts) : [])
      setTransactions(savedTxs ? JSON.parse(savedTxs) : [])
    } catch {
      setAccounts([])
      setTransactions([])
      toast.error('Failed to load saved data')
    }
    setTipDismissed(dismissed === 'true')
    const savedReview = storage.getItem('propTrackerAiReview')
    if (savedReview) {
      try {
        const r = JSON.parse(savedReview) as { text: string; at: string; accounts: number; transactions: number; fingerprint?: string }
        if (r?.text) { setAiAnalysis(r.text); setAiReviewMeta({ at: r.at, accounts: r.accounts, transactions: r.transactions, fingerprint: r.fingerprint }) }
      } catch { /* ignore a corrupt cached review */ }
    }
  }, [storage])

  const saveAccounts = useCallback((updated: PropFirmAccount[]) => {
    setAccounts(updated)
    storage.setItem('propFirmAccounts', JSON.stringify(updated))
  }, [storage])

  const saveTransactions = useCallback((updated: PropFirmTransaction[]) => {
    setTransactions(updated)
    storage.setItem('propFirmTransactions', JSON.stringify(updated))
  }, [storage])

  function dismissTip() {
    setTipDismissed(true)
    storage.setItem('propTrackerTipDismissed', 'true')
  }

  // ── AI state ──
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiUsage, setAiUsage] = useState<{ used: number; limit: number; remaining: number } | null>(null)
  // When the current review was produced and what it saw, so the tab can say
  // "reviewed 3 days ago, 2 transactions logged since" instead of a bare result.
  const [aiReviewMeta, setAiReviewMeta] = useState<{ at: string; accounts: number; transactions: number; fingerprint?: string } | null>(null)

  // What the coach reads: account status/rules/progress and every transaction.
  // Balance updates or a status change count as "changed" even when the
  // account and transaction counts stay the same.
  const reviewFingerprint = useMemo(() => JSON.stringify([
    accounts.map(a => [a.id, a.status, a.accountType, a.challengeRules ?? null, a.challengeProgress?.currentBalance ?? null, a.challengeProgress?.tradingDaysCount ?? null]),
    transactions.map(t => [t.id, t.type, t.amount, t.date]),
  ]), [accounts, transactions])

  function rememberReview(text: string) {
    const meta = { at: new Date().toISOString(), accounts: accounts.length, transactions: transactions.length, fingerprint: reviewFingerprint }
    setAiReviewMeta(meta)
    storage.setItem('propTrackerAiReview', JSON.stringify({ text, ...meta }))
  }

  async function runAiAnalysis() {
    if (accounts.length === 0) { toast.warning('Add some accounts first'); return }
    const previous = aiAnalysis
    setAiLoading(true)
    setAiAnalysis(null)
    // Demo mode: show a pre-written analysis instead of calling the backend.
    if (isDemo) {
      await new Promise(resolve => setTimeout(resolve, 600))
      const demoText = getDemoPropAnalysis()
      setAiAnalysis(demoText)
      rememberReview(demoText)
      setAiUsage(DEMO_AI_USAGE)
      setAiLoading(false)
      return
    }
    try {
      const res = await requestPropAnalysis(accounts, transactions)
      setAiAnalysis(res.result)
      rememberReview(res.result)
      setAiUsage(res.usage)
    } catch (err: unknown) {
      const e = err as { message?: string; details?: string }
      const msg = e?.message || e?.details || 'AI analysis failed'
      toast.error(msg)
      // Keep the last good review on screen rather than dropping to the empty state
      setAiAnalysis(previous)
    } finally {
      setAiLoading(false)
    }
  }

  // In demo mode, auto-run the AI analysis once so it shows working without a click.
  useEffect(() => {
    if (isDemo && accounts.length > 0 && transactions.length > 0 && !aiAnalysis && !aiLoading) {
      runAiAnalysis()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo, accounts.length, transactions.length])

  // ── UI state ──
  const [activeTab, setActiveTab] = useState<PropTab>('accounts')
  const [accountFilter, setAccountFilter] = useState<'all' | PropAccountStatus>('all')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [toggledMonths, setToggledMonths] = useState<Set<string>>(new Set())
  const [showAllMonths, setShowAllMonths] = useState<Set<string>>(new Set())
  const currentYearMonth = new Date().toISOString().substring(0, 7)
  const [accountDialog, setAccountDialog] = useState<{ open: boolean; editing: PropFirmAccount | null }>({ open: false, editing: null })
  const [txDialog, setTxDialog] = useState<{ open: boolean; accountId: string }>({ open: false, accountId: '' })
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: 'account' | 'tx'; id: string } | null>(null)
  const [importDialog, setImportDialog] = useState<{
    open: boolean
    accountId: string
    step: 'upload' | 'preview'
    importType: 'billing' | 'payout'
    loading: boolean
    dragOver: boolean
    parsed: Array<{ id: string; date: string; amount: number; type: TransactionType; notes: string; keep: boolean }>
  }>({ open: false, accountId: '', step: 'upload', importType: 'billing', loading: false, dragOver: false, parsed: [] })

  function openImportDialog(accountId: string) {
    setImportDialog({ open: true, accountId, step: 'upload', importType: 'billing', loading: false, dragOver: false, parsed: [] })
  }

  async function processImageFiles(files: File[], importType: 'billing' | 'payout', accountId: string) {
    if (!files.length) return
    const invalid = files.find(f => !f.type.startsWith('image/'))
    if (invalid) { toast.warning('Please upload image files only'); return }
    setImportDialog(p => ({ ...p, loading: true, dragOver: false }))
    try {
      const toBase64 = (f: File) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(f)
      })
      const mapTx = (tx: ParsedTransaction) => ({
        id: crypto.randomUUID(),
        date: tx.date,
        amount: tx.amount,
        type: (tx.type ?? (importType === 'payout' ? 'payout' : 'other-expense')) as TransactionType,
        notes: tx.notes ?? '',
        keep: true,
      })
      const allParsed: ReturnType<typeof mapTx>[] = []
      for (const file of files) {
        const base64 = await toBase64(file)
        const res = await requestScreenshotParse(base64, file.type, importType)
        res.transactions.forEach(tx => allParsed.push(mapTx(tx)))
      }
      if (!allParsed.length) {
        toast.warning('No transactions found in screenshots')
        setImportDialog(p => ({ ...p, loading: false }))
        return
      }
      const existing = transactions.filter(t => t.propAccountId === accountId)
      const isDup = (tx: typeof allParsed[0]) =>
        existing.some(e => e.date === tx.date && e.amount === tx.amount && e.type === tx.type)
      const seen = new Set<string>()
      const deduped = allParsed.map(tx => {
        const key = `${tx.date}|${tx.amount}|${tx.type}`
        if (isDup(tx) || seen.has(key)) return { ...tx, keep: false }
        seen.add(key)
        return tx
      })
      const skipped = deduped.filter(t => !t.keep).length
      if (skipped > 0) toast.info(`${skipped} duplicate${skipped !== 1 ? 's' : ''} found, pre-unchecked`)
      setImportDialog(p => ({ ...p, loading: false, step: 'preview', parsed: deduped }))
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Failed to parse screenshot')
      setImportDialog(p => ({ ...p, loading: false }))
    }
  }

  function handleScreenshotUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    processImageFiles(files, importDialog.importType, importDialog.accountId)
  }

  function handleDropUpload(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    processImageFiles(files, importDialog.importType, importDialog.accountId)
  }

  function handleConfirmImport() {
    if (demoGuard('import transactions')) return
    const toImport = importDialog.parsed.filter(tx => tx.keep)
    if (!toImport.length) { toast.warning('No transactions selected'); return }
    saveTransactions([...transactions, ...toImport.map(tx => ({
      id: tx.id,
      propAccountId: importDialog.accountId,
      type: tx.type,
      amount: tx.amount,
      description: tx.notes,
      date: tx.date,
      createdAt: new Date().toISOString(),
    }))])
    setImportDialog({ open: false, accountId: '', step: 'upload', importType: 'billing', loading: false, dragOver: false, parsed: [] })
    toast.success(`${toImport.length} transaction${toImport.length !== 1 ? 's' : ''} imported`)
  }

  // ── Account form ──
  const [accountForm, setAccountForm] = useState(defaultAccountForm())

  function openAddAccount() {
    if (!isPro && accounts.length >= FREE_ACCOUNT_LIMIT) {
      trackGateHit('prop_cap', { accounts: accounts.length })
      toast.warning(`Free plan is limited to ${FREE_ACCOUNT_LIMIT} prop firm ${FREE_ACCOUNT_LIMIT === 1 ? 'account' : 'accounts'}. Upgrade to Pro for unlimited accounts.`)
      return
    }
    setAccountForm(defaultAccountForm())
    setAccountDialog({ open: true, editing: null })
  }

  function openEditAccount(account: PropFirmAccount) {
    const isCustomFirm = !PROP_FIRMS.slice(0, -1).includes(account.firmName as typeof PROP_FIRMS[number])
    const isCustomSize = !ACCOUNT_SIZES.includes(account.accountSize)
    const rules = account.challengeRules
    setAccountForm({
      firmName: isCustomFirm ? 'Custom...' : account.firmName,
      customFirm: isCustomFirm ? account.firmName : '',
      accountSizeStr: isCustomSize ? 'custom' : String(account.accountSize),
      customSizeStr: isCustomSize ? String(account.accountSize) : '',
      currency: account.currency ?? 'USD',
      accountType: account.accountType,
      status: account.status,
      startDate: account.startDate,
      endDate: account.endDate ?? '',
      notes: account.notes ?? '',
      rulesEnabled: !!rules,
      profitTarget: rules ? String(rules.profitTarget) : '',
      maxDailyDrawdown: rules ? String(rules.maxDailyDrawdown) : '',
      maxTotalDrawdown: rules ? String(rules.maxTotalDrawdown) : '',
      minTradingDays: rules?.minTradingDays ? String(rules.minTradingDays) : '',
      // Saved targets may be hand-tuned — never auto-rescale them on edit.
      targetAutoFilled: false,
    })
    setAccountDialog({ open: true, editing: account })
  }

  function handleSaveAccount() {
    if (demoGuard('add prop firm accounts')) return
    const firmName = accountForm.firmName === 'Custom...' ? accountForm.customFirm.trim() : accountForm.firmName
    const sizeRaw = accountForm.accountSizeStr === 'custom' ? accountForm.customSizeStr : accountForm.accountSizeStr
    const accountSize = Number(sizeRaw)
    if (!firmName) { toast.warning('Firm name is required'); return }
    if (!accountSize || accountSize <= 0) { toast.warning('Account size must be greater than 0'); return }
    if (!accountForm.startDate) { toast.warning('Start date is required'); return }

    let challengeRules: ChallengeRules | undefined
    if (accountForm.rulesEnabled) {
      const profitTarget = Number(accountForm.profitTarget)
      const maxDailyDrawdown = Number(accountForm.maxDailyDrawdown) || 0
      const maxTotalDrawdown = Number(accountForm.maxTotalDrawdown)
      if (!profitTarget || profitTarget <= 0) { toast.warning('Profit target is required when rules are enabled'); return }
      if (!maxTotalDrawdown || maxTotalDrawdown <= 0) { toast.warning('Max total drawdown is required when rules are enabled'); return }
      challengeRules = {
        profitTarget,
        maxDailyDrawdown,
        maxTotalDrawdown,
        ...(Number(accountForm.minTradingDays) > 0 ? { minTradingDays: Number(accountForm.minTradingDays) } : {}),
      }
    }

    if (accountDialog.editing) {
      saveAccounts(accounts.map(a => {
        if (a.id !== accountDialog.editing!.id) return a
        const updated = { ...a, firmName, accountSize, currency: accountForm.currency, accountType: accountForm.accountType, status: accountForm.status, startDate: accountForm.startDate, endDate: accountForm.endDate || undefined, notes: accountForm.notes || undefined, challengeRules }
        if (challengeRules && !a.challengeProgress) {
          updated.challengeProgress = { currentBalance: accountSize, highWaterMark: accountSize, tradingDaysCount: 0, lastUpdated: '' }
        } else if (challengeRules && a.challengeProgress && a.accountSize !== accountSize) {
          // Size changed: shift balance and high-water mark by the same delta so
          // the recorded profit gain and drawdown dollars stay what they were —
          // otherwise the progress bars read the resize as a huge gain or a
          // limit breach.
          const delta = accountSize - a.accountSize
          updated.challengeProgress = {
            ...a.challengeProgress,
            currentBalance: a.challengeProgress.currentBalance + delta,
            highWaterMark: a.challengeProgress.highWaterMark + delta,
          }
        }
        if (!challengeRules) {
          updated.challengeProgress = undefined
        }
        return updated
      }))
      toast.success('Account updated')
    } else {
      saveAccounts([...accounts, {
        id: crypto.randomUUID(),
        firmName,
        accountSize,
        currency: accountForm.currency,
        accountType: accountForm.accountType,
        status: accountForm.status,
        startDate: accountForm.startDate,
        endDate: accountForm.endDate || undefined,
        notes: accountForm.notes || undefined,
        challengeRules,
        challengeProgress: challengeRules ? { currentBalance: accountSize, highWaterMark: accountSize, tradingDaysCount: 0, lastUpdated: '' } : undefined,
        createdAt: new Date().toISOString(),
      }])
      toast.success('Account added')
    }
    setAccountDialog({ open: false, editing: null })
  }

  function handleDeleteAccount(id: string) {
    if (demoGuard('manage prop firm accounts')) return
    saveAccounts(accounts.filter(a => a.id !== id))
    saveTransactions(transactions.filter(t => t.propAccountId !== id))
    setDeleteDialog(null)
    toast.success('Account deleted')
  }

  // ── Transaction form ──
  const [txForm, setTxForm] = useState(defaultTxForm())

  function openAddTx(accountId: string) {
    setTxForm(defaultTxForm(accountId))
    setTxDialog({ open: true, accountId })
  }

  function handleSaveTx() {
    if (demoGuard('add transactions')) return
    const amount = Number(txForm.amount)
    if (!txForm.propAccountId) { toast.warning('Select an account'); return }
    if (!amount || amount <= 0) { toast.warning('Amount must be greater than 0'); return }
    if (!txForm.date) { toast.warning('Date is required'); return }

    saveTransactions([...transactions, {
      id: crypto.randomUUID(),
      propAccountId: txForm.propAccountId,
      type: txForm.type,
      amount,
      description: txForm.description.trim(),
      date: txForm.date,
      createdAt: new Date().toISOString(),
    }])
    setTxDialog({ open: false, accountId: '' })
    toast.success('Transaction added')
  }

  function handleDeleteTx(id: string) {
    if (demoGuard('manage transactions')) return
    saveTransactions(transactions.filter(t => t.id !== id))
    setDeleteDialog(null)
    toast.success('Transaction deleted')
  }

  // ── Balance update ──
  const [balanceDialog, setBalanceDialog] = useState<{
    open: boolean
    accountId: string
    balance: string
    todayPnL: string
    tradingDays: string
  }>({ open: false, accountId: '', balance: '', todayPnL: '', tradingDays: '' })

  function openBalanceDialog(account: PropFirmAccount) {
    const progress = account.challengeProgress
    // Pre-fill today's P&L if it was already recorded today, so a mid-day
    // balance update doesn't silently wipe it.
    const todayPnL = effectiveTodayPnL(progress)
    setBalanceDialog({
      open: true,
      accountId: account.id,
      balance: progress ? String(progress.currentBalance) : String(account.accountSize),
      todayPnL: todayPnL !== undefined ? String(todayPnL) : '',
      tradingDays: progress ? String(progress.tradingDaysCount) : '0',
    })
  }

  function handleSaveBalance() {
    if (demoGuard('update balances')) return
    const balance = Number(balanceDialog.balance)
    if (isNaN(balance) || balance < 0) { toast.warning('Enter a valid balance'); return }
    const tradingDays = Number(balanceDialog.tradingDays) || 0
    const todayPnL = balanceDialog.todayPnL ? Number(balanceDialog.todayPnL) : undefined

    saveAccounts(accounts.map(a => {
      if (a.id !== balanceDialog.accountId) return a
      const prev = a.challengeProgress
      return {
        ...a,
        challengeProgress: {
          currentBalance: balance,
          highWaterMark: Math.max(prev?.highWaterMark ?? a.accountSize, balance),
          tradingDaysCount: tradingDays,
          todayPnL,
          lastUpdated: localDateStr(),
        },
      }
    }))
    setBalanceDialog({ open: false, accountId: '', balance: '', todayPnL: '', tradingDays: '' })
    toast.success('Balance updated')
  }

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleMonth(accountId: string, month: string) {
    const key = `${accountId}:${month}`
    setToggledMonths(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function isMonthOpen(accountId: string, month: string) {
    const toggled = toggledMonths.has(`${accountId}:${month}`)
    return month === currentYearMonth ? !toggled : toggled
  }

  // ── Stats ──
  const stats = useMemo(() => {
    let totalInvested = 0
    let totalEarned = 0
    for (const tx of transactions) {
      if (isExpenseTx(tx.type)) totalInvested += tx.amount
      else totalEarned += tx.amount
    }
    const netPnL = totalEarned - totalInvested
    const roi = totalInvested > 0 ? ((totalEarned / totalInvested - 1) * 100) : null
    return {
      totalInvested,
      totalEarned,
      netPnL,
      roi,
      activeCount: accounts.filter(a => a.status === 'active').length,
    }
  }, [accounts, transactions])

  // One currency across every account → label aggregate stats with it; mixed
  // currencies keep the "$" fallback (an honest multi-currency total needs FX
  // conversion, which we don't do).
  const aggregateCurrency = useMemo<PropCurrency | undefined>(() => {
    if (accounts.length === 0) return undefined
    const first = accounts[0].currency
    return accounts.every(a => a.currency === first) ? first : undefined
  }, [accounts])

  const subtitleParts = useMemo(() => {
    if (accounts.length === 0) return null
    return {
      // Read as a sentence rather than "1 account · 1 active"
      base: (() => {
        const n = accounts.length
        if (n === 1) return `1 ${statusMeta(accounts[0].status).label.toLowerCase()} account`
        if (stats.activeCount === n) return `${n} accounts, all active`
        if (stats.activeCount === 0) return `${n} accounts, none active`
        return `${n} accounts · ${stats.activeCount} active`
      })(),
      net: transactions.length > 0 ? `${stats.netPnL >= 0 ? '+' : '-'}${fmt(stats.netPnL, aggregateCurrency)} P&L` : null,
      netColor: stats.netPnL >= 0 ? themeColors.profit : themeColors.loss,
    }
  }, [accounts, stats, transactions, themeColors])

  // ── Performance analytics ──
  // Money figures on the Performance tab respect a period; pass/fail counts are lifetime.
  const [perfRange, setPerfRange] = useState<PerfRange>('12m')

  const rangeStart = useMemo(() => {
    if (perfRange === 'all') return null
    const months = perfRange === '3m' ? 3 : perfRange === '6m' ? 6 : 12
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - (months - 1))
    return localDateStr(d)
  }, [perfRange])

  const rangeTxs = useMemo(
    () => (rangeStart ? transactions.filter(t => t.date >= rangeStart) : transactions),
    [transactions, rangeStart],
  )

  // Cumulative net over the period, starting from whatever was already banked
  // before the period so a 3-month view doesn't pretend the account began at zero.
  const pnlOverTime = useMemo(() => {
    if (rangeTxs.length === 0) return []
    let cumulative = 0
    if (rangeStart) {
      for (const tx of transactions) {
        if (tx.date < rangeStart) cumulative += isExpenseTx(tx.type) ? -tx.amount : tx.amount
      }
    }
    const sorted = [...rangeTxs].sort((a, b) => a.date.localeCompare(b.date))
    const points: Array<{ date: string; value: number }> = []
    if (rangeStart && cumulative !== 0) {
      points.push({ date: new Date(rangeStart + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: cumulative })
    }
    for (const tx of sorted) {
      cumulative += isExpenseTx(tx.type) ? -tx.amount : tx.amount
      points.push({
        date: parseStoredDate(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: cumulative,
      })
    }
    return points
  }, [rangeTxs, transactions, rangeStart])

  // Fees vs payouts per calendar month across the period (gaps stay at zero)
  const monthlyFlow = useMemo(() => {
    if (rangeTxs.length === 0) return []
    const firstDate = rangeStart ?? [...rangeTxs].sort((a, b) => a.date.localeCompare(b.date))[0].date
    const cur = new Date(firstDate.slice(0, 7) + '-01T12:00:00')
    const now = new Date()
    const buckets: Array<{ key: string; label: string; fees: number; payouts: number; net: number }> = []
    while (cur.getFullYear() < now.getFullYear() || (cur.getFullYear() === now.getFullYear() && cur.getMonth() <= now.getMonth())) {
      const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`
      buckets.push({ key, label: cur.toLocaleDateString('en-US', { month: 'short' }), fees: 0, payouts: 0, net: 0 })
      cur.setMonth(cur.getMonth() + 1)
      if (buckets.length > 120) break
    }
    const byKey = new Map(buckets.map(b => [b.key, b]))
    for (const tx of rangeTxs) {
      const b = byKey.get(tx.date.slice(0, 7))
      if (!b) continue
      if (isExpenseTx(tx.type)) b.fees += tx.amount
      else b.payouts += tx.amount
    }
    for (const b of buckets) b.net = b.payouts - b.fees
    // Drop leading months with nothing in them so a long period doesn't start with empty bars
    const firstActive = buckets.findIndex(b => b.fees > 0 || b.payouts > 0)
    const active = buckets.slice(Math.max(0, firstActive))
    // Disambiguate January (or the first bar) with the year once the axis spans two years
    const years = new Set(active.map(b => b.key.slice(0, 4)))
    if (years.size > 1) {
      for (let i = 0; i < active.length; i++) {
        if (i === 0 || active[i].key.endsWith('-01')) active[i].label += ` '${active[i].key.slice(2, 4)}`
      }
    }
    return active
  }, [rangeTxs, rangeStart])

  // The bar chart shows at most the last 24 months; the summary below it uses every month
  const monthlyBars = useMemo(() => monthlyFlow.slice(-24), [monthlyFlow])

  const monthlySummary = useMemo(() => {
    const active = monthlyFlow.filter(m => m.fees > 0 || m.payouts > 0)
    if (active.length === 0) return null
    const best = active.reduce((a, b) => (b.net > a.net ? b : a))
    const worst = active.reduce((a, b) => (b.net < a.net ? b : a))
    const avgNet = active.reduce((s, m) => s + m.net, 0) / active.length
    const monthLabel = (key: string) => new Date(key + '-02T12:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    return { best, worst, avgNet, months: active.length, monthLabel }
  }, [monthlyFlow])

  // Where the fees went: evaluation vs reset vs monthly vs other
  const spendByType = useMemo(() => {
    const rows = TX_TYPE_OPTIONS.filter(t => t.isExpense).map(t => ({ value: t.value, label: t.label, amount: 0, count: 0 }))
    for (const tx of rangeTxs) {
      const r = rows.find(x => x.value === tx.type)
      if (r) { r.amount += tx.amount; r.count += 1 }
    }
    const total = rows.reduce((s, r) => s + r.amount, 0)
    return { rows: rows.filter(r => r.count > 0).sort((a, b) => b.amount - a.amount), total }
  }, [rangeTxs])

  const payoutStats = useMemo(() => {
    const payouts = rangeTxs.filter(t => !isExpenseTx(t.type)).sort((a, b) => a.date.localeCompare(b.date))
    if (payouts.length === 0) return null
    const total = payouts.reduce((s, p) => s + p.amount, 0)
    const largest = payouts.reduce((a, b) => (b.amount > a.amount ? b : a))
    const last = payouts[payouts.length - 1]
    const gaps: number[] = []
    for (let i = 1; i < payouts.length; i++) {
      gaps.push((parseStoredDate(payouts[i].date).getTime() - parseStoredDate(payouts[i - 1].date).getTime()) / 86400000)
    }
    const avgGapDays = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null
    // Days from account start to its first payout (lifetime, since the start may predate the period)
    const firstPayoutDays: number[] = []
    for (const a of accounts) {
      const first = transactions
        .filter(t => t.propAccountId === a.id && !isExpenseTx(t.type))
        .sort((x, y) => x.date.localeCompare(y.date))[0]
      if (!first) continue
      const days = (parseStoredDate(first.date).getTime() - parseStoredDate(a.startDate).getTime()) / 86400000
      if (days >= 0) firstPayoutDays.push(days)
    }
    const avgDaysToFirstPayout = firstPayoutDays.length > 0 ? firstPayoutDays.reduce((a, b) => a + b, 0) / firstPayoutDays.length : null
    return {
      count: payouts.length,
      total,
      avg: total / payouts.length,
      largest,
      last,
      avgGapDays,
      avgDaysToFirstPayout,
      accountsPaid: new Set(payouts.map(p => p.propAccountId)).size,
    }
  }, [rangeTxs, transactions, accounts])

  // Per-firm scoreboard, sorted by net. Record is lifetime; money is period.
  const firmTable = useMemo(() => {
    const map = new Map<string, { firm: string; accounts: number; active: number; passed: number; failed: number; resets: number; invested: number; earned: number }>()
    for (const a of accounts) {
      const r = map.get(a.firmName) ?? { firm: a.firmName, accounts: 0, active: 0, passed: 0, failed: 0, resets: 0, invested: 0, earned: 0 }
      r.accounts += 1
      if (a.status === 'active') r.active += 1
      if (a.status === 'passed' || (a.status === 'active' && a.accountType === 'funded')) r.passed += 1
      if (a.status === 'failed') r.failed += 1
      map.set(a.firmName, r)
    }
    const firmOf = new Map(accounts.map(a => [a.id, a.firmName]))
    for (const tx of rangeTxs) {
      const firm = firmOf.get(tx.propAccountId)
      if (!firm) continue
      const r = map.get(firm)!
      if (isExpenseTx(tx.type)) {
        r.invested += tx.amount
        if (tx.type === 'reset-fee') r.resets += 1
      } else {
        r.earned += tx.amount
      }
    }
    return [...map.values()]
      .map(r => ({ ...r, net: r.earned - r.invested, roi: r.invested > 0 ? (r.earned / r.invested - 1) * 100 : null }))
      .sort((a, b) => b.net - a.net)
  }, [accounts, rangeTxs])

  function getAccountStats(accountId: string) {
    const txs = transactions.filter(t => t.propAccountId === accountId)
    let invested = 0, earned = 0
    for (const tx of txs) {
      if (isExpenseTx(tx.type)) invested += tx.amount
      else earned += tx.amount
    }
    return { invested, earned, net: earned - invested, txs }
  }

  const hasData = transactions.length > 0

  const statusCounts = useMemo(() => {
    const counts: Partial<Record<PropAccountStatus, number>> = {}
    for (const a of accounts) counts[a.status] = (counts[a.status] ?? 0) + 1
    return counts
  }, [accounts])
  // A filter whose status no longer exists (last account deleted) falls back to all
  const effectiveFilter: 'all' | PropAccountStatus =
    accounts.length >= 4 && accountFilter !== 'all' && (statusCounts[accountFilter] ?? 0) > 0 ? accountFilter : 'all'
  const visibleAccounts = effectiveFilter === 'all' ? accounts : accounts.filter(a => a.status === effectiveFilter)

  const statCards = [
    {
      label: 'Total invested',
      value: hasData ? fmt(stats.totalInvested, aggregateCurrency) : '—',
      // Neutral, not loss-red: fees paid are an investment, not a losing trade.
      valueColor: hasData ? 'hsl(var(--foreground))' : 'var(--muted-foreground)',
      subtitle: 'All fees paid',
    },
    {
      label: 'Total earned',
      value: hasData ? fmt(stats.totalEarned, aggregateCurrency) : '—',
      valueColor: hasData ? themeColors.profit : 'var(--muted-foreground)',
      subtitle: 'All payouts received',
    },
    {
      label: 'Net P&L',
      value: hasData ? (stats.netPnL >= 0 ? '+' : '-') + fmt(stats.netPnL, aggregateCurrency) : '—',
      valueColor: hasData ? (stats.netPnL >= 0 ? themeColors.profit : themeColors.loss) : 'var(--muted-foreground)',
      subtitle: hasData
        ? (stats.roi !== null ? `${stats.roi >= 0 ? '+' : ''}${stats.roi.toFixed(1)}% ROI` : 'Profitable overall')
        : 'Fees vs payouts',
    },
    {
      label: 'Active accounts',
      value: String(stats.activeCount),
      valueColor: themeColors.primary,
      subtitle: `of ${accounts.length} total`,
    },
  ]

  // ── Success rate stats ──
  const successStats = useMemo(() => {
    if (accounts.length < 3) return null
    const passed = accounts.filter(a => a.status === 'passed' || (a.status === 'active' && a.accountType === 'funded')).length
    const failed = accounts.filter(a => a.status === 'failed').length
    const resolved = passed + failed
    const passRate = resolved > 0 ? (passed / resolved) * 100 : null

    const costOfFunded: number[] = []
    const costOfFailed: number[] = []
    for (const a of accounts) {
      const txs = transactions.filter(t => t.propAccountId === a.id)
      const spent = txs.filter(t => isExpenseTx(t.type)).reduce((s, t) => s + t.amount, 0)
      if (a.status === 'passed' || (a.status === 'active' && a.accountType === 'funded')) {
        costOfFunded.push(spent)
      }
      if (a.status === 'failed') {
        costOfFailed.push(spent)
      }
    }
    const avgCostToFund = costOfFunded.length > 0 ? costOfFunded.reduce((a, b) => a + b, 0) / costOfFunded.length : null
    const totalWastedOnFailed = costOfFailed.reduce((a, b) => a + b, 0)

    const firmROI: { firm: string; roi: number }[] = []
    const firmMap = new Map<string, { invested: number; earned: number }>()
    for (const a of accounts) {
      const txs = transactions.filter(t => t.propAccountId === a.id)
      let inv = 0, ear = 0
      for (const t of txs) {
        if (isExpenseTx(t.type)) inv += t.amount; else ear += t.amount
      }
      const prev = firmMap.get(a.firmName) ?? { invested: 0, earned: 0 }
      firmMap.set(a.firmName, { invested: prev.invested + inv, earned: prev.earned + ear })
    }
    for (const [firm, { invested, earned }] of firmMap) {
      if (invested > 0) firmROI.push({ firm, roi: ((earned / invested) - 1) * 100 })
    }
    firmROI.sort((a, b) => b.roi - a.roi)
    const bestFirm = firmROI.length > 0 ? firmROI[0] : null

    return { passed, failed, total: accounts.length, passRate, avgCostToFund, totalWastedOnFailed, bestFirm }
  }, [accounts, transactions])

  // ── Quick balance check-in ──
  const activeRulesAccounts = useMemo(() =>
    accounts.filter(a => a.status === 'active' && a.challengeRules),
  [accounts])

  const [checkinDialog, setCheckinDialog] = useState<{
    open: boolean
    entries: Array<{ accountId: string; balance: string; todayPnL: string; tradingDays: string }>
  }>({ open: false, entries: [] })

  function openCheckinDialog() {
    setCheckinDialog({
      open: true,
      entries: activeRulesAccounts.map(a => {
        const todayPnL = effectiveTodayPnL(a.challengeProgress)
        return {
          accountId: a.id,
          balance: a.challengeProgress ? String(a.challengeProgress.currentBalance) : String(a.accountSize),
          todayPnL: todayPnL !== undefined ? String(todayPnL) : '',
          tradingDays: a.challengeProgress ? String(a.challengeProgress.tradingDaysCount) : '0',
        }
      }),
    })
  }

  function handleSaveCheckin() {
    if (demoGuard('log a daily check-in')) return
    const today = localDateStr()
    saveAccounts(accounts.map(a => {
      const entry = checkinDialog.entries.find(e => e.accountId === a.id)
      if (!entry) return a
      const balance = Number(entry.balance)
      if (isNaN(balance) || balance < 0) return a
      const tradingDays = Number(entry.tradingDays) || 0
      const todayPnL = entry.todayPnL ? Number(entry.todayPnL) : undefined
      const prev = a.challengeProgress
      return {
        ...a,
        challengeProgress: {
          currentBalance: balance,
          highWaterMark: Math.max(prev?.highWaterMark ?? a.accountSize, balance),
          tradingDaysCount: tradingDays,
          todayPnL,
          lastUpdated: today,
        },
      }
    }))
    setCheckinDialog({ open: false, entries: [] })
    toast.success(`Updated ${checkinDialog.entries.length} account${checkinDialog.entries.length !== 1 ? 's' : ''}`)
  }

  // ── Risk calculator ──
  const [riskCalcOpen, setRiskCalcOpen] = useState(false)
  const [riskCalcAmount, setRiskCalcAmount] = useState('')

  const riskCalcResults = useMemo(() => {
    const loss = Number(riskCalcAmount)
    if (!loss || loss <= 0) return null
    return activeRulesAccounts.map(a => {
      const rules = a.challengeRules!
      const progress = a.challengeProgress ?? { currentBalance: a.accountSize, highWaterMark: a.accountSize, tradingDaysCount: 0, lastUpdated: '' }
      const maxTotalDDDollars = (rules.maxTotalDrawdown / 100) * a.accountSize
      const maxDailyDDDollars = rules.maxDailyDrawdown > 0 ? (rules.maxDailyDrawdown / 100) * a.accountSize : 0

      const currentDD = Math.max(0, progress.highWaterMark - progress.currentBalance)
      const afterDD = currentDD + loss
      const totalDDPctAfter = maxTotalDDDollars > 0 ? (afterDD / maxTotalDDDollars) * 100 : 0
      const totalDDPctBefore = maxTotalDDDollars > 0 ? (currentDD / maxTotalDDDollars) * 100 : 0
      const wouldBreachTotal = totalDDPctAfter >= 100

      const todayPnL = effectiveTodayPnL(progress)
      const existingDailyLoss = (todayPnL !== undefined && todayPnL < 0) ? Math.abs(todayPnL) : 0
      const dailyAfter = existingDailyLoss + loss
      const dailyDDPctAfter = maxDailyDDDollars > 0 ? (dailyAfter / maxDailyDDDollars) * 100 : 0
      const dailyDDPctBefore = maxDailyDDDollars > 0 ? (existingDailyLoss / maxDailyDDDollars) * 100 : 0
      const wouldBreachDaily = maxDailyDDDollars > 0 && dailyDDPctAfter >= 100

      const remainingBeforeTotal = Math.max(0, maxTotalDDDollars - currentDD - loss)
      const remainingBeforeDaily = maxDailyDDDollars > 0 ? Math.max(0, maxDailyDDDollars - dailyAfter) : null

      return {
        account: a,
        totalDDPctAfter: Math.min(totalDDPctAfter, 100),
        totalDDPctBefore: Math.min(totalDDPctBefore, 100),
        dailyDDPctAfter: Math.min(dailyDDPctAfter, 100),
        dailyDDPctBefore: Math.min(dailyDDPctBefore, 100),
        wouldBreachTotal,
        wouldBreachDaily,
        remainingBeforeTotal,
        remainingBeforeDaily,
        balanceAfter: progress.currentBalance - loss,
      }
    })
  }, [riskCalcAmount, activeRulesAccounts])

  // Largest loss that keeps every active challenge under its limits
  const maxSafeLoss = useMemo(() => {
    if (activeRulesAccounts.length === 0) return 0
    let safe = Infinity
    for (const a of activeRulesAccounts) {
      const rules = a.challengeRules!
      const progress = a.challengeProgress ?? { currentBalance: a.accountSize, highWaterMark: a.accountSize, tradingDaysCount: 0, lastUpdated: '' }
      const maxTotalDDDollars = (rules.maxTotalDrawdown / 100) * a.accountSize
      const currentDD = Math.max(0, progress.highWaterMark - progress.currentBalance)
      let room = Math.max(0, maxTotalDDDollars - currentDD)
      if (rules.maxDailyDrawdown > 0) {
        const maxDailyDDDollars = (rules.maxDailyDrawdown / 100) * a.accountSize
        const todayPnL = effectiveTodayPnL(progress)
        const existingDailyLoss = (todayPnL !== undefined && todayPnL < 0) ? Math.abs(todayPnL) : 0
        room = Math.min(room, Math.max(0, maxDailyDDDollars - existingDailyLoss))
      }
      safe = Math.min(safe, room)
    }
    return safe === Infinity ? 0 : safe
  }, [activeRulesAccounts])

  // ─── Deadline alerts ────────────────────────────────────────────────────────
  const upcomingDeadlines = useMemo(() => {
    const now = new Date()
    return accounts
      .filter(a => a.status === 'active' && a.endDate)
      .map(a => {
        const end = new Date(a.endDate! + 'T12:00:00')
        const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return { account: a, daysLeft }
      })
      .filter(({ daysLeft }) => daysLeft >= 0 && daysLeft <= 7)
      .sort((a, b) => a.daysLeft - b.daysLeft)
  }, [accounts])

  // ─── Breach alerts — an account still marked active whose recorded balance
  // already exceeds a drawdown limit (the "would breach" calculator only warns
  // about future losses; this flags limits that are already blown) ────────────
  const breachedAccounts = useMemo(() => {
    return accounts
      .filter(a => a.status === 'active')
      .map(a => {
        const status = getChallengeStatus(a)
        if (!status) return null
        const totalBreached = status.totalDDUsedPct >= 100
        const dailyBreached = status.dailyDDUsedPct >= 100
        if (!totalBreached && !dailyBreached) return null
        return { account: a, totalBreached, dailyBreached }
      })
      .filter(Boolean) as Array<{ account: PropFirmAccount; totalBreached: boolean; dailyBreached: boolean }>
  }, [accounts])

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      {/* Affiliate deals banner */}
      {showDealsBanner && (
        <NoticeBanner
          className="mx-4 sm:mx-6 lg:mx-8 mt-4"
          tone="info"
          icon={Tag}
          title="Save on your next challenge"
          description="Discount codes for The5ers, FTMO, Apex and more"
          actions={
            <Button asChild size="sm" className="shadow-none">
              <Link
                to="/affiliate"
                onClick={() => trackEvent('affiliate_link_clicked', { source: 'proptracker_deals_banner' })}
              >
                View deals <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          }
          onDismiss={() => { localStorage.setItem('ftj-dismiss-deals-pt', '1'); setShowDealsBanner(false); }}
        />
      )}

      {/* Page header: title, actions, headline numbers */}
      <div className="border-b">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-bold" style={{ color: themeColors.primary }}>PropTracker</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {subtitleParts ? subtitleParts.base : 'Track fees, resets, and payouts across your prop firms'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {activeRulesAccounts.length >= 1 && (
                <Button variant="outline" onClick={openCheckinDialog} className="h-10 touch-manipulation">
                  <ClipboardText className="h-4 w-4 mr-1.5" aria-hidden="true" />
                  <span className="hidden sm:inline">End of day</span>
                  <span className="sm:hidden">Check-in</span>
                </Button>
              )}
              {!isPro && accounts.length >= FREE_ACCOUNT_LIMIT ? (
                <Link to="/pricing">
                  <Button className="h-10 touch-manipulation" style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}>
                    <Lock className="h-4 w-4 mr-1.5" aria-hidden="true" />
                    Upgrade for more
                  </Button>
                </Link>
              ) : (
                <Button onClick={openAddAccount} className="h-10 touch-manipulation" style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}>
                  <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
                  Add account
                </Button>
              )}
            </div>
          </div>

          {accounts.length > 0 && (
            <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-y-5 gap-x-4 sm:gap-x-0">
              {statCards.map((card, i) => (
                <div key={card.label} className={`min-w-0 ${i > 0 ? 'sm:border-l sm:border-border sm:pl-6' : ''} ${i > 0 && i < 3 ? 'sm:pr-6' : ''}`}>
                  <dt className="text-xs text-muted-foreground">{card.label}</dt>
                  <dd className="mt-1 text-xl sm:text-2xl font-semibold tabular-nums tracking-tight truncate" style={{ color: card.valueColor }}>
                    {card.value}
                  </dd>
                  <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">{card.subtitle}</p>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-5 flex-1">

        {/* Pro nudge when at free account limit */}
        {!isPro && accounts.length >= FREE_ACCOUNT_LIMIT && (
          <ProUpgradeCard
            icon={Buildings}
            title={FREE_ACCOUNT_LIMIT === 1 ? 'You\'ve used your free account' : `You've used all ${FREE_ACCOUNT_LIMIT} free accounts`}
            description="Upgrade to Pro for unlimited prop firm accounts, advanced analytics, AI-powered challenge analysis, and more."
            cta="Unlock unlimited accounts"
            dismissKey="proptracker-limit"
          />
        )}

        {/* Breach alerts: always visible, whichever tab is open */}
        {breachedAccounts.length > 0 && (
          <div className="space-y-2">
            {breachedAccounts.map(({ account, totalBreached, dailyBreached }) => (
              <div
                key={account.id}
                role="alert"
                className="flex items-start gap-3 px-4 py-3 rounded-lg border text-sm"
                style={{ borderColor: alpha(themeColors.loss, '55'), backgroundColor: alpha(themeColors.loss, '0d') }}
              >
                <Warning className="h-4 w-4 shrink-0 mt-0.5" style={{ color: themeColors.loss }} />
                <p>
                  <span className="font-medium" style={{ color: themeColors.loss }}>
                    {totalBreached ? 'Max drawdown breached' : 'Daily drawdown breached'}
                  </span>
                  <span className="text-muted-foreground">
                    {' '}{account.firmName} ({account.accountType}). {totalBreached && dailyBreached ? 'Both limits exceeded. ' : ''}
                    Check your balance entry, or mark the account as failed if the firm confirmed the breach.
                  </span>
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Deadline alerts */}
        {upcomingDeadlines.length > 0 && (
          <div className="space-y-2">
            {upcomingDeadlines.map(({ account, daysLeft }) => (
              <div
                key={account.id}
                className="flex items-start gap-3 px-4 py-3 rounded-lg border text-sm"
                style={{
                  borderColor: daysLeft <= 2 ? alpha(themeColors.loss, '40') : 'hsl(var(--border))',
                }}
              >
                <Warning
                  className="h-4 w-4 shrink-0 mt-0.5"
                  style={{ color: daysLeft <= 2 ? themeColors.loss : themeColors.primary }}
                />
                <p>
                  <span className="font-medium" style={{ color: daysLeft <= 2 ? themeColors.loss : themeColors.primary }}>
                    {daysLeft === 0 ? 'Expires today' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                  </span>
                  <span className="text-muted-foreground">
                    {' '}{account.firmName} ({account.accountType}) evaluation ends {new Date(account.endDate! + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </p>
              </div>
            ))}
          </div>
        )}

        {accounts.length === 0 ? (
          /* ── Empty state ── */
          <div className="rounded-lg border overflow-hidden">
            <div className="flex flex-col items-center text-center gap-5 px-6 pt-12 pb-10">
              <div className="space-y-2 max-w-md">
                <h2 className="text-2xl font-bold tracking-tight">Do you actually know your prop ROI?</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Log every fee and every payout. PropTracker calculates the number most prop traders never work out.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                {[
                  { icon: Receipt, label: 'Fees and payouts' },
                  { icon: TrendUp, label: 'True ROI' },
                  { icon: ClipboardText, label: 'Challenge rules' },
                  { icon: Brain, label: 'AI analysis' },
                ].map(f => (
                  <div key={f.label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted border text-muted-foreground">
                    <f.icon className="h-3 w-3" aria-hidden="true" />
                    {f.label}
                  </div>
                ))}
              </div>

              <Button onClick={openAddAccount} size="lg" style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}>
                <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
                Add your first account
              </Button>

              {!isPro && <p className="text-xs text-muted-foreground -mt-1">Free to start · {FREE_ACCOUNT_LIMIT} {FREE_ACCOUNT_LIMIT === 1 ? 'account' : 'accounts'} on free plan</p>}

              <p className="text-xs text-muted-foreground">
                Starting a new challenge?{' '}
                <Link
                  to="/affiliate"
                  className="font-medium hover:underline"
                  style={{ color: themeColors.primary }}
                  onClick={() => trackEvent('affiliate_link_clicked', { source: 'proptracker_empty_state' })}
                >
                  Get partner discounts at top prop firms
                </Link>
              </p>
            </div>

            {/* Preview of a filled-in tracker, faded */}
            <div className="relative border-t">
              <p className="absolute top-3 left-1/2 -translate-x-1/2 text-xs text-muted-foreground bg-card px-2">Preview</p>
              <div className="pointer-events-none select-none opacity-50 p-4 sm:p-6 pt-8 sm:pt-8 space-y-5">
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-y-4">
                  {[
                    { label: 'Total invested', value: '$1,915', sub: 'All fees paid', color: 'hsl(var(--foreground))' },
                    { label: 'Total earned', value: '$7,700', sub: 'All payouts received', color: themeColors.profit },
                    { label: 'Net P&L', value: '+$5,785', sub: '+302% ROI', color: themeColors.profit },
                    { label: 'Active accounts', value: '2', sub: 'of 4 total', color: themeColors.primary },
                  ].map((c, i) => (
                    <div key={c.label} className={i > 0 ? 'sm:border-l sm:border-border sm:pl-6' : ''}>
                      <dt className="text-xs text-muted-foreground">{c.label}</dt>
                      <dd className="mt-1 text-xl sm:text-2xl font-semibold tabular-nums tracking-tight" style={{ color: c.color }}>{c.value}</dd>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.sub}</p>
                    </div>
                  ))}
                </dl>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {[
                    { initials: 'TS', color: '#FFCC06', firm: 'TopStep', size: '$50,000', type: 'Evaluation', status: 'Active', statusClass: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20', invested: '$347', earned: '$2,300', pnl: '+$1,953' },
                    { initials: 'AT', color: '#007BFF', firm: 'Apex Trader Funding', size: '$100,000', type: 'Funded', status: 'Passed', statusClass: 'bg-blue-500/15 text-blue-600 border-blue-500/20', invested: '$137', earned: '$3,900', pnl: '+$3,763' },
                  ].map(g => (
                    <Card key={g.firm}>
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-start gap-3 mb-4">
                          {FIRM_LOGOS[g.firm] ? (
                            <div className="h-9 w-9 rounded-lg shrink-0 overflow-hidden bg-white border"><img src={FIRM_LOGOS[g.firm]} alt={g.firm} className="w-full h-full object-cover" /></div>
                          ) : (
                            <div className="h-9 w-9 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: g.color }}>{g.initials}</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-sm">{g.firm}</p>
                              <span className={`text-xs h-5 px-1.5 rounded border font-medium ${g.statusClass}`}>{g.status}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{g.size} · {g.type}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 divide-x divide-border">
                          {[{ l: 'Invested', v: g.invested }, { l: 'Earned', v: g.earned }, { l: 'P&L', v: g.pnl }].map((s, i) => (
                            <div key={s.l} className={i > 0 ? 'pl-3' : ''}>
                              <p className="text-xs text-muted-foreground">{s.l}</p>
                              <p className="text-sm font-semibold tabular-nums mt-0.5">{s.v}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none" style={{ background: 'linear-gradient(to top, hsl(var(--background)) 0%, transparent 100%)' }} />
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as PropTab)}>
            <TabsList className="w-full grid grid-cols-3 sm:w-auto sm:inline-flex">
              <TabsTrigger value="accounts" className="gap-1.5">
                Accounts
                <span className="text-xs text-muted-foreground tabular-nums">{accounts.length}</span>
              </TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="coach">AI Coach</TabsTrigger>
            </TabsList>

            {/* ── Accounts tab ── */}
            <TabsContent value="accounts" className="mt-5 space-y-5">
              {!tipDismissed && (
                <div className="flex items-start gap-3 rounded-lg border px-4 py-3 text-sm">
                  <Info className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <p className="flex-1 text-muted-foreground">
                    <span className="font-medium text-foreground">Quick start.</span>{' '}
                    One card per prop account. Log every fee and payout, set challenge rules to see drawdown and profit target live, and the header shows your true net P&L across all firms.
                  </p>
                  <button onClick={dismissTip} aria-label="Dismiss tip" className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5">
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              )}

              {/* Risk calculator */}
              {activeRulesAccounts.length > 0 && (
                <div className="rounded-lg border overflow-hidden">
                  <button
                    onClick={() => setRiskCalcOpen(p => !p)}
                    aria-expanded={riskCalcOpen}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Calculator className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <p className="text-sm font-medium">Risk calculator</p>
                      <p className="text-xs text-muted-foreground truncate hidden sm:block">See what a loss today does to your drawdown limits</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {maxSafeLoss > 0 && !riskCalcOpen && (
                        <span className="text-xs text-muted-foreground tabular-nums hidden sm:inline">
                          Max safe today <span className="font-semibold text-foreground">{fmt(Math.floor(maxSafeLoss), activeRulesAccounts[0]?.currency)}</span>
                        </span>
                      )}
                      {riskCalcOpen ? <CaretUp className="h-4 w-4 text-muted-foreground" /> : <CaretDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </button>
                  {riskCalcOpen && (
                    <div className="px-4 pb-4 space-y-4 border-t pt-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="text-sm text-muted-foreground whitespace-nowrap">If I lose</label>
                        <div className="relative max-w-[120px] sm:max-w-[160px]">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" aria-hidden="true">{currencySymbol(aggregateCurrency)}</span>
                          <Input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            className="pl-7"
                            value={riskCalcAmount}
                            onChange={e => setRiskCalcAmount(e.target.value)}
                            aria-label="Hypothetical loss amount"
                          />
                        </div>
                        <label className="text-sm text-muted-foreground whitespace-nowrap">today</label>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {[100, 250, 500, 1000].map(v => {
                          const active = Number(riskCalcAmount) === v
                          return (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setRiskCalcAmount(String(v))}
                              className="h-8 px-3 rounded-md text-xs font-medium tabular-nums border transition-colors hover:bg-muted/40"
                              style={{
                                borderColor: active ? themeColors.primary : 'hsl(var(--border))',
                                backgroundColor: active ? alpha(themeColors.primary, '15') : 'transparent',
                                color: active ? themeColors.primary : undefined,
                              }}
                            >
                              ${v >= 1000 ? `${v / 1000}k` : v}
                            </button>
                          )
                        })}
                        {maxSafeLoss > 0 && (
                          <button
                            type="button"
                            onClick={() => setRiskCalcAmount(String(Math.floor(maxSafeLoss)))}
                            className="h-8 px-3 rounded-md text-xs font-medium tabular-nums border border-dashed transition-colors hover:bg-muted/40"
                            style={{ borderColor: alpha(themeColors.primary, '60'), color: themeColors.primary }}
                          >
                            Max safe · {fmt(Math.floor(maxSafeLoss), activeRulesAccounts[0]?.currency)}
                          </button>
                        )}
                      </div>
                      {riskCalcResults && riskCalcResults.length > 0 && (
                        <div className="space-y-2">
                          {riskCalcResults.map(r => {
                            const brandColor = firmAvatarColor(r.account.firmName)
                            const breached = r.wouldBreachTotal || r.wouldBreachDaily
                            const hasDaily = r.account.challengeRules!.maxDailyDrawdown > 0
                            return (
                              <div
                                key={r.account.id}
                                className="rounded-lg border p-3 space-y-2.5"
                                style={{
                                  borderColor: breached ? alpha(themeColors.loss, '40') : 'hsl(var(--border))',
                                  backgroundColor: breached ? alpha(themeColors.loss, '06') : undefined,
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  {FIRM_LOGOS[r.account.firmName] ? (
                                    <div className="h-6 w-6 rounded shrink-0 overflow-hidden bg-white border"><img src={FIRM_LOGOS[r.account.firmName]} alt={r.account.firmName} className="w-full h-full object-cover" /></div>
                                  ) : (
                                    <div
                                      className="h-6 w-6 rounded flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                                      style={{ backgroundColor: brandColor }}
                                    >
                                      {firmInitials(r.account.firmName)}
                                    </div>
                                  )}
                                  <span className="text-sm font-medium min-w-0 truncate">{r.account.firmName}</span>
                                  <span className="text-xs text-muted-foreground shrink-0">{currencySymbol(r.account.currency)}{r.account.accountSize.toLocaleString()}</span>
                                  {breached && (
                                    <Badge variant="outline" className="ml-auto text-xs h-5 px-1.5 bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20">
                                      Breach
                                    </Badge>
                                  )}
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Total drawdown</span>
                                    <span className="font-semibold tabular-nums">
                                      <span className="text-muted-foreground">{r.totalDDPctBefore.toFixed(0)}%</span>
                                      <span className="text-muted-foreground mx-1">&rarr;</span>
                                      <span style={{ color: ddBarColor(r.totalDDPctAfter, themeColors) }}>
                                        {r.totalDDPctAfter.toFixed(0)}%{r.wouldBreachTotal && ' limit'}
                                      </span>
                                    </span>
                                  </div>
                                  <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, r.totalDDPctAfter)}%`, backgroundColor: ddBarColor(r.totalDDPctAfter, themeColors) }} />
                                    <div className="absolute top-0 bottom-0 w-px bg-foreground/40" style={{ left: `${Math.min(100, r.totalDDPctBefore)}%` }} aria-hidden="true" />
                                  </div>
                                </div>
                                {hasDaily && (
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-muted-foreground">Daily drawdown</span>
                                      <span className="font-semibold tabular-nums">
                                        <span className="text-muted-foreground">{r.dailyDDPctBefore.toFixed(0)}%</span>
                                        <span className="text-muted-foreground mx-1">&rarr;</span>
                                        <span style={{ color: ddBarColor(r.dailyDDPctAfter, themeColors) }}>
                                          {r.dailyDDPctAfter.toFixed(0)}%{r.wouldBreachDaily && ' limit'}
                                        </span>
                                      </span>
                                    </div>
                                    <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                                      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, r.dailyDDPctAfter)}%`, backgroundColor: ddBarColor(r.dailyDDPctAfter, themeColors) }} />
                                      <div className="absolute top-0 bottom-0 w-px bg-foreground/40" style={{ left: `${Math.min(100, r.dailyDDPctBefore)}%` }} aria-hidden="true" />
                                    </div>
                                  </div>
                                )}
                                <div className="flex items-center justify-between text-xs pt-0.5">
                                  <span className="text-muted-foreground">Balance after <span className="font-semibold tabular-nums text-foreground">{fmt(r.balanceAfter, r.account.currency)}</span></span>
                                  <span className="text-muted-foreground">Room left <span className="font-semibold tabular-nums text-foreground">{fmt(r.remainingBeforeTotal, r.account.currency)}</span></span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                      {(!riskCalcResults || riskCalcResults.length === 0) && (
                        <div className="rounded-lg border border-dashed px-4 py-5 text-center space-y-1">
                          <p className="text-xs text-muted-foreground">Enter an amount or tap a preset to see how a loss would affect your active challenges.</p>
                          {maxSafeLoss > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Your tightest buffer today is <span className="font-semibold text-foreground tabular-nums">{fmt(Math.floor(maxSafeLoss), activeRulesAccounts[0]?.currency)}</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Status filter (only worth showing once there are a few accounts) */}
              {accounts.length >= 4 && (
                <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter accounts by status">
                  {([{ value: 'all', label: 'All', count: accounts.length }, ...STATUS_OPTIONS.map(s => ({ value: s.value, label: s.label, count: statusCounts[s.value] ?? 0 }))] as Array<{ value: 'all' | PropAccountStatus; label: string; count: number }>)
                    .filter(f => f.count > 0)
                    .map(f => {
                      const active = effectiveFilter === f.value
                      return (
                        <button
                          key={f.value}
                          type="button"
                          onClick={() => setAccountFilter(f.value)}
                          aria-pressed={active}
                          className="h-8 px-3 rounded-full text-xs font-medium border transition-colors hover:bg-muted/40 tabular-nums"
                          style={{
                            borderColor: active ? themeColors.primary : 'hsl(var(--border))',
                            backgroundColor: active ? alpha(themeColors.primary, '15') : 'transparent',
                            color: active ? themeColors.primary : undefined,
                          }}
                        >
                          {f.label} <span className={active ? '' : 'text-muted-foreground'}>{f.count}</span>
                        </button>
                      )
                    })}
                </div>
              )}

              {/* Account cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {visibleAccounts.map(account => {
                  const { invested, earned, net, txs } = getAccountStats(account.id)
                  const expanded = expandedIds.has(account.id)
                  const meta = statusMeta(account.status)
                  const typeMeta = ACCOUNT_TYPE_OPTIONS.find(t => t.value === account.accountType)
                    ?? { value: account.accountType, label: String(account.accountType) }
                  const brandColor = firmAvatarColor(account.firmName)
                  const challengeStatus = getChallengeStatus(account)
                  const isEvalPhase = account.accountType === 'evaluation' || account.accountType === 'express'
                  const isClosed = account.status === 'failed' || account.status === 'withdrawn'
                  return (
                    <Card key={account.id} className="h-full flex flex-col">
                      <CardContent className="p-4 sm:p-5 flex-1 flex flex-col">
                        {/* Account header */}
                        <div className="flex items-start gap-3 mb-4">
                          {FIRM_LOGOS[account.firmName] ? (
                            <div className="h-9 w-9 rounded-lg shrink-0 mt-0.5 overflow-hidden bg-white border">
                              <img src={FIRM_LOGOS[account.firmName]} alt={account.firmName} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div
                              className="h-9 w-9 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5"
                              style={{ backgroundColor: brandColor }}
                            >
                              {firmInitials(account.firmName)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-sm leading-tight truncate">{account.firmName}</p>
                              <Badge variant="outline" className={`text-xs h-5 px-1.5 shrink-0 font-medium ${meta.badgeClass}`}>
                                {meta.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              <span className="font-medium text-foreground/80">{currencySymbol(account.currency)}{account.accountSize.toLocaleString()}</span>
                              {' '}&middot; {typeMeta.label} &middot; Since {parseStoredDate(account.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        {/* Money in / out / net */}
                        <div className="grid grid-cols-3 divide-x divide-border mb-3">
                          {[
                            { label: 'Invested', value: invested > 0 ? fmt(invested, account.currency) : '—', color: undefined },
                            { label: 'Earned', value: earned > 0 ? fmt(earned, account.currency) : '—', color: earned > 0 ? themeColors.profit : undefined },
                            { label: 'P&L', value: txs.length > 0 ? (net >= 0 ? '+' : '-') + fmt(net, account.currency) : '—', color: txs.length > 0 ? (net >= 0 ? themeColors.profit : themeColors.loss) : undefined },
                          ].map((s, i) => (
                            <div key={s.label} className={`min-w-0 ${i > 0 ? 'pl-3' : ''}`}>
                              <p className="text-xs text-muted-foreground">{s.label}</p>
                              <p className="text-sm font-semibold tabular-nums mt-0.5 truncate" style={{ color: s.color ?? (s.value === '—' ? 'hsl(var(--muted-foreground))' : undefined) }}>{s.value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Cost recovery */}
                        {invested > 0 && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-3">
                            {net >= 0 ? (
                              <>
                                <CheckCircle className="h-3.5 w-3.5 shrink-0" style={{ color: themeColors.profit }} />
                                <span>Costs recovered{earned > invested ? `, ${fmt(earned - invested, account.currency)} profit` : ''}</span>
                              </>
                            ) : (
                              <>
                                <Target className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <span>{isClosed ? `${fmt(Math.abs(net), account.currency)} net loss` : `${fmt(Math.abs(net), account.currency)} more in payouts to break even`}</span>
                              </>
                            )}
                          </p>
                        )}

                        {/* Challenge progress */}
                        {challengeStatus && account.challengeRules && (
                          <div className="border-t pt-3 mb-3 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-medium">{isEvalPhase ? 'Challenge progress' : 'Risk limits'}</p>
                              {account.challengeProgress?.lastUpdated && (
                                <p className="text-xs text-muted-foreground">
                                  {(() => {
                                    const days = daysSinceLocalDate(account.challengeProgress!.lastUpdated)
                                    if (days <= 0) return 'Updated today'
                                    if (days === 1) return 'Updated yesterday'
                                    return `Updated ${days}d ago`
                                  })()}
                                </p>
                              )}
                            </div>
                            {isEvalPhase && (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Profit target</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground tabular-nums">
                                      {challengeStatus.profitGain >= 0 ? '+' : ''}{fmt(challengeStatus.profitGain, account.currency)} / {fmt(account.challengeRules.profitTarget, account.currency)}
                                    </span>
                                    <span className="font-semibold tabular-nums min-w-[2.5rem] text-right" style={{ color: profitBarColor(challengeStatus.profitPct, themeColors) }}>
                                      {Math.max(0, Math.min(100, challengeStatus.profitPct)).toFixed(0)}%
                                    </span>
                                  </div>
                                </div>
                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-300"
                                    style={{
                                      width: `${Math.max(0, Math.min(100, challengeStatus.profitPct))}%`,
                                      backgroundColor: profitBarColor(challengeStatus.profitPct, themeColors),
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Total drawdown</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground tabular-nums">
                                    {fmt(challengeStatus.totalDDDollars, account.currency)} / {fmt(challengeStatus.maxTotalDDDollars, account.currency)}
                                  </span>
                                  <span className="font-semibold tabular-nums min-w-[2.5rem] text-right" style={{ color: ddBarColor(challengeStatus.totalDDUsedPct, themeColors) }}>
                                    {Math.min(100, challengeStatus.totalDDUsedPct).toFixed(0)}%
                                  </span>
                                </div>
                              </div>
                              <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{
                                    width: `${Math.min(100, challengeStatus.totalDDUsedPct)}%`,
                                    backgroundColor: ddBarColor(challengeStatus.totalDDUsedPct, themeColors),
                                  }}
                                />
                              </div>
                            </div>
                            {account.challengeRules.maxDailyDrawdown > 0 && (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Daily drawdown</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground tabular-nums">
                                      {fmt(challengeStatus.dailyDDDollars, account.currency)} / {fmt(challengeStatus.maxDailyDDDollars, account.currency)}
                                    </span>
                                    <span className="font-semibold tabular-nums min-w-[2.5rem] text-right" style={{ color: ddBarColor(challengeStatus.dailyDDUsedPct, themeColors) }}>
                                      {Math.min(100, challengeStatus.dailyDDUsedPct).toFixed(0)}%
                                    </span>
                                  </div>
                                </div>
                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-300"
                                    style={{
                                      width: `${Math.min(100, challengeStatus.dailyDDUsedPct)}%`,
                                      backgroundColor: ddBarColor(challengeStatus.dailyDDUsedPct, themeColors),
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                            {isEvalPhase && challengeStatus.tradingDaysPct !== null && account.challengeRules.minTradingDays && (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Trading days</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground tabular-nums">
                                      {Math.min(challengeStatus.tradingDaysCount, account.challengeRules.minTradingDays)} / {account.challengeRules.minTradingDays}
                                    </span>
                                    <span className="font-semibold tabular-nums min-w-[2.5rem] text-right" style={{ color: themeColors.primary }}>
                                      {Math.min(100, challengeStatus.tradingDaysPct).toFixed(0)}%
                                    </span>
                                  </div>
                                </div>
                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-300"
                                    style={{
                                      width: `${Math.min(100, challengeStatus.tradingDaysPct)}%`,
                                      backgroundColor: themeColors.primary,
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {account.notes && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mb-3">{account.notes}</p>
                        )}

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-1.5 gap-y-2 pt-3 mt-auto border-t">
                          {/* Phones lay the buttons out as a flush 2-up grid: three of them in
                              one flex row overflowed the card under 400px, and letting them wrap
                              stranded a single button on its own line. Update balance takes the
                              full second row. Back to an inline row from sm up. */}
                          <div className="grid w-full grid-cols-2 gap-1.5 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
                            <Button variant="outline" size="sm" className="h-8 w-full text-xs gap-1 sm:w-auto" onClick={() => openAddTx(account.id)}>
                              <Plus className="h-3 w-3" />
                              Transaction
                            </Button>
                            {account.challengeRules && (
                              <Button
                                size="sm"
                                className="h-8 w-full text-xs gap-1 col-span-2 order-last sm:w-auto sm:order-none"
                                style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}
                                onClick={() => openBalanceDialog(account)}
                              >
                                <ArrowsClockwise className="h-3 w-3" />
                                Update balance
                              </Button>
                            )}
                            {isPro ? (
                              <Button variant="outline" size="sm" className="h-8 w-full text-xs gap-1 sm:w-auto" onClick={() => openImportDialog(account.id)}>
                                <UploadSimple className="h-3 w-3" />
                                Import
                              </Button>
                            ) : (
                              <Link to="/pricing" className="w-full sm:w-auto">
                                <Button variant="outline" size="sm" className="h-8 w-full text-xs gap-1 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 sm:w-auto">
                                  <UploadSimple className="h-3 w-3" />
                                  Import
                                  <Lock className="h-2.5 w-2.5 ml-0.5" />
                                </Button>
                              </Link>
                            )}
                          </div>
                          <div className="flex items-center gap-1 ml-0 sm:ml-auto">
                            {txs.length > 0 && (
                              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-muted-foreground" onClick={() => toggleExpand(account.id)} aria-expanded={expanded}>
                                {expanded ? <CaretUp className="h-3.5 w-3.5" /> : <CaretDown className="h-3.5 w-3.5" />}
                                {txs.length} transaction{txs.length !== 1 ? 's' : ''}
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Edit account" onClick={() => openEditAccount(account)}>
                              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" aria-label="Delete account" onClick={() => setDeleteDialog({ open: true, type: 'account', id: account.id })}>
                              <Trash className="h-3.5 w-3.5" aria-hidden="true" />
                            </Button>
                          </div>
                        </div>

                        {/* Expanded transactions */}
                        {expanded && txs.length > 0 && (() => {
                          const sorted = [...txs].sort((a, b) => b.date.localeCompare(a.date))
                          const grouped = sorted.reduce((acc, tx) => {
                            const month = tx.date.substring(0, 7)
                            if (!acc[month]) acc[month] = []
                            acc[month].push(tx)
                            return acc
                          }, {} as Record<string, typeof txs>)
                          const months = Object.keys(grouped).sort((a, b) => b.localeCompare(a))
                          const showAll = showAllMonths.has(account.id)
                          const visibleMonths = showAll ? months : months.slice(0, 3)
                          const hiddenCount = months.length - visibleMonths.length
                          return (
                            <div className="flex flex-col gap-0 pt-1">
                              {visibleMonths.map(month => {
                                const monthTxs = grouped[month]
                                const monthLabel = new Date(month + '-02').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                                const monthNet = monthTxs.reduce((sum, tx) => sum + (isExpenseTx(tx.type) ? -tx.amount : tx.amount), 0)
                                const monthOpen = isMonthOpen(account.id, month)
                                return (
                                  <div key={month}>
                                    <button
                                      onClick={() => toggleMonth(account.id, month)}
                                      aria-expanded={monthOpen}
                                      className="w-full flex items-center justify-between px-1.5 py-1.5 mt-1.5 rounded hover:bg-muted/40 transition-colors"
                                    >
                                      <div className="flex items-center gap-1.5">
                                        {monthOpen
                                          ? <CaretUp className="h-3 w-3 text-muted-foreground" />
                                          : <CaretDown className="h-3 w-3 text-muted-foreground" />}
                                        <span className="text-xs font-medium">{monthLabel}</span>
                                        <span className="text-xs text-muted-foreground">({monthTxs.length})</span>
                                      </div>
                                      <span className="text-xs font-semibold tabular-nums" style={{ color: monthNet >= 0 ? themeColors.profit : themeColors.loss }}>
                                        {monthNet >= 0 ? '+' : '-'}{fmt(Math.abs(monthNet), account.currency)}
                                      </span>
                                    </button>
                                    {monthOpen && <div className="flex flex-col gap-0.5">
                                      {monthTxs.map(tx => {
                                        const expense = isExpenseTx(tx.type)
                                        const txMeta = TX_TYPE_OPTIONS.find(t => t.value === tx.type)!
                                        return (
                                          <div key={tx.id} className="flex items-center gap-2 rounded-md hover:bg-muted/40 px-1.5 py-1.5 group transition-colors">
                                            <div style={{ color: expense ? themeColors.loss : themeColors.profit }}>
                                              {expense ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-1.5 min-w-0">
                                                <span className={`text-xs font-medium px-1.5 py-0.5 rounded border shrink-0 ${txMeta.badgeClass}`}>
                                                  {txMeta.label}
                                                </span>
                                                {tx.description && <span className="text-xs text-muted-foreground truncate">{tx.description}</span>}
                                              </div>
                                            </div>
                                            <span className="text-xs text-muted-foreground shrink-0">
                                              {parseStoredDate(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                                            </span>
                                            <span className="text-xs font-semibold shrink-0 tabular-nums" style={{ color: expense ? themeColors.loss : themeColors.profit }}>
                                              {expense ? '-' : '+'}{fmt(tx.amount, account.currency)}
                                            </span>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-9 w-9 -m-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                                              aria-label="Delete transaction"
                                              onClick={() => setDeleteDialog({ open: true, type: 'tx', id: tx.id })}
                                            >
                                              <Trash className="h-3 w-3" aria-hidden="true" />
                                            </Button>
                                          </div>
                                        )
                                      })}
                                    </div>}
                                  </div>
                                )
                              })}
                              {hiddenCount > 0 && (
                                <button
                                  onClick={() => setShowAllMonths(prev => { const n = new Set(prev); n.add(account.id); return n })}
                                  className="w-full text-xs text-muted-foreground hover:text-foreground py-1.5 mt-1 transition-colors text-center"
                                >
                                  Show {hiddenCount} older {hiddenCount === 1 ? 'month' : 'months'}
                                </button>
                              )}
                              {showAll && months.length > 3 && (
                                <button
                                  onClick={() => setShowAllMonths(prev => { const n = new Set(prev); n.delete(account.id); return n })}
                                  className="w-full text-xs text-muted-foreground hover:text-foreground py-1.5 mt-1 transition-colors text-center"
                                >
                                  Show less
                                </button>
                              )}
                            </div>
                          )
                        })()}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            {/* ── Performance tab ── */}
            <TabsContent value="performance" className="mt-5 space-y-5">
              {/* Period */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Money figures use the selected period. Pass and fail counts are all time.
                </p>
                <div className="flex items-center gap-1.5" role="group" aria-label="Period">
                  {([['3m', '3M'], ['6m', '6M'], ['12m', '12M'], ['all', 'All']] as Array<[PerfRange, string]>).map(([value, label]) => {
                    const active = perfRange === value
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setPerfRange(value)}
                        aria-pressed={active}
                        className="h-8 px-3 rounded-md text-xs font-medium border transition-colors hover:bg-muted/40 tabular-nums"
                        style={{
                          borderColor: active ? themeColors.primary : 'hsl(var(--border))',
                          backgroundColor: active ? alpha(themeColors.primary, '15') : 'transparent',
                          color: active ? themeColors.primary : undefined,
                        }}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Track record: lifetime */}
              {successStats ? (
                <ProGate featureName="Success Rate Dashboard">
                  <div className="rounded-lg border">
                    <div className="px-4 sm:px-5 py-3 border-b flex items-center justify-between">
                      <p className="text-sm font-medium">Track record</p>
                      <p className="text-xs text-muted-foreground">All time</p>
                    </div>
                    <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-y-5 gap-x-4 sm:gap-x-0 p-4 sm:p-5">
                      {(() => {
                        const passColor = successStats.passRate !== null && successStats.passRate >= 50 ? themeColors.profit : themeColors.loss
                        const roiColor = successStats.bestFirm && successStats.bestFirm.roi >= 0 ? themeColors.profit : themeColors.loss
                        const cells: Array<{ label: string; value: string; color?: string; sub: string; bar?: { pct: number; color: string; left: string; right: string } }> = [
                          {
                            label: 'Pass rate',
                            value: successStats.passRate !== null ? `${successStats.passRate.toFixed(0)}%` : '--',
                            color: successStats.passRate !== null ? passColor : undefined,
                            sub: `${successStats.passed} passed, ${successStats.failed} failed`,
                            bar: successStats.passRate !== null ? { pct: successStats.passRate, color: passColor, left: `${successStats.passed} passed`, right: `${successStats.failed} failed` } : undefined,
                          },
                          { label: 'Attempts', value: String(successStats.total), sub: `${successStats.passed} funded` },
                          { label: 'Avg cost to fund', value: successStats.avgCostToFund !== null ? fmt(successStats.avgCostToFund, aggregateCurrency) : '--', sub: 'Per funded account' },
                          { label: 'Spent on failed', value: successStats.totalWastedOnFailed > 0 ? fmt(successStats.totalWastedOnFailed, aggregateCurrency) : '--', color: successStats.totalWastedOnFailed > 0 ? themeColors.loss : undefined, sub: `Across ${successStats.failed} failed` },
                          { label: 'Best firm ROI', value: successStats.bestFirm ? `${successStats.bestFirm.roi >= 0 ? '+' : ''}${successStats.bestFirm.roi.toFixed(0)}%` : '--', color: successStats.bestFirm ? roiColor : undefined, sub: successStats.bestFirm?.firm ?? 'Not enough data' },
                        ]
                        return cells.map((c, i) => (
                          <div key={c.label} className={`min-w-0 ${i > 0 ? 'sm:border-l sm:border-border sm:pl-5' : ''} ${i < cells.length - 1 ? 'sm:pr-5' : ''}`}>
                            <dt className="text-xs text-muted-foreground">{c.label}</dt>
                            <dd className="mt-1 text-xl font-semibold tabular-nums tracking-tight truncate" style={{ color: c.color ?? (c.value === '--' ? 'hsl(var(--muted-foreground))' : undefined) }}>{c.value}</dd>
                            {c.bar ? (
                              <div className="mt-2 space-y-1">
                                <div className="h-1.5 rounded-full overflow-hidden bg-muted">
                                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, c.bar.pct)}%`, backgroundColor: c.bar.color }} />
                                </div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>{c.bar.left}</span>
                                  <span>{c.bar.right}</span>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">{c.sub}</p>
                            )}
                          </div>
                        ))
                      })()}
                    </dl>
                  </div>
                </ProGate>
              ) : (
                <div className="rounded-lg border border-dashed px-4 py-4 text-sm text-muted-foreground">
                  Pass rate, average cost to fund and best-firm ROI appear once you have 3 or more accounts. You have {accounts.length}.
                </div>
              )}

              {rangeTxs.length === 0 ? (
                <div className="rounded-lg border border-dashed px-4 py-4 text-sm text-muted-foreground">
                  {transactions.length === 0
                    ? 'Log a fee or payout on an account to see cash flow, spend and payout analytics.'
                    : 'No fees or payouts in this period. Pick a longer period or All.'}
                </div>
              ) : (
                <ProGate featureName="Charts & Analytics">
                  <div className="space-y-4">
                    {/* Cash flow row */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                      {/* Monthly cash flow */}
                      <Card className="flex flex-col lg:col-span-3">
                        <CardContent className="p-4 sm:p-5 flex flex-col flex-1">
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div>
                              <p className="text-sm font-medium">Monthly cash flow</p>
                              <p className="text-xs text-muted-foreground">Fees out, payouts in, by calendar month{monthlyBars.length < monthlyFlow.length ? `. Chart shows the last ${monthlyBars.length} months` : ''}</p>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ backgroundColor: themeColors.loss }} />Fees</span>
                              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ backgroundColor: themeColors.profit }} />Payouts</span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <ResponsiveContainer width="100%" height={220}>
                              <BarChart data={monthlyBars} margin={{ top: 4, right: 4, bottom: 0, left: 4 }} barCategoryGap="28%" barGap={2}>
                                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} interval="preserveStartEnd" />
                                <YAxis hide />
                                <Tooltip
                                  cursor={{ fill: 'hsl(var(--muted))', fillOpacity: 0.4 }}
                                  content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null
                                    const m = payload[0].payload as { key: string; fees: number; payouts: number; net: number }
                                    return (
                                      <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md space-y-1">
                                        <p className="font-medium text-foreground">{new Date(m.key + '-02T12:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                                        <p className="text-muted-foreground tabular-nums">Fees <span className="font-medium" style={{ color: themeColors.loss }}>-{fmt(m.fees, aggregateCurrency)}</span></p>
                                        <p className="text-muted-foreground tabular-nums">Payouts <span className="font-medium" style={{ color: themeColors.profit }}>+{fmt(m.payouts, aggregateCurrency)}</span></p>
                                        <p className="text-muted-foreground tabular-nums border-t pt-1">Net <span className="font-semibold" style={{ color: m.net >= 0 ? themeColors.profit : themeColors.loss }}>{m.net >= 0 ? '+' : '-'}{fmt(Math.abs(m.net), aggregateCurrency)}</span></p>
                                      </div>
                                    )
                                  }}
                                />
                                <Bar dataKey="fees" fill={themeColors.loss} fillOpacity={0.85} radius={[3, 3, 0, 0]} maxBarSize={28} />
                                <Bar dataKey="payouts" fill={themeColors.profit} fillOpacity={0.9} radius={[3, 3, 0, 0]} maxBarSize={28} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                          {monthlySummary && (
                            <dl className="grid grid-cols-3 gap-x-4 mt-4 pt-4 border-t">
                              <div className="min-w-0">
                                <dt className="text-xs text-muted-foreground">Best month</dt>
                                <dd className="text-sm font-semibold tabular-nums truncate" style={{ color: monthlySummary.best.net >= 0 ? themeColors.profit : themeColors.loss }}>
                                  {monthlySummary.best.net >= 0 ? '+' : '-'}{fmt(Math.abs(monthlySummary.best.net), aggregateCurrency)}
                                </dd>
                                <p className="text-xs text-muted-foreground truncate">{monthlySummary.monthLabel(monthlySummary.best.key)}</p>
                              </div>
                              <div className="min-w-0 border-l pl-4">
                                <dt className="text-xs text-muted-foreground">Worst month</dt>
                                <dd className="text-sm font-semibold tabular-nums truncate" style={{ color: monthlySummary.worst.net >= 0 ? themeColors.profit : themeColors.loss }}>
                                  {monthlySummary.worst.net >= 0 ? '+' : '-'}{fmt(Math.abs(monthlySummary.worst.net), aggregateCurrency)}
                                </dd>
                                <p className="text-xs text-muted-foreground truncate">{monthlySummary.monthLabel(monthlySummary.worst.key)}</p>
                              </div>
                              <div className="min-w-0 border-l pl-4">
                                <dt className="text-xs text-muted-foreground">Avg per active month</dt>
                                <dd className="text-sm font-semibold tabular-nums truncate" style={{ color: monthlySummary.avgNet >= 0 ? themeColors.profit : themeColors.loss }}>
                                  {monthlySummary.avgNet >= 0 ? '+' : '-'}{fmt(Math.abs(monthlySummary.avgNet), aggregateCurrency)}
                                </dd>
                                <p className="text-xs text-muted-foreground truncate">{monthlySummary.months} month{monthlySummary.months !== 1 ? 's' : ''} with activity</p>
                              </div>
                            </dl>
                          )}
                        </CardContent>
                      </Card>

                      {/* Cumulative P&L */}
                      <Card className="flex flex-col lg:col-span-2">
                        <CardContent className="p-4 sm:p-5 flex flex-col flex-1">
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div>
                              <p className="text-sm font-medium">Cumulative P&L</p>
                              <p className="text-xs text-muted-foreground">{rangeStart ? 'Carries the balance from before the period' : 'Since your first transaction'}</p>
                            </div>
                            {pnlOverTime.length > 0 && (() => {
                              const final = pnlOverTime[pnlOverTime.length - 1].value
                              return (
                                <p className="text-lg font-semibold tabular-nums leading-none shrink-0" style={{ color: final >= 0 ? themeColors.profit : themeColors.loss }}>
                                  {final >= 0 ? '+' : '-'}{fmt(Math.abs(final), aggregateCurrency)}
                                </p>
                              )
                            })()}
                          </div>
                          <div className="flex-1 flex flex-col justify-end">
                            {(() => {
                              const final = pnlOverTime.length > 0 ? pnlOverTime[pnlOverTime.length - 1].value : 0
                              const lineColor = final >= 0 ? themeColors.profit : themeColors.loss
                              return (
                                <ResponsiveContainer width="100%" height={220}>
                                  <AreaChart data={pnlOverTime} margin={{ top: 8, right: 4, bottom: 8, left: 4 }}>
                                    <defs>
                                      <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={lineColor} stopOpacity={0.3} />
                                        <stop offset="100%" stopColor={lineColor} stopOpacity={0.02} />
                                      </linearGradient>
                                    </defs>
                                    <XAxis dataKey="date" hide />
                                    <YAxis hide domain={['auto', 'auto']} />
                                    <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1} strokeDasharray="3 3" />
                                    <Tooltip
                                      content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null
                                        const v = payload[0].value as number
                                        return (
                                          <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
                                            <p className="text-muted-foreground">{payload[0].payload.date}</p>
                                            <p className="font-semibold tabular-nums" style={{ color: v >= 0 ? themeColors.profit : themeColors.loss }}>
                                              {v >= 0 ? '+' : '-'}{fmt(Math.abs(v), aggregateCurrency)}
                                            </p>
                                          </div>
                                        )
                                      }}
                                    />
                                    <Area
                                      type="monotone"
                                      dataKey="value"
                                      stroke={lineColor}
                                      strokeWidth={2}
                                      fill="url(#pnlGradient)"
                                      baseValue={0}
                                      dot={false}
                                      activeDot={{ r: 3, strokeWidth: 0, fill: lineColor }}
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              )
                            })()}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Spend + payouts row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Where the money goes */}
                      <Card className="flex flex-col">
                        <CardContent className="p-4 sm:p-5 flex flex-col flex-1">
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div>
                              <p className="text-sm font-medium">Where the money goes</p>
                              <p className="text-xs text-muted-foreground">Fees by type</p>
                            </div>
                            <p className="text-lg font-semibold tabular-nums leading-none shrink-0">{spendByType.total > 0 ? fmt(spendByType.total, aggregateCurrency) : '--'}</p>
                          </div>
                          {spendByType.rows.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No fees in this period.</p>
                          ) : (
                            <div className="space-y-3">
                              {spendByType.rows.map(r => {
                                const pct = spendByType.total > 0 ? (r.amount / spendByType.total) * 100 : 0
                                const isReset = r.value === 'reset-fee'
                                return (
                                  <div key={r.value} className="space-y-1">
                                    <div className="flex items-center justify-between gap-3 text-sm">
                                      <span className="min-w-0 truncate">
                                        {r.label}
                                        <span className="text-muted-foreground"> · {r.count} {r.count === 1 ? 'charge' : 'charges'}</span>
                                      </span>
                                      <span className="tabular-nums font-semibold shrink-0">
                                        {fmt(r.amount, aggregateCurrency)}
                                        <span className="text-muted-foreground font-normal ml-1.5">{pct.toFixed(0)}%</span>
                                      </span>
                                    </div>
                                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: isReset ? themeColors.loss : themeColors.primary }} />
                                    </div>
                                  </div>
                                )
                              })}
                              {(() => {
                                const resets = spendByType.rows.find(r => r.value === 'reset-fee')
                                const evals = spendByType.rows.find(r => r.value === 'evaluation-fee')
                                if (!resets) return null
                                const share = spendByType.total > 0 ? (resets.amount / spendByType.total) * 100 : 0
                                return (
                                  <p className="text-xs text-muted-foreground pt-1">
                                    Resets are {share.toFixed(0)}% of what you have paid{evals ? `, ${resets.count} reset${resets.count !== 1 ? 's' : ''} against ${evals.count} evaluation${evals.count !== 1 ? 's' : ''}` : ''}.
                                  </p>
                                )
                              })()}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Payouts */}
                      <Card className="flex flex-col">
                        <CardContent className="p-4 sm:p-5 flex flex-col flex-1">
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div>
                              <p className="text-sm font-medium">Payouts</p>
                              <p className="text-xs text-muted-foreground">{payoutStats ? `${payoutStats.count} payout${payoutStats.count !== 1 ? 's' : ''} from ${payoutStats.accountsPaid} account${payoutStats.accountsPaid !== 1 ? 's' : ''}` : 'Withdrawals you have logged'}</p>
                            </div>
                            <p className="text-lg font-semibold tabular-nums leading-none shrink-0" style={{ color: payoutStats ? themeColors.profit : undefined }}>{payoutStats ? fmt(payoutStats.total, aggregateCurrency) : '--'}</p>
                          </div>
                          {!payoutStats ? (
                            <p className="text-sm text-muted-foreground">No payouts in this period.</p>
                          ) : (
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
                              {[
                                { label: 'Average payout', value: fmt(payoutStats.avg, aggregateCurrency), sub: 'per withdrawal' },
                                { label: 'Largest payout', value: fmt(payoutStats.largest.amount, aggregateCurrency), sub: parseStoredDate(payoutStats.largest.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
                                { label: 'Last payout', value: fmt(payoutStats.last.amount, aggregateCurrency), sub: parseStoredDate(payoutStats.last.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
                                { label: 'Gap between payouts', value: payoutStats.avgGapDays !== null ? `${Math.round(payoutStats.avgGapDays)} days` : '--', sub: payoutStats.avgGapDays !== null ? 'average' : 'needs 2 or more payouts' },
                                { label: 'Start to first payout', value: payoutStats.avgDaysToFirstPayout !== null ? `${Math.round(payoutStats.avgDaysToFirstPayout)} days` : '--', sub: 'average across accounts' },
                              ].map(item => (
                                <div key={item.label} className="min-w-0">
                                  <dt className="text-xs text-muted-foreground">{item.label}</dt>
                                  <dd className="text-sm font-semibold tabular-nums mt-0.5 truncate">{item.value}</dd>
                                  <p className="text-xs text-muted-foreground truncate">{item.sub}</p>
                                </div>
                              ))}
                            </dl>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* By firm */}
                    <div className="rounded-lg border overflow-hidden">
                      <div className="px-4 sm:px-5 py-3 border-b flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">By firm</p>
                          <p className="text-xs text-muted-foreground">Sorted by net. Record is all time, money is the selected period.</p>
                        </div>
                      </div>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-muted-foreground border-b">
                            <th scope="col" className="text-left font-medium px-4 sm:px-5 py-2">Firm</th>
                            <th scope="col" className="text-right font-medium px-3 py-2">Record</th>
                            <th scope="col" className="text-right font-medium px-3 py-2 hidden md:table-cell">Resets</th>
                            <th scope="col" className="text-right font-medium px-3 py-2 hidden sm:table-cell">Invested</th>
                            <th scope="col" className="text-right font-medium px-3 py-2 hidden sm:table-cell">Earned</th>
                            <th scope="col" className="text-right font-medium px-3 py-2">Net</th>
                            <th scope="col" className="text-right font-medium pl-3 pr-4 sm:pr-5 py-2">ROI</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {firmTable.map(r => {
                            const brandColor = firmAvatarColor(r.firm)
                            return (
                              <tr key={r.firm}>
                                <td className="px-4 sm:px-5 py-2.5">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {FIRM_LOGOS[r.firm] ? (
                                      <div className="h-7 w-7 rounded-md shrink-0 overflow-hidden bg-white border"><img src={FIRM_LOGOS[r.firm]} alt="" className="w-full h-full object-cover" /></div>
                                    ) : (
                                      <div className="h-7 w-7 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: brandColor }}>{firmInitials(r.firm)}</div>
                                    )}
                                    <div className="min-w-0">
                                      <p className="font-medium truncate">{r.firm}</p>
                                      <p className="text-xs text-muted-foreground">{r.accounts} account{r.accounts !== 1 ? 's' : ''}{r.active > 0 ? `, ${r.active} active` : ''}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="text-right px-3 py-2.5 tabular-nums whitespace-nowrap">
                                  <span style={{ color: r.passed > 0 ? themeColors.profit : undefined }}>{r.passed}</span>
                                  <span className="text-muted-foreground"> / </span>
                                  <span style={{ color: r.failed > 0 ? themeColors.loss : undefined }}>{r.failed}</span>
                                </td>
                                <td className="text-right px-3 py-2.5 tabular-nums hidden md:table-cell" style={{ color: r.resets > 0 ? undefined : 'hsl(var(--muted-foreground))' }}>{r.resets}</td>
                                <td className="text-right px-3 py-2.5 tabular-nums hidden sm:table-cell">{r.invested > 0 ? fmt(r.invested, aggregateCurrency) : '--'}</td>
                                <td className="text-right px-3 py-2.5 tabular-nums hidden sm:table-cell" style={{ color: r.earned > 0 ? themeColors.profit : 'hsl(var(--muted-foreground))' }}>{r.earned > 0 ? fmt(r.earned, aggregateCurrency) : '--'}</td>
                                <td className="text-right px-3 py-2.5 tabular-nums font-semibold" style={{ color: r.invested > 0 || r.earned > 0 ? (r.net >= 0 ? themeColors.profit : themeColors.loss) : 'hsl(var(--muted-foreground))' }}>
                                  {r.invested > 0 || r.earned > 0 ? `${r.net >= 0 ? '+' : '-'}${fmt(Math.abs(r.net), aggregateCurrency)}` : '--'}
                                </td>
                                <td className="text-right pl-3 pr-4 sm:pr-5 py-2.5 tabular-nums font-semibold" style={{ color: r.roi !== null ? (r.roi >= 0 ? themeColors.profit : themeColors.loss) : 'hsl(var(--muted-foreground))' }}>
                                  {r.roi !== null ? `${r.roi >= 0 ? '+' : ''}${r.roi.toFixed(0)}%` : '--'}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </ProGate>
              )}
            </TabsContent>

            {/* ── AI Coach tab ── */}
            <TabsContent value="coach" className="mt-5">
              {transactions.length === 0 ? (
                <div className="rounded-lg border border-dashed px-4 py-4 text-sm text-muted-foreground">
                  Log at least one fee or payout, then the coach has something to review.
                </div>
              ) : (
                <ProGate featureName="AI PropTracker Analysis">
                  {(() => {
                    const reviewedAgo = (() => {
                      if (!aiReviewMeta) return null
                      const mins = Math.max(0, Math.round((Date.now() - new Date(aiReviewMeta.at).getTime()) / 60000))
                      if (mins < 2) return 'just now'
                      if (mins < 60) return `${mins} min ago`
                      const hours = Math.round(mins / 60)
                      if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
                      const days = Math.round(hours / 24)
                      return `${days} day${days !== 1 ? 's' : ''} ago`
                    })()
                    const newTxs = aiReviewMeta ? Math.max(0, transactions.length - aiReviewMeta.transactions) : 0
                    const newAccounts = aiReviewMeta ? Math.max(0, accounts.length - aiReviewMeta.accounts) : 0
                    const changedSince = !!aiReviewMeta?.fingerprint && aiReviewMeta.fingerprint !== reviewFingerprint
                    const stale = newTxs > 0 || newAccounts > 0 || changedSince
                    const analyseButton = (extraClass = '') => (
                      <Button
                        size="sm"
                        onClick={runAiAnalysis}
                        disabled={aiLoading}
                        className={`h-9 text-sm gap-1.5 ${extraClass}`}
                        style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}
                      >
                        <Brain className="h-4 w-4" aria-hidden="true" />
                        {aiLoading ? 'Reviewing…' : aiAnalysis ? 'Review again' : 'Review my accounts'}
                      </Button>
                    )

                    return (
                      <div className="rounded-lg border overflow-hidden">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b">
                          <div className="min-w-0">
                            <p className="text-sm font-medium">AI Coach</p>
                            <p className="text-xs text-muted-foreground">
                              {aiReviewMeta && aiAnalysis
                                ? <>Reviewed {reviewedAgo} from {aiReviewMeta.accounts} account{aiReviewMeta.accounts !== 1 ? 's' : ''} and {aiReviewMeta.transactions} transaction{aiReviewMeta.transactions !== 1 ? 's' : ''}.</>
                                : <>Reads your accounts, fees, payouts and drawdown, then writes a plain-English review.</>}
                            </p>
                          </div>
                          {!isDemo && (
                            <div className="shrink-0 flex items-center gap-3">
                              {aiUsage && (
                                <p className="text-xs text-muted-foreground tabular-nums">{aiUsage.remaining} of {aiUsage.limit} left today</p>
                              )}
                              {(aiAnalysis || aiLoading) && analyseButton()}
                            </div>
                          )}
                        </div>

                        {/* Stale notice */}
                        {stale && aiAnalysis && !aiLoading && (
                          <div className="flex items-center gap-2 px-4 sm:px-5 py-2 border-b text-xs text-muted-foreground" style={{ backgroundColor: alpha(themeColors.primary, '08') }}>
                            <Info className="h-3.5 w-3.5 shrink-0" style={{ color: themeColors.primary }} aria-hidden="true" />
                            <span>
                              {newTxs > 0 || newAccounts > 0
                                ? `${[
                                    newTxs > 0 ? `${newTxs} transaction${newTxs !== 1 ? 's' : ''}` : null,
                                    newAccounts > 0 ? `${newAccounts} account${newAccounts !== 1 ? 's' : ''}` : null,
                                  ].filter(Boolean).join(' and ')} added since this review.`
                                : 'Your accounts or transactions have changed since this review.'}
                              {!isDemo && ' Review again to include the changes.'}
                            </span>
                          </div>
                        )}

                        {/* Loading */}
                        {aiLoading && (
                          <div className="px-5 py-12 flex flex-col items-center gap-3 text-center">
                            <Brain className="h-6 w-6 animate-pulse" style={{ color: themeColors.primary }} aria-hidden="true" />
                            <p className="text-sm text-muted-foreground">Reading {accounts.length} account{accounts.length !== 1 ? 's' : ''} and {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}. Usually 10 to 20 seconds.</p>
                          </div>
                        )}

                        {/* Empty */}
                        {!aiAnalysis && !aiLoading && (
                          <div className="px-5 py-10 sm:py-12 flex flex-col items-center text-center gap-4">
                            <div className="h-11 w-11 rounded-full flex items-center justify-center" style={{ backgroundColor: alpha(themeColors.primary, '15') }}>
                              <Brain className="h-5 w-5" style={{ color: themeColors.primary }} aria-hidden="true" />
                            </div>
                            <div className="space-y-1.5 max-w-md">
                              <p className="text-base font-semibold">Get a written review of your prop trading</p>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                The coach looks at your {accounts.length} account{accounts.length !== 1 ? 's' : ''} and {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}: what you have paid in fees and resets, what you have taken out, how close each challenge is to its limits, and which firms are actually paying you.
                                You get a score out of 10, what is working, what to watch, and a short plan.
                              </p>
                            </div>
                            {!isDemo && analyseButton()}
                            {!isDemo && aiUsage && (
                              <p className="text-xs text-muted-foreground tabular-nums">{aiUsage.remaining} of {aiUsage.limit} reviews left today</p>
                            )}
                          </div>
                        )}

                        {/* Result */}
                        {aiAnalysis && !aiLoading && (() => {
                          const { score, sections: parsed } = parseCoachReview(aiAnalysis)
                          const scoreColor = score !== null
                            ? score >= 7 ? themeColors.profit : score >= 4 ? themeColors.primary : themeColors.loss
                            : themeColors.primary

                          const sections = [
                            { key: 'verdict' as const, heading: COACH_HEADINGS.verdict, icon: CheckCircle, color: themeColors.profit, style: 'prose' as const },
                            { key: 'roi' as const, heading: COACH_HEADINGS.roi, icon: ChartBar, color: themeColors.primary, style: 'prose' as const },
                            { key: 'challenge' as const, heading: COACH_HEADINGS.challenge, icon: Target, color: themeColors.primary, style: 'prose' as const },
                            { key: 'firms' as const, heading: COACH_HEADINGS.firms, icon: Buildings, color: themeColors.primary, style: 'prose' as const },
                            { key: 'warnings' as const, heading: COACH_HEADINGS.warnings, icon: Warning, color: themeColors.loss, style: 'warnings' as const },
                            { key: 'next' as const, heading: COACH_HEADINGS.next, icon: ListChecks, color: themeColors.profit, style: 'steps' as const },
                          ]

                          // If the model drifted from the expected headings, show the raw
                          // text rather than a blank card after spending the user's quota.
                          if (score === null && sections.every(s => !parsed[s.key])) {
                            return (
                              <div className="px-5 py-5 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {aiAnalysis}
                              </div>
                            )
                          }

                          const inline = (text: string) => DOMPurify.sanitize(
                            text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-medium">$1</strong>'),
                            { ALLOWED_TAGS: ['strong', 'em', 'br'], ALLOWED_ATTR: ['class'] },
                          )
                          const cleanLine = (line: string) => {
                            const isBullet = line.startsWith('-') || /^\d+\./.test(line)
                            return isBullet ? line.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '') : line
                          }

                          const bigPicture = parsed.verdict
                          const rest = sections.filter(s => s.key !== 'verdict' && parsed[s.key])
                          const plan = sections.find(s => s.key === 'next')!
                          const grid = rest.filter(s => s.key !== 'next')

                          return (
                            <div>
                              {/* Score + big picture */}
                              {(score !== null || bigPicture) && (
                                <div className="px-4 sm:px-5 py-5 border-b flex flex-col sm:flex-row gap-4 sm:gap-5">
                                  {score !== null && (
                                    <div className="flex items-center gap-3 shrink-0">
                                      <div
                                        className="flex items-center justify-center w-14 h-14 rounded-lg text-white font-bold text-lg shrink-0"
                                        style={{ backgroundColor: scoreColor }}
                                      >
                                        {score}<span className="text-xs font-medium opacity-80 ml-0.5">/10</span>
                                      </div>
                                      <div className="sm:hidden">
                                        <p className="text-base font-semibold">
                                          {score >= 8 ? 'Looking strong' : score >= 6 ? 'Getting there' : score >= 4 ? 'Room to grow' : 'Needs attention'}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    {score !== null && (
                                      <p className="text-base font-semibold hidden sm:block">
                                        {score >= 8 ? 'Looking strong' : score >= 6 ? 'Getting there' : score >= 4 ? 'Room to grow' : 'Needs attention'}
                                      </p>
                                    )}
                                    {bigPicture ? (
                                      <div className="text-sm text-muted-foreground leading-relaxed space-y-2 mt-1">
                                        {bigPicture.split('\n').filter(Boolean).map((line, i) => (
                                          <p key={i} dangerouslySetInnerHTML={{ __html: inline(cleanLine(line)) }} />
                                        ))}
                                      </div>
                                    ) : score !== null ? (
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {score >= 8 ? 'Your prop trading is paying off.' : score >= 6 ? 'Heading in the right direction.' : score >= 4 ? 'Some things to tighten up.' : 'Worth rethinking your approach.'}
                                      </p>
                                    ) : null}
                                  </div>
                                </div>
                              )}

                              {/* Detail sections */}
                              {grid.length > 0 && (
                                <div className={`grid grid-cols-1 -mb-px ${grid.length > 1 ? 'lg:grid-cols-2' : ''}`}>
                                  {grid.map((s, idx) => {
                                    const Icon = s.icon
                                    const lines = parsed[s.key].split('\n').filter(Boolean)
                                    // Odd count: the last section takes the full row instead of leaving an empty cell
                                    const spansRow = grid.length > 1 && grid.length % 2 === 1 && idx === grid.length - 1
                                    const leftColumn = grid.length > 1 && idx % 2 === 0 && !spansRow
                                    return (
                                      <div key={s.key} className={`px-4 sm:px-5 py-5 border-b ${spansRow ? 'lg:col-span-2' : ''} ${leftColumn ? 'lg:border-r' : ''}`}>
                                        <div className="flex items-center gap-2 mb-3">
                                          <Icon className="h-4 w-4 shrink-0" style={{ color: s.color }} aria-hidden="true" />
                                          <p className="text-sm font-semibold">{s.heading}</p>
                                        </div>
                                        {s.style === 'warnings' ? (
                                          <ul className="space-y-2.5">
                                            {lines.map((line, i) => (
                                              <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground leading-relaxed">
                                                <Warning className="h-3.5 w-3.5 mt-1 shrink-0" style={{ color: themeColors.loss }} aria-hidden="true" />
                                                <span dangerouslySetInnerHTML={{ __html: inline(cleanLine(line)) }} />
                                              </li>
                                            ))}
                                          </ul>
                                        ) : (
                                          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                                            {lines.map((line, i) => {
                                              const cleaned = cleanLine(line)
                                              const headingMatch = cleaned.match(/^\*\*(.+?)\*\*[:.]\s*(.*)/)
                                              if (headingMatch) {
                                                return (
                                                  <div key={i} className="space-y-0.5">
                                                    <p className="text-sm font-medium text-foreground">{headingMatch[1]}</p>
                                                    {headingMatch[2] && <p dangerouslySetInnerHTML={{ __html: inline(headingMatch[2]) }} />}
                                                  </div>
                                                )
                                              }
                                              return <p key={i} dangerouslySetInnerHTML={{ __html: inline(cleaned) }} />
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}

                              {/* Game plan as numbered steps */}
                              {parsed.next && (
                                <div className="px-4 sm:px-5 py-5 border-t">
                                  <div className="flex items-center gap-2 mb-3">
                                    <ListChecks className="h-4 w-4 shrink-0" style={{ color: plan.color }} aria-hidden="true" />
                                    <p className="text-sm font-semibold">{plan.heading}</p>
                                  </div>
                                  <ol className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {parsed.next.split('\n').filter(Boolean).map((line, i) => (
                                      <li key={i} className="flex items-start gap-3 rounded-lg border p-3 text-sm text-muted-foreground leading-relaxed">
                                        <span className="h-6 w-6 rounded-full border flex items-center justify-center text-xs font-semibold shrink-0 tabular-nums text-foreground">{i + 1}</span>
                                        <span dangerouslySetInnerHTML={{ __html: inline(cleanLine(line)) }} />
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    )
                  })()}
                </ProGate>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <AppFooter />

      {/* ── Add / Edit Account Dialog ── */}
      <Dialog open={accountDialog.open} onOpenChange={open => setAccountDialog(p => ({ ...p, open }))}>
        <DialogContent className="max-w-lg p-0 overflow-hidden gap-0">
          {(() => {
            const selectedFirm = accountForm.firmName && accountForm.firmName !== 'Custom...' ? accountForm.firmName : null
            const logo = selectedFirm ? FIRM_LOGOS[selectedFirm] : null
            const brandCol = selectedFirm ? (FIRM_BRAND_COLORS[selectedFirm] ?? themeColors.primary) : themeColors.primary
            const sizeNum = Number(accountForm.accountSizeStr === 'custom' ? accountForm.customSizeStr : accountForm.accountSizeStr) || 0
            const sym = currencySymbol(accountForm.currency)
            const isEval = accountForm.accountType === 'evaluation' || accountForm.accountType === 'express'
            const targetNum = Number(accountForm.profitTarget) || 0
            const dailyPct = Number(accountForm.maxDailyDrawdown) || 0
            const totalPct = Number(accountForm.maxTotalDrawdown) || 0
            return (
              <>
                <div className="px-6 pt-5 pb-4 border-b flex items-center gap-3">
                  {logo ? (
                    <div className="h-10 w-10 rounded-lg overflow-hidden bg-white border shrink-0"><img src={logo} alt="" className="w-full h-full object-cover" /></div>
                  ) : (
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${brandCol}20` }}>
                      <Buildings className="h-5 w-5" style={{ color: brandCol }} />
                    </div>
                  )}
                  <DialogHeader className="p-0 space-y-0.5 text-left">
                    <DialogTitle className="text-base">{accountDialog.editing ? 'Edit account' : 'New account'}</DialogTitle>
                    <DialogDescription className="text-xs">
                      {selectedFirm
                        ? `${selectedFirm}${sizeNum > 0 ? ` · ${sym}${sizeNum.toLocaleString()}` : ''}`
                        : accountForm.firmName === 'Custom...' && accountForm.customFirm
                          ? accountForm.customFirm
                          : 'Pick the firm, size and type. Rules are optional but unlock drawdown tracking.'}
                    </DialogDescription>
                  </DialogHeader>
                </div>

                <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
                  {/* Firm */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground" id="label-firm">Prop firm</label>
                    <Select value={accountForm.firmName} onValueChange={v => {
                      setAccountForm(p => {
                        const next = { ...p, firmName: v }
                        if (v !== 'Custom...' && FIRM_RULE_PRESETS[v]) {
                          const preset = FIRM_RULE_PRESETS[v]
                          const sizeRaw = p.accountSizeStr === 'custom' ? p.customSizeStr : p.accountSizeStr
                          const accountSize = Number(sizeRaw) || 100000
                          next.rulesEnabled = true
                          next.profitTarget = String((preset.profitTarget / 100) * accountSize)
                          next.maxDailyDrawdown = String(preset.maxDailyDrawdown)
                          next.maxTotalDrawdown = String(preset.maxTotalDrawdown)
                          next.minTradingDays = preset.minTradingDays ? String(preset.minTradingDays) : ''
                          next.targetAutoFilled = true
                        }
                        return next
                      })
                    }}>
                      <SelectTrigger aria-labelledby="label-firm" className="h-10"><SelectValue placeholder="Select firm" /></SelectTrigger>
                      <SelectContent>
                        {PROP_FIRMS.map(f => (
                          <SelectItem key={f} value={f}>
                            <span className="flex items-center gap-2">
                              {FIRM_LOGOS[f] ? (
                                <div className="h-4 w-4 rounded-sm shrink-0 overflow-hidden"><img src={FIRM_LOGOS[f]} alt="" className="w-full h-full object-cover" /></div>
                              ) : f !== 'Custom...' ? (
                                <span className="h-4 w-4 rounded-sm flex items-center justify-center text-[7px] font-bold text-white shrink-0" style={{ backgroundColor: FIRM_BRAND_COLORS[f] ?? '#888' }}>{firmInitials(f)}</span>
                              ) : null}
                              {f}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {accountForm.firmName === 'Custom...' && (
                      <Input aria-label="Custom firm name" placeholder="Firm name" className="h-10" value={accountForm.customFirm} onChange={e => setAccountForm(p => ({ ...p, customFirm: e.target.value }))} />
                    )}
                  </div>

                  {/* Size + currency */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-muted-foreground">Account size</label>
                      <Select value={accountForm.currency} onValueChange={v => setAccountForm(p => ({ ...p, currency: v as PropCurrency }))}>
                        <SelectTrigger aria-label="Currency" className="w-auto h-7 text-xs px-2.5 gap-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCY_OPTIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {ACCOUNT_SIZES.map(sz => {
                        const active = accountForm.accountSizeStr === String(sz)
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setAccountForm(p => applySizeChange(p, { accountSizeStr: String(sz) }))}
                            aria-pressed={active}
                            className="h-8 px-3 rounded-md text-xs font-medium border transition-colors hover:bg-muted/40 tabular-nums"
                            style={{
                              borderColor: active ? themeColors.primary : 'hsl(var(--border))',
                              backgroundColor: active ? alpha(themeColors.primary, '15') : 'transparent',
                              color: active ? themeColors.primary : undefined,
                            }}
                          >
                            {sym}{sz / 1000}k
                          </button>
                        )
                      })}
                      <button
                        type="button"
                        onClick={() => setAccountForm(p => applySizeChange(p, { accountSizeStr: 'custom' }))}
                        aria-pressed={accountForm.accountSizeStr === 'custom'}
                        className="h-8 px-3 rounded-md text-xs font-medium border transition-colors hover:bg-muted/40"
                        style={{
                          borderColor: accountForm.accountSizeStr === 'custom' ? themeColors.primary : 'hsl(var(--border))',
                          backgroundColor: accountForm.accountSizeStr === 'custom' ? alpha(themeColors.primary, '15') : 'transparent',
                          color: accountForm.accountSizeStr === 'custom' ? themeColors.primary : undefined,
                        }}
                      >
                        Custom
                      </button>
                    </div>
                    {accountForm.accountSizeStr === 'custom' && (
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" aria-hidden="true">{sym}</span>
                        <Input type="number" inputMode="decimal" aria-label="Custom account size" placeholder="150000" className="h-10 pl-7" value={accountForm.customSizeStr} onChange={e => setAccountForm(p => applySizeChange(p, { customSizeStr: e.target.value }))} />
                      </div>
                    )}
                  </div>

                  {/* Type + status */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground" id="label-actype">Account type</label>
                      <Select value={accountForm.accountType} onValueChange={v => setAccountForm(p => ({ ...p, accountType: v as PropAccountType }))}>
                        <SelectTrigger aria-labelledby="label-actype" className="h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ACCOUNT_TYPE_OPTIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground" id="label-status">Status</label>
                      <Select value={accountForm.status} onValueChange={v => setAccountForm(p => ({ ...p, status: v as PropAccountStatus }))}>
                        <SelectTrigger aria-labelledby="label-status" className="h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map(st => <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Start date</label>
                      <DatePicker
                        date={accountForm.startDate ? new Date(accountForm.startDate + 'T12:00:00') : undefined}
                        onDateChange={d => setAccountForm(p => ({ ...p, startDate: d ? localDateStr(d) : '' }))}
                        placeholder="Pick a date"
                        className="w-full h-10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">{isEval ? 'Deadline' : 'End date'} <span className="font-normal">(optional)</span></label>
                      <DatePicker
                        date={accountForm.endDate ? new Date(accountForm.endDate + 'T12:00:00') : undefined}
                        onDateChange={d => setAccountForm(p => ({ ...p, endDate: d ? localDateStr(d) : '' }))}
                        placeholder="Pick a date"
                        className="w-full h-10"
                      />
                      {isEval && <p className="text-xs text-muted-foreground">Reminder in the final 7 days.</p>}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground" htmlFor="account-notes">Notes <span className="font-normal">(optional)</span></label>
                    <Textarea id="account-notes" placeholder="Phase 1 passed, waiting on funded account" value={accountForm.notes} onChange={e => setAccountForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="resize-none text-sm" />
                  </div>

                  {/* Challenge rules */}
                  <div className="rounded-lg border">
                    <button
                      type="button"
                      onClick={() => {
                        const enabling = !accountForm.rulesEnabled
                        if (enabling && !accountForm.profitTarget) {
                          const firmName = accountForm.firmName === 'Custom...' ? '' : accountForm.firmName
                          const sizeRaw = accountForm.accountSizeStr === 'custom' ? accountForm.customSizeStr : accountForm.accountSizeStr
                          const accountSize = Number(sizeRaw) || 100000
                          const preset = FIRM_RULE_PRESETS[firmName]
                          if (preset) {
                            setAccountForm(p => ({
                              ...p,
                              rulesEnabled: true,
                              profitTarget: String((preset.profitTarget / 100) * accountSize),
                              maxDailyDrawdown: String(preset.maxDailyDrawdown),
                              maxTotalDrawdown: String(preset.maxTotalDrawdown),
                              minTradingDays: preset.minTradingDays ? String(preset.minTradingDays) : '',
                              targetAutoFilled: true,
                            }))
                            return
                          }
                        }
                        setAccountForm(p => ({ ...p, rulesEnabled: enabling }))
                      }}
                      aria-expanded={accountForm.rulesEnabled}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-muted/40 transition-colors rounded-lg"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Challenge rules</p>
                        <p className="text-xs text-muted-foreground">
                          {accountForm.rulesEnabled ? 'Tracks profit target and drawdown on the card.' : 'Optional. Turn on to track profit target and drawdown limits.'}
                        </p>
                      </div>
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full border shrink-0"
                        style={accountForm.rulesEnabled ? { borderColor: alpha(themeColors.primary, '40'), backgroundColor: alpha(themeColors.primary, '15'), color: themeColors.primary } : undefined}
                      >
                        {accountForm.rulesEnabled ? 'On' : 'Off'}
                      </span>
                    </button>

                    {accountForm.rulesEnabled && (
                      <div className="border-t px-3 py-3 space-y-3">
                        {accountForm.firmName && FIRM_RULE_PRESETS[accountForm.firmName] && accountForm.targetAutoFilled && (
                          <p className="text-xs text-muted-foreground">Pre-filled from {accountForm.firmName} defaults. Adjust to match your challenge.</p>
                        )}
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground" htmlFor="rule-profit-target">Profit target</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" aria-hidden="true">{sym}</span>
                            <Input id="rule-profit-target" type="number" inputMode="decimal" min="0" step="0.01" placeholder="10000" className="h-10 pl-7" value={accountForm.profitTarget} onChange={e => setAccountForm(p => ({ ...p, profitTarget: e.target.value, targetAutoFilled: false }))} />
                          </div>
                          {sizeNum > 0 && targetNum > 0 && (
                            <p className="text-xs text-muted-foreground tabular-nums">{((targetNum / sizeNum) * 100).toFixed(1)}% of {sym}{sizeNum.toLocaleString()}</p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground" htmlFor="rule-daily-dd">Max daily drawdown</label>
                            <div className="relative">
                              <Input id="rule-daily-dd" type="number" inputMode="decimal" min="0" step="0.1" placeholder="5" className="h-10 pr-8" value={accountForm.maxDailyDrawdown} onChange={e => setAccountForm(p => ({ ...p, maxDailyDrawdown: e.target.value }))} />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" aria-hidden="true">%</span>
                            </div>
                            <p className="text-xs text-muted-foreground tabular-nums">{sizeNum > 0 && dailyPct > 0 ? `= ${sym}${((dailyPct / 100) * sizeNum).toLocaleString(undefined, { maximumFractionDigits: 0 })} a day` : 'Leave 0 if the firm has none'}</p>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground" htmlFor="rule-total-dd">Max total drawdown</label>
                            <div className="relative">
                              <Input id="rule-total-dd" type="number" inputMode="decimal" min="0" step="0.1" placeholder="10" className="h-10 pr-8" value={accountForm.maxTotalDrawdown} onChange={e => setAccountForm(p => ({ ...p, maxTotalDrawdown: e.target.value }))} />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" aria-hidden="true">%</span>
                            </div>
                            <p className="text-xs text-muted-foreground tabular-nums">{sizeNum > 0 && totalPct > 0 ? `= ${sym}${((totalPct / 100) * sizeNum).toLocaleString(undefined, { maximumFractionDigits: 0 })} from the high point` : 'Required'}</p>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground" htmlFor="rule-min-days">Minimum trading days <span className="font-normal">(optional)</span></label>
                          <Input id="rule-min-days" type="number" inputMode="numeric" min="0" step="1" placeholder="4" className="h-10" value={accountForm.minTradingDays} onChange={e => setAccountForm(p => ({ ...p, minTradingDays: e.target.value }))} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-6 py-4 border-t flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setAccountDialog({ open: false, editing: null })}>Cancel</Button>
                  <Button onClick={handleSaveAccount} style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}>
                    {accountDialog.editing ? 'Save changes' : 'Add account'}
                  </Button>
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* ── Add Transaction Dialog ── */}
      {(() => {
        const txAccount = accounts.find(a => a.id === txDialog.accountId)
        const txBrandColor = txAccount ? firmAvatarColor(txAccount.firmName) : themeColors.primary
        const txLogo = txAccount ? FIRM_LOGOS[txAccount.firmName] : null
        const txCurrSym = currencySymbol(txAccount?.currency)
        const txMeta = TX_TYPE_OPTIONS.find(t => t.value === txForm.type)
        return (
          <Dialog open={txDialog.open} onOpenChange={open => setTxDialog(p => ({ ...p, open }))}>
            <DialogContent className="max-w-sm p-0 overflow-hidden gap-0">
              <div className="px-5 pt-5 pb-4 border-b flex items-center gap-3">
                {txLogo ? (
                  <div className="h-9 w-9 rounded-lg overflow-hidden bg-white border shrink-0"><img src={txLogo} alt="" className="w-full h-full object-cover" /></div>
                ) : txAccount ? (
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: txBrandColor }}>{firmInitials(txAccount.firmName)}</div>
                ) : null}
                <DialogHeader className="p-0 space-y-0.5 text-left">
                  <DialogTitle className="text-base">Add transaction</DialogTitle>
                  <DialogDescription className="text-xs">
                    {txAccount ? `${txAccount.firmName} · ${txCurrSym}${txAccount.accountSize.toLocaleString()}` : 'Record a fee or payout'}
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="px-5 py-5 space-y-4">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground" id="label-txtype">Type</p>
                  <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby="label-txtype">
                    {TX_TYPE_OPTIONS.map(t => {
                      const active = txForm.type === t.value
                      const accent = t.isExpense ? themeColors.primary : themeColors.profit
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setTxForm(p => ({ ...p, type: t.value }))}
                          aria-pressed={active}
                          className="h-8 px-3 rounded-md text-xs font-medium border transition-colors hover:bg-muted/40"
                          style={{
                            borderColor: active ? accent : 'hsl(var(--border))',
                            backgroundColor: active ? `${accent}15` : 'transparent',
                            color: active ? accent : undefined,
                          }}
                        >
                          {t.label}
                        </button>
                      )
                    })}
                  </div>
                  {txMeta && (
                    <p className="text-xs text-muted-foreground">
                      {txMeta.isExpense ? 'Money out. Counts against your invested total.' : 'Money in. Counts toward your earned total.'}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="tx-amount">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" aria-hidden="true">{txCurrSym}</span>
                    <Input id="tx-amount" type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00" autoFocus className="h-11 pl-7 text-base tabular-nums" value={txForm.amount} onChange={e => setTxForm(p => ({ ...p, amount: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Date</label>
                    <DatePicker
                      date={txForm.date ? new Date(txForm.date + 'T12:00:00') : undefined}
                      onDateChange={d => setTxForm(p => ({ ...p, date: d ? localDateStr(d) : '' }))}
                      placeholder="Pick a date"
                      className="w-full h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground" htmlFor="tx-description">Note <span className="font-normal">(optional)</span></label>
                    <Input id="tx-description" placeholder={txMeta?.isExpense ? 'Phase 1 reset after drawdown' : 'First payout, month 1'} className="h-10" value={txForm.description} onChange={e => setTxForm(p => ({ ...p, description: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 border-t flex justify-end gap-2">
                <Button variant="outline" onClick={() => setTxDialog({ open: false, accountId: '' })}>Cancel</Button>
                <Button onClick={handleSaveTx} style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}>
                  {txMeta ? `Add ${txMeta.label.toLowerCase()}` : 'Add transaction'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )
      })()}

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={!!deleteDialog?.open} onOpenChange={open => !open && setDeleteDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{deleteDialog?.type === 'account' ? 'Delete Account?' : 'Delete Transaction?'}</DialogTitle>
            <DialogDescription>
              {deleteDialog?.type === 'account'
                ? 'This will permanently delete the account and all its transactions.'
                : 'This will permanently delete this transaction.'}
              {' '}This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => {
              if (!deleteDialog) return
              if (deleteDialog.type === 'account') handleDeleteAccount(deleteDialog.id)
              else handleDeleteTx(deleteDialog.id)
            }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Screenshot import dialog */}
      <Dialog open={importDialog.open} onOpenChange={open => !open && setImportDialog(p => ({ ...p, open: false }))}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import from Screenshot</DialogTitle>
            <DialogDescription>
              Upload a screenshot of your prop firm billing or payout page. Transactions are extracted automatically.
            </DialogDescription>
          </DialogHeader>

          {importDialog.step === 'upload' && (
            <div className="space-y-4">
              {/* Import type toggle */}
              <div className="flex rounded-lg border border-border p-1 gap-1">
                {(['billing', 'payout'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${importDialog.importType === type ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                    style={importDialog.importType === type ? { backgroundColor: themeColors.primary } : {}}
                    onClick={() => setImportDialog(p => ({ ...p, importType: type }))}
                  >
                    {type === 'billing' ? 'Billing / Fees' : 'Payouts'}
                  </button>
                ))}
              </div>

              {/* Upload area */}
              <label
                className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition-colors ${importDialog.dragOver ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/50 hover:bg-muted/40'}`}
                onDragOver={e => { e.preventDefault(); setImportDialog(p => ({ ...p, dragOver: true })) }}
                onDragLeave={() => setImportDialog(p => ({ ...p, dragOver: false }))}
                onDrop={handleDropUpload}
              >
                {importDialog.loading ? (
                  <>
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: themeColors.primary, borderTopColor: 'transparent' }} />
                    <p className="text-sm text-muted-foreground">Analysing screenshots…</p>
                  </>
                ) : (
                  <>
                    <UploadSimple className={`h-8 w-8 ${importDialog.dragOver ? 'text-primary' : 'text-muted-foreground'}`} style={importDialog.dragOver ? { color: themeColors.primary } : {}} />
                    <div className="text-center">
                      <p className="text-sm font-medium">{importDialog.dragOver ? 'Drop to upload' : 'Drag & drop or click to upload'}</p>
                      <p className="text-xs text-muted-foreground mt-1">Multiple files supported · PNG, JPG, WEBP</p>
                    </div>
                  </>
                )}
                <input type="file" accept="image/*" multiple className="hidden" disabled={importDialog.loading} onChange={handleScreenshotUpload} />
              </label>

              <p className="text-xs text-muted-foreground text-center">
                {importDialog.importType === 'billing'
                  ? 'Screenshot your billing history showing eval fees, resets, and subscriptions'
                  : 'Screenshot your payouts or withdrawal history'}
              </p>
            </div>
          )}

          {importDialog.step === 'preview' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {importDialog.parsed.filter(t => t.keep).length} transaction{importDialog.parsed.filter(t => t.keep).length !== 1 ? 's' : ''} found. Uncheck any you don't want to import.
              </p>

              <div className="max-h-72 overflow-y-auto rounded-lg border border-border/60 divide-y divide-border/40">
                {importDialog.parsed.map((tx, i) => {
                  const expense = tx.type !== 'payout'
                  return (
                    <div key={tx.id} className={`flex items-center gap-3 px-3 py-2.5 transition-opacity ${tx.keep ? '' : 'opacity-40'}`}>
                      <input
                        type="checkbox"
                        aria-label="Include transaction in import"
                        checked={tx.keep}
                        onChange={() => setImportDialog(p => ({ ...p, parsed: p.parsed.map((t, j) => j === i ? { ...t, keep: !t.keep } : t) }))}
                        className="rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">{TX_TYPE_OPTIONS.find(t => t.value === tx.type)?.label ?? tx.type}</p>
                        {tx.notes && <p className="text-[10px] text-muted-foreground truncate">{tx.notes}</p>}
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {parseStoredDate(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                      </span>
                      <span className="text-xs font-semibold tabular-nums shrink-0" style={{ color: expense ? themeColors.loss : themeColors.profit }}>
                        {expense ? '-' : '+'}{fmt(tx.amount)}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setImportDialog(p => ({ ...p, step: 'upload', parsed: [] }))}>
                  Back
                </Button>
                <Button
                  className="flex-1"
                  style={{ backgroundColor: themeColors.primary }}
                  onClick={handleConfirmImport}
                  disabled={!importDialog.parsed.some(t => t.keep)}
                >
                  Import {importDialog.parsed.filter(t => t.keep).length} Transaction{importDialog.parsed.filter(t => t.keep).length !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* ── End of Day Check-In Dialog ── */}
      <Dialog open={checkinDialog.open} onOpenChange={open => !open && setCheckinDialog(p => ({ ...p, open: false }))}>
        <DialogContent className="max-w-lg p-0 overflow-hidden gap-0">
          <div className="px-5 pt-5 pb-4 border-b">
            <DialogHeader className="p-0 space-y-0.5 text-left">
              <DialogTitle className="text-base">End of day check-in</DialogTitle>
              <DialogDescription className="text-xs">
                Enter tonight's balance for each active challenge. Drawdown updates as you type.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-5 py-4 space-y-3 max-h-[60vh] overflow-y-auto">
            {checkinDialog.entries.map((entry, i) => {
              const account = accounts.find(a => a.id === entry.accountId)
              if (!account) return null
              const brandColor = firmAvatarColor(account.firmName)
              const preview = previewChallenge(account, entry.balance, entry.todayPnL, entry.tradingDays)
              const isEvalPhase = account.accountType === 'evaluation' || account.accountType === 'express'
              const prevBalance = account.challengeProgress?.currentBalance
              const delta = preview && prevBalance !== undefined ? Number(entry.balance) - prevBalance : null
              return (
                <div key={entry.accountId} className="rounded-lg border p-3 space-y-3">
                  <div className="flex items-center gap-2.5">
                    {FIRM_LOGOS[account.firmName] ? (
                      <div className="h-7 w-7 rounded-md shrink-0 overflow-hidden bg-white border"><img src={FIRM_LOGOS[account.firmName]} alt="" className="w-full h-full object-cover" /></div>
                    ) : (
                      <div className="h-7 w-7 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: brandColor }}>
                        {firmInitials(account.firmName)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{account.firmName}</p>
                      <p className="text-xs text-muted-foreground">
                        {currencySymbol(account.currency)}{account.accountSize.toLocaleString()}
                        {prevBalance !== undefined ? ` · last ${fmt(prevBalance, account.currency)}` : ' · no balance yet'}
                      </p>
                    </div>
                    {delta !== null && delta !== 0 && (
                      <span className="text-xs font-semibold tabular-nums shrink-0" style={{ color: delta >= 0 ? themeColors.profit : themeColors.loss }}>
                        {delta >= 0 ? '+' : '-'}{fmt(Math.abs(delta), account.currency)}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground" htmlFor={`ci-bal-${i}`}>Balance</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs" aria-hidden="true">{currencySymbol(account.currency)}</span>
                        <Input
                          id={`ci-bal-${i}`}
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          placeholder="0.00"
                          className="h-9 text-sm pl-6 tabular-nums"
                          value={entry.balance}
                          onChange={e => setCheckinDialog(p => ({
                            ...p,
                            entries: p.entries.map((en, j) => j === i ? { ...en, balance: e.target.value } : en),
                          }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground" htmlFor={`ci-pnl-${i}`}>Today's P&L</label>
                      <Input
                        id={`ci-pnl-${i}`}
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        placeholder="0.00"
                        className="h-9 text-sm tabular-nums"
                        value={entry.todayPnL}
                        onChange={e => setCheckinDialog(p => ({
                          ...p,
                          entries: p.entries.map((en, j) => j === i ? { ...en, todayPnL: e.target.value } : en),
                        }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground" htmlFor={`ci-days-${i}`}>Trading days</label>
                      <Input
                        id={`ci-days-${i}`}
                        type="number"
                        inputMode="numeric"
                        min="0"
                        step="1"
                        placeholder="0"
                        className="h-9 text-sm tabular-nums"
                        value={entry.tradingDays}
                        onChange={e => setCheckinDialog(p => ({
                          ...p,
                          entries: p.entries.map((en, j) => j === i ? { ...en, tradingDays: e.target.value } : en),
                        }))}
                      />
                    </div>
                  </div>
                  {preview && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground tabular-nums">
                      {isEvalPhase && account.challengeRules!.profitTarget > 0 && (
                        <span>Target <span className="font-semibold" style={{ color: profitBarColor(preview.profitPct, themeColors) }}>{Math.max(0, preview.profitPct).toFixed(0)}%</span></span>
                      )}
                      <span>Total DD <span className="font-semibold" style={{ color: ddBarColor(preview.totalDDUsedPct, themeColors) }}>{Math.min(100, preview.totalDDUsedPct).toFixed(0)}%</span></span>
                      {account.challengeRules!.maxDailyDrawdown > 0 && (
                        <span>Daily DD <span className="font-semibold" style={{ color: ddBarColor(preview.dailyDDUsedPct, themeColors) }}>{Math.min(100, preview.dailyDDUsedPct).toFixed(0)}%</span></span>
                      )}
                      {(preview.totalDDUsedPct >= 100 || preview.dailyDDUsedPct >= 100) && (
                        <span className="font-semibold" style={{ color: themeColors.loss }}>Over the limit</span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="px-5 py-4 border-t flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCheckinDialog(p => ({ ...p, open: false }))}>Cancel</Button>
            <Button onClick={handleSaveCheckin} style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}>
              Save {checkinDialog.entries.length} account{checkinDialog.entries.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Balance Update Dialog ── */}
      {(() => {
        const balAccount = accounts.find(a => a.id === balanceDialog.accountId)
        const balSym = currencySymbol(balAccount?.currency)
        const balLogo = balAccount ? FIRM_LOGOS[balAccount.firmName] : null
        const balBrand = balAccount ? firmAvatarColor(balAccount.firmName) : themeColors.primary
        const prev = balAccount?.challengeProgress
        const preview = balAccount ? previewChallenge(balAccount, balanceDialog.balance, balanceDialog.todayPnL, balanceDialog.tradingDays) : null
        const isEvalPhase = balAccount ? (balAccount.accountType === 'evaluation' || balAccount.accountType === 'express') : false
        const delta = preview && prev ? Number(balanceDialog.balance) - prev.currentBalance : null
        const lastUpdatedLabel = prev?.lastUpdated ? (() => {
          const days = daysSinceLocalDate(prev.lastUpdated)
          return days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`
        })() : null
        return (
          <Dialog open={balanceDialog.open} onOpenChange={open => !open && setBalanceDialog(p => ({ ...p, open: false }))}>
            <DialogContent className="max-w-md p-0 overflow-hidden gap-0">
              <div className="px-5 pt-5 pb-4 border-b flex items-center gap-3">
                {balLogo ? (
                  <div className="h-9 w-9 rounded-lg overflow-hidden bg-white border shrink-0"><img src={balLogo} alt="" className="w-full h-full object-cover" /></div>
                ) : balAccount ? (
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: balBrand }}>{firmInitials(balAccount.firmName)}</div>
                ) : null}
                <DialogHeader className="p-0 space-y-0.5 text-left">
                  <DialogTitle className="text-base">Update balance</DialogTitle>
                  <DialogDescription className="text-xs">
                    {balAccount ? `${balAccount.firmName} · ${balSym}${balAccount.accountSize.toLocaleString()}` : 'Copy the balance from your prop firm dashboard.'}
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="px-5 py-5 space-y-4">
                {balAccount && (
                  <p className="text-xs text-muted-foreground">
                    {prev
                      ? <>Last recorded <span className="font-medium text-foreground tabular-nums">{fmt(prev.currentBalance, balAccount.currency)}</span> {lastUpdatedLabel}. High point <span className="font-medium text-foreground tabular-nums">{fmt(prev.highWaterMark, balAccount.currency)}</span>.</>
                      : <>No balance recorded yet. Drawdown is measured from the high point, starting at {fmt(balAccount.accountSize, balAccount.currency)}.</>}
                  </p>
                )}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="bal-current">Current balance</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" aria-hidden="true">{balSym}</span>
                    <Input id="bal-current" type="number" inputMode="decimal" step="0.01" placeholder="0.00" autoFocus className="h-11 pl-7 text-base tabular-nums" value={balanceDialog.balance} onChange={e => setBalanceDialog(p => ({ ...p, balance: e.target.value }))} />
                  </div>
                  {delta !== null && delta !== 0 && (
                    <p className="text-xs tabular-nums" style={{ color: delta >= 0 ? themeColors.profit : themeColors.loss }}>
                      {delta >= 0 ? '+' : '-'}{fmt(Math.abs(delta), balAccount?.currency)} since last update
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground" htmlFor="bal-today-pnl">Today's P&L <span className="font-normal">(optional)</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" aria-hidden="true">{balSym}</span>
                      <Input id="bal-today-pnl" type="number" inputMode="decimal" step="0.01" placeholder="-250" className="h-10 pl-7 tabular-nums" value={balanceDialog.todayPnL} onChange={e => setBalanceDialog(p => ({ ...p, todayPnL: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground" htmlFor="bal-trading-days">Trading days so far</label>
                    <Input id="bal-trading-days" type="number" inputMode="numeric" min="0" step="1" placeholder="0" className="h-10 tabular-nums" value={balanceDialog.tradingDays} onChange={e => setBalanceDialog(p => ({ ...p, tradingDays: e.target.value }))} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Negative P&L feeds the daily drawdown bar. Leave it blank if you did not trade today.</p>

                {/* Live preview */}
                {balAccount?.challengeRules && (
                  <div className="rounded-lg border p-3 space-y-2">
                    <p className="text-xs font-medium">{preview ? 'After this update' : 'Enter a balance to preview drawdown'}</p>
                    {preview && (
                      <div className="space-y-2">
                        {isEvalPhase && balAccount.challengeRules.profitTarget > 0 && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Profit target</span>
                              <span className="font-semibold tabular-nums" style={{ color: profitBarColor(preview.profitPct, themeColors) }}>
                                {preview.profitGain >= 0 ? '+' : ''}{fmt(preview.profitGain, balAccount.currency)} · {Math.max(0, Math.min(100, preview.profitPct)).toFixed(0)}%
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, preview.profitPct))}%`, backgroundColor: profitBarColor(preview.profitPct, themeColors) }} />
                            </div>
                          </div>
                        )}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground whitespace-nowrap">Total drawdown</span>
                            <span className="font-semibold tabular-nums text-right" style={{ color: ddBarColor(preview.totalDDUsedPct, themeColors) }}>
                              {fmt(preview.totalDDDollars, balAccount.currency)} of {fmt(preview.maxTotalDDDollars, balAccount.currency)} · {Math.min(100, preview.totalDDUsedPct).toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, preview.totalDDUsedPct)}%`, backgroundColor: ddBarColor(preview.totalDDUsedPct, themeColors) }} />
                          </div>
                        </div>
                        {balAccount.challengeRules.maxDailyDrawdown > 0 && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground whitespace-nowrap">Daily drawdown</span>
                              <span className="font-semibold tabular-nums text-right" style={{ color: ddBarColor(preview.dailyDDUsedPct, themeColors) }}>
                                {fmt(preview.dailyDDDollars, balAccount.currency)} of {fmt(preview.maxDailyDDDollars, balAccount.currency)} · {Math.min(100, preview.dailyDDUsedPct).toFixed(0)}%
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${Math.min(100, preview.dailyDDUsedPct)}%`, backgroundColor: ddBarColor(preview.dailyDDUsedPct, themeColors) }} />
                            </div>
                          </div>
                        )}
                        {(preview.totalDDUsedPct >= 100 || preview.dailyDDUsedPct >= 100) && (
                          <p className="text-xs font-medium" style={{ color: themeColors.loss }}>
                            This balance is over a drawdown limit. Save it if it is right, then mark the account failed once the firm confirms.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="px-5 py-4 border-t flex justify-end gap-2">
                <Button variant="outline" onClick={() => setBalanceDialog(p => ({ ...p, open: false }))}>Cancel</Button>
                <Button onClick={handleSaveBalance} style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}>Save balance</Button>
              </div>
            </DialogContent>
          </Dialog>
        )
      })()}
    </div>
  )
}
