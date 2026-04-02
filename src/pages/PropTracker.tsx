import React, { useState, useMemo, useCallback, useEffect } from 'react'
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
import { Separator } from '@/components/ui/separator'
import { SiteHeader } from '@/components/site-header'
import { AppFooter } from '@/components/app-footer'
import { useUserStorage } from '@/utils/user-storage'
import { useThemePresets } from '@/contexts/theme-presets'
import { useProStatus } from '@/contexts/pro-context'
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
  TransactionType,
} from '@/types/prop-tracker'

// ─── Constants ───────────────────────────────────────────────────────────────

const PROP_FIRMS = [
  'TopStep',
  'Apex Trader Funding',
  'My Funded Futures (MFFU)',
  'Bulenox',
  'FTMO',
  'The5ers',
  'E8 Funding',
  'Earn2Trade',
  'Leeloo Trading',
  'FundedNext',
  'True Forex Funds',
  'Funded Trading Plus',
  'Tradeday',
  'Custom...',
] as const

const FREE_ACCOUNT_LIMIT = 2

const ACCOUNT_SIZES = [10000, 25000, 50000, 75000, 100000, 150000, 200000, 300000]

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

const HOW_IT_WORKS = [
  {
    icon: Building2,
    title: 'Add your accounts',
    desc: 'One entry per prop firm challenge or funded account. Include the firm, account size, type, and current status.',
  },
  {
    icon: Receipt,
    title: 'Log every transaction',
    desc: 'Record evaluation fees, monthly subscriptions, resets, and every payout you receive from the firm.',
  },
  {
    icon: TrendingUp,
    title: 'See your true P&L',
    desc: 'PropTracker calculates your net across all firms — so you know whether prop trading is actually profitable for you.',
  },
]

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
]

const FIRM_BRAND_COLORS: Record<string, string> = {
  'TopStep':                    '#FFCC06',
  'Apex Trader Funding':        '#007BFF',
  'My Funded Futures (MFFU)':   '#D8AE5E',
  'Bulenox':                    '#3498DB',
  'FTMO':                       '#0781FE',
  'The5ers':                    '#FFD000',
  'E8 Funding':                 '#30D5F1',
  'Earn2Trade':                 '#FF6700',
  'Leeloo Trading':             '#DC342E',
  'FundedNext':                 '#635BFF',
  'True Forex Funds':           '#4169E1',
  'Funded Trading Plus':        '#4169E1',
  'Tradeday':                   '#4D65FF',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
    accountType: 'evaluation' as PropAccountType,
    status: 'active' as PropAccountStatus,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    notes: '',
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PropTracker() {
  const storage = useUserStorage()
  const { themeColors } = useThemePresets()
  const { isPro } = useProStatus()

  // ── Data ──
  const [accounts, setAccounts] = useState<PropFirmAccount[]>([])
  const [transactions, setTransactions] = useState<PropFirmTransaction[]>([])
  const [tipDismissed, setTipDismissed] = useState(false)

  useEffect(() => {
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

  async function runAiAnalysis() {
    if (accounts.length === 0) { toast.error('Add some accounts first'); return }
    setAiLoading(true)
    setAiAnalysis(null)
    try {
      const res = await requestPropAnalysis(accounts, transactions)
      setAiAnalysis(res.result)
      setAiUsage(res.usage)
    } catch (err: any) {
      const msg = err?.message || err?.details || 'AI analysis failed'
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
      if (skipped > 0) toast.info(`${skipped} duplicate${skipped !== 1 ? 's' : ''} found — pre-unchecked`)
      setImportDialog(p => ({ ...p, loading: false, step: 'preview', parsed: deduped }))
    } catch (err: any) {
      toast.error(err?.message || 'Failed to parse screenshot')
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
    setAccountForm({
      firmName: isCustomFirm ? 'Custom...' : account.firmName,
      customFirm: isCustomFirm ? account.firmName : '',
      accountSizeStr: isCustomSize ? 'custom' : String(account.accountSize),
      customSizeStr: isCustomSize ? String(account.accountSize) : '',
      accountType: account.accountType,
      status: account.status,
      startDate: account.startDate,
      endDate: account.endDate ?? '',
      notes: account.notes ?? '',
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

    if (accountDialog.editing) {
      saveAccounts(accounts.map(a =>
        a.id === accountDialog.editing!.id
          ? { ...a, firmName, accountSize, accountType: accountForm.accountType, status: accountForm.status, startDate: accountForm.startDate, endDate: accountForm.endDate || undefined, notes: accountForm.notes || undefined }
          : a
      ))
      toast.success('Account updated')
    } else {
      saveAccounts([...accounts, {
        id: crypto.randomUUID(),
        firmName,
        accountSize,
        accountType: accountForm.accountType,
        status: accountForm.status,
        startDate: accountForm.startDate,
        endDate: accountForm.endDate || undefined,
        notes: accountForm.notes || undefined,
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

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      {/* Page header */}
      <div className="border-b">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-center sm:text-left">
            <div>
              <h1 className="font-display text-2xl font-bold" style={{ color: themeColors.primary }}>
                PropTracker
              </h1>
              {subtitleParts ? (
                <p className="text-sm text-muted-foreground mt-1">
                  {subtitleParts.base}
                  {subtitleParts.net && (
                    <> · <span className="font-medium" style={{ color: subtitleParts.netColor }}>{subtitleParts.net}</span></>
                  )}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">Track fees, resets, and payouts across your prop firms</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0 sm:self-start">
              {!isPro && accounts.length >= FREE_ACCOUNT_LIMIT ? (
                <Link to="/pricing">
                  <Button style={{ backgroundColor: themeColors.primary }}>
                    <Lock className="h-4 w-4 mr-1.5" aria-hidden="true" />
                    Upgrade for More
                  </Button>
                </Link>
              ) : (
                <Button onClick={openAddAccount} style={{ backgroundColor: themeColors.primary }}>
                  <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
                  Add Account
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">

        {/* Dismissible how-it-works — plain text, no step circles */}
        {accounts.length > 0 && !tipDismissed && (
          <div className="flex items-start gap-3 rounded-lg border border-border/60 px-4 py-3.5 text-sm">
            <Info className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
            <div className="flex-1 space-y-1">
              <p className="font-medium text-foreground text-sm">How to use PropTracker</p>
              <p className="text-muted-foreground leading-relaxed text-xs">
                Add one entry per account — each evaluation challenge, funded seat, or instant funding account gets its own card. Log every expense against it: evaluation fees, monthly subscriptions, resets. Log every income: profit splits and payouts. PropTracker calculates your true net P&L and ROI across all firms — the number most prop traders never actually work out.
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
            <Card key={card.label}>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <card.icon className="h-3 w-3" />
                  {card.label}
                </p>
                <p className="text-2xl font-bold tabular-nums" style={{ color: card.valueColor }}>
                  {card.value}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{card.subtitle}</p>
              </CardContent>
            </Card>
          ))}
        </div>

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
                // Parse sections from markdown-style response
                const sections = [
                  { key: 'verdict',  heading: 'Overall Verdict',  icon: CheckCircle2,   color: themeColors.profit },
                  { key: 'roi',      heading: 'ROI Breakdown',    icon: BarChart2,      color: themeColors.primary },
                  { key: 'firms',    heading: 'Firm-by-Firm',     icon: Building2,      color: themeColors.primary },
                  { key: 'warnings', heading: 'Warning Signs',    icon: AlertTriangle,  color: themeColors.loss },
                  { key: 'next',     heading: 'What to Do Next',  icon: ListChecks,     color: themeColors.profit },
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
                    {sections.map(s => {
                      const content = parsed[s.key]
                      if (!content) return null
                      const Icon = s.icon
                      // Format bullet points
                      const lines = content.split('\n').filter(Boolean)
                      return (
                        <div key={s.key} className="px-5 py-4 space-y-2">
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: s.color }} aria-hidden="true" />
                            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: s.color }}>{s.heading}</p>
                          </div>
                          <div className="space-y-1.5 text-sm text-foreground leading-relaxed">
                            {lines.map((line, i) => {
                              // Bold firm names (**text**)
                              const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              const isBullet = line.startsWith('-') || /^\d+\./.test(line)
                              return (
                                <p
                                  key={i}
                                  className={isBullet ? 'pl-3 border-l-2 border-border/60' : ''}
                                  dangerouslySetInnerHTML={{ __html: formatted.replace(/^[-•]\s*/, '') }}
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
          <div className="rounded-xl border border-border/60 overflow-hidden">
            {/* Hero CTA — clean, no overlap */}
            <div className="flex flex-col items-center text-center gap-5 px-6 pt-12 pb-8" style={{ background: `radial-gradient(ellipse at 50% 0%, ${themeColors.primary}18 0%, transparent 70%)` }}>
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
                  { icon: BarChart2,  label: 'Firm Breakdown' },
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

              {!isPro && <p className="text-xs text-muted-foreground -mt-1">Free to start · 2 accounts on free plan</p>}
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
                    <Card key={c.label}>
                      <CardContent className="p-5">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <c.icon className="h-3 w-3" aria-hidden="true" />{c.label}
                        </p>
                        <p className="text-2xl font-bold tabular-nums" style={{ color: c.color }}>{c.value}</p>
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
                    <Card key={g.firm}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="h-9 w-9 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: g.color }}>{g.initials}</div>
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

              return (
                <Card key={account.id}>
                  <CardContent className="p-4">

                    {/* Account header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="h-9 w-9 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5"
                        style={{ backgroundColor: brandColor }}
                      >
                        {firmInitials(account.firmName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-sm leading-tight truncate">{account.firmName}</p>
                          <Badge variant="outline" className={`text-[10px] h-5 px-1.5 shrink-0 ${meta.badgeClass}`}>
                            {meta.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          ${account.accountSize.toLocaleString()} · {typeMeta.label} · Since {new Date(account.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {/* Stats — 3 col text, no boxes */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[
                        { label: 'Invested', value: invested > 0 ? fmt(invested) : '—', color: invested > 0 ? themeColors.loss : undefined },
                        { label: 'Earned',   value: earned > 0  ? fmt(earned)   : '—', color: earned > 0  ? themeColors.profit : undefined },
                        { label: 'P&L',      value: txs.length > 0 ? (net >= 0 ? '+' : '-') + fmt(net) : '—', color: txs.length > 0 ? (net >= 0 ? themeColors.profit : themeColors.loss) : undefined },
                      ].map(s => (
                        <div key={s.label}>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                          <p className="text-sm font-semibold tabular-nums mt-0.5" style={{ color: s.color ?? 'var(--muted-foreground)' }}>{s.value}</p>
                        </div>
                      ))}
                    </div>

                    {account.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-3">{account.notes}</p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 pt-3 border-t border-border/60">
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => openAddTx(account.id)}>
                        <Plus className="h-3 w-3" />
                        Add
                      </Button>
                      {isPro && (
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => openImportDialog(account.id)}>
                          <Upload className="h-3 w-3" />
                          Import
                        </Button>
                      )}
                      <div className="flex-1" />
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
                                    {monthNet >= 0 ? '+' : '-'}{fmt(Math.abs(monthNet))}
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
                                          {expense ? '-' : '+'}{fmt(tx.amount)}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{accountDialog.editing ? 'Edit Account' : 'Add Prop Firm Account'}</DialogTitle>
            <DialogDescription>
              {accountDialog.editing ? 'Update the details for this account.' : 'Track a new prop firm challenge or funded account.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-medium text-muted-foreground" id="label-firm">Prop Firm</label>
              <Select value={accountForm.firmName} onValueChange={v => setAccountForm(p => ({ ...p, firmName: v }))}>
                <SelectTrigger aria-labelledby="label-firm"><SelectValue placeholder="Select firm" /></SelectTrigger>
                <SelectContent>
                  {PROP_FIRMS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
              {accountForm.firmName === 'Custom...' && (
                <Input aria-label="Custom firm name" placeholder="Enter firm name…" value={accountForm.customFirm} onChange={e => setAccountForm(p => ({ ...p, customFirm: e.target.value }))} />
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-medium text-muted-foreground" id="label-size">Account Size</label>
              <Select value={accountForm.accountSizeStr} onValueChange={v => setAccountForm(p => ({ ...p, accountSizeStr: v }))}>
                <SelectTrigger aria-labelledby="label-size"><SelectValue placeholder="Select size" /></SelectTrigger>
                <SelectContent>
                  {ACCOUNT_SIZES.map(s => <SelectItem key={s} value={String(s)}>${s.toLocaleString()}</SelectItem>)}
                  <SelectItem value="custom">Custom…</SelectItem>
                </SelectContent>
              </Select>
              {accountForm.accountSizeStr === 'custom' && (
                <Input type="number" inputMode="decimal" aria-label="Custom account size" placeholder="e.g. 150000…" value={accountForm.customSizeStr} onChange={e => setAccountForm(p => ({ ...p, customSizeStr: e.target.value }))} />
              )}
            </div>
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
                <label className="text-xs uppercase tracking-wider font-medium text-muted-foreground">End Date <span className="normal-case">(optional)</span></label>
                <DatePicker
                  date={accountForm.endDate ? new Date(accountForm.endDate + 'T12:00:00') : undefined}
                  onDateChange={d => setAccountForm(p => ({ ...p, endDate: d ? d.toISOString().split('T')[0] : '' }))}
                  placeholder="Pick a date"
                  className="w-full"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-medium text-muted-foreground" htmlFor="account-notes">Notes <span className="normal-case">(optional)</span></label>
              <Textarea id="account-notes" placeholder="E.g. passed phase 1, waiting on funded account…" value={accountForm.notes} onChange={e => setAccountForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccountDialog({ open: false, editing: null })}>Cancel</Button>
            <Button onClick={handleSaveAccount} style={{ backgroundColor: themeColors.primary }}>
              {accountDialog.editing ? 'Save Changes' : 'Add Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Transaction Dialog ── */}
      <Dialog open={txDialog.open} onOpenChange={open => setTxDialog(p => ({ ...p, open }))}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
            <DialogDescription>
              {txDialog.accountId
                ? `Recording for ${accounts.find(a => a.id === txDialog.accountId)?.firmName ?? 'this account'}.`
                : 'Record a fee or payout for this account.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
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
              <label className="text-xs uppercase tracking-wider font-medium text-muted-foreground" htmlFor="tx-amount">Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" aria-hidden="true">$</span>
                <Input id="tx-amount" type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00…" className="pl-7" value={txForm.amount} onChange={e => setTxForm(p => ({ ...p, amount: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-medium text-muted-foreground" htmlFor="tx-description">Description <span className="normal-case">(optional)</span></label>
              <Input id="tx-description" placeholder="e.g. Phase 1 reset after drawdown…" value={txForm.description} onChange={e => setTxForm(p => ({ ...p, description: e.target.value }))} />
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setTxDialog({ open: false, accountId: '' })}>Cancel</Button>
            <Button onClick={handleSaveTx} style={{ backgroundColor: themeColors.primary }}>Add Transaction</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              Upload a screenshot of your prop firm billing or payout page — we'll extract the transactions automatically.
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
                {importDialog.parsed.filter(t => t.keep).length} transaction{importDialog.parsed.filter(t => t.keep).length !== 1 ? 's' : ''} found — uncheck any you don't want to import.
              </p>

              <div className="max-h-72 overflow-y-auto rounded-lg border border-border/60 divide-y divide-border/40">
                {importDialog.parsed.map((tx, i) => {
                  const expense = tx.type !== 'payout'
                  return (
                    <div key={tx.id} className={`flex items-center gap-3 px-3 py-2.5 transition-opacity ${tx.keep ? '' : 'opacity-40'}`}>
                      <input
                        type="checkbox"
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
    </div>
  )
}
