import { useMemo, useState, useEffect } from "react"
import { toast } from "sonner"
import { useThemePresets } from '@/contexts/theme-presets'
import { useAccounts } from '@/contexts/account-context'
import { useDemoData } from '@/hooks/use-demo-data'
import { useUserStorage } from '@/utils/user-storage'
import { PROP_FIRMS, MARKET_INSTRUMENTS, type MarketType } from '@/constants/trading'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDays, faArrowUp, faArrowDown, faChevronLeft, faChevronRight, faBookOpen, faPlus } from '@fortawesome/free-solid-svg-icons'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Link } from "react-router-dom"
import { Plus, DollarSign, Target, TrendingUp, BarChart3, Activity } from "lucide-react"
import { Separator } from "@/components/ui/separator"
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

export function CalendarHeatmap() {
  // Get theme colors
  const { themeColors, alpha } = useThemePresets()
  const { activeAccount } = useAccounts()
  const { getTrades, getJournalEntries, isDemo } = useDemoData()
  const userStorage = useUserStorage()
  
  // State for current viewing month/year
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [isAnimating, setIsAnimating] = useState(false)
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
      const dateKey = new Date(entry.date).toISOString().split('T')[0]
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
      const entryDate = new Date(entry.date).toISOString().split('T')[0]
      return entryDate === dateKey
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

    if (isDemo) {
      toast.info('Sign up to save journal entries!');
      return;
    }

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

    if (isDemo) {
      toast.info('Sign up to save your real trades!');
      return;
    }

    const entryPrice = parseFloat(tradeForm.entryPrice)
    const exitPrice = parseFloat(tradeForm.exitPrice)
    const lotSize = parseFloat(tradeForm.lotSize) || 1
    const pnl = parseFloat(tradeForm.pnl) || ((exitPrice - entryPrice) * lotSize * (tradeForm.side === 'long' ? 1 : -1))

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
    if (trades === 0) return 'bg-muted/10 border-muted/30 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] cursor-default'

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

  const getPnLStyle = (pnl: number, trades: number) => {
    if (trades === 0) return {}

    const rounded = roundedPnl(pnl)
    if (rounded > 0) {
      return {
        backgroundColor: themeColors.profit,
        borderColor: themeColors.profit
      }
    } else if (rounded < 0) {
      return {
        backgroundColor: themeColors.loss,
        borderColor: themeColors.loss
      }
    }

    return { backgroundColor: breakevenColor, borderColor: breakevenColor } // Breakeven
  }

  // Get text color class based on the cell's background color
  const getCellTextColor = (pnl: number, trades: number) => {
    if (trades === 0) return 'text-foreground'

    const rounded = roundedPnl(pnl)
    let bgColor: string
    if (rounded > 0) bgColor = themeColors.profit
    else if (rounded < 0) bgColor = themeColors.loss
    else bgColor = breakevenColor

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

  const today = new Date()
  const currentMonthName = MONTHS[currentDate.getMonth()]
  const currentYear = currentDate.getFullYear()

  // Group days into weeks
  const weeks = []
  for (let i = 0; i < calendarData.length; i += 7) {
    weeks.push(calendarData.slice(i, i + 7))
  }

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
            <div className="flex items-center gap-1 rounded-full bg-muted/30 p-1">
              <button
                onClick={goToPreviousMonth}
                className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-black/[0.03] dark:hover:bg-white/[0.06] transition-colors touch-manipulation"
                title="Previous month (←)"
                aria-label="Previous month"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3 text-muted-foreground" />
              </button>

              <div className="flex items-center gap-1 px-1">
                <Select value={selectedMonth.toString()} onValueChange={(value) => jumpToMonth(parseInt(value), selectedYear)}>
                  <SelectTrigger className="w-16 h-8 text-xs font-semibold border-0 bg-transparent shadow-none focus:ring-0 px-2 touch-manipulation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month, index) => (
                      <SelectItem key={index} value={index.toString()}>{month.slice(0,3)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedYear.toString()} onValueChange={(value) => jumpToMonth(selectedMonth, parseInt(value))}>
                  <SelectTrigger className="w-16 h-8 text-xs font-semibold border-0 bg-transparent shadow-none focus:ring-0 px-2 touch-manipulation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map((year) => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <button
                onClick={goToNextMonth}
                className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-black/[0.03] dark:hover:bg-white/[0.06] transition-colors touch-manipulation"
                title="Next month (→)"
                aria-label="Next month"
              >
                <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3 text-muted-foreground" />
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
        <div className="grid grid-cols-3 md:flex md:items-center gap-2 md:gap-0 p-3 md:p-4 md:px-6">
          <div className="text-center md:text-left md:flex-1">
            <div className="flex items-center justify-center md:justify-start gap-1 mb-1">
              <DollarSign className="h-3 w-3 md:h-4 md:w-4" style={{color: themeColors.primary}} />
              <div className="text-[10px] md:text-sm text-muted-foreground">Monthly P&L</div>
            </div>
            <div className="text-base md:text-3xl lg:text-4xl font-bold" style={{color: monthlyStats.totalPnL >= 0 ? themeColors.profit : themeColors.loss}}>
              {formatCurrency(monthlyStats.totalPnL)}
            </div>
          </div>

          <Separator orientation="vertical" className="hidden md:block h-12 mx-4" />

          <div className="text-center md:text-left md:flex-1">
            <div className="flex items-center justify-center md:justify-start gap-1 mb-1">
              <Target className="h-3 w-3 md:h-4 md:w-4" style={{color: themeColors.primary}} />
              <div className="text-[10px] md:text-sm text-muted-foreground">Win Rate</div>
            </div>
            <div className="text-base md:text-3xl lg:text-4xl font-bold" style={{color: monthlyStats.winRate >= 50 ? themeColors.profit : themeColors.loss}}>
              {monthlyStats.winRate.toFixed(1)}%
            </div>
          </div>

          <Separator orientation="vertical" className="hidden md:block h-12 mx-4" />

          <div className="text-center md:text-left md:flex-1">
            <div className="flex items-center justify-center md:justify-start gap-1 mb-1">
              <BarChart3 className="h-3 w-3 md:h-4 md:w-4" style={{color: themeColors.primary}} />
              <div className="text-[10px] md:text-sm text-muted-foreground">W/L</div>
            </div>
            <div className="text-base md:text-3xl lg:text-4xl font-bold">
              <span style={{color: themeColors.profit}}>{monthlyStats.totalWinningTrades}</span>
              <span className="text-muted-foreground mx-0.5 md:mx-1">/</span>
              <span style={{color: themeColors.loss}}>{monthlyStats.totalLosingTrades}</span>
            </div>
          </div>

          <Separator orientation="vertical" className="hidden md:block h-12 mx-4" />

          <div className="text-center md:text-left md:flex-1">
            <div className="flex items-center justify-center md:justify-start gap-1 mb-1">
              <Activity className="h-3 w-3 md:h-4 md:w-4" style={{color: themeColors.primary}} />
              <div className="text-[10px] md:text-sm text-muted-foreground">Trades</div>
            </div>
            <div className="text-base md:text-3xl lg:text-4xl font-bold" style={{color: themeColors.primary}}>
              {monthlyStats.totalTrades}
            </div>
          </div>

          <Separator orientation="vertical" className="hidden md:block h-12 mx-4" />

          <div className="text-center md:text-left md:flex-1">
            <div className="flex items-center justify-center md:justify-start gap-1 mb-1">
              <FontAwesomeIcon icon={faCalendarDays} className="h-3 w-3 md:h-4 md:w-4" style={{color: themeColors.primary}} />
              <div className="text-[10px] md:text-sm text-muted-foreground">Trading Days</div>
            </div>
            <div className="text-base md:text-3xl lg:text-4xl font-bold" style={{color: themeColors.primary}}>
              {monthlyStats.activeDays}
            </div>
          </div>

          <Separator orientation="vertical" className="hidden md:block h-12 mx-4" />

          <div className="text-center md:text-left md:flex-1">
            <div className="flex items-center justify-center md:justify-start gap-1 mb-1">
              <TrendingUp className="h-3 w-3 md:h-4 md:w-4" style={{color: themeColors.primary}} />
              <div className="text-[10px] md:text-sm text-muted-foreground">R:R</div>
            </div>
            <div className="text-base md:text-3xl lg:text-4xl font-bold" style={{color: themeColors.primary}}>
              {monthlyStats.riskReward === Infinity ? '∞' : monthlyStats.riskReward.toFixed(2)}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 px-2 sm:px-6">
        <div className="space-y-3">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-3 mb-2">
            {DAYS.map((day) => (
              <div key={day} className="text-center text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground/60 py-1.5 sm:py-2">
                <span className="sm:hidden">{day.slice(0, 1)}</span>
                <span className="hidden sm:inline">{day}</span>
              </div>
            ))}
          </div>
          
          {/* Enhanced Calendar grid with better spacing and animations */}
          <div className={cn(
            "space-y-1 sm:space-y-3 transition-[opacity,transform] duration-300",
            isAnimating ? "opacity-50 scale-95" : "opacity-100 scale-100"
          )}>
            {weeks.map((week, weekIndex) => (
              <div
                key={`${currentDate.getFullYear()}-${currentDate.getMonth()}-${weekIndex}`}
                className="grid grid-cols-7 gap-1 sm:gap-3"
                style={{
                  animationDelay: `${weekIndex * 50}ms`
                }}
              >
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
                            ...getPnLStyle(day.pnl, day.trades),
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

                          <div className="flex flex-col items-center justify-between h-full py-1.5 sm:py-2.5 px-1 relative z-10">
                            {/* Date number — top left aligned */}
                            <div className={cn(
                              "self-start pl-0.5 text-[10px] sm:text-[11px] font-medium leading-none tabular-nums",
                              hasData ? `${getCellTextColor(day.pnl, day.trades)} opacity-60` :
                              day.isCurrentMonth ? "text-foreground/50" : "text-muted-foreground/30"
                            )}>
                              {day.date.getDate()}
                            </div>

                            {/* P&L — center */}
                            {hasData && (
                              <div className="flex flex-col items-center gap-1">
                                {/* Mobile */}
                                <div className={cn("sm:hidden text-sm font-black tracking-tighter leading-none drop-shadow-sm", getCellTextColor(day.pnl, day.trades))}>
                                  {Math.abs(day.pnl) >= 1000
                                    ? `${day.pnl >= 0 ? '+' : '-'}$${Math.abs(day.pnl/1000).toFixed(1)}k`
                                    : Math.abs(day.pnl) >= 10
                                      ? `${day.pnl >= 0 ? '+' : '-'}$${Math.abs(Math.round(day.pnl))}`
                                      : `${day.pnl >= 0 ? '+' : '-'}$${Math.abs(day.pnl).toFixed(1)}`
                                  }
                                </div>
                                {/* Desktop */}
                                <div className={cn("hidden sm:block text-xl font-black tracking-tighter leading-none drop-shadow-sm", getCellTextColor(day.pnl, day.trades))}>
                                  {day.pnl >= 0 ? '+' : '-'}${Math.abs(day.pnl) >= 1000
                                    ? `${(Math.abs(day.pnl) / 1000).toFixed(1)}k`
                                    : Math.abs(day.pnl).toFixed(0)
                                  }
                                </div>
                              </div>
                            )}

                            {/* Trade count + win rate — bottom */}
                            {hasData ? (
                              <div className={cn("text-[8px] sm:text-[10px] font-semibold leading-none opacity-75 tabular-nums", getCellTextColor(day.pnl, day.trades))}>
                                {day.trades}t · {day.winRate.toFixed(0)}%
                              </div>
                            ) : (
                              <div />
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
                              <FontAwesomeIcon icon={faBookOpen} className="h-2 w-2 sm:h-3 sm:w-3 text-slate-800 dark:text-white drop-shadow-lg" />
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
                            <div className="flex items-center justify-between pb-2 border-b border-border/50">
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
                                <div className="font-bold text-lg">
                                  {day.rr === 0 ? '-' : day.rr === Infinity ? '∞' : day.rr.toFixed(2)}
                                </div>
                              </div>
                            </div>
                            
                            {/* Additional stats */}
                            {(day.avgWin > 0 || day.avgLoss > 0) && (
                              <div className="pt-2 border-t border-border/30">
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
            ))}
          </div>
          
          {/* Enhanced Legend */}
          <div className="hidden sm:flex items-center justify-between mt-4 pt-3 border-t border-border/30">
            <div className="flex items-center gap-2 sm:gap-4 text-xs">
              <div className="flex items-center gap-1 sm:gap-2 group cursor-pointer">
                <div style={{width: '10px', height: '10px', borderRadius: '5px', backgroundColor: themeColors.profit, border: `1px solid ${themeColors.profit}`, boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'}} className="sm:w-3 sm:h-3"></div>
                <span className="font-medium text-muted-foreground text-xs" style={{'--hover-color': themeColors.profit} as any}>Profit Days</span>
                <Badge variant="outline" className="text-xs" style={{
                  color: themeColors.profit,
                  borderColor: themeColors.profit,
                  backgroundColor: alpha(themeColors.profit, '15')
                }}>
                  {monthlyStats.profitDays}
                </Badge>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 group cursor-pointer">
                <div style={{width: '10px', height: '10px', borderRadius: '5px', backgroundColor: themeColors.loss, border: `1px solid ${themeColors.loss}`, boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'}} className="sm:w-3 sm:h-3"></div>
                <span className="font-medium text-muted-foreground text-xs">Loss Days</span>
                <Badge variant="outline" className="text-xs" style={{
                  color: themeColors.loss,
                  borderColor: themeColors.loss,
                  backgroundColor: alpha(themeColors.loss, '15')
                }}>
                  {monthlyStats.lossDays}
                </Badge>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 group cursor-pointer">
                <div style={{width: '10px', height: '10px', borderRadius: '5px', backgroundColor: breakevenColor, border: `1px solid ${breakevenColor}`, boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'}} className="sm:w-3 sm:h-3"></div>
                <span className="font-medium text-muted-foreground text-xs">Breakeven</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 group cursor-pointer">
                <div style={{width: '10px', height: '10px', borderRadius: '5px', backgroundColor: 'transparent', border: '1px solid currentColor', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'}} className="sm:w-3 sm:h-3 text-muted-foreground"></div>
                <span className="font-medium text-muted-foreground group-hover:text-muted-foreground/80 text-xs">No Trading</span>
              </div>
              
              {/* Interactive shortcuts */}
              <div className="hidden sm:flex items-center gap-2 ml-4 text-[10px] text-muted-foreground/60">
                <kbd className="px-1.5 py-0.5 bg-muted/20 rounded text-[9px]">←</kbd>
                <kbd className="px-1.5 py-0.5 bg-muted/20 rounded text-[9px]">→</kbd>
                <span>navigate</span>
                <kbd className="px-1.5 py-0.5 bg-muted/20 rounded text-[9px]">Home</kbd>
                <span>today</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-xs">
              {monthlyStats.bestDay && (
                <div className="flex items-center gap-1">
                  <FontAwesomeIcon icon={faArrowUp} className="h-3 w-3" style={{color: themeColors.profit}} />
                  <span className="font-medium text-muted-foreground">Best: </span>
                  <span className="font-bold" style={{color: themeColors.profit}}>
                    {formatCurrency(monthlyStats.bestDay.pnl)}
                  </span>
                  <span className="text-muted-foreground">
                    ({monthlyStats.bestDay.date.getDate()})
                  </span>
                </div>
              )}
              {monthlyStats.worstDay && monthlyStats.worstDay.pnl < 0 && (
                <>
                  <div className="h-4 w-px bg-border"></div>
                  <div className="flex items-center gap-1">
                    <FontAwesomeIcon icon={faArrowDown} className="h-3 w-3" style={{color: themeColors.loss}} />
                    <span className="font-medium text-muted-foreground">Worst: </span>
                    <span className="font-bold" style={{color: themeColors.loss}}>
                      {formatCurrency(monthlyStats.worstDay.pnl)}
                    </span>
                    <span className="text-muted-foreground">
                      ({monthlyStats.worstDay.date.getDate()})
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Trade Entry & Journal Modal */}
      <Dialog open={isTradeDialogOpen} onOpenChange={setIsTradeDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-2 pb-4">
            <DialogTitle className="text-base sm:text-lg">
              {selectedDateForTrade?.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {isDemo ? 'View demo journal entries for this trading day' : 'Add trades or journal notes for this trading day'}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="journal" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-7 sm:h-9 p-0.5 sm:p-1 mb-4 sm:mb-5">
              <TabsTrigger
                value="journal"
                className="text-xs sm:text-sm py-1 sm:py-1.5 px-2 sm:px-3 h-6 sm:h-8 flex items-center justify-center"
              >
                Journal
              </TabsTrigger>
              <TabsTrigger
                value="trade"
                className="text-xs sm:text-sm py-1 sm:py-1.5 px-2 sm:px-3 h-6 sm:h-8 flex items-center justify-center"
              >
                Add Trade
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="journal" className="space-y-3 sm:space-y-4 mt-6 sm:mt-8">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground">
                  <FontAwesomeIcon icon={faPlus} className="h-3 w-3 sm:h-4 sm:w-4" />
                  Add New Journal Entry
                </div>

                {/* Compact form fields */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="journal-title" className="text-xs sm:text-sm">Entry Title</Label>
                    <Input
                      id="journal-title"
                      placeholder="Focus for this trading day"
                      value={journalTitle}
                      onChange={(e) => setJournalTitle(e.target.value)}
                      className="h-8 sm:h-9 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm">Link to Trade (Optional)</Label>
                    <Select value={selectedTradeId} onValueChange={setSelectedTradeId}>
                      <SelectTrigger className="h-8 sm:h-9 text-sm">
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

                  {/* Compact grid layout */}
                  <div className="grid grid-cols-2 gap-3 dialog-form-field">
                    <div className="space-y-1.5">
                      <Label className="text-xs sm:text-sm">Sentiment</Label>
                      <Select value={journalMood} onValueChange={(value: 'bullish' | 'bearish' | 'neutral') => setJournalMood(value)}>
                        <SelectTrigger className="h-8 sm:h-9 text-sm !py-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="neutral">😐 Neutral</SelectItem>
                          <SelectItem value="bullish">📈 Bullish</SelectItem>
                          <SelectItem value="bearish">📉 Bearish</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="journal-tags" className="text-xs sm:text-sm">Tags</Label>
                      <Input
                        id="journal-tags"
                        placeholder="strategy, analysis..."
                        value={journalTags}
                        onChange={(e) => setJournalTags(e.target.value)}
                        className="h-8 sm:h-9 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="journal-content" className="text-xs sm:text-sm">Trading Notes</Label>
                    <Textarea
                      id="journal-content"
                      placeholder="Record thoughts, observations, lessons learned..."
                      value={journalNote}
                      onChange={(e) => setJournalNote(e.target.value)}
                      className="min-h-[60px] sm:min-h-[80px] md:min-h-[120px] resize-none text-sm"
                    />
                  </div>
                </div>

                {/* Mobile-optimized button layout */}
                <div className="flex flex-col gap-2 pt-3 border-t border-border/50">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsTradeDialogOpen(false)} 
                      className="flex-1 h-9 text-sm"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSaveJournal} 
                      disabled={!journalNote.trim() || !journalTitle.trim()} 
                      className="flex-1 h-9 text-sm"
                    >
                      Save Entry
                    </Button>
                  </div>
                  
                  <Link to="/journal" onClick={() => setIsTradeDialogOpen(false)}>
                    <Button variant="outline" className="w-full h-8 text-xs gap-1.5">
                      <Plus className="h-3 w-3" />
                      Full Journal Features
                    </Button>
                  </Link>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="trade" className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Market</Label>
                    <Select value={tradeForm.market} onValueChange={(value: "forex" | "futures" | "indices") => {
                      setTradeForm(prev => ({ ...prev, market: value, symbol: "" }))
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="forex">💱 Forex</SelectItem>
                        <SelectItem value="futures">📊 Futures</SelectItem>
                        <SelectItem value="indices">📈 Indices</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Side</Label>
                    <Select value={tradeForm.side} onValueChange={(value: "long" | "short") => setTradeForm(prev => ({ ...prev, side: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="long">📈 Long (Buy)</SelectItem>
                        <SelectItem value="short">📉 Short (Sell)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="trade-symbol">Symbol</Label>
                    <Select value={tradeForm.symbol} onValueChange={(value) => setTradeForm(prev => ({ ...prev, symbol: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select instrument" />
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
                  
                  <div className="space-y-2">
                    <Label>Prop Firm</Label>
                    <Select value={tradeForm.propFirm} onValueChange={(value) => setTradeForm(prev => ({ ...prev, propFirm: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {PROP_FIRMS.map((firm) => (
                          <SelectItem key={firm} value={firm}>
                            {firm}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="trade-entry">Entry Price</Label>
                    <Input
                      id="trade-entry"
                      type="number"
                      step="0.00001"
                      placeholder="1.08450"
                      value={tradeForm.entryPrice}
                      onChange={(e) => setTradeForm(prev => ({ ...prev, entryPrice: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="trade-exit">Exit Price</Label>
                    <Input
                      id="trade-exit"
                      type="number"
                      step="0.00001"
                      placeholder="1.08650"
                      value={tradeForm.exitPrice}
                      onChange={(e) => setTradeForm(prev => ({ ...prev, exitPrice: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="trade-size">Lot Size</Label>
                    <Input
                      id="trade-size"
                      type="number"
                      step="0.01"
                      placeholder="1.00"
                      value={tradeForm.lotSize}
                      onChange={(e) => setTradeForm(prev => ({ ...prev, lotSize: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="trade-pnl">P&L (optional)</Label>
                    <Input
                      id="trade-pnl"
                      type="number"
                      step="0.01"
                      placeholder="Auto-calculated"
                      value={tradeForm.pnl}
                      onChange={(e) => setTradeForm(prev => ({ ...prev, pnl: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trade-strategy">Strategy</Label>
                  <Input
                    id="trade-strategy"
                    placeholder="Breakout, Support/Resistance, etc."
                    value={tradeForm.strategy}
                    onChange={(e) => setTradeForm(prev => ({ ...prev, strategy: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trade-notes">Notes</Label>
                  <Textarea
                    id="trade-notes"
                    placeholder="Trade reasoning, market conditions, etc."
                    value={tradeForm.notes}
                    onChange={(e) => setTradeForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="min-h-[80px]"
                  />
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t">
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => {
                      // Save form data to pre-fill Trade Log
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
                    <Plus className="h-4 w-4" />
                    Full Trade Journal
                  </Button>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={() => setIsTradeDialogOpen(false)} className="w-full sm:w-auto">
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSaveTrade} 
                      disabled={!tradeForm.symbol || !tradeForm.entryPrice || !tradeForm.exitPrice}
                      className="w-full sm:w-auto"
                    >
                      Save Trade
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </Card>
  )
}