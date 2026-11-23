import { Link } from 'react-router-dom'
import { ArrowRight } from '@phosphor-icons/react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { isScreenshotPreview } from '@/lib/screenshot-preview'

export function DemoWelcome() {
  const { isDemo } = useAuth()
  if (!isDemo || isScreenshotPreview(isDemo)) return null
  return <section className="rounded-xl border bg-card p-5 sm:p-6">
    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
      <div className="max-w-2xl">
        <p className="mb-2 text-xs font-medium text-primary">EXAMPLE JOURNAL · INTERACTIVE DEMO</p>
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Small trades. Useful lessons.</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Explore a fictional $2,500 practice account: ordinary wins, losses, costs, and notes about what to do differently. These are examples, not live results.</p>
      </div>
      <Button asChild className="shrink-0 self-start lg:self-center"><Link to="/signup">Start my own journal<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
    </div>
    <div className="mt-5 grid gap-3 border-t pt-4 sm:grid-cols-3">
      {[['/trades', 'Look at a trade', 'See the entry, exit, and costs.'], ['/journal', 'Read the reflection', 'A short note can make a review useful.'], ['/goals', 'Explore a goal', 'Give your next sessions a focus.']].map(([to, title, description], i) => <Link key={to} to={to} className="group flex gap-3 rounded-md py-2 pr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="pt-0.5 font-mono text-xs text-muted-foreground">0{i + 1}</span><span><span className="text-sm font-medium group-hover:underline underline-offset-4">{title} →</span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{description}</span></span>
      </Link>)}
    </div>
  </section>
}
