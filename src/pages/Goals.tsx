import { PerformanceGoals } from "@/components/performance-goals"
import { Button } from '@/components/ui/button'
import { Target, Gauge, Brain } from '@phosphor-icons/react'
import { SiteHeader } from "@/components/site-header"
import { AppFooter } from "@/components/app-footer"
import { AIGoalCoach } from '@/components/ai-goal-coach'

export default function Goals() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <header data-goals-header className="flex flex-col gap-4 border-b pb-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Goals &amp; Risk</h1>
            <p className="text-sm text-muted-foreground">Set your targets. Know your limits. Build consistency.</p>
          </div>
          <nav aria-label="Goals and risk sections" className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild><a href="#risk-limits"><Gauge className="mr-2 h-4 w-4" />Risk limits</a></Button>
            <Button variant="outline" size="sm" asChild><a href="#performance-goals"><Target className="mr-2 h-4 w-4" />Goals</a></Button>
            <Button variant="outline" size="sm" asChild><a href="#goal-coach"><Brain className="mr-2 h-4 w-4" />Goal Coach</a></Button>
          </nav>
        </header>
        <PerformanceGoals />
        <section id="goal-coach" className="scroll-mt-20"><AIGoalCoach /></section>
      </main>
      <AppFooter />
    </div>
  )
}
