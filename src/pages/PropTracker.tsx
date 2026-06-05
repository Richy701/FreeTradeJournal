import React, { useState, useMemo, useCallback, useEffect } from 'react'
import DOMPurify from 'dompurify'
import {
  PieChart,
  Pie,
  Tooltip,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import {
  Plus,
  Building2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  X,
  Info,
  Brain,
  Lock,
  AlertTriangle,
  CheckCircle2,
  ListChecks,
  BarChart2,
  Upload,
  Tag,
  RefreshCw,
  Target,
  Shield,
  Trophy,
  Calculator,
  ClipboardCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { useThemePresets } from '@/contexts/theme-presets'
import { useProStatus } from '@/contexts/pro-context'
import { useAuth } from '@/contexts/auth-context'
import { DemoDataService } from '@/services/demo-service'
import { ProGate } from '@/components/pro-gate'
import { toast } from 'sonner'
import { requestPropAnalysis, requestScreenshotParse } from '@/services/ai-analysis'
import type { ParsedTransaction } from '@/services/ai-analysis'
import { Link } from 'react-router-dom'
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

const FREE_ACCOUNT_LIMIT = 3

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

function statusMeta(status: PropAccountStatus) {
  return STATUS_OPTIONS.find(s => s.value === status)!
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
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    notes: '',
    rulesEnabled: false,
    profitTarget: '',
    maxDailyDrawdown: '',
    maxTotalDrawdown: '',
    minTradingDays: '',
  }
}

function defaultTxForm(accountId = '') {
  return {
    propAccountId: accountId,
    type: 'evaluation-fee' as TransactionType,
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
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

type HealthStatus = 'green' | 'amber' | 'red'

function getChallengeStatus(account: PropFirmAccount) {
  const rules = account.challengeRules
  const progress = account.challengeProgress
  if (!rules || !progress) return null

  const { accountSize } = account
  const { currentBalance, highWaterMark, todayPnL, tradingDaysCount } = progress

  const profitGain = currentBalance - accountSize
  const profitPct = rules.profitTarget > 0 ? Math.min((profitGain / rules.profitTarget) * 100, 100) : 0

  const totalDDDollars = Math.max(0, highWaterMark - currentBalance)
  const maxTotalDDDollars = (rules.maxTotalDrawdown / 100) * accountSize
  const totalDDUsedPct = maxTotalDDDollars > 0 ? (totalDDDollars / maxTotalDDDollars) * 100 : 0

  const dailyDDDollars = todayPnL !== undefined && todayPnL < 0 ? Math.abs(todayPnL) : 0
  const maxDailyDDDollars = rules.maxDailyDrawdown > 0 ? (rules.maxDailyDrawdown / 100) * accountSize : 0
  const dailyDDUsedPct = maxDailyDDDollars > 0 ? (dailyDDDollars / maxDailyDDDollars) * 100 : 0

  const tradingDaysPct = rules.minTradingDays ? Math.min((tradingDaysCount / rules.minTradingDays) * 100, 100) : null

  let health: HealthStatus = 'green'
  if (totalDDUsedPct >= 80 || dailyDDUsedPct >= 80) health = 'red'
  else if (totalDDUsedPct >= 50 || dailyDDUsedPct >= 50) health = 'amber'

  return {
    profitGain, profitPct,
    totalDDDollars, totalDDUsedPct, maxTotalDDDollars,
    dailyDDDollars, dailyDDUsedPct, maxDailyDDDollars,
    tradingDaysCount, tradingDaysPct,
    health,
  }
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
  const { themeColors } = useThemePresets()
  const { isPro } = useProStatus()
  const { isDemo } = useAuth()

  // ── Data ──
  const [accounts, setAccounts] = useState<PropFirmAccount[]>([])
  const [transactions, setTransactions] = useState<PropFirmTransaction[]>([])
  const [tipDismissed, setTipDismissed] = useState(false)
  const [showDealsBanner, setShowDealsBanner] = useState(() => !localStorage.getItem('ftj-dismiss-deals-pt'))

  useEffect(() => {
    if (isDemo) {
      setAccounts(DemoDataService.getPropAccounts())
      setTransactions(DemoDataService.getPropTransactions())
      setTipDismissed(true)
      return
    }
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
  }, [storage, isDemo])

  const saveAccounts = useCallback((updated: PropFirmAccount[]) => {
    setAccounts(updated)
    if (!isDemo) storage.setItem('propFirmAccounts', JSON.stringify(updated))
  }, [storage, isDemo])

  const saveTransactions = useCallback((updated: PropFirmTransaction[]) => {
    setTransactions(updated)
    if (!isDemo) storage.setItem('propFirmTransactions', JSON.stringify(updated))
  }, [storage, isDemo])

  function dismissTip() {
    setTipDismissed(true)
    storage.setItem('propTrackerTipDismissed', 'true')
  }

  // ── AI state ──
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiUsage, setAiUsage] = useState<{ used: number; limit: number; remaining: number } | null>(null)

  async function runAiAnalysis() {
    if (accounts.length === 0) { toast.error('Add some accounts first'); return }
    setAiLoading(true)
    setAiAnalysis(null)
    try {
      const res = await requestPropAnalysis(accounts, transactions)
      setAiAnalysis(res.result)
      setAiUsage(res.usage)
    } catch (err: unknown) {
      const e = err as { message?: string; details?: string }
      const msg = e?.message || e?.details || 'AI analysis failed'
      toast.error(msg)
    } finally {
      setAiLoading(false)
    }
  }

  // ── UI state ──
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
    if (invalid) { toast.error('Please upload image files only'); return }
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
        toast.error('No transactions found in screenshots')
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
    const toImport = importDialog.parsed.filter(tx => tx.keep)
    if (!toImport.length) { toast.error('No transactions selected'); return }
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
      toast.error(`Free plan is limited to ${FREE_ACCOUNT_LIMIT} accounts. Upgrade to Pro for unlimited accounts.`)
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
    })
    setAccountDialog({ open: true, editing: account })
  }

  function handleSaveAccount() {
    const firmName = accountForm.firmName === 'Custom...' ? accountForm.customFirm.trim() : accountForm.firmName
    const sizeRaw = accountForm.accountSizeStr === 'custom' ? accountForm.customSizeStr : accountForm.accountSizeStr
    const accountSize = Number(sizeRaw)
    if (!firmName) { toast.error('Firm name is required'); return }
    if (!accountSize || accountSize <= 0) { toast.error('Account size must be greater than 0'); return }
    if (!accountForm.startDate) { toast.error('Start date is required'); return }

    let challengeRules: ChallengeRules | undefined
    if (accountForm.rulesEnabled) {
      const profitTarget = Number(accountForm.profitTarget)
      const maxDailyDrawdown = Number(accountForm.maxDailyDrawdown) || 0
      const maxTotalDrawdown = Number(accountForm.maxTotalDrawdown)
      if (!profitTarget || profitTarget <= 0) { toast.error('Profit target is required when rules are enabled'); return }
      if (!maxTotalDrawdown || maxTotalDrawdown <= 0) { toast.error('Max total drawdown is required when rules are enabled'); return }
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
    const amount = Number(txForm.amount)
    if (!txForm.propAccountId) { toast.error('Select an account'); return }
    if (!amount || amount <= 0) { toast.error('Amount must be greater than 0'); return }
    if (!txForm.date) { toast.error('Date is required'); return }

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
    setBalanceDialog({
      open: true,
      accountId: account.id,
      balance: progress ? String(progress.currentBalance) : String(account.accountSize),
      todayPnL: '',
      tradingDays: progress ? String(progress.tradingDaysCount) : '0',
    })
  }

  function handleSaveBalance() {
    const balance = Number(balanceDialog.balance)
    if (isNaN(balance) || balance < 0) { toast.error('Enter a valid balance'); return }
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
          lastUpdated: new Date().toISOString().split('T')[0],
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

  const subtitleParts = useMemo(() => {
    if (accounts.length === 0) return null
    return {
      base: [
        `${accounts.length} account${accounts.length !== 1 ? 's' : ''}`,
        stats.activeCount > 0 ? `${stats.activeCount} active` : null,
      ].filter(Boolean).join(' · '),
      net: transactions.length > 0 ? `${stats.netPnL >= 0 ? '+' : ''}${fmt(stats.netPnL)} P&L` : null,
      netColor: stats.netPnL >= 0 ? themeColors.profit : themeColors.loss,
    }
  }, [accounts, stats, transactions, themeColors])

  const pnlOverTime = useMemo(() => {
    if (transactions.length === 0) return []
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date))
    let cumulative = 0
    return sorted.map(tx => {
      cumulative += isExpenseTx(tx.type) ? -tx.amount : tx.amount
      return {
        date: new Date(tx.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: cumulative,
      }
    })
  }, [transactions])

  const chartData = useMemo(() => {
    if (transactions.length === 0) return []
    return accounts.map(a => {
      const txs = transactions.filter(t => t.propAccountId === a.id)
      let invested = 0, earned = 0
      for (const tx of txs) {
        if (isExpenseTx(tx.type)) invested += tx.amount
        else earned += tx.amount
      }
      const pnl = earned - invested
      return {
        name: firmInitials(a.firmName),
        fullName: a.firmName,
        invested,
        earned,
        pnl,
        color: firmAvatarColor(a.firmName),
      }
    }).filter(d => d.invested > 0 || d.earned > 0)
  }, [accounts, transactions])

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

  const statCards = [
    {
      icon: DollarSign,
      label: 'Total Invested',
      value: hasData ? fmt(stats.totalInvested) : '—',
      valueColor: hasData ? themeColors.loss : 'var(--muted-foreground)',
      subtitle: 'All fees paid',
    },
    {
      icon: Wallet,
      label: 'Total Earned',
      value: hasData ? fmt(stats.totalEarned) : '—',
      valueColor: hasData ? themeColors.profit : 'var(--muted-foreground)',
      subtitle: 'All payouts received',
    },
    {
      icon: stats.netPnL >= 0 ? TrendingUp : TrendingDown,
      label: 'P&L',
      value: hasData ? (stats.netPnL >= 0 ? '+' : '-') + fmt(stats.netPnL) : '—',
      valueColor: hasData ? (stats.netPnL >= 0 ? themeColors.profit : themeColors.loss) : 'var(--muted-foreground)',
      subtitle: hasData
        ? (stats.roi !== null ? `${stats.roi >= 0 ? '+' : ''}${stats.roi.toFixed(1)}% ROI` : 'Profitable overall')
        : 'Fees vs payouts',
    },
    {
      icon: Building2,
      label: 'Active Accounts',
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
      entries: activeRulesAccounts.map(a => ({
        accountId: a.id,
        balance: a.challengeProgress ? String(a.challengeProgress.currentBalance) : String(a.accountSize),
        todayPnL: '',
        tradingDays: a.challengeProgress ? String(a.challengeProgress.tradingDaysCount) : '0',
      })),
    })
  }

  function handleSaveCheckin() {
    const today = new Date().toISOString().split('T')[0]
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
      const wouldBreachTotal = totalDDPctAfter >= 100

      const existingDailyLoss = (progress.todayPnL !== undefined && progress.todayPnL < 0) ? Math.abs(progress.todayPnL) : 0
      const dailyAfter = existingDailyLoss + loss
      const dailyDDPctAfter = maxDailyDDDollars > 0 ? (dailyAfter / maxDailyDDDollars) * 100 : 0
      const wouldBreachDaily = maxDailyDDDollars > 0 && dailyDDPctAfter >= 100

      const remainingBeforeTotal = Math.max(0, maxTotalDDDollars - currentDD - loss)
      const remainingBeforeDaily = maxDailyDDDollars > 0 ? Math.max(0, maxDailyDDDollars - dailyAfter) : null

      return {
        account: a,
        totalDDPctAfter: Math.min(totalDDPctAfter, 100),
        dailyDDPctAfter: Math.min(dailyDDPctAfter, 100),
        wouldBreachTotal,
        wouldBreachDaily,
        remainingBeforeTotal,
        remainingBeforeDaily,
        balanceAfter: progress.currentBalance - loss,
      }
    })
  }, [riskCalcAmount, activeRulesAccounts])

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

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      {/* Affiliate Deals Banner */}
      {showDealsBanner && (
        <div className="mx-3 sm:mx-6 lg:mx-8 mt-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] px-4 py-2.5 flex items-center gap-3">
          <Tag className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="flex-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Save on your next challenge</span>
            <span className="hidden sm:inline"> · Exclusive codes for The5ers, FTMO, Apex, and more</span>
          </p>
          <a href="/affiliate" target="_blank" rel="noopener noreferrer" className="shrink-0">
            <button className="text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-black px-3 py-1.5 rounded-lg transition-colors duration-150">
              View Deals →
            </button>
          </a>
          <button
            onClick={() => { localStorage.setItem('ftj-dismiss-deals-pt', '1'); setShowDealsBanner(false); }}
            className="text-muted-foreground hover:text-foreground shrink-0 p-1 transition-colors"
            aria-label="Dismiss"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Page header */}
      <div className="border-b relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 20% 50%, ${themeColors.primary}12 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, ${themeColors.primary}06 0%, transparent 40%)` }} />
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full pointer-events-none opacity-[0.04]" style={{ backgroundColor: themeColors.primary, filter: 'blur(40px)' }} />
        <div className="relative w-full px-3 py-5 sm:px-6 lg:px-8 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Title + subtitle */}
            <div className="text-center sm:text-left">
              <div className="flex items-center gap-3 justify-center sm:justify-start">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: `${themeColors.primary}15` }}>
                  <BarChart2 className="h-5 w-5" style={{ color: themeColors.primary }} />
                </div>
                <div>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: themeColors.primary }}>
                    PropTracker
                  </h1>
                </div>
              </div>
              {subtitleParts ? (
                <div className="flex flex-wrap items-center gap-2 mt-3 justify-center sm:justify-start">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border border-border/60 bg-muted/50 text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    {subtitleParts.base}
                  </span>
                  {subtitleParts.net && (
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap"
                      style={{
                        color: subtitleParts.netColor,
                        borderColor: `${subtitleParts.netColor}30`,
                        backgroundColor: `${subtitleParts.netColor}10`,
                      }}
                    >
                      {stats.netPnL >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {subtitleParts.net}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-2 sm:pl-[52px]">Track fees, resets, and payouts across your prop firms</p>
              )}
            </div>
            {/* Action button */}
            <div className="flex items-center justify-center sm:justify-end gap-2 shrink-0">
              {activeRulesAccounts.length >= 2 && (
                <Button variant="outline" onClick={openCheckinDialog} className="h-11 touch-manipulation">
                  <ClipboardCheck className="h-4 w-4 mr-1.5" aria-hidden="true" />
                  <span className="hidden sm:inline">End of Day</span>
                  <span className="sm:hidden">Check-In</span>
                </Button>
              )}
              {!isPro && accounts.length >= FREE_ACCOUNT_LIMIT ? (
                <Link to="/pricing">
                  <Button className="h-11 touch-manipulation" style={{ backgroundColor: themeColors.primary }}>
                    <Lock className="h-4 w-4 mr-1.5" aria-hidden="true" />
                    Upgrade for More
                  </Button>
                </Link>
              ) : (
                <Button onClick={openAddAccount} className="h-11 touch-manipulation" style={{ backgroundColor: themeColors.primary }}>
                  <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
                  Add Account
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">

        {/* Deadline alerts */}
        {upcomingDeadlines.length > 0 && (
          <div className="space-y-2">
            {upcomingDeadlines.map(({ account, daysLeft }) => (
              <div
                key={account.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm"
                style={{
                  borderColor: daysLeft <= 2 ? `${themeColors.loss}40` : `${themeColors.primary}30`,
                  backgroundColor: daysLeft <= 2 ? `${themeColors.loss}08` : `${themeColors.primary}06`,
                }}
              >
                <AlertTriangle
                  className="h-4 w-4 shrink-0"
                  style={{ color: daysLeft <= 2 ? themeColors.loss : themeColors.primary }}
                />
                <span className="font-medium" style={{ color: daysLeft <= 2 ? themeColors.loss : themeColors.primary }}>
                  {daysLeft === 0 ? 'Expires today' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                </span>
                <span className="text-muted-foreground">
                  {account.firmName} ({account.accountType}) evaluation ends {new Date(account.endDate! + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        )}


        {/* Dismissible how-it-works — plain text, no step circles */}
        {accounts.length > 0 && !tipDismissed && (
          <div className="flex items-start gap-3 rounded-lg border border-border/60 px-4 py-3.5 text-sm">
            <Info className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
            <div className="flex-1 space-y-1">
              <p className="font-medium text-foreground text-sm">Quick start</p>
              <p className="text-muted-foreground leading-relaxed text-xs">
                Create one card per prop account. Log every fee (evaluations, resets, subscriptions) and every payout. Set challenge rules to track drawdown limits and profit targets in real time. PropTracker shows your true net P&L across all firms.
              </p>
            </div>
            <button onClick={dismissTip} aria-label="Dismiss tip" className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 2xl:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <Card key={card.label} className="relative overflow-hidden transition-shadow duration-300 hover:shadow-lg">
              <div className="absolute top-0 right-0 w-20 h-20 pointer-events-none" style={{ background: `radial-gradient(circle at 100% 0%, ${card.valueColor}10 0%, transparent 70%)` }} />
              <CardContent className="p-5 relative">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    {card.label}
                  </p>
                  <div className="h-7 w-7 rounded-md flex items-center justify-center" style={{ backgroundColor: `${card.valueColor}15` }}>
                    <card.icon className="h-3.5 w-3.5" style={{ color: card.valueColor }} />
                  </div>
                </div>
                <p className="text-2xl font-bold tabular-nums tracking-tight" style={{ color: card.valueColor }}>
                  {card.value}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{card.subtitle}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Success Rate Dashboard */}
        {successStats && (
          <ProGate featureName="Success Rate Dashboard">
            <div className="rounded-xl border border-border/60 overflow-hidden relative">
              <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(135deg, ${themeColors.primary}06 0%, transparent 40%)` }} />
              <div className="relative flex items-center gap-2.5 px-5 py-3.5 border-b border-border/60">
                <div className="p-1.5 rounded-md" style={{ backgroundColor: `${themeColors.primary}20` }}>
                  <Trophy className="h-4 w-4" style={{ color: themeColors.primary }} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Performance Overview</p>
                  <p className="text-[10px] text-muted-foreground">Your prop trading track record</p>
                </div>
              </div>
              <div className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-border/40">
                {[
                  {
                    label: 'Pass Rate',
                    value: successStats.passRate !== null ? `${successStats.passRate.toFixed(0)}%` : '--',
                    sub: `${successStats.passed} passed, ${successStats.failed} failed`,
                    color: successStats.passRate !== null && successStats.passRate >= 50 ? themeColors.profit : themeColors.loss,
                  },
                  {
                    label: 'Attempts',
                    value: String(successStats.total),
                    sub: `${successStats.passed} funded`,
                    color: themeColors.primary,
                  },
                  {
                    label: 'Avg Cost to Fund',
                    value: successStats.avgCostToFund !== null ? fmt(successStats.avgCostToFund) : '--',
                    sub: 'Per funded account',
                    color: successStats.avgCostToFund !== null ? themeColors.loss : 'var(--muted-foreground)',
                  },
                  {
                    label: 'Wasted on Failed',
                    value: successStats.totalWastedOnFailed > 0 ? fmt(successStats.totalWastedOnFailed) : '--',
                    sub: `Across ${successStats.failed} failed`,
                    color: successStats.totalWastedOnFailed > 0 ? themeColors.loss : 'var(--muted-foreground)',
                  },
                  {
                    label: 'Best Firm ROI',
                    value: successStats.bestFirm ? `${successStats.bestFirm.roi >= 0 ? '+' : ''}${successStats.bestFirm.roi.toFixed(0)}%` : '--',
                    sub: successStats.bestFirm?.firm ?? 'N/A',
                    color: successStats.bestFirm && successStats.bestFirm.roi >= 0 ? themeColors.profit : themeColors.loss,
                  },
                ].map(s => (
                  <div key={s.label} className="bg-card px-4 py-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                    <p className="text-xl font-bold tabular-nums mt-0.5" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </ProGate>
        )}

        {/* Risk Calculator */}
        {activeRulesAccounts.length > 0 && (
          <div className="rounded-xl border border-border/60 overflow-hidden">
            <button
              onClick={() => setRiskCalcOpen(p => !p)}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-md" style={{ backgroundColor: `${themeColors.primary}20` }}>
                  <Calculator className="h-4 w-4" style={{ color: themeColors.primary }} aria-hidden="true" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">Risk Calculator</p>
                  <p className="text-[10px] text-muted-foreground">Check the impact before you trade</p>
                </div>
              </div>
              {riskCalcOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {riskCalcOpen && (
              <div className="px-5 pb-4 space-y-4 border-t border-border/60 pt-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-muted-foreground whitespace-nowrap">If I lose</label>
                  <div className="relative max-w-[160px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" aria-hidden="true">$</span>
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
                  <label className="text-sm text-muted-foreground whitespace-nowrap">today...</label>
                </div>

                {riskCalcResults && riskCalcResults.length > 0 && (
                  <div className="space-y-2">
                    {riskCalcResults.map(r => {
                      const brandColor = firmAvatarColor(r.account.firmName)
                      const breached = r.wouldBreachTotal || r.wouldBreachDaily
                      return (
                        <div
                          key={r.account.id}
                          className="rounded-lg border p-3 space-y-2"
                          style={{
                            borderColor: breached ? `${themeColors.loss}40` : 'var(--border)',
                            backgroundColor: breached ? `${themeColors.loss}06` : undefined,
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {FIRM_LOGOS[r.account.firmName] ? (
                              <div className="h-6 w-6 rounded shrink-0 overflow-hidden"><img src={FIRM_LOGOS[r.account.firmName]} alt={r.account.firmName} className="w-full h-full object-cover" /></div>
                            ) : (
                              <div
                                className="h-6 w-6 rounded flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                                style={{ backgroundColor: brandColor }}
                              >
                                {firmInitials(r.account.firmName)}
                              </div>
                            )}
                            <span className="text-sm font-medium truncate">{r.account.firmName}</span>
                            <span className="text-xs text-muted-foreground">{currencySymbol(r.account.currency)}{r.account.accountSize.toLocaleString()}</span>
                            {breached && (
                              <Badge variant="outline" className="ml-auto text-[10px] h-5 px-1.5 bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20">
                                BREACH
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                            <div>
                              <p className="text-muted-foreground">Balance after</p>
                              <p className="font-semibold tabular-nums" style={{ color: r.balanceAfter < r.account.accountSize ? themeColors.loss : themeColors.profit }}>
                                {fmt(r.balanceAfter, r.account.currency)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Total DD used</p>
                              <p className="font-semibold tabular-nums" style={{ color: ddBarColor(r.totalDDPctAfter, themeColors) }}>
                                {r.totalDDPctAfter.toFixed(1)}%
                                {r.wouldBreachTotal && <span className="text-red-500 ml-1">LIMIT</span>}
                              </p>
                            </div>
                            {r.account.challengeRules!.maxDailyDrawdown > 0 && (
                              <div>
                                <p className="text-muted-foreground">Daily DD used</p>
                                <p className="font-semibold tabular-nums" style={{ color: ddBarColor(r.dailyDDPctAfter, themeColors) }}>
                                  {r.dailyDDPctAfter.toFixed(1)}%
                                  {r.wouldBreachDaily && <span className="text-red-500 ml-1">LIMIT</span>}
                                </p>
                              </div>
                            )}
                            <div>
                              <p className="text-muted-foreground">Room left (total)</p>
                              <p className="font-semibold tabular-nums">
                                {fmt(r.remainingBeforeTotal, r.account.currency)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {(!riskCalcResults || riskCalcResults.length === 0) && (
                  <p className="text-xs text-muted-foreground text-center py-2">Enter an amount to see the impact on your active challenges.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Pie charts — Pro only */}
        {chartData.length > 0 && (
          <ProGate featureName="Charts & Analytics">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Spend by Firm */}
            <Card>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <DollarSign className="h-3 w-3" />
                  Spend by Firm
                </p>
                <div className="flex items-center gap-5">
                  <div className="shrink-0">
                    <PieChart width={120} height={120}>
                      <Pie
                        data={chartData.filter(d => d.invested > 0)}
                        dataKey="invested"
                        innerRadius={36}
                        outerRadius={56}
                        paddingAngle={2}
                        startAngle={90}
                        endAngle={-270}
                      >
                        {chartData.filter(d => d.invested > 0).map((entry, i) => (
                          <Cell key={i} fill={entry.color} fillOpacity={0.9} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null
                          const d = payload[0].payload
                          return (
                            <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
                              <p className="font-medium text-foreground">{d.fullName}</p>
                              <p className="text-muted-foreground">{fmt(d.invested)}</p>
                            </div>
                          )
                        }}
                      />
                    </PieChart>
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    {chartData.filter(d => d.invested > 0).map((d, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-xs text-muted-foreground flex-1 truncate">{d.fullName}</span>
                        <span className="text-xs font-medium tabular-nums">{fmt(d.invested)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* P&L Over Time */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3" />
                    P&L Over Time
                  </p>
                  {pnlOverTime.length > 0 && (() => {
                    const final = pnlOverTime[pnlOverTime.length - 1].value
                    return (
                      <div className="text-right">
                        <p className="text-lg font-bold tabular-nums leading-none" style={{ color: final >= 0 ? themeColors.profit : themeColors.loss }}>
                          {final >= 0 ? '+' : ''}{fmt(final)}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">cumulative</p>
                      </div>
                    )
                  })()}
                </div>
                {(() => {
                  const final = pnlOverTime.length > 0 ? pnlOverTime[pnlOverTime.length - 1].value : 0
                  const lineColor = final >= 0 ? themeColors.profit : themeColors.loss
                  return (
                    <ResponsiveContainer width="100%" height={140}>
                      <AreaChart data={pnlOverTime} margin={{ top: 8, right: 4, bottom: 8, left: 4 }}>
                        <defs>
                          <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={lineColor} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={lineColor} stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" hide />
                        <YAxis hide domain={['auto', 'auto']} />
                        <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1} strokeDasharray="3 3" />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            const v = payload[0].value as number
                            return (
                              <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
                                <p className="text-muted-foreground">{payload[0].payload.date}</p>
                                <p className="font-semibold" style={{ color: v >= 0 ? themeColors.profit : themeColors.loss }}>
                                  {v >= 0 ? '+' : ''}{fmt(v)}
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
              </CardContent>
            </Card>
          </div>
          </ProGate>
        )}

        {/* AI Analysis — Pro only */}
        {accounts.length > 0 && transactions.length > 0 && (
          <ProGate featureName="AI PropTracker Analysis">
            <div className="rounded-lg border border-border/60 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border/60">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md" style={{ backgroundColor: `${themeColors.primary}20` }}>
                    <Brain className="h-4 w-4" style={{ color: themeColors.primary }} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">AI Analysis</p>
                    <p className="text-xs text-muted-foreground">Honest breakdown of your prop trading across all firms</p>
                  </div>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <button
                    onClick={runAiAnalysis}
                    disabled={aiLoading}
                    aria-label="Run AI analysis"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white disabled:opacity-60 transition-opacity"
                    style={{ backgroundColor: themeColors.primary }}
                  >
                    <Brain className="h-3 w-3" aria-hidden="true" />
                    {aiLoading ? 'Analysing…' : aiAnalysis ? 'Re-analyse' : 'Analyse'}
                  </button>
                  {aiUsage && (
                    <p className="text-[10px] text-muted-foreground">{aiUsage.remaining}/{aiUsage.limit} uses today</p>
                  )}
                </div>
              </div>

              {/* Loading state */}
              {aiLoading && (
                <div className="px-5 py-8 flex flex-col items-center gap-3 text-center">
                  <Brain className="h-6 w-6 animate-pulse" style={{ color: themeColors.primary }} aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">Analysing your prop trading data…</p>
                </div>
              )}

              {/* Results */}
              {aiAnalysis && !aiLoading && (() => {
                // Parse score from first line
                const scoreMatch = aiAnalysis.match(/^SCORE:\s*(\d+)\s*\/\s*10/im)
                const score = scoreMatch ? parseInt(scoreMatch[1], 10) : null
                const scoreColor = score !== null
                  ? score >= 7 ? themeColors.profit : score >= 4 ? themeColors.primary : themeColors.loss
                  : themeColors.primary

                const sections = [
                  { key: 'verdict',   heading: 'Overall Verdict',   icon: CheckCircle2,   color: themeColors.profit },
                  { key: 'roi',       heading: 'ROI Breakdown',     icon: BarChart2,       color: themeColors.primary },
                  { key: 'challenge', heading: 'Challenge Progress', icon: Target,          color: themeColors.primary },
                  { key: 'firms',     heading: 'Firm-by-Firm',      icon: Building2,       color: themeColors.primary },
                  { key: 'warnings',  heading: 'Warning Signs',     icon: AlertTriangle,   color: themeColors.loss },
                  { key: 'next',      heading: 'What to Do Next',   icon: ListChecks,      color: themeColors.profit },
                ]

                const parsed: Record<string, string> = {}
                sections.forEach((s, i) => {
                  const nextHeading = sections[i + 1]?.heading
                  const regex = new RegExp(
                    `\\*\\*${s.heading}\\*\\*[^\\n]*\\n([\\s\\S]*?)${nextHeading ? `(?=\\*\\*${nextHeading}\\*\\*)` : '$'}`,
                    'i'
                  )
                  const match = aiAnalysis.match(regex)
                  parsed[s.key] = match ? match[1].trim() : ''
                })

                return (
                  <div className="divide-y divide-border/60">
                    {/* Score card */}
                    {score !== null && (
                      <div className="px-5 py-4 flex items-center gap-4">
                        <div
                          className="flex items-center justify-center w-14 h-14 rounded-xl text-white font-bold text-lg shrink-0"
                          style={{ backgroundColor: scoreColor }}
                        >
                          {score}/10
                        </div>
                        <div>
                          <p className="text-sm font-semibold">
                            {score >= 8 ? 'Strong Performance' : score >= 6 ? 'On Track' : score >= 4 ? 'Needs Improvement' : 'At Risk'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {score >= 8 ? 'Your prop trading is profitable and sustainable.' : score >= 6 ? 'Profitable direction, but room to optimize.' : score >= 4 ? 'Costs are eating into returns. Review your approach.' : 'Spending more than you\'re making. Action needed.'}
                          </p>
                        </div>
                      </div>
                    )}

                    {sections.map(s => {
                      const content = parsed[s.key]
                      if (!content) return null
                      const Icon = s.icon
                      const lines = content.split('\n').filter(Boolean)
                      return (
                        <div key={s.key} className="px-5 py-4 space-y-2">
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: s.color }} aria-hidden="true" />
                            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: s.color }}>{s.heading}</p>
                          </div>
                          <div className="space-y-1.5 text-sm text-foreground leading-relaxed">
                            {lines.map((line, i) => {
                              const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              const isBullet = line.startsWith('-') || /^\d+\./.test(line)
                              return (
                                <p
                                  key={i}
                                  className={isBullet ? 'pl-3 border-l-2 border-border/60' : ''}
                                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatted.replace(/^[-•]\s*/, ''), { ALLOWED_TAGS: ['strong', 'em', 'br'] }) }}
                                />
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}

              {/* Empty prompt */}
              {!aiAnalysis && !aiLoading && (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-muted-foreground">Hit <strong>Analyse</strong> to get your AI breakdown.</p>
                </div>
              )}
            </div>
          </ProGate>
        )}

        {/* Empty state */}
        {accounts.length === 0 ? (
          <div className="rounded-xl border border-border/60 overflow-hidden relative">
            {/* Hero CTA — clean, no overlap */}
            <div className="flex flex-col items-center text-center gap-5 px-6 pt-12 pb-8 relative" style={{ background: `radial-gradient(ellipse at 50% 0%, ${themeColors.primary}15 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, ${themeColors.primary}08 0%, transparent 50%)` }}>
              <div className="space-y-2 max-w-md">
                <h2 className="text-2xl font-bold tracking-tight">Do you actually know your prop ROI?</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Log every fee and every payout. PropTracker calculates the number most prop traders never work out.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                {[
                  { icon: Receipt,    label: 'Fees & Payouts' },
                  { icon: TrendingUp, label: 'True ROI' },
                  { icon: Shield,     label: 'Challenge Rules' },
                  { icon: Brain,      label: 'AI Analysis' },
                ].map(f => (
                  <div key={f.label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted border border-border/60 text-muted-foreground">
                    <f.icon className="h-3 w-3" aria-hidden="true" />
                    {f.label}
                  </div>
                ))}
              </div>

              <Button onClick={openAddAccount} size="lg" style={{ backgroundColor: themeColors.primary }}>
                <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
                Add your first account
              </Button>

              {!isPro && <p className="text-xs text-muted-foreground -mt-1">Free to start · 3 accounts on free plan</p>}
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center px-6"><div className="w-full border-t border-border/60" /></div>
              <div className="relative flex justify-center">
                <span className="bg-card px-3 text-[11px] text-muted-foreground uppercase tracking-wider">Preview</span>
              </div>
            </div>

            {/* Ghost preview — visible, fades at bottom */}
            <div className="relative">
              <div className="pointer-events-none select-none opacity-50 p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-2 2xl:grid-cols-4 gap-4">
                  {[
                    { icon: DollarSign, label: 'Total Invested',  value: '$1,915',  sub: 'All fees paid',        color: themeColors.loss },
                    { icon: Wallet,     label: 'Total Earned',    value: '$7,700',  sub: 'All payouts received', color: themeColors.profit },
                    { icon: TrendingUp, label: 'P&L',             value: '+$5,785', sub: '+302% ROI',            color: themeColors.profit },
                    { icon: Building2,  label: 'Active Accounts', value: '2',       sub: 'of 4 total',          color: themeColors.primary },
                  ].map(c => (
                    <Card key={c.label} className="relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-20 h-20 pointer-events-none" style={{ background: `radial-gradient(circle at 100% 0%, ${c.color}10 0%, transparent 70%)` }} />
                      <CardContent className="p-5 relative">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">{c.label}</p>
                          <div className="h-7 w-7 rounded-md flex items-center justify-center" style={{ backgroundColor: `${c.color}15` }}>
                            <c.icon className="h-3.5 w-3.5" style={{ color: c.color }} aria-hidden="true" />
                          </div>
                        </div>
                        <p className="text-2xl font-bold tabular-nums tracking-tight" style={{ color: c.color }}>{c.value}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{c.sub}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {[
                    { initials: 'TS', color: '#FFCC06', firm: 'TopStep',              size: '$50,000',  type: 'Evaluation', status: 'Active',    statusClass: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20', invested: '$347',  earned: '—',      pnl: '-$347' },
                    { initials: 'AT', color: '#007BFF', firm: 'Apex Trader Funding',  size: '$100,000', type: 'Funded',     status: 'Passed',    statusClass: 'bg-blue-500/15 text-blue-600 border-blue-500/20',         invested: '$137',  earned: '$4,200', pnl: '+$4,063' },
                    { initials: 'FT', color: '#0781FE', firm: 'FTMO',                 size: '$200,000', type: 'Evaluation', status: 'Failed',    statusClass: 'bg-red-500/15 text-red-600 border-red-500/20',           invested: '$810',  earned: '—',      pnl: '-$810' },
                    { initials: 'MF', color: '#D8AE5E', firm: 'My Funded Futures',    size: '$150,000', type: 'Funded',     status: 'Active',    statusClass: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20', invested: '$524',  earned: '$3,500', pnl: '+$2,976' },
                  ].map(g => (
                    <Card key={g.firm} className="relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 opacity-60" style={{ backgroundColor: g.color }} />
                      <CardContent className="p-4 pt-5">
                        <div className="flex items-start gap-3 mb-3">
                          {FIRM_LOGOS[g.firm] ? (
                            <div className="h-9 w-9 rounded-lg shrink-0 shadow-sm overflow-hidden"><img src={FIRM_LOGOS[g.firm]} alt={g.firm} className="w-full h-full object-cover" /></div>
                          ) : (
                            <div className="h-9 w-9 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm" style={{ backgroundColor: g.color }}>{g.initials}</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-sm">{g.firm}</p>
                              <span className={`text-[10px] h-5 px-1.5 rounded border font-semibold ${g.statusClass}`}>{g.status}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{g.size} · {g.type}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {[{ l: 'Invested', v: g.invested }, { l: 'Earned', v: g.earned }, { l: 'P&L', v: g.pnl }].map(s => (
                            <div key={s.l}>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.l}</p>
                              <p className="text-sm font-semibold mt-0.5">{s.v}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              {/* Fade out at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none" style={{ background: 'linear-gradient(to top, hsl(var(--background)) 0%, transparent 100%)' }} />
            </div>
          </div>
        ) : (
          /* Accounts grid */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {accounts.map(account => {
              const { invested, earned, net, txs } = getAccountStats(account.id)
              const expanded = expandedIds.has(account.id)
              const meta = statusMeta(account.status)
              const typeMeta = ACCOUNT_TYPE_OPTIONS.find(t => t.value === account.accountType)!
              const brandColor = firmAvatarColor(account.firmName)
              const challengeStatus = getChallengeStatus(account)

              return (
                <Card key={account.id} className="relative overflow-hidden transition-[transform,box-shadow] duration-300 hover:shadow-lg hover:scale-[1.005]">
                  <div className="absolute top-0 left-0 w-full h-1 opacity-60" style={{ backgroundColor: brandColor }} />
                  <CardContent className="p-4 pt-5">

                    {/* Account header */}
                    <div className="flex items-start gap-3 mb-3">
                      {FIRM_LOGOS[account.firmName] ? (
                        <div className="h-9 w-9 rounded-lg shrink-0 mt-0.5 shadow-sm bg-white overflow-hidden">
                          <img src={FIRM_LOGOS[account.firmName]} alt={account.firmName} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div
                          className="h-9 w-9 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5 shadow-sm"
                          style={{ backgroundColor: brandColor }}
                        >
                          {firmInitials(account.firmName)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-sm leading-tight truncate">{account.firmName}</p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {challengeStatus && (
                              <span
                                className="h-2 w-2 rounded-full shrink-0"
                                style={{ backgroundColor:
                                  challengeStatus.health === 'red' ? themeColors.loss :
                                  challengeStatus.health === 'amber' ? '#f59e0b' :
                                  themeColors.profit
                                }}
                                aria-label={`Challenge health: ${challengeStatus.health}`}
                              />
                            )}
                            <Badge variant="outline" className={`text-[10px] h-5 px-1.5 shrink-0 ${meta.badgeClass}`}>
                              {meta.label}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          <span className="font-medium text-foreground/70">{currencySymbol(account.currency)}{account.accountSize.toLocaleString()}</span>
                          {' '}&middot; {typeMeta.label} &middot; Since {new Date(account.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {/* Stats — 3 col with tinted backgrounds */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[
                        { label: 'Invested', value: invested > 0 ? fmt(invested, account.currency) : '—', color: invested > 0 ? themeColors.loss : undefined },
                        { label: 'Earned',   value: earned > 0  ? fmt(earned, account.currency)   : '—', color: earned > 0  ? themeColors.profit : undefined },
                        { label: 'P&L',      value: txs.length > 0 ? (net >= 0 ? '+' : '-') + fmt(net, account.currency) : '—', color: txs.length > 0 ? (net >= 0 ? themeColors.profit : themeColors.loss) : undefined },
                      ].map(s => (
                        <div
                          key={s.label}
                          className="rounded-lg px-2.5 py-2"
                          style={{ backgroundColor: s.color ? `${s.color}08` : 'var(--muted)' }}
                        >
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                          <p className="text-sm font-bold tabular-nums mt-0.5" style={{ color: s.color ?? 'var(--muted-foreground)' }}>{s.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Cost recovery indicator */}
                    {invested > 0 && (
                      <p className="text-[10px] text-muted-foreground mb-3 flex items-center gap-1.5">
                        {net >= 0 ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 shrink-0" style={{ color: themeColors.profit }} />
                            <span>Costs recovered{earned > invested ? `, ${fmt(earned - invested, account.currency)} profit` : ''}</span>
                          </>
                        ) : (
                          <>
                            <Target className="h-3 w-3 shrink-0 text-muted-foreground" />
                            <span>{fmt(Math.abs(net), account.currency)} more in payouts to break even</span>
                          </>
                        )}
                      </p>
                    )}

                    {/* Challenge progress bars */}
                    {challengeStatus && account.challengeRules && (
                      <div className="mb-3 space-y-2 rounded-lg border border-border/60 p-3 relative overflow-hidden">
                        <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(135deg, ${brandColor}04 0%, transparent 50%)` }} />
                        <div className="relative flex items-center justify-between mb-1">
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
                            <Shield className="h-3 w-3" />
                            Challenge Progress
                          </p>
                          {account.challengeProgress?.lastUpdated && (
                            <p className="text-[10px] text-muted-foreground">
                              {(() => {
                                const days = Math.floor((Date.now() - new Date(account.challengeProgress!.lastUpdated + 'T12:00:00').getTime()) / 86400000)
                                if (days === 0) return 'Updated today'
                                if (days === 1) return 'Updated yesterday'
                                return `Updated ${days}d ago`
                              })()}
                            </p>
                          )}
                        </div>

                        {/* Profit Target — hero metric */}
                        <div className="rounded-md p-2.5 -mx-0.5" style={{ backgroundColor: `${profitBarColor(challengeStatus.profitPct, themeColors)}08` }}>
                          <div className="flex items-center justify-between text-[10px] mb-1.5">
                            <span className="font-medium" style={{ color: profitBarColor(challengeStatus.profitPct, themeColors) }}>Profit Target</span>
                            <span className="font-semibold tabular-nums" style={{ color: profitBarColor(challengeStatus.profitPct, themeColors) }}>
                              {Math.max(0, Math.min(100, challengeStatus.profitPct)).toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-2.5 rounded-full bg-muted/60 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.max(0, Math.min(100, challengeStatus.profitPct))}%`,
                                backgroundColor: profitBarColor(challengeStatus.profitPct, themeColors),
                              }}
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1 tabular-nums">
                            {challengeStatus.profitGain >= 0 ? '+' : ''}{fmt(challengeStatus.profitGain, account.currency)} of {fmt(account.challengeRules.profitTarget, account.currency)}
                          </p>
                        </div>

                        {/* Total Drawdown */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-muted-foreground">Total Drawdown</span>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground tabular-nums">
                                {fmt(challengeStatus.totalDDDollars, account.currency)} / {fmt(challengeStatus.maxTotalDDDollars, account.currency)}
                              </span>
                              <span className="font-semibold tabular-nums min-w-[2.5rem] text-right" style={{ color: ddBarColor(challengeStatus.totalDDUsedPct, themeColors) }}>
                                {Math.min(100, challengeStatus.totalDDUsedPct).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min(100, challengeStatus.totalDDUsedPct)}%`,
                                backgroundColor: ddBarColor(challengeStatus.totalDDUsedPct, themeColors),
                              }}
                            />
                          </div>
                        </div>

                        {/* Daily Drawdown */}
                        {account.challengeRules.maxDailyDrawdown > 0 && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-muted-foreground">Daily Drawdown</span>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground tabular-nums">
                                  {fmt(challengeStatus.dailyDDDollars, account.currency)} / {fmt(challengeStatus.maxDailyDDDollars, account.currency)}
                                </span>
                                <span className="font-semibold tabular-nums min-w-[2.5rem] text-right" style={{ color: ddBarColor(challengeStatus.dailyDDUsedPct, themeColors) }}>
                                  {Math.min(100, challengeStatus.dailyDDUsedPct).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                            <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
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

                        {/* Trading Days */}
                        {challengeStatus.tradingDaysPct !== null && account.challengeRules.minTradingDays && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-muted-foreground">Trading Days</span>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground tabular-nums">
                                  {challengeStatus.tradingDaysCount} / {account.challengeRules.minTradingDays}
                                </span>
                                <span className="font-semibold tabular-nums min-w-[2.5rem] text-right" style={{ color: themeColors.primary }}>
                                  {Math.min(100, challengeStatus.tradingDaysPct).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                            <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
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
                    <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-border/60">
                      <div className="flex items-center gap-1.5">
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => openAddTx(account.id)}>
                          <Plus className="h-3 w-3" />
                          Transaction
                        </Button>
                        {account.challengeRules && (
                          <Button
                            size="sm"
                            className="h-7 text-xs gap-1 text-white"
                            style={{ backgroundColor: brandColor }}
                            onClick={() => openBalanceDialog(account)}
                          >
                            <RefreshCw className="h-3 w-3" />
                            Update Balance
                          </Button>
                        )}
                        {isPro ? (
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => openImportDialog(account.id)}>
                            <Upload className="h-3 w-3" />
                            Import
                          </Button>
                        ) : (
                          <Link to="/pricing">
                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10">
                              <Upload className="h-3 w-3" />
                              Import
                              <Lock className="h-2.5 w-2.5 ml-0.5" />
                            </Button>
                          </Link>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-auto">
                        {txs.length > 0 && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" onClick={() => toggleExpand(account.id)}>
                            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            {txs.length} transaction{txs.length !== 1 ? 's' : ''}
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Edit account" onClick={() => openEditAccount(account)}>
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" aria-label="Delete account" onClick={() => setDeleteDialog({ open: true, type: 'account', id: account.id })}>
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
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
                                  className="w-full flex items-center justify-between px-1.5 py-1 mt-1.5 rounded hover:bg-muted/40 transition-colors group"
                                >
                                  <div className="flex items-center gap-1">
                                    {monthOpen
                                      ? <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                      : <ChevronUp className="h-3 w-3 text-muted-foreground" />}
                                    <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{monthLabel}</span>
                                    <span className="text-[10px] text-muted-foreground">({monthTxs.length})</span>
                                  </div>
                                  <span className="text-[10px] font-semibold tabular-nums" style={{ color: monthNet >= 0 ? themeColors.profit : themeColors.loss }}>
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
                                          <div className="flex items-center gap-1.5">
                                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${txMeta.badgeClass}`}>
                                              {txMeta.label}
                                            </span>
                                            {tx.description && <span className="text-[10px] text-muted-foreground truncate">{tx.description}</span>}
                                          </div>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground shrink-0">
                                          {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                                        </span>
                                        <span className="text-xs font-semibold shrink-0 tabular-nums" style={{ color: expense ? themeColors.loss : themeColors.profit }}>
                                          {expense ? '-' : '+'}{fmt(tx.amount, account.currency)}
                                        </span>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-5 w-5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                                          aria-label="Delete transaction"
                                          onClick={() => setDeleteDialog({ open: true, type: 'tx', id: tx.id })}
                                        >
                                          <Trash2 className="h-3 w-3" aria-hidden="true" />
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
                              className="w-full text-[10px] text-muted-foreground hover:text-foreground py-1.5 mt-1 transition-colors text-center"
                            >
                              Show {hiddenCount} older {hiddenCount === 1 ? 'month' : 'months'}
                            </button>
                          )}
                          {showAll && months.length > 3 && (
                            <button
                              onClick={() => setShowAllMonths(prev => { const n = new Set(prev); n.delete(account.id); return n })}
                              className="w-full text-[10px] text-muted-foreground hover:text-foreground py-1.5 mt-1 transition-colors text-center"
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
        )}
      </div>

      <AppFooter />

      {/* ── Add / Edit Account Dialog ── */}
      <Dialog open={accountDialog.open} onOpenChange={open => setAccountDialog(p => ({ ...p, open }))}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          {/* Branded header */}
          {(() => {
            const selectedFirm = accountForm.firmName && accountForm.firmName !== 'Custom...' ? accountForm.firmName : null
            const brandCol = selectedFirm ? (FIRM_BRAND_COLORS[selectedFirm] ?? themeColors.primary) : themeColors.primary
            const logo = selectedFirm ? FIRM_LOGOS[selectedFirm] : null
            return (
              <div className="relative px-6 pt-5 pb-4 border-b border-border/60 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(135deg, ${brandCol}12 0%, transparent 50%)` }} />
                <div className="relative flex items-center gap-3">
                  {logo ? (
                    <div className="h-10 w-10 rounded-lg shadow-sm overflow-hidden"><img src={logo} alt="" className="w-full h-full object-cover" /></div>
                  ) : (
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center shadow-sm" style={{ backgroundColor: `${brandCol}20` }}>
                      <Building2 className="h-5 w-5" style={{ color: brandCol }} />
                    </div>
                  )}
                  <div>
                    <DialogHeader className="p-0 space-y-0.5">
                      <DialogTitle className="text-lg">{accountDialog.editing ? 'Edit Account' : 'New Account'}</DialogTitle>
                      <DialogDescription className="text-xs">
                        {selectedFirm ? selectedFirm : 'Select a prop firm to get started'}
                      </DialogDescription>
                    </DialogHeader>
                  </div>
                </div>
              </div>
            )
          })()}

          <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Firm selector with logos */}
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-medium text-muted-foreground" id="label-firm">Prop Firm</label>
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
                  }
                  return next
                })
              }}>
                <SelectTrigger aria-labelledby="label-firm"><SelectValue placeholder="Select firm" /></SelectTrigger>
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
                <Input aria-label="Custom firm name" placeholder="Enter firm name" value={accountForm.customFirm} onChange={e => setAccountForm(p => ({ ...p, customFirm: e.target.value }))} />
              )}
            </div>

            {/* Account size chips + currency */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Account Size</label>
                <Select value={accountForm.currency} onValueChange={v => setAccountForm(p => ({ ...p, currency: v as PropCurrency }))}>
                  <SelectTrigger aria-label="Currency" className="w-auto h-6 text-[10px] px-2 border-0 bg-muted/50 rounded-full gap-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ACCOUNT_SIZES.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setAccountForm(p => ({ ...p, accountSizeStr: String(s) }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      accountForm.accountSizeStr === String(s)
                        ? 'text-white shadow-sm'
                        : 'border-border/60 text-muted-foreground hover:border-foreground/30 hover:text-foreground bg-transparent'
                    }`}
                    style={accountForm.accountSizeStr === String(s) ? { backgroundColor: themeColors.primary, borderColor: themeColors.primary } : {}}
                  >
                    {currencySymbol(accountForm.currency)}{(s / 1000)}k
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAccountForm(p => ({ ...p, accountSizeStr: 'custom' }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    accountForm.accountSizeStr === 'custom'
                      ? 'text-white shadow-sm'
                      : 'border-border/60 text-muted-foreground hover:border-foreground/30 hover:text-foreground bg-transparent'
                  }`}
                  style={accountForm.accountSizeStr === 'custom' ? { backgroundColor: themeColors.primary, borderColor: themeColors.primary } : {}}
                >
                  Custom
                </button>
              </div>
              {accountForm.accountSizeStr === 'custom' && (
                <Input type="number" inputMode="decimal" aria-label="Custom account size" placeholder="e.g. 150000" value={accountForm.customSizeStr} onChange={e => setAccountForm(p => ({ ...p, customSizeStr: e.target.value }))} />
              )}
            </div>

            {/* Type + Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-medium text-muted-foreground" id="label-actype">Account Type</label>
                <Select value={accountForm.accountType} onValueChange={v => setAccountForm(p => ({ ...p, accountType: v as PropAccountType }))}>
                  <SelectTrigger aria-labelledby="label-actype"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPE_OPTIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-medium text-muted-foreground" id="label-status">Status</label>
                <Select value={accountForm.status} onValueChange={v => setAccountForm(p => ({ ...p, status: v as PropAccountStatus }))}>
                  <SelectTrigger aria-labelledby="label-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Start Date</label>
                <DatePicker
                  date={accountForm.startDate ? new Date(accountForm.startDate + 'T12:00:00') : undefined}
                  onDateChange={d => setAccountForm(p => ({ ...p, startDate: d ? d.toISOString().split('T')[0] : '' }))}
                  placeholder="Pick a date"
                  className="w-full"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-medium text-muted-foreground">End Date <span className="normal-case">(opt.)</span></label>
                <DatePicker
                  date={accountForm.endDate ? new Date(accountForm.endDate + 'T12:00:00') : undefined}
                  onDateChange={d => setAccountForm(p => ({ ...p, endDate: d ? d.toISOString().split('T')[0] : '' }))}
                  placeholder="Pick a date"
                  className="w-full"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-medium text-muted-foreground" htmlFor="account-notes">Notes <span className="normal-case">(optional)</span></label>
              <Textarea id="account-notes" placeholder="Phase 1 passed, waiting on funded account..." value={accountForm.notes} onChange={e => setAccountForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="resize-none" />
            </div>

            {/* Challenge Rules */}
            <div className="border-t border-border/60 pt-3 space-y-3">
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
                      }))
                      return
                    }
                  }
                  setAccountForm(p => ({ ...p, rulesEnabled: enabling }))
                }}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Challenge Rules</span>
                  {!accountForm.rulesEnabled && <span className="text-[10px] text-muted-foreground normal-case">(optional)</span>}
                </div>
                {accountForm.rulesEnabled
                  ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                  : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>

              {accountForm.rulesEnabled && (
                <div className="space-y-3 rounded-lg border border-border/40 p-3 bg-muted/20">
                  {accountForm.firmName && FIRM_RULE_PRESETS[accountForm.firmName] && (
                    <p className="text-[10px] text-muted-foreground">Pre-filled from {accountForm.firmName} defaults. Adjust to match your challenge.</p>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider font-medium text-muted-foreground" htmlFor="rule-profit-target">
                      Profit Target ({currencySymbol(accountForm.currency)})
                    </label>
                    <Input id="rule-profit-target" type="number" inputMode="decimal" min="0" step="0.01" placeholder="e.g. 10000" value={accountForm.profitTarget} onChange={e => setAccountForm(p => ({ ...p, profitTarget: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs uppercase tracking-wider font-medium text-muted-foreground" htmlFor="rule-daily-dd">Max Daily DD (%)</label>
                      <Input id="rule-daily-dd" type="number" inputMode="decimal" min="0" step="0.1" placeholder="e.g. 5" value={accountForm.maxDailyDrawdown} onChange={e => setAccountForm(p => ({ ...p, maxDailyDrawdown: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs uppercase tracking-wider font-medium text-muted-foreground" htmlFor="rule-total-dd">Max Total DD (%)</label>
                      <Input id="rule-total-dd" type="number" inputMode="decimal" min="0" step="0.1" placeholder="e.g. 10" value={accountForm.maxTotalDrawdown} onChange={e => setAccountForm(p => ({ ...p, maxTotalDrawdown: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider font-medium text-muted-foreground" htmlFor="rule-min-days">Min Trading Days <span className="normal-case">(optional)</span></label>
                    <Input id="rule-min-days" type="number" inputMode="numeric" min="0" step="1" placeholder="e.g. 4" value={accountForm.minTradingDays} onChange={e => setAccountForm(p => ({ ...p, minTradingDays: e.target.value }))} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-border/60 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAccountDialog({ open: false, editing: null })}>Cancel</Button>
            <Button onClick={handleSaveAccount} style={{ backgroundColor: themeColors.primary }}>
              {accountDialog.editing ? 'Save Changes' : 'Add Account'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Add Transaction Dialog ── */}
      {(() => {
        const txAccount = accounts.find(a => a.id === txDialog.accountId)
        const txBrandColor = txAccount ? firmAvatarColor(txAccount.firmName) : themeColors.primary
        const txLogo = txAccount ? FIRM_LOGOS[txAccount.firmName] : null
        const txCurrSym = currencySymbol(txAccount?.currency)
        return (
          <Dialog open={txDialog.open} onOpenChange={open => setTxDialog(p => ({ ...p, open }))}>
            <DialogContent className="max-w-sm p-0 overflow-hidden">
              {/* Branded header */}
              <div className="relative px-5 pt-4 pb-3 border-b border-border/60 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(135deg, ${txBrandColor}12 0%, transparent 50%)` }} />
                <div className="relative flex items-center gap-2.5">
                  {txLogo ? (
                    <div className="h-8 w-8 rounded-lg shadow-sm overflow-hidden"><img src={txLogo} alt="" className="w-full h-full object-cover" /></div>
                  ) : txAccount ? (
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: txBrandColor }}>{firmInitials(txAccount.firmName)}</div>
                  ) : null}
                  <DialogHeader className="p-0 space-y-0">
                    <DialogTitle className="text-base">Add Transaction</DialogTitle>
                    <DialogDescription className="text-xs">
                      {txAccount?.firmName ?? 'Record a fee or payout'}
                    </DialogDescription>
                  </DialogHeader>
                </div>
              </div>

              <div className="px-5 py-4 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider font-medium text-muted-foreground" id="label-txtype">Type</label>
                  <Select value={txForm.type} onValueChange={v => setTxForm(p => ({ ...p, type: v as TransactionType }))}>
                    <SelectTrigger aria-labelledby="label-txtype"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TX_TYPE_OPTIONS.map(t => (
                        <SelectItem key={t.value} value={t.value}>
                          <span className="flex items-center gap-2">
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${t.isExpense ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                              {t.isExpense ? 'OUT' : 'IN'}
                            </span>
                            {t.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider font-medium text-muted-foreground" htmlFor="tx-amount">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" aria-hidden="true">{txCurrSym}</span>
                    <Input id="tx-amount" type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00" className="pl-7" value={txForm.amount} onChange={e => setTxForm(p => ({ ...p, amount: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider font-medium text-muted-foreground" htmlFor="tx-description">Description <span className="normal-case">(optional)</span></label>
                  <Input id="tx-description" placeholder="Phase 1 reset after drawdown..." value={txForm.description} onChange={e => setTxForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Date</label>
                  <DatePicker
                    date={txForm.date ? new Date(txForm.date + 'T12:00:00') : undefined}
                    onDateChange={d => setTxForm(p => ({ ...p, date: d ? d.toISOString().split('T')[0] : '' }))}
                    placeholder="Pick a date"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="px-5 py-3 border-t border-border/60 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setTxDialog({ open: false, accountId: '' })}>Cancel</Button>
                <Button onClick={handleSaveTx} style={{ backgroundColor: txBrandColor }} className="text-white">Add Transaction</Button>
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
                className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition-colors ${importDialog.dragOver ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/50 hover:bg-muted/20'}`}
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
                    <Upload className={`h-8 w-8 ${importDialog.dragOver ? 'text-primary' : 'text-muted-foreground'}`} style={importDialog.dragOver ? { color: themeColors.primary } : {}} />
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
                        {new Date(tx.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
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
      {/* ── Quick Balance Check-In Dialog ── */}
      <Dialog open={checkinDialog.open} onOpenChange={open => !open && setCheckinDialog(p => ({ ...p, open: false }))}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>End of Day Check-In</DialogTitle>
            <DialogDescription>
              Update all your active challenge balances at once.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {checkinDialog.entries.map((entry, i) => {
              const account = accounts.find(a => a.id === entry.accountId)
              if (!account) return null
              const brandColor = firmAvatarColor(account.firmName)
              return (
                <div key={entry.accountId} className="rounded-lg border border-border/60 p-3 space-y-2.5">
                  <div className="flex items-center gap-2">
                    {FIRM_LOGOS[account.firmName] ? (
                      <div className="h-6 w-6 rounded shrink-0 overflow-hidden"><img src={FIRM_LOGOS[account.firmName]} alt={account.firmName} className="w-full h-full object-cover" /></div>
                    ) : (
                      <div
                        className="h-6 w-6 rounded flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                        style={{ backgroundColor: brandColor }}
                      >
                        {firmInitials(account.firmName)}
                      </div>
                    )}
                    <span className="text-sm font-medium truncate">{account.firmName}</span>
                    <span className="text-xs text-muted-foreground">{currencySymbol(account.currency)}{account.accountSize.toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Balance</label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        placeholder="0.00"
                        className="h-8 text-xs"
                        value={entry.balance}
                        onChange={e => setCheckinDialog(p => ({
                          ...p,
                          entries: p.entries.map((en, j) => j === i ? { ...en, balance: e.target.value } : en),
                        }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Today P&L</label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        placeholder="0.00"
                        className="h-8 text-xs"
                        value={entry.todayPnL}
                        onChange={e => setCheckinDialog(p => ({
                          ...p,
                          entries: p.entries.map((en, j) => j === i ? { ...en, todayPnL: e.target.value } : en),
                        }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Trading Days</label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        step="1"
                        placeholder="0"
                        className="h-8 text-xs"
                        value={entry.tradingDays}
                        onChange={e => setCheckinDialog(p => ({
                          ...p,
                          entries: p.entries.map((en, j) => j === i ? { ...en, tradingDays: e.target.value } : en),
                        }))}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckinDialog(p => ({ ...p, open: false }))}>Cancel</Button>
            <Button onClick={handleSaveCheckin} style={{ backgroundColor: themeColors.primary }}>
              Update All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Balance Update Dialog ── */}
      <Dialog open={balanceDialog.open} onOpenChange={open => !open && setBalanceDialog(p => ({ ...p, open: false }))}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Balance</DialogTitle>
            <DialogDescription>
              Enter your current account balance from your prop firm dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-medium text-muted-foreground" htmlFor="bal-current">Current Balance</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" aria-hidden="true">
                  {currencySymbol(accounts.find(a => a.id === balanceDialog.accountId)?.currency)}
                </span>
                <Input id="bal-current" type="number" inputMode="decimal" step="0.01" placeholder="0.00" className="pl-7" value={balanceDialog.balance} onChange={e => setBalanceDialog(p => ({ ...p, balance: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-medium text-muted-foreground" htmlFor="bal-today-pnl">Today's P&L <span className="normal-case">(optional, can be negative)</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" aria-hidden="true">
                  {currencySymbol(accounts.find(a => a.id === balanceDialog.accountId)?.currency)}
                </span>
                <Input id="bal-today-pnl" type="number" inputMode="decimal" step="0.01" placeholder="0.00" className="pl-7" value={balanceDialog.todayPnL} onChange={e => setBalanceDialog(p => ({ ...p, todayPnL: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-medium text-muted-foreground" htmlFor="bal-trading-days">Trading Days So Far</label>
              <Input id="bal-trading-days" type="number" inputMode="numeric" min="0" step="1" placeholder="0" value={balanceDialog.tradingDays} onChange={e => setBalanceDialog(p => ({ ...p, tradingDays: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBalanceDialog(p => ({ ...p, open: false }))}>Cancel</Button>
            <Button onClick={handleSaveBalance} style={{ backgroundColor: themeColors.primary }}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
