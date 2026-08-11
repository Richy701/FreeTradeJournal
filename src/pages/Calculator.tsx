import { useThemePresets } from '@/contexts/theme-presets'
import { Calculator as CalculatorIcon } from '@phosphor-icons/react'
import { SiteHeader } from "@/components/site-header"
import { AppFooter } from "@/components/app-footer"
import { PositionSizeCalculator, CalculatorDisclaimer } from '@/components/position-size-calculator'

export default function Calculator() {
  const { themeColors, alpha } = useThemePresets()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <div className="border-b bg-card/80 backdrop-blur-xl shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg shrink-0 mt-0.5" style={{ backgroundColor: alpha(themeColors.primary, '15') }}>
              <CalculatorIcon className="h-5 w-5" style={{ color: themeColors.primary }} />
            </div>
            <div className="space-y-0.5">
              <h1 className="font-display text-2xl font-bold" style={{ color: themeColors.primary }}>
                Position Calculator
              </h1>
              <p className="text-sm text-muted-foreground">
                Size forex and futures trades from your balance, risk, and stop loss.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6">
        <PositionSizeCalculator />
        <div className="mt-6">
          <CalculatorDisclaimer />
        </div>
      </div>
      <AppFooter />
    </div>
  )
}
