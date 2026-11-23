import { Link } from 'react-router-dom'
import { ArrowRight } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { isScreenshotPreview } from '@/lib/screenshot-preview'

export function DemoCtaCard() {
  const { isDemo } = useAuth()
  if (!isDemo || isScreenshotPreview(isDemo)) return null
  return <section className="flex flex-col gap-5 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
    <div>
      <h2 className="text-lg font-semibold tracking-tight">Make this journal yours.</h2>
      <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">Start with one trade and one lesson. Your account begins fresh, without the example data.</p>
    </div>
    <Button asChild className="shrink-0 self-start sm:self-center"><Link to="/signup">Create my journal<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
  </section>
}
