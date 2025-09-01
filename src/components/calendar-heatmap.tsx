import { useMemo, useState, useEffect } from "react"
import { useThemePresets } from '@/contexts/theme-presets'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDays, faArrowUp, faArrowDown, faChevronLeft, faChevronRight, faBookOpen, faPlus } from '@fortawesome/free-solid-svg-icons'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Link } from "react-router-dom"
import { Plus } from "lucide-react"
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
  const { themeColors } = useThemePresets()
  
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

  const propFirms = [
    "E8 Markets",
    "Funded FX", 
    "FundingPips",
    "TopStep",
    "FTMO",
    "Alpha Capital Group",
    "Apex Trader Funding",
    "The5ers"
  ]

  const getInstrumentsByMarket = (market: string) => {
    switch (market) {
      case 'forex':
        return ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD', 'EURJPY', 'GBPJPY', 'EURGBP'];
      case 'futures':
        return ['ES', 'NQ', 'YM', 'RTY', 'CL', 'GC', 'SI', 'ZB', 'ZN', 'ZF'];
      case 'indices':
        return ['SPX500', 'NAS100', 'US30', 'GER40', 'UK100', 'FRA40', 'JPN225', 'AUS200'];
      default:
        return [];
    }
  }

  // Get trades from localStorage
  const trades = useMemo(() => {
    const storedTrades = localStorage.getItem('trades')
    if (!storedTrades) return []
    
    try {
      const parsedTrades = JSON.parse(storedTrades)
      return parsedTrades.map((trade: any) => ({
        ...trade,
        entryTime: new Date(trade.entryTime),
        exitTime: new Date(trade.exitTime)
      }))
    } catch {
      return []
    }
  }, [])

  // Get journal entries from localStorage (now supports multiple entries per day)
  const journalEntries = useMemo(() => {
    const savedEntries = localStorage.getItem('journalEntries')
    if (!savedEntries) return {} as Record<string, any[]>
    
    try {
      const entries = JSON.parse(savedEntries)
      const journalByDate: Record<string, any[]> = {}
      
      entries.forEach((entry: any) => {
        const dateKey = new Date(entry.date).toISOString().split('T')[0]
        if (!journalByDate[dateKey]) {
          journalByDate[dateKey] = []
        }
        journalByDate[dateKey].push(entry)
      })
      
      return journalByDate
    } catch {
      return {} as Record<string, any[]>
    }
  }, [isTradeDialogOpen]) // Re-check when modal closes

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
    const savedEntries = localStorage.getItem('journalEntries')
    let dayEntries = []
    if (savedEntries) {
      try {
        const entries = JSON.parse(savedEntries)
        const dateKey = date.toISOString().split('T')[0]
        dayEntries = entries.filter((entry: any) => {
          const entryDate = new Date(entry.date).toISOString().split('T')[0]
          return entryDate === dateKey
        })
      } catch {
        dayEntries = []
      }
    }
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
    
    const savedEntries = localStorage.getItem('journalEntries')
    let entries = []
    
    if (savedEntries) {
      try {
        entries = JSON.parse(savedEntries)
      } catch {
        entries = []
      }
    }
    
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
    
    localStorage.setItem('journalEntries', JSON.stringify(entries))
    
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
    
    const savedTrades = localStorage.getItem('trades')
    let trades = []
    
    if (savedTrades) {
      try {
        trades = JSON.parse(savedTrades)
      } catch {
        trades = []
      }
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
      propFirm: tradeForm.propFirm === "none" ? "" : tradeForm.propFirm
    }
    
    trades.unshift(newTrade)
    localStorage.setItem('trades', JSON.stringify(trades))
    
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

  const getPnLColor = (pnl: number, trades: number) => {
    if (trades === 0) return 'bg-muted/10 border-muted/30 hover:bg-muted/20 transition-colors duration-200 cursor-default'
    
    // Use theme colors for styling
    const profitColor = themeColors.profit
    const lossColor = themeColors.loss
    
    if (pnl > 0) {
      // Use theme profit color with different opacities for intensity
      return 'border-2 shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer'
    } else if (pnl < 0) {
      // Use theme loss color
      return 'border-2 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer'
    }
    
    return 'bg-gray-400 border-gray-300/50 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer' // Breakeven
  }
  
  const getPnLStyle = (pnl: number, trades: number) => {
    if (trades === 0) return {}
    
    if (pnl > 0) {
      // Use theme profit color with opacity based on amount
      const opacity = pnl >= 1000 ? 0.9 : pnl >= 500 ? 0.8 : pnl >= 100 ? 0.7 : 0.6
      return { 
        backgroundColor: themeColors.profit,
        opacity: opacity,
        borderColor: themeColors.profit
      }
    } else if (pnl < 0) {
      // Use theme loss color with consistent opacity
      const opacity = Math.abs(pnl) >= 1000 ? 0.9 : Math.abs(pnl) >= 500 ? 0.8 : Math.abs(pnl) >= 100 ? 0.7 : 0.6
      return { 
        backgroundColor: themeColors.loss,
        opacity: opacity,
        borderColor: themeColors.loss
      }
    }
    
    return { backgroundColor: '#9ca3af', opacity: 0.7 } // Gray for breakeven
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
    <Card className="hover:shadow-lg transition-shadow duration-200 border-0">
      <CardHeader className="pb-4 border-b border-border/30">
        <div className="space-y-4">
          {/* Title and icon - Mobile friendly v2 */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{backgroundColor: `${themeColors.primary}20`}}>
              <FontAwesomeIcon icon={faCalendarDays} className="h-4 w-4" style={{color: themeColors.primary}} />
            </div>
            <CardTitle className="text-lg sm:text-xl font-semibold">
              Trading Calendar
            </CardTitle>
          </div>

          {/* Mobile-first navigation */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Navigation controls */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousMonth}
                className="h-10 w-10 p-0 touch-manipulation"
                title="Previous month (←)"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4" />
              </Button>

              <div className="flex gap-2">
                <Select value={selectedMonth.toString()} onValueChange={(value) => jumpToMonth(parseInt(value), selectedYear)}>
                  <SelectTrigger className="w-20 h-10 text-sm touch-manipulation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month, index) => (
                      <SelectItem key={index} value={index.toString()}>{month.slice(0,3)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedYear.toString()} onValueChange={(value) => jumpToMonth(selectedMonth, parseInt(value))}>
                  <SelectTrigger className="w-20 h-10 text-sm touch-manipulation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map((year) => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={goToNextMonth}
                className="h-10 w-10 p-0 touch-manipulation"
                title="Next month (→)"
              >
                <FontAwesomeIcon icon={faChevronRight} className="h-4 w-4" />
              </Button>
            </div>

            {/* Today button */}
            <Button
              onClick={goToToday}
              className="h-10 px-6"
              style={{
                background: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.primary}CC)`,
                color: 'white'
              }}
            >
              Today
            </Button>
          </div>

          {/* Mobile instruction text */}
          <CardDescription className="text-xs sm:text-sm text-muted-foreground font-medium text-center sm:text-left">
            <span className="hidden sm:inline">Daily performance overview • Use ← → keys to navigate • Click days to add trades or view details</span>
            <span className="sm:hidden">Tap dates to add trades or view details</span>
          </CardDescription>
        </div>

        {/* Mobile-optimized stats panel */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="text-center space-y-1">
            <div className="text-lg sm:text-xl font-bold" style={{color: monthlyStats.totalPnL >= 0 ? themeColors.profit : themeColors.loss}}>
              {monthlyStats.totalPnL >= 0 ? '+' : ''}{formatCurrency(monthlyStats.totalPnL)}
            </div>
            <div className="text-xs text-muted-foreground">Monthly P&L</div>
          </div>
          
          <div className="text-center space-y-1">
            <div className="text-lg sm:text-xl font-bold">
              {monthlyStats.winRate.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Win Rate</div>
          </div>
          
          <div className="text-center space-y-1">
            <div className="text-lg sm:text-xl font-bold">
              <span style={{color: themeColors.profit}}>{monthlyStats.totalWinningTrades}</span>
              <span className="text-muted-foreground mx-1">/</span>
              <span style={{color: themeColors.loss}}>{monthlyStats.totalLosingTrades}</span>
            </div>
            <div className="text-xs text-muted-foreground">W/L</div>
          </div>
          
          <div className="text-center space-y-1">
            <div className="text-lg sm:text-xl font-bold">
              {monthlyStats.totalTrades}
            </div>
            <div className="text-xs text-muted-foreground">Trades</div>
          </div>
        </div>
        
        {/* Active trades indicator */}
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-muted-foreground">{monthlyStats.activeDays} active</span>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-4 mb-3">
            {DAYS.map((day) => (
              <div key={day} className="text-center text-xs sm:text-sm font-semibold text-muted-foreground py-1 sm:py-2">
                <span className="sm:hidden">{day.slice(0, 1)}</span>
                <span className="hidden sm:inline">{day}</span>
              </div>
            ))}
          </div>
          
          {/* Enhanced Calendar grid with better spacing and animations */}
          <div className={cn(
            "space-y-4 transition-all duration-300",
            isAnimating ? "opacity-50 scale-95" : "opacity-100 scale-100"
          )}>
            {weeks.map((week, weekIndex) => (
              <div 
                key={`${currentDate.getFullYear()}-${currentDate.getMonth()}-${weekIndex}`} 
                className="grid grid-cols-7 gap-1 sm:gap-4"
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
                          className={cn(
                            "h-16 sm:h-20 rounded-lg sm:rounded-xl relative overflow-hidden",
                            getPnLColor(day.pnl, day.trades),
                            day.isCurrentMonth ? "opacity-100" : "opacity-50",
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
                        >
                          {/* Subtle gradient overlay for depth */}
                          {hasData && (
                            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                          )}
                          
                          <div className="flex flex-col items-center justify-center h-full px-2 relative z-10">
                            <div className={cn(
                              "text-xs font-bold leading-none mb-1",
                              day.pnl > 0 ? "text-white/80 drop-shadow-sm" : 
                              day.pnl < 0 ? "text-white/80 drop-shadow-sm" : 
                              hasData ? "text-white/80 drop-shadow-sm" :
                              day.isCurrentMonth ? "text-foreground" : "text-muted-foreground"
                            )}>
                              {day.date.getDate()}
                            </div>
                            
                            {hasData && (
                              <div className="flex flex-col items-center justify-center h-full px-1 relative z-10">
                                {/* Mobile: Single line with just P&L */}
                                <div className="sm:hidden text-center">
                                  <div className="text-xs font-bold text-white drop-shadow-sm leading-none">
                                    {day.pnl >= 0 ? '+' : ''}${Math.abs(day.pnl) >= 1000 ? 
                                      `${(day.pnl/1000).toFixed(1)}k` : 
                                      Math.abs(day.pnl).toFixed(0)
                                    }
                                  </div>
                                </div>

                                {/* Desktop: Full details */}
                                <div className="hidden sm:flex sm:flex-col sm:items-center sm:justify-center sm:h-full">
                                  <div className="text-lg leading-none font-black text-white drop-shadow-sm">
                                    {day.pnl >= 0 ? '+' : ''}${Math.abs(day.pnl) >= 1000 ?
                                      `${(Math.abs(day.pnl) / 1000).toFixed(1)}k` :
                                      Math.abs(day.pnl).toFixed(0)
                                    }
                                  </div>
                                  <div className="text-[8px] leading-none font-semibold text-white/70 drop-shadow-sm mt-0.5 text-center">
                                    {day.trades} {day.trades === 1 ? 'trade' : 'trades'} • {day.winRate.toFixed(0)}%
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Today indicator */}
                          {isToday && (
                            <div className="absolute top-1 right-1 w-2 h-2 rounded-full shadow-sm" style={{backgroundColor: themeColors.primary}} />
                          )}
                          
                          {/* Add trade indicator for empty dates */}
                          {!hasData && day.isCurrentMonth && (
                            <div className="absolute bottom-1 right-1 opacity-0 hover:opacity-100 transition-opacity">
                              <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                                <Plus className="h-2 w-2 text-primary" />
                              </div>
                            </div>
                          )}
                          
                          {/* Journal indicator with count */}
                          {hasJournal && (
                            <div className="absolute top-1 left-1 flex items-center gap-1">
                              <FontAwesomeIcon icon={faBookOpen} className="h-3 w-3 text-slate-800 dark:text-white drop-shadow-lg" />
                              {journalEntries[dateKey].length > 1 && (
                                <div className="bg-slate-800 dark:bg-white text-white dark:text-slate-800 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center drop-shadow-lg">
                                  {journalEntries[dateKey].length}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </PopoverTrigger>
                      {hasData && (
                        <PopoverContent className="w-[90vw] max-w-64 p-0 border-0 shadow-xl" side="top" align="center">
                          <div className="bg-card/95 backdrop-blur-md rounded-lg border p-4 space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-border/50">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{backgroundColor: day.pnl > 0 ? themeColors.profit : day.pnl < 0 ? themeColors.loss : '#9ca3af'}}
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
                                  color: 'white',
                                  backgroundColor: day.pnl >= 0 ? themeColors.profit : themeColors.loss
                                }}
                              >
                                <span className="hidden sm:inline">{day.pnl >= 0 ? '+' : ''}{formatCurrency(day.pnl)}</span>
                                <span className="sm:hidden">{day.pnl >= 0 ? '+' : ''}{formatCurrencyMobile(day.pnl)}</span>
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
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2 group cursor-pointer">
                <div className="w-3 h-3 rounded-md shadow-sm " style={{backgroundColor: themeColors.profit}}></div>
                <span className="font-medium text-muted-foreground group-hover:transition-colors" style={{'--hover-color': themeColors.profit} as any}>Profit Days</span>
                <Badge variant="outline" className="text-xs " style={{
                  color: themeColors.profit, 
                  borderColor: themeColors.profit,
                  backgroundColor: `${themeColors.profit}15`
                }}>
                  {monthlyStats.profitDays}
                </Badge>
              </div>
              <div className="flex items-center gap-2 group cursor-pointer">
                <div className="w-3 h-3 rounded-md shadow-sm " style={{backgroundColor: themeColors.loss}}></div>
                <span className="font-medium text-muted-foreground transition-colors">Loss Days</span>
                <Badge variant="outline" className="text-xs " style={{
                  color: themeColors.loss,
                  borderColor: themeColors.loss,
                  backgroundColor: `${themeColors.loss}15`
                }}>
                  {monthlyStats.lossDays}
                </Badge>
              </div>
              <div className="flex items-center gap-2 group cursor-pointer">
                <div className="w-3 h-3 bg-gray-400 rounded-md shadow-sm "></div>
                <span className="font-medium text-muted-foreground group-hover:text-gray-600 transition-colors">Breakeven</span>
              </div>
              <div className="flex items-center gap-2 group cursor-pointer">
                <div className="w-3 h-3 bg-muted/20 rounded-md border border-muted/30 "></div>
                <span className="font-medium text-muted-foreground group-hover:text-muted-foreground/80 transition-colors">No Trading</span>
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
              Add trades or journal notes for this trading day
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
                        {propFirms.map((firm) => (
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
                      localStorage.setItem('prefilledTradeForm', JSON.stringify(prefilledData));
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