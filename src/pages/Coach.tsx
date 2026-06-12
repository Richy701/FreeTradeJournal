import { TradingCoach } from "@/components/trading-coach"
import { AIAnalysis } from "@/components/ai-analysis"
import { useThemePresets } from "@/contexts/theme-presets"
import { useDemoData } from "@/hooks/use-demo-data"
import { Brain } from "@phosphor-icons/react"

export default function Coach() {
  const { themeColors, alpha } = useThemePresets()
  const { getTrades } = useDemoData()
  const trades = getTrades() || []

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-lg shrink-0 mt-0.5" style={{ backgroundColor: alpha(themeColors.primary, '15') }}>
          <Brain className="h-5 w-5" style={{ color: themeColors.primary }} />
        </div>
        <div className="space-y-0.5">
          <h1 className="font-display text-2xl font-bold" style={{ color: themeColors.primary }}>AI Coach</h1>
          <p className="text-sm text-muted-foreground">Coach FTJ — personalized insights and analysis from your trades</p>
        </div>
      </div>

      <TradingCoach />
      <AIAnalysis trades={trades as any} />
    </div>
  )
}
