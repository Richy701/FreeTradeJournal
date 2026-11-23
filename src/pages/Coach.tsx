import { TradingCoach } from "@/components/trading-coach"
import { AIAnalysis } from "@/components/ai-analysis"
import { SiteHeader } from "@/components/site-header"
import { AppFooter } from "@/components/app-footer"
import { useDemoData } from "@/hooks/use-demo-data"
import { Brain, Target, ChartBar } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useState } from 'react'
import { WeeklyFocus, type FocusSuggestion } from '@/components/weekly-focus'
import { useAccounts } from '@/contexts/account-context'
import { trackEvent } from '@/lib/analytics'
import { useAuth } from '@/contexts/auth-context'

export default function Coach() {
  const { getTrades } = useDemoData()
  const trades = getTrades() || []
  const { activeAccount, isAllAccounts } = useAccounts()
  const { user } = useAuth()
  const [suggestion, setSuggestion] = useState<(FocusSuggestion & { accountId: string; userId?: string }) | undefined>()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <div data-coach-page className="w-full flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b pb-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-semibold tracking-tight">AI Coach</h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">Your next step to better trading.</p>
          </div>
          <nav aria-label="Coach sections" className="flex flex-wrap gap-2">
            <Button asChild variant="secondary" size="sm"><a href="#coaching"><Brain className="h-4 w-4" />Coaching</a></Button>
            <Button asChild variant="ghost" size="sm"><a href="#weekly-focus"><Target className="h-4 w-4" />Weekly focus</a></Button>
            <Button asChild variant="ghost" size="sm"><a href="#trade-analysis"><ChartBar className="h-4 w-4" />Trade analysis</a></Button>
          </nav>
        </header>

        <section id="coaching" aria-label="Your coaching brief" className="scroll-mt-24">
          <TradingCoach workspace onChooseFocus={!isAllAccounts && activeAccount ? message => {
            setSuggestion({ message, selection: Date.now(), accountId: activeAccount.id, userId: user?.uid })
            trackEvent('weekly_focus_tip_selected')
          } : undefined} />
        </section>
        <WeeklyFocus suggestion={suggestion?.accountId === activeAccount?.id && suggestion?.userId === user?.uid ? suggestion : undefined} />
        <section id="trade-analysis" aria-label="Detailed trade analysis" className="scroll-mt-24">
          <Accordion type="single" collapsible>
            <AccordionItem value="analysis" className="rounded-xl border bg-card px-4 sm:px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                <span className="space-y-1"><span className="block text-base font-semibold">AI Trade Analysis</span><span className="block text-xs font-normal text-muted-foreground">Detailed performance, strengths, and an action plan.</span></span>
              </AccordionTrigger>
              <AccordionContent><AIAnalysis embedded reportDesign hideReportHeading setupLayout="stacked" trades={trades as any} /></AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </div>
      <AppFooter />
    </div>
  )
}
