import { useMemo, useState, useEffect } from "react"
import { useThemePresets } from '@/contexts/theme-presets'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDays, faArrowUp, faArrowDown, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
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
      return 'border-2 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer'
    } else if (pnl < 0) {
      // Use theme loss color
      return 'border-2 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer'
    }
    
    return 'bg-gray-400 border-gray-300/50 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer' // Breakeven
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg -translate-y-4" style={{backgroundColor: `${themeColors.primary}20`}}>
              <FontAwesomeIcon icon={faCalendarDays} className="h-4 w-4" style={{color: themeColors.primary}} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousMonth}
                  className="h-9 w-9 p-0 hover:scale-110 transition-transform"
                  title="Previous month (←)"
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" />
                </Button>
                
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-semibold">Trading Calendar</CardTitle>
                  <div className="flex items-center gap-2">
                    <Select value={selectedMonth.toString()} onValueChange={(value) => jumpToMonth(parseInt(value), selectedYear)}>
                      <SelectTrigger className="w-24 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((month, index) => (
                          <SelectItem key={index} value={index.toString()}>{month}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={selectedYear.toString()} onValueChange={(value) => jumpToMonth(selectedMonth, parseInt(value))}>
                      <SelectTrigger className="w-20 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map((year) => (
                          <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextMonth}
                  className="h-9 w-9 p-0 hover:scale-110 transition-transform"
                  title="Next month (→)"
                >
                  <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" />
                </Button>
                
                <Button
                  variant="default"
                  size="sm"
                  onClick={goToToday}
                  className="h-8 px-3 text-xs font-medium hover:scale-105 transition-transform"
                  style={{
                    background: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.primary}CC)`,
                    color: 'white'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `linear-gradient(to right, ${themeColors.primary}E6, ${themeColors.primary}B3)`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = `linear-gradient(to right, ${themeColors.primary}, ${themeColors.primary}CC)`
                  }}
                  title="Jump to today (Home)"
                >
                  Today
                </Button>
                
                {/* Quick stats indicator */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{backgroundColor: themeColors.profit}}></div>
                  <span className="font-medium">{monthlyStats.activeDays} active</span>
                </div>
              </div>
              <CardDescription className="text-muted-foreground font-medium">
                Daily performance overview • Use ← → keys to navigate • Click days for details
              </CardDescription>
            </div>
          </div>
          
          {/* Monthly Summary Statistics */}
          <div className="flex items-center gap-3">
            <div className="text-center px-2">
              <div className="text-3xl font-black tracking-tight" style={{letterSpacing: '-0.02em', color: monthlyStats.totalPnL >= 0 ? themeColors.profit : themeColors.loss}}>
                {monthlyStats.totalPnL >= 0 ? '+' : ''}{formatCurrency(monthlyStats.totalPnL)}
              </div>
              <div className="text-xs text-muted-foreground font-semibold">Monthly P&L</div>
            </div>
            <div className="h-12 w-px bg-border"></div>
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center">
                <div className="text-lg font-bold tracking-tight" style={{letterSpacing: '-0.02em', color: themeColors.primary}}>
                  {monthlyStats.winRate.toFixed(1)}%
                </div>
                <div className="text-[10px] text-muted-foreground font-medium">Win Rate</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold tracking-tight" style={{letterSpacing: '-0.02em', color: themeColors.primary}}>
                  {monthlyStats.riskReward === Infinity ? '∞' : monthlyStats.riskReward.toFixed(2)}
                </div>
                <div className="text-[10px] text-muted-foreground font-medium">R:R</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold tracking-tight" style={{letterSpacing: '-0.02em'}}>
                  <span style={{color: themeColors.profit}}>{monthlyStats.totalWinningTrades}</span>
                  <span className="text-muted-foreground text-sm mx-0.5">/</span>
                  <span style={{color: themeColors.loss}}>{monthlyStats.totalLosingTrades}</span>
                </div>
                <div className="text-[10px] text-muted-foreground font-medium">W/L</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold tracking-tight text-foreground" style={{letterSpacing: '-0.02em'}}>
                  {monthlyStats.totalTrades}
                </div>
                <div className="text-[10px] text-muted-foreground font-medium">Trades</div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-4 mb-3">
            {DAYS.map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                {day}
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
                className="grid grid-cols-7 gap-4"
                style={{
                  animationDelay: `${weekIndex * 50}ms`
                }}
              >
                {week.map((day) => {
                  const isToday = day.date.toDateString() === today.toDateString()
                  const hasData = day.trades > 0
                  
                  return (
                    <Popover key={day.date.toISOString()} open={isPopoverOpen && selectedDay?.date.toISOString() === day.date.toISOString()}>
                      <PopoverTrigger asChild>
                        <div
                          className={cn(
                            "h-20 rounded-xl relative overflow-hidden",
                            getPnLColor(day.pnl, day.trades),
                            day.isCurrentMonth ? "opacity-100" : "opacity-50",
                            hasData && "hover:z-10"
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
                              <>
                                <div className="text-lg leading-none font-black text-white drop-shadow-sm">
                                  {day.pnl >= 0 ? '+' : ''}${Math.abs(day.pnl) >= 1000 ? 
                                    `${(Math.abs(day.pnl) / 1000).toFixed(1)}k` : 
                                    Math.abs(day.pnl).toFixed(0)
                                  }
                                </div>
                                <div className="text-[8px] leading-none font-semibold text-white/70 drop-shadow-sm mt-0.5 text-center">
                                  {day.trades} {day.trades === 1 ? 'trade' : 'trades'} • {day.winRate.toFixed(0)}%
                                </div>
                              </>
                            )}
                          </div>
                          
                          {/* Today indicator */}
                          {isToday && (
                            <div className="absolute top-1 right-1 w-2 h-2 rounded-full shadow-sm" style={{backgroundColor: themeColors.primary}} />
                          )}
                        </div>
                      </PopoverTrigger>
                      {hasData && (
                        <PopoverContent className="w-64 p-0 border-0 shadow-xl" side="top" align="center">
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
                                className="text-sm font-bold px-2 py-1 rounded-md"
                                style={{
                                  color: 'white',
                                  backgroundColor: day.pnl >= 0 ? themeColors.profit : themeColors.loss
                                }}
                              >
                                {day.pnl >= 0 ? '+' : ''}{formatCurrency(day.pnl)}
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
                <div className="w-3 h-3 rounded-md shadow-sm group-hover:scale-110 transition-transform" style={{backgroundColor: themeColors.profit}}></div>
                <span className="font-medium text-muted-foreground group-hover:transition-colors" style={{'--hover-color': themeColors.profit} as any}>Profit Days</span>
                <Badge variant="outline" className="text-xs group-hover:scale-105 transition-transform" style={{
                  color: themeColors.profit, 
                  borderColor: themeColors.profit,
                  backgroundColor: `${themeColors.profit}15`
                }}>
                  {monthlyStats.profitDays}
                </Badge>
              </div>
              <div className="flex items-center gap-2 group cursor-pointer">
                <div className="w-3 h-3 rounded-md shadow-sm group-hover:scale-110 transition-transform" style={{backgroundColor: themeColors.loss}}></div>
                <span className="font-medium text-muted-foreground transition-colors">Loss Days</span>
                <Badge variant="outline" className="text-xs group-hover:scale-105 transition-transform" style={{
                  color: themeColors.loss,
                  borderColor: themeColors.loss,
                  backgroundColor: `${themeColors.loss}15`
                }}>
                  {monthlyStats.lossDays}
                </Badge>
              </div>
              <div className="flex items-center gap-2 group cursor-pointer">
                <div className="w-3 h-3 bg-gray-400 rounded-md shadow-sm group-hover:scale-110 transition-transform"></div>
                <span className="font-medium text-muted-foreground group-hover:text-gray-600 transition-colors">Breakeven</span>
              </div>
              <div className="flex items-center gap-2 group cursor-pointer">
                <div className="w-3 h-3 bg-muted/20 rounded-md border border-muted/30 group-hover:scale-110 transition-transform"></div>
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
    </Card>
  )
}