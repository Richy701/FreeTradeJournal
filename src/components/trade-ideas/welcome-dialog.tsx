import { UsersThree, Lightbulb, LinkSimple, ListChecks } from '@phosphor-icons/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useThemePresets } from '@/contexts/theme-presets'
import { IdeaPreviewCard } from './idea-preview-card'

interface WelcomeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPost: () => void
  onShowRules: () => void
}

const STEPS = [
  { icon: Lightbulb, title: 'Post the setup before you take it', body: 'Symbol, long or short, entry, stop, target and why. You pick a handle and avatar the first time. Your real name and email are never shown.' },
  { icon: LinkSimple, title: 'Link the trade afterwards', body: 'Pick it from your Trade Log and the result shows on the idea for everyone. That is how the feed tells good calls from lucky ones.' },
  { icon: ListChecks, title: 'Keep it honest', body: 'Your own setups, a stop on every idea, no selling, no made-up results. Report anything that breaks that.' },
] as const

/** Shown once, the first time someone opens Trade Ideas. */
export function WelcomeDialog({ open, onOpenChange, onPost, onShowRules }: WelcomeDialogProps) {
  const { themeColors, alpha } = useThemePresets()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-3xl p-0 max-h-[calc(100dvh-2rem)] overflow-y-auto overflow-x-hidden gap-0">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.15fr]">
          {/* What the feed looks like: a finished idea with its result. */}
          <div className="px-6 pt-6 pb-6 sm:py-8 border-b sm:border-b-0 sm:border-r space-y-4" style={{ backgroundColor: alpha(themeColors.primary, '06') }}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: alpha(themeColors.primary, '15') }}>
                <UsersThree className="h-5 w-5" style={{ color: themeColors.primary }} aria-hidden="true" />
              </div>
              <DialogHeader className="p-0 space-y-0.5 text-left">
                <DialogTitle className="text-lg">Welcome to Trade Ideas</DialogTitle>
                <DialogDescription className="text-xs">A shared feed of setups, with the result next to each one. In beta.</DialogDescription>
              </DialogHeader>
            </div>
            <IdeaPreviewCard
              caption="An idea on the feed, after the trade"
              preview={{
                avatar: { avatarEmoji: '⚡', avatarColor: '#f59e0b' },
                handle: 'nq_scalper',
                market: 'futures',
                symbol: 'NQ',
                direction: 'short',
                entry: 19240,
                stop: 19290,
                target: 19120,
                when: '1d ago',
                outcome: { result: 'win', pnl: 1840, currency: 'USD', closedAt: '', tradeId: '' },
              }}
            />
            <p className="text-xs text-muted-foreground leading-relaxed">
              The result badge only appears when the poster links the trade from their own Trade Log. Claims in the text do not count.
            </p>
            <div className="rounded-xl border p-4 space-y-2.5 bg-background/60">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Your record builds from linked trades</p>
              <dl className="grid grid-cols-3 gap-2 text-center tabular-nums">
                {([['Ideas', '12'], ['Worked', '8'], ['Hit rate', '67%']] as const).map(([label, value]) => (
                  <div key={label} className="rounded-lg border bg-muted/30 py-2 flex flex-col-reverse">
                    <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
                    <dd className="text-base font-bold leading-tight">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* How to take part */}
          <div className="px-6 py-6 sm:py-8 space-y-5">
            <ol className="space-y-4">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-3">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: alpha(themeColors.primary, '12') }}>
                    <step.icon className="h-4 w-4" style={{ color: themeColors.primary }} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-snug">{i + 1}. {step.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="text-xs text-muted-foreground">
              Nothing here is financial advice. Read the full{' '}
              <button type="button" onClick={onShowRules} className="underline underline-offset-2 hover:text-foreground">community rules</button>.
            </p>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Browse first</Button>
              <Button onClick={onPost} style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}>
                Post my first idea
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
