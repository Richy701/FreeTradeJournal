import { SectionCards } from "@/components/section-cards"
import { useThemePresets } from '@/contexts/theme-presets'
import { useAuth } from '@/contexts/auth-context'
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { CalendarHeatmap } from "@/components/calendar-heatmap"
import { Skeleton } from "@/components/ui/skeleton"
import { useState, useEffect } from "react"

export default function Dashboard() {
  const { themeColors } = useThemePresets()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)

  // Generate personalized greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    const firstName = user?.displayName?.split(' ')[0] || 'Trader'
    
    if (hour >= 5 && hour < 12) {
      return `Good morning, ${firstName}!`
    } else if (hour >= 12 && hour < 17) {
      return `Good afternoon, ${firstName}!`
    } else if (hour >= 17 && hour < 22) {
      return `Good evening, ${firstName}!`
    } else {
      return `Welcome back, ${firstName}!`
    }
  }

  useEffect(() => {
    // Simulate initial load time for better UX
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  // Skeleton loader components
  const MetricCardSkeleton = () => (
    <div className="bg-muted/30 backdrop-blur-sm rounded-lg border p-6 space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )

  const ChartSkeleton = ({ height = "h-[400px]" }) => (
    <div className={`bg-muted/30 backdrop-blur-sm rounded-lg border p-6 ${height}`}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-full w-full rounded" />
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        {/* Header Skeleton */}
        <div className="border-b bg-card/80 backdrop-blur-xl">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div className="space-y-3">
                <Skeleton className="h-12 w-80" />
                <Skeleton className="h-6 w-96" />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 sm:space-y-12 animate-in fade-in-0 duration-500">
          {/* Metrics Cards Skeleton */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <MetricCardSkeleton key={i} />
            ))}
          </div>

          {/* Main Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ChartSkeleton />
            </div>
            <div className="lg:col-span-1">
              <ChartSkeleton />
            </div>
          </div>

          {/* Calendar Skeleton */}
          <ChartSkeleton height="h-[500px]" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Enhanced Header Section */}
      <div className="border-b bg-card/80 backdrop-blur-xl sticky top-0 z-10 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="space-y-4">
              {/* Personalized Greeting */}
              <div className="space-y-1">
                <p className="text-lg font-semibold text-foreground opacity-90">
                  {getGreeting()}
                </p>
                <div className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
              
              {/* Dashboard Title */}
              <div className="space-y-2">
                <h1 
                  className="text-4xl sm:text-5xl font-black bg-clip-text text-transparent leading-tight pb-1"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.primary}DD, ${themeColors.primary}AA)`
                  }}
                >
                  Trading Dashboard
                </h1>
                <p className="text-muted-foreground text-lg sm:text-xl font-medium max-w-2xl">
                  Track your performance and analyze your trades
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 sm:space-y-12 overflow-visible">
        {/* Top metrics row with staggered animation */}
        <div className="animate-in slide-in-from-bottom-4 duration-500 delay-100 overflow-visible">
          <SectionCards />
        </div>
        
        {/* Main content area - 2:1 ratio with enhanced spacing */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-500 delay-200">
          {/* Equity curve - takes 2/3 width */}
          <div className="lg:col-span-2">
            <ChartAreaInteractive />
          </div>
          
          {/* Recent trades - takes 1/3 width */}
          <div className="lg:col-span-1">
            <DataTable />
          </div>
        </div>
        
        {/* Calendar Section */}
        <div className="animate-in slide-in-from-bottom-4 duration-500 delay-300">
          <CalendarHeatmap />
        </div>
      </div>
    </div>
  )
}