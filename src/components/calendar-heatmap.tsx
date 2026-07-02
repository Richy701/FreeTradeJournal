import { useMemo, useState, useEffect } from "react"
import { toast } from "sonner"
import { calculateGrossPnl } from "@/lib/pnl"
import { useThemePresets } from '@/contexts/theme-presets'
import { useAccounts } from '@/contexts/account-context'
import { useDemoData } from '@/hooks/use-demo-data'
import { useDemoGuard } from '@/hooks/use-demo-guard'
import { useUserStorage } from '@/utils/user-storage'
import { MARKET_INSTRUMENTS, type MarketType } from '@/constants/trading'
import { PropFirmSelect } from '@/components/prop-firm-select'
import { CalendarDots, CaretLeft, CaretRight, BookOpen } from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Link } from "react-router-dom"
import { Plus, CurrencyDollar, ChartBar, PencilSimple, Crosshair, ArrowsLeftRight, Lightbulb, Tag, Heart, Note } from '@phosphor-icons/react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"

// Define interfaces
interface Trade {
  id: string
  symbol: string
  side: 'long' | 'short'
  entryPrice: number
  exitPrice: number
  lotSize: number
  entryTime: Date
  exitTime: Date
  spread: number
  commission: number
  swap: number
  pnl: number
  pnlPercentage: number
  riskReward?: number
  notes?: string
  strategy?: string
  tags?: string[]
  screenshots?: string[]
  market?: 'forex' | 'futures' | 'indices'
}

interface DayData {
  date: Date
  pnl: number
  trades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  avgWin: number
  avgLoss: number
  rr: number
  isCurrentMonth: boolean
  tradeDetails: Trade[]
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Safe YYYY-MM-DD key from any stored date value. Returns null for unparseable
// dates so a bad journal/trade record can't throw on .toISOString() and blank
// the dashboard.
function safeDateKey(value: unknown): string | null {
  const d = new Date(value as any)
  return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0]
}

export function CalendarHeatmap() {
  // Get theme colors
  const { themeColors, alpha } = useThemePresets()
  const { activeAccount } = useAccounts()
  const { getTrades, getJournalEntries, isDemo } = useDemoData()
  const demoGuard = useDemoGuard()
  const userStorage = useUserStorage()
  
  // State for current viewing month/year
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [isAnimating, setIsAnimating] = useState(false)
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false)
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear())
  const [isTradeDialogOpen, setIsTradeDialogOpen] = useState(false)
  const [selectedDateForTrade, setSelectedDateForTrade] = useState<Date | null>(null)
  const [journalNote, setJournalNote] = useState("")
  const [journalTitle, setJournalTitle] = useState("")
  const [journalMood, setJournalMood] = useState<'bullish' | 'bearish' | 'neutral'>('neutral')
  const [journalTags, setJournalTags] = useState("")
  const [selectedTradeId, setSelectedTradeId] = useState("none")
  const [selectedDateEntries, setSelectedDateEntries] = useState<any[]>([])
  const [tradeForm, setTradeForm] = useState({
    symbol: "",
    side: "long" as "long" | "short",
    market: "forex" as "forex" | "futures" | "indices",
    entryPrice: "",
    exitPrice: "",
    lotSize: "",
    pnl: "",
    strategy: "",
    notes: "",
    propFirm: ""
  })


  const getInstrumentsByMarket = (market: MarketType) => {
    return MARKET_INSTRUMENTS[market] || [];
  }

  // Get trades from localStorage or demo data
  const trades = useMemo(() => {
    if (isDemo) {
      // Use demo data
      const demoTrades = getTrades()
      return demoTrades.map((trade: any) => ({
        ...trade,
        entryTime: trade.entryTime instanceof Date ? trade.entryTime : new Date(trade.entryTime),
        exitTime: trade.exitTime instanceof Date ? trade.exitTime : new Date(trade.exitTime),
        accountId: activeAccount?.id || 'demo-account'
      }))
    }
    
    // Use localStorage data for real users
    const storedTrades = userStorage.getItem('trades')
    if (!storedTrades || !activeAccount) return []
    
    try {
      const parsedTrades = JSON.parse(storedTrades)
      return parsedTrades
        .filter((trade: any) => trade.accountId === activeAccount.id || (!trade.accountId && activeAccount.id.includes('default')))
        .map((trade: any) => ({
          ...trade,
          entryTime: new Date(trade.entryTime),
          exitTime: new Date(trade.exitTime)
        }))
    } catch {
      return []
    }
  }, [activeAccount, isDemo, getTrades])

  // Get journal entries from demo data or localStorage
  const journalEntries = useMemo(() => {
    let entries = []
    
    if (isDemo) {
      entries = getJournalEntries()
    } else {
      const savedEntries = userStorage.getItem('journalEntries')
      if (!savedEntries) return {} as Record<string, any[]>
      
      try {
        entries = JSON.parse(savedEntries)
      } catch {
        return {} as Record<string, any[]>
      }
    }
    
    const journalByDate: Record<string, any[]> = {}
    entries.forEach((entry: any) => {
      const dateKey = safeDateKey(entry.date)
      if (!dateKey) return
      if (!journalByDate[dateKey]) {
        journalByDate[dateKey] = []
      }
      journalByDate[dateKey].push(entry)
    })
    
    return journalByDate
  }, [isDemo, getJournalEntries, isTradeDialogOpen])

  // Navigation functions with animation
  const navigateWithAnimation = (callback: () => void) => {
    setIsAnimating(true)
    setTimeout(() => {
      callback()
      setTimeout(() => setIsAnimating(false), 100)
    }, 150)
  }

  const goToPreviousMonth = () => {
    navigateWithAnimation(() => {
      setCurrentDate(prev => {
        const newDate = new Date(prev)
        newDate.setMonth(newDate.getMonth() - 1)
        setSelectedMonth(newDate.getMonth())
        setSelectedYear(newDate.getFullYear())
        return newDate
      })
    })
  }

  const goToNextMonth = () => {
    navigateWithAnimation(() => {
      setCurrentDate(prev => {
        const newDate = new Date(prev)
        newDate.setMonth(newDate.getMonth() + 1)
        setSelectedMonth(newDate.getMonth())
        setSelectedYear(newDate.getFullYear())
        return newDate
      })
    })
  }

  const goToToday = () => {
    navigateWithAnimation(() => {
      const today = new Date()
      setCurrentDate(today)
      setSelectedMonth(today.getMonth())
      setSelectedYear(today.getFullYear())
    })
  }

  const jumpToMonth = (month: number, year: number) => {
    navigateWithAnimation(() => {
      const newDate = new Date(year, month, 1)
      setCurrentDate(newDate)
      setSelectedMonth(month)
      setSelectedYear(year)
    })
  }

  const handleDateClick = (date: Date) => {
    setSelectedDateForTrade(date)
    
    // Load existing journal entries for this date
    const entries = getJournalEntries()
    const dateKey = date.toISOString().split('T')[0]
    const dayEntries = entries.filter((entry: any) => {
      const entryDate = safeDateKey(entry.date)
      return entryDate !== null && entryDate === dateKey
    })
    setSelectedDateEntries(dayEntries)
    
    // Reset form for new journal entry (always start fresh)
    setJournalNote("")
    setJournalTitle(`Trading Day - ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`)
    setJournalMood('neutral')
    setJournalTags("")
    setSelectedTradeId("none")
    
    setIsTradeDialogOpen(true)
  }

  const handleSaveJournal = () => {
    if (!selectedDateForTrade || !journalNote.trim()) return
    if (demoGuard('save journal entries')) return

    let entries = getJournalEntries()
    
    // Always create a new journal entry (no longer replace existing ones)
    const journalEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // Ensure unique ID
      title: journalTitle.trim(),
      content: journalNote.trim(),
      date: selectedDateForTrade,
      tags: journalTags.split(',').map(tag => tag.trim()).filter(Boolean),
      mood: journalMood,
      entryType: 'general' as const,
      tradeId: selectedTradeId === "none" ? undefined : selectedTradeId || undefined
    }
    
    // Add new entry to the beginning of the array
    entries.unshift(journalEntry)
    
    userStorage.setItem('journalEntries', JSON.stringify(entries))
    
    // Reset form
    setJournalNote("")
    setJournalTitle("")
    setJournalMood('neutral')
    setJournalTags("")
    setSelectedTradeId("none")
    setIsTradeDialogOpen(false)
    
    // Update the selected date entries to reflect the new entry
    const dateKey = selectedDateForTrade.toISOString().split('T')[0]
    const updatedDayEntries = [...(journalEntries[dateKey] || []), journalEntry]
    setSelectedDateEntries(updatedDayEntries)
    
    // Show success feedback
    const feedback = document.createElement('div')
    feedback.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in slide-in-from-right-full duration-300'
    feedback.textContent = '✓ Journal entry saved successfully!'
    document.body.appendChild(feedback)
    
    setTimeout(() => {
      feedback.classList.add('animate-out', 'slide-out-to-right-full')
      setTimeout(() => document.body.removeChild(feedback), 300)
    }, 2000)
  }

  const handleSaveTrade = () => {
    if (!selectedDateForTrade || !tradeForm.symbol || !tradeForm.entryPrice || !tradeForm.exitPrice) return
    if (demoGuard('save your trades')) return

    const entryPrice = parseFloat(tradeForm.entryPrice)
    const exitPrice = parseFloat(tradeForm.exitPrice)
    const lotSize = parseFloat(tradeForm.lotSize) || 1
    // Manual P&L wins; otherwise use the shared calculation (same math as the
    // Trade Log form) so every entry path agrees on contract multipliers.
    const pnl = parseFloat(tradeForm.pnl) || calculateGrossPnl({
      symbol: tradeForm.symbol,
      market: tradeForm.market,
      side: tradeForm.side,
      entryPrice,
      exitPrice,
      quantity: lotSize,
    })

    const newTrade = {
      id: Date.now().toString(),
      symbol: tradeForm.symbol.toUpperCase(),
      side: tradeForm.side,
      entryPrice,
      exitPrice,
      lotSize,
      entryTime: selectedDateForTrade,
      exitTime: selectedDateForTrade,
      spread: 0,
      commission: 0,
      swap: 0,
      pnl,
      pnlPercentage: entryPrice > 0 ? (pnl / (entryPrice * lotSize)) * 100 : 0,
      notes: tradeForm.notes,
      strategy: tradeForm.strategy,
      market: tradeForm.market,
      propFirm: tradeForm.propFirm === "none" ? "" : tradeForm.propFirm,
      accountId: activeAccount?.id || 'default-main-account'
    }

    // Read ALL trades from localStorage to avoid overwriting other accounts
    let allTrades: any[] = []
    try {
      const saved = userStorage.getItem('trades')
      if (saved) allTrades = JSON.parse(saved)
    } catch { /* empty */ }
    allTrades.unshift(newTrade)
    userStorage.setItem('trades', JSON.stringify(allTrades))
    
    // Reset form
    setTradeForm({
      symbol: "",
      side: "long",
      market: "forex",
      entryPrice: "",
      exitPrice: "",
      lotSize: "",
      pnl: "",
      strategy: "",
      notes: "",
      propFirm: "none"
    })
    
    setIsTradeDialogOpen(false)
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.target !== document.body) return
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          goToPreviousMonth()
          break
        case 'ArrowRight':
          event.preventDefault()
          goToNextMonth()
          break
        case 'Home':
          event.preventDefault()
          goToToday()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  // Generate calendar data
  const calendarData = useMemo(() => {
    const viewingYear = currentDate.getFullYear()
    const viewingMonth = currentDate.getMonth()
    
    // Get first day of viewing month and last day
    const firstDay = new Date(viewingYear, viewingMonth, 1)
    const lastDay = new Date(viewingYear, viewingMonth + 1, 0)
    
    // Get the start of the calendar (including previous month days to fill the grid)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    // Get the end of the calendar (including next month days to fill the grid)
    const endDate = new Date(lastDay)
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()))
    
    const days: DayData[] = []
    const iteratorDate = new Date(startDate)
    
    while (iteratorDate <= endDate) {
      const dateStr = iteratorDate.toDateString()
      const isCurrentMonth = iteratorDate.getMonth() === viewingMonth
      
      // Find trades for this day
      const dayTrades = trades.filter((trade: Trade) => {
        return trade.exitTime.toDateString() === dateStr
      })
      
      const dayPnL = dayTrades.reduce((sum: number, trade: Trade) => sum + trade.pnl, 0)
      const winningTradesList = dayTrades.filter((trade: Trade) => trade.pnl > 0)
      const losingTradesList = dayTrades.filter((trade: Trade) => trade.pnl < 0)
      const winningTrades = winningTradesList.length
      const losingTrades = losingTradesList.length
      
      // Calculate win rate and R:R for the day
      const dayWinRate = dayTrades.length > 0 ? (winningTrades / dayTrades.length) * 100 : 0
      const avgWin = winningTrades > 0 ? 
        winningTradesList.reduce((sum: number, t: any) => sum + t.pnl, 0) / winningTrades : 0
      const avgLoss = losingTrades > 0 ? 
        Math.abs(losingTradesList.reduce((sum: number, t: any) => sum + t.pnl, 0) / losingTrades) : 0
      const dayRR = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0
      
      days.push({
        date: new Date(iteratorDate),
        pnl: dayPnL,
        trades: dayTrades.length,
        winningTrades,
        losingTrades,
        winRate: dayWinRate,
        avgWin,
        avgLoss,
        rr: dayRR,
        isCurrentMonth,
        tradeDetails: dayTrades
      })
      
      iteratorDate.setDate(iteratorDate.getDate() + 1)
    }
    
    return days
  }, [trades, currentDate])

  // Round to nearest cent to avoid floating point breakeven artifacts
  const roundedPnl = (pnl: number) => Math.round(pnl * 100) / 100

  const getPnLColor = (pnl: number, trades: number) => {
    if (trades === 0) return 'bg-muted/25 border-muted/50 hover:bg-black/[0.05] dark:hover:bg-white/[0.04] cursor-default'

    const rounded = roundedPnl(pnl)
    if (rounded > 0) {
      return 'border-2 shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer'
    } else if (rounded < 0) {
      return 'border-2 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer'
    }

    return 'border-2 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer' // Breakeven
  }
  
  // Determine if a color is light (needs dark text) or dark (needs white text)
  const isLightColor = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    // Perceived brightness formula
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness > 160
  }

  // Breakeven uses dark charcoal — clearly neutral
  const breakevenColor = '#27272a' // zinc-800

  // Convert a 0-100 percentage to a two-character hex opacity (00-ff)
  const pctToHex = (pct: number) => Math.round((pct / 100) * 255).toString(16).padStart(2, '0')

  const getPnLStyle = (pnl: number, trades: number, maxAbs: number) => {
    if (trades === 0) return {}

    const rounded = roundedPnl(pnl)
    if (rounded > 0) {
      const intensity = Math.min(Math.abs(rounded) / maxAbs, 1)
      const minOpacity = 30
      const maxOpacity = 100
      const opacity = Math.round(minOpacity + intensity * (maxOpacity - minOpacity))
      const borderOpacity = Math.min(opacity + 15, 100)
      return {
        backgroundColor: alpha(themeColors.profit, pctToHex(opacity)),
        borderColor: alpha(themeColors.profit, pctToHex(borderOpacity))
      }
    } else if (rounded < 0) {
      const intensity = Math.min(Math.abs(rounded) / maxAbs, 1)
      const minOpacity = 30
      const maxOpacity = 100
      const opacity = Math.round(minOpacity + intensity * (maxOpacity - minOpacity))
      const borderOpacity = Math.min(opacity + 15, 100)
      return {
        backgroundColor: alpha(themeColors.loss, pctToHex(opacity)),
        borderColor: alpha(themeColors.loss, pctToHex(borderOpacity))
      }
    }

    return { backgroundColor: breakevenColor, borderColor: breakevenColor } // Breakeven
  }

  // Get text color class based on the cell's background color
  const getCellTextColor = (pnl: number, trades: number, maxAbs: number) => {
    if (trades === 0) return 'text-foreground'

    const rounded = roundedPnl(pnl)
    if (rounded === 0) {
      return isLightColor(breakevenColor) ? 'text-black' : 'text-white'
    }

    const intensity = Math.min(Math.abs(rounded) / maxAbs, 1)
    const minOpacity = 30
    const maxOpacity = 100
    const opacity = Math.round(minOpacity + intensity * (maxOpacity - minOpacity))

    // Low opacity backgrounds are mostly transparent, so use foreground color
    if (opacity < 70) return 'text-foreground'

    const bgColor = rounded > 0 ? themeColors.profit : themeColors.loss
    return isLightColor(bgColor) ? 'text-black' : 'text-white'
  }

  // Calculate monthly statistics
  const monthlyStats = useMemo(() => {
    const currentMonthData = calendarData.filter(day => day.isCurrentMonth && day.trades > 0)
    const totalPnL = currentMonthData.reduce((sum, day) => sum + day.pnl, 0)
    const totalTrades = currentMonthData.reduce((sum, day) => sum + day.trades, 0)
    const totalWinningTrades = currentMonthData.reduce((sum, day) => sum + day.winningTrades, 0)
    const totalLosingTrades = currentMonthData.reduce((sum, day) => sum + day.losingTrades, 0)
    const profitDays = currentMonthData.filter(day => day.pnl > 0).length
    const lossDays = currentMonthData.filter(day => day.pnl < 0).length
    const activeDays = profitDays + lossDays
    const winRate = totalTrades > 0 ? (totalWinningTrades / totalTrades) * 100 : 0
    const avgPnLPerTrade = totalTrades > 0 ? totalPnL / totalTrades : 0
    
    // Calculate overall R:R
    const allWinningTrades = currentMonthData.flatMap(day => 
      day.tradeDetails.filter(t => t.pnl > 0)
    )
    const allLosingTrades = currentMonthData.flatMap(day => 
      day.tradeDetails.filter(t => t.pnl < 0)
    )
    
    const avgWin = allWinningTrades.length > 0 ? 
      allWinningTrades.reduce((sum, t) => sum + t.pnl, 0) / allWinningTrades.length : 0
    const avgLoss = allLosingTrades.length > 0 ? 
      Math.abs(allLosingTrades.reduce((sum, t) => sum + t.pnl, 0) / allLosingTrades.length) : 0
    const riskReward = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0
    
    // Find best and worst days
    let bestDay = null
    let worstDay = null
    if (currentMonthData.length > 0) {
      bestDay = currentMonthData.reduce((best, day) => 
        day.pnl > best.pnl ? day : best
      )
      worstDay = currentMonthData.reduce((worst, day) => 
        day.pnl < worst.pnl ? day : worst
      )
    }
    
    return {
      totalPnL,
      totalTrades,
      totalWinningTrades,
      totalLosingTrades,
      profitDays,
      lossDays,
      activeDays,
      winRate,
      avgPnLPerTrade,
      avgWin,
      avgLoss,
      riskReward,
      bestDay,
      worstDay
    }
  }, [calendarData])

  // Maximum absolute P&L for the current month (used for intensity scaling)
  const maxAbsPnl = useMemo(() => {
    const currentMonthData = calendarData.filter(day => day.isCurrentMonth && day.trades > 0)
    if (currentMonthData.length === 0) return 1
    const max = Math.max(...currentMonthData.map(day => Math.abs(roundedPnl(day.pnl))))
    return max > 0 ? max : 1
  }, [calendarData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatCurrencyMobile = (amount: number) => {
    const abs = Math.abs(amount)
    if (abs >= 1000) {
      return `$${(amount/1000).toFixed(1)}k`
    } else if (abs >= 100) {
      return `$${Math.round(amount)}`
    } else {
      return `$${amount.toFixed(0)}`
    }
  }

  // Compact signed P&L for the slim weekly-total column (e.g. +$820, -$1.2k)
  const formatWeekPnl = (n: number) => {
    const sign = n > 0 ? '+' : n < 0 ? '-' : ''
    const a = Math.abs(n)
    if (a >= 1000) return `${sign}$${(a / 1000).toFixed(1)}k`
    return `${sign}$${a.toFixed(0)}`
  }

  const today = new Date()
  const currentMonthName = MONTHS[currentDate.getMonth()]
  const currentYear = currentDate.getFullYear()

  // Group days into weeks
  const weeks = []
  for (let i = 0; i < calendarData.length; i += 7) {
    weeks.push(calendarData.slice(i, i + 7))
  }

  // Weekly P&L totals — current-month days only, so the weekly totals sum
  // exactly to the Monthly P&L above (spillover days aren't double-counted).
  const weekTotals = weeks.map((week) => {
    const monthDays = week.filter((d) => d.isCurrentMonth && d.trades > 0)
    return {
      pnl: monthDays.reduce((s, d) => s + d.pnl, 0),
      trades: monthDays.reduce((s, d) => s + d.trades, 0),
      hasTrades: monthDays.length > 0,
    }
  })

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="space-y-4">
          {/* Title - Mobile friendly v2 */}
          <CardTitle className="text-lg sm:text-xl font-semibold">
            Trading Calendar
          </CardTitle>

          {/* Navigation */}
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div className="flex items-center gap-1 rounded-full bg-muted/50 p-1">
              <button
                onClick={goToPreviousMonth}
                className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-colors touch-manipulation"
                title="Previous month (←)"
                aria-label="Previous month"
              >
                <CaretLeft className="h-3 w-3 text-muted-foreground" />
              </button>

              <Popover open={isMonthPickerOpen} onOpenChange={(open) => {
                setIsMonthPickerOpen(open)
                if (open) setPickerYear(currentDate.getFullYear())
              }}>
                <PopoverTrigger asChild>
                  <button className="h-8 px-3 rounded-md text-sm font-semibold hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-colors touch-manipulation">
                    {MONTHS[selectedMonth]} {selectedYear}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3" align="start" sideOffset={8}>
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => setPickerYear(y => y - 1)}
                      className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      <CaretLeft className="h-3 w-3 text-muted-foreground" />
                    </button>
                    <span className="text-sm font-semibold">{pickerYear}</span>
                    <button
                      onClick={() => setPickerYear(y => y + 1)}
                      className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      <CaretRight className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {MONTHS.map((month, index) => {
                      const isActive = index === selectedMonth && pickerYear === selectedYear
                      const isCurrent = index === new Date().getMonth() && pickerYear === new Date().getFullYear()
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            jumpToMonth(index, pickerYear)
                            setIsMonthPickerOpen(false)
                          }}
                          className={cn(
                            "py-2 rounded-md text-xs font-medium transition-colors",
                            !isActive && "hover:bg-muted",
                            isCurrent && !isActive && "text-foreground font-semibold"
                          )}
                          style={isActive ? {
                            backgroundColor: alpha(themeColors.primary, '15'),
                            color: themeColors.primary,
                          } : undefined}
                        >
                          {month}
                        </button>
                      )
                    })}
                  </div>
                </PopoverContent>
              </Popover>

              <button
                onClick={goToNextMonth}
                className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-colors touch-manipulation"
                title="Next month (→)"
                aria-label="Next month"
              >
                <CaretRight className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>

            <button
              onClick={goToToday}
              className="h-8 px-4 rounded-full text-xs font-semibold transition-opacity hover:opacity-90 touch-manipulation"
              style={{
                backgroundColor: themeColors.primary,
                color: isLightColor(themeColors.primary) ? '#000' : '#fff'
              }}
            >
              Today
            </button>
          </div>
        </div>

        {/* Stats panel */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 p-3 sm:p-4">
          <div className="px-3 sm:px-4 border-r border-border/40 last:border-r-0">
            <div className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">Monthly P&L</div>
            <div className="text-lg sm:text-2xl font-bold" style={{color: monthlyStats.totalPnL >= 0 ? themeColors.profit : themeColors.loss}}>
              {formatCurrency(monthlyStats.totalPnL)}
            </div>
            {monthlyStats.bestDay && (
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                <span>Best <span className="font-semibold" style={{color: themeColors.profit}}>{formatCurrency(monthlyStats.bestDay.pnl)}</span></span>
                {monthlyStats.worstDay && monthlyStats.worstDay.pnl < 0 && (
                  <span>Worst <span className="font-semibold" style={{color: themeColors.loss}}>{formatCurrency(monthlyStats.worstDay.pnl)}</span></span>
                )}
              </div>
            )}
          </div>

          <div className="px-3 sm:px-4 border-r border-border/40 max-sm:border-r-0">
            <div className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">Win Rate</div>
            <div className="text-lg sm:text-2xl font-bold" style={{color: monthlyStats.winRate >= 50 ? themeColors.profit : themeColors.loss}}>
              {monthlyStats.winRate.toFixed(1)}%
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              <span style={{color: themeColors.profit}}>{monthlyStats.totalWinningTrades}W</span>
              <span className="mx-1">/</span>
              <span style={{color: themeColors.loss}}>{monthlyStats.totalLosingTrades}L</span>
            </div>
          </div>

          <div className="px-3 sm:px-4 border-r border-border/40 max-sm:mt-3 max-sm:pt-3 max-sm:border-t max-sm:border-border/30">
            <div className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">Trades</div>
            <div className="text-lg sm:text-2xl font-bold" style={{color: themeColors.primary}}>
              {monthlyStats.totalTrades}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              {monthlyStats.activeDays} trading day{monthlyStats.activeDays !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="px-3 sm:px-4 max-sm:mt-3 max-sm:pt-3 max-sm:border-t max-sm:border-border/30">
            <div className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">Days</div>
            <div className="text-lg sm:text-2xl font-bold">
              <span style={{color: themeColors.profit}}>{monthlyStats.profitDays}</span>
              <span className="text-muted-foreground mx-0.5">/</span>
              <span style={{color: themeColors.loss}}>{monthlyStats.lossDays}</span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">profit / loss</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 px-2 sm:px-6">
        <div className="space-y-3">
          {/* Day headers */}
          <div className="flex gap-1 sm:gap-3 mb-2">
            <div className="grid grid-cols-7 gap-1 sm:gap-3 flex-1">
              {DAYS.map((day) => (
                <div key={day} className="text-center text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground/70 py-1.5 sm:py-2">
                  <span className="sm:hidden">{day.slice(0, 1)}</span>
                  <span className="hidden sm:inline">{day}</span>
                </div>
              ))}
            </div>
            <div className="w-12 sm:w-20 shrink-0 text-center text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground/70 py-1.5 sm:py-2">
              Week
            </div>
          </div>
          
          {/* Enhanced Calendar grid with better spacing and animations */}
          <div className={cn(
            "space-y-1 sm:space-y-3 transition-[opacity,transform] duration-300",
            isAnimating ? "opacity-50 scale-95" : "opacity-100 scale-100"
          )}>
            {weeks.map((week, weekIndex) => {
              const wt = weekTotals[weekIndex]
              return (
              <div
                key={`${currentDate.getFullYear()}-${currentDate.getMonth()}-${weekIndex}`}
                className="flex gap-1 sm:gap-3"
                style={{
                  animationDelay: `${weekIndex * 50}ms`
                }}
              >
                <div className="grid grid-cols-7 gap-1 sm:gap-3 flex-1">
                {week.map((day) => {
                  const isToday = day.date.toDateString() === today.toDateString()
                  const hasData = day.trades > 0
                  const dateKey = day.date.toISOString().split('T')[0]
                  const hasJournal = journalEntries[dateKey] && journalEntries[dateKey].length > 0
                  
                  return (
                    <Popover key={day.date.toISOString()} open={isPopoverOpen && selectedDay?.date.toISOString() === day.date.toISOString()}>
                      <PopoverTrigger asChild>
                        <div
                          role="button"
                          tabIndex={day.isCurrentMonth ? 0 : -1}
                          className={cn(
                            "h-[72px] sm:h-24 rounded-lg sm:rounded-xl relative overflow-hidden",
                            getPnLColor(day.pnl, day.trades),
                            day.isCurrentMonth ? "opacity-100" : "opacity-40",
                            hasData && "hover:z-10",
                            day.isCurrentMonth && "cursor-pointer"
                          )}
                          style={{
                            ...getPnLStyle(day.pnl, day.trades, maxAbsPnl),
                            ...(isToday && { 
                              boxShadow: `0 0 0 2px ${themeColors.primary}`,
                              borderColor: themeColors.primary
                            })
                          }}
                          onMouseEnter={() => {
                            if (hasData) {
                              setSelectedDay(day)
                              setIsPopoverOpen(true)
                            }
                          }}
                          onMouseLeave={() => {
                            setIsPopoverOpen(false)
                            setSelectedDay(null)
                          }}
                          onClick={() => {
                            if (day.isCurrentMonth) {
                              handleDateClick(day.date)
                            }
                          }}
                          onKeyDown={(e: React.KeyboardEvent) => {
                            if ((e.key === 'Enter' || e.key === ' ') && day.isCurrentMonth) {
                              e.preventDefault()
                              handleDateClick(day.date)
                            }
                          }}
                        >
                          {/* Shine overlay on profit days */}
                          {hasData && roundedPnl(day.pnl) > 0 && (
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
                          )}

                          <div className="relative h-full z-10">
                            {/* Date number — absolute top left */}
                            <div className={cn(
                              "absolute top-1.5 left-1.5 sm:top-2 sm:left-2 text-[10px] sm:text-[11px] font-medium leading-none tabular-nums",
                              hasData ? `${getCellTextColor(day.pnl, day.trades, maxAbsPnl)} opacity-60` :
                              day.isCurrentMonth ? "text-foreground/60" : "text-muted-foreground/50"
                            )}>
                              {day.date.getDate()}
                            </div>

                            {/* P&L — true center */}
                            {hasData && (
                              <div className="flex items-center justify-center h-full">
                                {/* Mobile */}
                                <div className={cn("sm:hidden text-[10px] font-black tracking-tighter leading-none drop-shadow-sm px-0.5", getCellTextColor(day.pnl, day.trades, maxAbsPnl))}>
                                  {Math.abs(day.pnl) >= 1000
                                    ? `${day.pnl >= 0 ? '+' : '-'}${Math.abs(day.pnl/1000).toFixed(1)}k`
                                    : Math.abs(day.pnl) >= 10
                                      ? `${day.pnl >= 0 ? '+' : '-'}${Math.abs(Math.round(day.pnl))}`
                                      : `${day.pnl >= 0 ? '+' : '-'}${Math.abs(day.pnl).toFixed(1)}`
                                  }
                                </div>
                                {/* Desktop */}
                                <div className={cn("hidden sm:block text-xl font-black tracking-tighter leading-none drop-shadow-sm", getCellTextColor(day.pnl, day.trades, maxAbsPnl))}>
                                  {day.pnl >= 0 ? '+' : '-'}${Math.abs(day.pnl) >= 1000
                                    ? `${(Math.abs(day.pnl) / 1000).toFixed(1)}k`
                                    : Math.abs(day.pnl).toFixed(0)
                                  }
                                </div>
                              </div>
                            )}

                            {/* Trade count — bottom center */}
                            {hasData && (
                              <div className={cn(
                                "absolute bottom-1 sm:bottom-1.5 left-0 right-0 flex items-center justify-center",
                                getCellTextColor(day.pnl, day.trades, maxAbsPnl)
                              )}>
                                <span className="text-[8px] sm:text-[10px] font-medium opacity-50 tabular-nums">
                                  <span className="sm:hidden">{day.trades}t</span>
                                  <span className="hidden sm:inline">{day.trades} trade{day.trades !== 1 ? 's' : ''}</span>
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Today indicator */}
                          {isToday && (
                            <div className="absolute top-1 right-1 w-2 h-2 rounded-full shadow-sm" style={{backgroundColor: themeColors.primary}} />
                          )}
                          
                          {/* Add trade indicator for empty dates */}
                          {!isDemo && !hasData && day.isCurrentMonth && (
                            <div className="absolute bottom-1 right-1 opacity-0 hover:opacity-100 transition-opacity">
                              <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                                <Plus className="h-2 w-2 text-primary" />
                              </div>
                            </div>
                          )}
                          
                          {/* Journal indicator with count */}
                          {hasJournal && (
                            <div className="absolute bottom-0.5 right-0.5 sm:bottom-1 sm:left-1 sm:right-auto flex items-center gap-0.5">
                              <BookOpen className="h-2 w-2 sm:h-3 sm:w-3 text-slate-800 dark:text-white drop-shadow-lg" />
                              {journalEntries[dateKey].length > 1 && (
                                <div className="bg-slate-800 dark:bg-white text-white dark:text-slate-800 text-[7px] sm:text-[10px] font-bold rounded-full w-2.5 h-2.5 sm:w-4 sm:h-4 flex items-center justify-center drop-shadow-lg">
                                  {journalEntries[dateKey].length}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </PopoverTrigger>
                      {hasData && (
                        <PopoverContent className="w-[90vw] max-w-64 p-0 border-0 shadow-xl" side="bottom" align="center">
                          <div className="bg-card/95 backdrop-blur-md rounded-lg border p-4 space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-border/70">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{backgroundColor: day.pnl > 0 ? themeColors.profit : day.pnl < 0 ? themeColors.loss : breakevenColor}}
                                />
                                <div className="font-semibold text-sm">
                                  {day.date.toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </div>
                              </div>
                              <div
                                className="text-xs sm:text-sm font-bold px-1 sm:px-2 py-0.5 sm:py-1 rounded-md"
                                style={{
                                  color: isLightColor(day.pnl >= 0 ? themeColors.profit : themeColors.loss) ? '#000' : '#fff',
                                  backgroundColor: day.pnl >= 0 ? themeColors.profit : themeColors.loss
                                }}
                              >
                                <span className="hidden sm:inline">{formatCurrency(day.pnl)}</span>
                                <span className="sm:hidden">{formatCurrencyMobile(day.pnl)}</span>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="space-y-1">
                                <div className="text-muted-foreground text-xs font-medium">Trades</div>
                                <div className="font-bold text-lg">{day.trades}</div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-muted-foreground text-xs font-medium">Win Rate</div>
                                <div className="font-bold text-lg">{day.winRate.toFixed(0)}%</div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-muted-foreground text-xs font-medium">W/L Ratio</div>
                                <div className="font-bold text-lg flex items-center gap-1">
                                  <span style={{color: themeColors.profit}}>{day.winningTrades}</span>
                                  <span className="text-muted-foreground text-sm">/</span>
                                  <span style={{color: themeColors.loss}}>{day.losingTrades}</span>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-muted-foreground text-xs font-medium">R:R</div>
                                <div
                                  className={`font-bold text-lg${day.rr === Infinity ? ' cursor-help' : ''}`}
                                  title={day.rr === Infinity ? 'No losing trades' : undefined}
                                >
                                  {day.rr === 0 ? '-' : day.rr === Infinity ? '∞' : day.rr.toFixed(2)}
                                </div>
                              </div>
                            </div>
                            
                            {/* Additional stats */}
                            {(day.avgWin > 0 || day.avgLoss > 0) && (
                              <div className="pt-2 border-t border-border/70">
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                  {day.avgWin > 0 && (
                                    <div>
                                      <div className="text-muted-foreground font-medium">Avg Win</div>
                                      <div className="font-semibold" style={{color: themeColors.profit}}>{formatCurrency(day.avgWin)}</div>
                                    </div>
                                  )}
                                  {day.avgLoss > 0 && (
                                    <div>
                                      <div className="text-muted-foreground font-medium">Avg Loss</div>
                                      <div className="font-semibold" style={{color: themeColors.loss}}>{formatCurrency(-day.avgLoss)}</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </PopoverContent>
                      )}
                    </Popover>
                  )
                })}
                </div>
                {/* Weekly P&L total */}
                <div className="w-12 sm:w-20 shrink-0 flex flex-col items-center justify-center rounded-lg sm:rounded-xl h-[72px] sm:h-24 border border-border/40 bg-muted/20">
                  {wt.hasTrades ? (
                    <>
                      <span
                        className="text-[10px] sm:text-sm font-bold tabular-nums leading-none text-center px-0.5 truncate max-w-full block"
                        style={{ color: wt.pnl >= 0 ? themeColors.profit : themeColors.loss }}
                      >
                        {formatWeekPnl(wt.pnl)}
                      </span>
                      <span className="hidden sm:block text-[10px] text-muted-foreground/60 mt-1 tabular-nums">
                        {wt.trades} trade{wt.trades !== 1 ? 's' : ''}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground/30 text-xs">–</span>
                  )}
                </div>
              </div>
              )
            })}
          </div>
          
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-4 mt-4 pt-3 border-t border-border/70 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{backgroundColor: themeColors.profit}} />
              <span className="text-muted-foreground">Profit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{backgroundColor: themeColors.loss}} />
              <span className="text-muted-foreground">Loss</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{backgroundColor: breakevenColor}} />
              <span className="text-muted-foreground">Breakeven</span>
            </div>

            <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-border/50">
              <span className="text-[10px] text-muted-foreground/60">Less</span>
              {[30, 50, 70, 85, 100].map(pct => (
                <div
                  key={pct}
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: alpha(themeColors.profit, pctToHex(pct)) }}
                />
              ))}
              <span className="text-[10px] text-muted-foreground/60">More</span>
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Trade Entry & Journal Modal */}
      <Dialog open={isTradeDialogOpen} onOpenChange={setIsTradeDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <div className="px-5 pt-5 sm:px-6 sm:pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg" style={{ backgroundColor: alpha(themeColors.primary, '15') }}>
                <CalendarDots className="h-4 w-4" style={{ color: themeColors.primary }} />
              </div>
              <div>
                <DialogHeader className="text-left space-y-0.5">
                  <DialogTitle className="text-base sm:text-lg">
                    {selectedDateForTrade?.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </DialogTitle>
                  <DialogDescription className="text-sm">
                    {isDemo ? 'View demo entries for this trading day' : 'Log trades or journal notes for this day'}
                  </DialogDescription>
                </DialogHeader>
              </div>
            </div>
          </div>

          <div className="px-5 pb-5 sm:px-6 sm:pb-6 mt-4">
          <Tabs defaultValue="journal" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-9 p-1 mb-5">
              <TabsTrigger
                value="journal"
                className="text-xs sm:text-sm gap-1.5 flex items-center justify-center"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Journal
              </TabsTrigger>
              <TabsTrigger
                value="trade"
                className="text-xs sm:text-sm gap-1.5 flex items-center justify-center"
              >
                <ChartBar className="h-3.5 w-3.5" />
                Add Trade
              </TabsTrigger>
            </TabsList>

            <TabsContent value="journal" className="space-y-4 mt-0">
              {/* -- Entry Card -- */}
              <div className="rounded-xl border bg-card/50 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <PencilSimple className="h-3.5 w-3.5" style={{ color: themeColors.primary }} />
                  <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Entry</span>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="journal-title" className="text-xs text-muted-foreground">Title</Label>
                    <Input
                      id="journal-title"
                      placeholder="What's the focus for today?"
                      value={journalTitle}
                      onChange={(e) => setJournalTitle(e.target.value)}
                      className="h-10 text-sm bg-background/60 border-border/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="journal-content" className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Note className="h-3 w-3" />
                      Notes
                    </Label>
                    <Textarea
                      id="journal-content"
                      placeholder="Thoughts, observations, lessons learned..."
                      value={journalNote}
                      onChange={(e) => setJournalNote(e.target.value)}
                      className="min-h-[80px] sm:min-h-[100px] resize-none text-sm bg-background/60 border-border/50"
                    />
                  </div>
                </div>
              </div>

              {/* -- Details Card -- */}
              <div className="rounded-xl border bg-card/50 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5" style={{ color: themeColors.primary }} />
                  <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Details</span>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <ChartBar className="h-3 w-3" />
                    Link to Trade
                  </Label>
                  <Select value={selectedTradeId} onValueChange={setSelectedTradeId}>
                    <SelectTrigger className="h-10 text-sm bg-background/60 border-border/50">
                      <SelectValue placeholder="No trade linked" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No trade linked</SelectItem>
                      {trades.map((trade: any) => (
                        <SelectItem key={trade.id} value={trade.id} className="text-xs">
                          {trade.symbol} {trade.side.toUpperCase()} • {trade.pnl > 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Heart className="h-3 w-3" />
                      Sentiment
                    </Label>
                    <Select value={journalMood} onValueChange={(value: 'bullish' | 'bearish' | 'neutral') => setJournalMood(value)}>
                      <SelectTrigger className="h-10 text-sm bg-background/60 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="neutral">Neutral</SelectItem>
                        <SelectItem value="bullish">Bullish</SelectItem>
                        <SelectItem value="bearish">Bearish</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="journal-tags" className="text-xs text-muted-foreground">Tag</Label>
                    <Input
                      id="journal-tags"
                      placeholder="strategy, analysis..."
                      value={journalTags}
                      onChange={(e) => setJournalTags(e.target.value)}
                      className="h-10 text-sm bg-background/60 border-border/50"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2">
                <Link to="/journal" onClick={() => setIsTradeDialogOpen(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                  <BookOpen className="h-3 w-3" />
                  Full journal
                </Link>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsTradeDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveJournal}
                    disabled={!journalNote.trim() || !journalTitle.trim()}
                    className="shadow-sm gap-2 px-5"
                    style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}
                  >
                    Save Entry
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="trade" className="space-y-4 mt-0">
              {/* -- Setup Card -- */}
              <div className="rounded-xl border bg-card/50 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Crosshair className="h-3.5 w-3.5" style={{ color: themeColors.primary }} />
                  <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Setup</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Market</Label>
                    <Select value={tradeForm.market} onValueChange={(value: "forex" | "futures" | "indices") => {
                      setTradeForm(prev => ({ ...prev, market: value, symbol: "" }))
                    }}>
                      <SelectTrigger className="h-10 bg-background/60 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="forex">Forex</SelectItem>
                        <SelectItem value="futures">Futures</SelectItem>
                        <SelectItem value="indices">Indices</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Symbol</Label>
                    <Select value={tradeForm.symbol} onValueChange={(value) => setTradeForm(prev => ({ ...prev, symbol: value }))}>
                      <SelectTrigger className="h-10 bg-background/60 border-border/50">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {getInstrumentsByMarket(tradeForm.market).map((instrument) => (
                          <SelectItem key={instrument} value={instrument}>
                            {instrument}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Side</Label>
                    <Select value={tradeForm.side} onValueChange={(value: "long" | "short") => setTradeForm(prev => ({ ...prev, side: value }))}>
                      <SelectTrigger className="h-10 bg-background/60 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="long">Long</SelectItem>
                        <SelectItem value="short">Short</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Prop Firm</Label>
                    <PropFirmSelect
                      triggerClassName="h-10 bg-background/60 border-border/50"
                      value={tradeForm.propFirm}
                      onChange={(value) => setTradeForm(prev => ({ ...prev, propFirm: value }))}
                    />
                  </div>
                </div>
              </div>

              {/* -- Execution Card -- */}
              <div className="rounded-xl border bg-card/50 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <ArrowsLeftRight className="h-3.5 w-3.5" style={{ color: themeColors.primary }} />
                  <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Execution</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="trade-entry" className="text-xs text-muted-foreground">Entry Price</Label>
                    <Input
                      id="trade-entry"
                      type="number"
                      step="0.00001"
                      placeholder="1.08450"
                      className="h-10 bg-background/60 border-border/50"
                      value={tradeForm.entryPrice}
                      onChange={(e) => setTradeForm(prev => ({ ...prev, entryPrice: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="trade-exit" className="text-xs text-muted-foreground">Exit Price</Label>
                    <Input
                      id="trade-exit"
                      type="number"
                      step="0.00001"
                      placeholder="1.08650"
                      className="h-10 bg-background/60 border-border/50"
                      value={tradeForm.exitPrice}
                      onChange={(e) => setTradeForm(prev => ({ ...prev, exitPrice: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="trade-size" className="text-xs text-muted-foreground">Lot Size</Label>
                    <Input
                      id="trade-size"
                      type="number"
                      step="0.01"
                      placeholder="1.00"
                      className="h-10 bg-background/60 border-border/50"
                      value={tradeForm.lotSize}
                      onChange={(e) => setTradeForm(prev => ({ ...prev, lotSize: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="trade-pnl" className="text-xs text-muted-foreground">P&L</Label>
                    <Input
                      id="trade-pnl"
                      type="number"
                      step="0.01"
                      placeholder="Auto-calculated"
                      className="h-10 bg-background/60 border-border/50"
                      value={tradeForm.pnl}
                      onChange={(e) => setTradeForm(prev => ({ ...prev, pnl: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* -- Context Card -- */}
              <div className="rounded-xl border bg-card/50 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-3.5 w-3.5" style={{ color: themeColors.primary }} />
                  <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Context</span>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="trade-strategy" className="text-xs text-muted-foreground">Strategy</Label>
                  <Input
                    id="trade-strategy"
                    placeholder="Breakout, S/R, trend follow..."
                    className="h-10 bg-background/60 border-border/50"
                    value={tradeForm.strategy}
                    onChange={(e) => setTradeForm(prev => ({ ...prev, strategy: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="trade-notes" className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Note className="h-3 w-3" />
                    Notes
                  </Label>
                  <Textarea
                    id="trade-notes"
                    placeholder="What was your reasoning?"
                    value={tradeForm.notes}
                    onChange={(e) => setTradeForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="min-h-[72px] resize-none text-sm bg-background/60 border-border/50"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                  onClick={() => {
                    const prefilledData = {
                      symbol: tradeForm.symbol,
                      side: tradeForm.side,
                      market: tradeForm.market,
                      entryPrice: tradeForm.entryPrice,
                      exitPrice: tradeForm.exitPrice,
                      lotSize: tradeForm.lotSize,
                      strategy: tradeForm.strategy,
                      notes: tradeForm.notes,
                      propFirm: tradeForm.propFirm,
                      entryTime: selectedDateForTrade,
                      exitTime: selectedDateForTrade
                    };
                    userStorage.setItem('prefilledTradeForm', JSON.stringify(prefilledData));
                    setIsTradeDialogOpen(false);
                    window.location.href = '/trades';
                  }}
                >
                  <ChartBar className="h-3 w-3" />
                  Full trade log
                </button>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsTradeDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveTrade}
                    disabled={!tradeForm.symbol || !tradeForm.entryPrice || !tradeForm.exitPrice}
                    className="shadow-sm gap-2 px-5"
                    style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}
                  >
                    <CurrencyDollar className="h-3.5 w-3.5" />
                    Save Trade
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}