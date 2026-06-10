import { PerformanceGoals } from "@/components/performance-goals"
import { useThemePresets } from '@/contexts/theme-presets'
import { Target } from '@phosphor-icons/react'
import { SiteHeader } from "@/components/site-header"
import { AppFooter } from "@/components/app-footer"
import { AIGoalCoach } from '@/components/ai-goal-coach'

export default function Goals() {
  const { themeColors, alpha } = useThemePresets()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <div className="border-b bg-card/80 backdrop-blur-xl shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg shrink-0 mt-0.5" style={{ backgroundColor: alpha(themeColors.primary, '15') }}>
              <Target className="h-5 w-5" style={{ color: themeColors.primary }} />
            </div>
            <div className="space-y-0.5">
              <h1 className="font-display text-2xl font-bold" style={{ color: themeColors.primary }}>
                Goals & Risk Management
              </h1>
              <p className="text-sm text-muted-foreground">
                Set targets, protect your capital, and track your discipline.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        <PerformanceGoals />
        <AIGoalCoach />
      </div>
      <AppFooter />
    </div>
  )
}
