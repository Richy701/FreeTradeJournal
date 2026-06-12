import { TradingCoach } from "@/components/trading-coach"
import { AIAnalysis } from "@/components/ai-analysis"
import { SiteHeader } from "@/components/site-header"
import { AppFooter } from "@/components/app-footer"
import { useThemePresets } from "@/contexts/theme-presets"
import { useDemoData } from "@/hooks/use-demo-data"
import { Brain } from "@phosphor-icons/react"

export default function Coach() {
  const { themeColors, alpha } = useThemePresets()
  const { getTrades } = useDemoData()
  const trades = getTrades() || []

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <div className="border-b bg-card/80 backdrop-blur-xl shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg shrink-0 mt-0.5" style={{ backgroundColor: alpha(themeColors.primary, '15') }}>
              <Brain className="h-5 w-5" style={{ color: themeColors.primary }} />
            </div>
            <div className="space-y-0.5">
              <h1 className="font-display text-2xl font-bold" style={{ color: themeColors.primary }}>AI Coach</h1>
              <p className="text-sm text-muted-foreground">Coach FTJ — personalized insights and analysis from your trades</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <TradingCoach />
        <AIAnalysis trades={trades as any} />
      </div>
      <AppFooter />
    </div>
  )
}
