import { SCREENSHOT_WIDTHS } from '@/data/landing-screenshot-sizes'
import { useScreenshotMode } from '@/hooks/use-screenshot-mode'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowsOut } from '@phosphor-icons/react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { ResponsiveImage } from '@/components/responsive-image'

const features = [
  { id: 'performance', label: 'Performance', title: 'Find the trades worth repeating.', description: 'Read your equity curve alongside win rate, profit factor, and results by symbol. See how the picture changes as you build a history.', detail: 'P&L · Equity curve · Symbol breakdowns', images: ['dashboard-trades-performance-screenshot', 'equity-curve-screenshot'] },
  { id: 'logging', label: 'Trade log', title: 'Keep the full story of every trade.', description: 'Record entries, exits, position size, and costs. Filter your history by account, market, or strategy when you need to look closer.', detail: 'Manual entry · Broker imports · Export', images: ['trading-log-screenshot'] },
  { id: 'journal', label: 'Journal', title: 'Remember the decision behind the result.', description: 'Keep your plan, screenshots, and reflections beside the trade. A useful review starts with remembering what you saw at the time.', detail: 'Trade notes · Screenshots · Mood tracking', images: ['trading-journal-screenshot'] },
  { id: 'calendar', label: 'Calendar', title: 'See your trading rhythm.', description: 'Review profitable and losing days together. Move from a month of results to the sessions you want to understand.', detail: 'Daily P&L · Session reviews · Consistency', images: ['calendar-heatmap-screenshot'] },
  { id: 'risk', label: 'Goals & risk', title: 'Give your process a clear boundary.', description: 'Set targets and risk limits, then review your progress against recorded trades. Keep your rules visible alongside your results.', detail: 'Goals · Risk limits · Alerts', images: ['goals-risk-management-screenshot'] },
  { id: 'analysis', label: 'AI analysis', title: 'Bring better questions to your review.', description: 'Explore patterns, strengths, and areas to work on with analysis of your trade history. Use it as a starting point for your own review.', detail: 'Pattern summaries · Trade reviews · Next steps', images: ['ai-trade-analysis-screenshot'] },
  { id: 'insights', label: 'Trade insights', title: 'Look past the headline P&L.', description: 'Compare symbols, direction, and strategy to understand where your results come from—and what deserves a closer look.', detail: 'Long vs short · Strategies · Weekly results', images: ['trade-insights-screenshot', 'trade-insights-ideas-screenshot'] },
  { id: 'prop', label: 'PropTracker', title: 'Track what you keep after the fees.', description: 'Bring evaluation fees, resets, and payouts together across your prop accounts. See the net result of the whole journey.', detail: 'Fees & payouts · Net return · Account history', images: ['prop-tracker-screenshot', 'prop-tracker-performance-screenshot'] },
] as const

export function LandingProductExplorer() {
  const mode = useScreenshotMode()
  const [selectedImage, setSelectedImage] = useState<{src: string; alt: string} | null>(null)
  return <section id="features" className="scroll-mt-8 py-12 sm:py-16">
    <div className="mx-auto max-w-[1600px] px-5 sm:px-8">
      <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div><h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">Go from a result<br className="hidden sm:block" /> to a reason.</h2></div>
        <p className="max-w-md text-base leading-relaxed text-muted-foreground">Explore the tools you’ll use before, during, and after a trading session.</p>
      </div>
      <Tabs defaultValue="performance">
        <TabsList aria-label="Explore journal features" className="h-auto sm:h-auto w-full sm:w-full justify-start gap-1 rounded-none border-b bg-transparent p-0 pb-2">
          {features.map(f => <TabsTrigger key={f.id} value={f.id} className="shrink-0 rounded-md px-3 py-2 sm:py-2 data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-700 dark:data-[state=active]:text-amber-400 data-[state=active]:shadow-none">{f.label}</TabsTrigger>)}
        </TabsList>
        {features.map(f => <TabsContent key={f.id} value={f.id} className="mt-8">
          <div className="grid items-start gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-14">
            <div className="lg:pt-6">
              <h3 className="max-w-sm font-display text-2xl font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">{f.description}</p>
              <Link to="/signup" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold hover:underline underline-offset-4">Start your journal <ArrowRight className="h-4 w-4" /></Link>
              {f.id === 'logging' && <Link to="/forex-trading-journal" className="block text-sm text-muted-foreground underline underline-offset-4">Explore forex journaling</Link>}
            </div>
            <div className="space-y-4">
              {f.images.map((name, index) => {
                const src = '/images/screenshots/' + name + '-' + mode + '.webp'
                const alt = f.label + (f.images.length > 1 ? ' — view ' + (index + 1) : '')
                return <button key={name} type="button" onClick={() => setSelectedImage({src: name, alt})} className="group relative block w-full overflow-hidden rounded-xl border bg-muted/20 text-left shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <ResponsiveImage src={src} alt={alt} sourceWidth={SCREENSHOT_WIDTHS[`${name}-${mode}`]} sizes="(max-width: 1023px) calc(100vw - 40px), (max-width: 1600px) 63vw, 960px" imgClassName="h-auto w-full object-contain" />
                  <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-md border bg-background/95 px-2.5 py-1.5 text-xs shadow-sm"><ArrowsOut className="h-3.5 w-3.5" />Enlarge</span>
                </button>
              })}
            </div>
          </div>
        </TabsContent>)}
      </Tabs>
    </div>
    <Dialog open={!!selectedImage} onOpenChange={open => !open && setSelectedImage(null)}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[95vw] p-2 sm:p-2">
        <DialogTitle className="sr-only">{selectedImage?.alt ?? 'Product screenshot'}</DialogTitle>
        {selectedImage && <img src={'/images/screenshots/' + selectedImage.src + '-' + mode + '.webp'} alt={selectedImage.alt} className="max-h-[85svh] w-full object-contain" />}
      </DialogContent>
    </Dialog>
  </section>
}
