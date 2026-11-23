import { SiteHeader } from "@/components/site-header"
import { AppFooter } from "@/components/app-footer"
import { PositionSizeCalculator, CalculatorDisclaimer } from '@/components/position-size-calculator'

export default function Calculator() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <header data-calculator-header className="px-4 pt-6 sm:px-6 lg:px-8">
        <div className="space-y-1 border-b pb-5">
          <h1 className="text-2xl font-semibold tracking-tight">Position Calculator</h1>
          <p className="text-sm text-muted-foreground">Calculate forex lots and futures contracts from your balance, risk, and stop loss.</p>
        </div>
      </header>

      <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6">
        <PositionSizeCalculator inApp />
        <div className="mt-6">
          <CalculatorDisclaimer />
        </div>
      </div>
      <AppFooter />
    </div>
  )
}
