import { useState } from 'react'
import { useThemePresets } from '@/contexts/theme-presets'
import { changelog, type ChangelogItem, type ChangelogItemType } from '@/constants/changelog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, Lightning, Bug, CaretRight, CaretDown, ArrowSquareOut } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'

const typeConfig: Record<ChangelogItemType, { label: string; icon: typeof Plus; color: string; bg: string }> = {
  new: { label: 'New', icon: Plus, color: '#22c55e', bg: '#22c55e15' },
  improved: { label: 'Improved', icon: Lightning, color: '#3b82f6', bg: '#3b82f615' },
  fixed: { label: 'Fixed', icon: Bug, color: '#f59e0b', bg: '#f59e0b15' },
}

interface WhatsNewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The version the user last dismissed. Releases shipped after it (other
   *  than the latest, which renders in full) appear as one-line summaries.
   *  Omit/null for manual opens (sidebar) and brand-new users — latest only. */
  sinceVersion?: string | null
}

// "2.62.0" reads like a build artifact in a hero; "2.62" reads like a release.
function heroVersion(v: string): string {
  return v.replace(/\.0$/, '')
}

function ItemRow({ item, index }: { item: ChangelogItem; index: number }) {
  const config = typeConfig[item.type]
  const Icon = config.icon
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.05] animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms`, animationDuration: '350ms' }}
    >
      <div
        className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: config.bg }}
      >
        <Icon className="h-4 w-4" weight="bold" style={{ color: config.color }} />
      </div>
      <span className="flex-1 min-w-0 text-sm font-medium text-foreground/90 leading-snug">
        {item.text}
      </span>
      <span
        className="shrink-0 text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: config.color }}
      >
        {config.label}
      </span>
    </div>
  )
}

// Shows ONLY the latest release: a hero header, the flagged highlights, and
// the rest collapsed behind "+N more". Releases missed since the user's last
// visit compress to one line each. Full history lives at /changelog — the
// dialog is a greeting, not an archive.
export function WhatsNewDialog({ open, onOpenChange, sinceVersion }: WhatsNewDialogProps) {
  const { themeColors, alpha } = useThemePresets()
  const [showRest, setShowRest] = useState(false)

  const release = changelog[0]
  if (!release) return null

  const flagged = release.items.filter(i => i.highlight)
  const highlights = flagged.length > 0 ? flagged : release.items.slice(0, 3)
  const rest = release.items.filter(i => !highlights.includes(i))

  // Releases the user skipped between their last visit and the latest one —
  // shown as one line each, never as full item lists.
  const missed = (() => {
    if (!sinceVersion) return []
    const sinceIdx = changelog.findIndex(r => r.version === sinceVersion)
    if (sinceIdx <= 1) return [] // saw the previous release (or unknown version)
    return changelog.slice(1, sinceIdx)
  })()

  const handleOpenChange = (next: boolean) => {
    if (!next) setShowRest(false)
    onOpenChange(next)
  }

  const dateLabel = new Date(release.date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        {/* Hero — layered primary glow, oversized version, summary as copy */}
        <div
          className="relative px-6 pt-7 pb-6 overflow-hidden"
          style={{
            background: `radial-gradient(120% 140% at 0% 0%, ${alpha(themeColors.primary, '1f')} 0%, ${alpha(themeColors.primary, '0a')} 45%, transparent 100%)`,
          }}
        >
          {/* Second, offset glow for depth */}
          <div
            className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full blur-3xl"
            style={{ backgroundColor: alpha(themeColors.primary, '14') }}
          />
          <DialogHeader className="relative text-left space-y-0">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: themeColors.primary }}
            >
              What's New · {dateLabel}
            </p>
            <DialogTitle asChild>
              <h2 className="font-display text-[2.75rem] leading-none font-bold tracking-tight mt-3">
                v{heroVersion(release.version)}
              </h2>
            </DialogTitle>
            <DialogDescription asChild>
              <p className="text-sm text-foreground/70 leading-relaxed mt-3 max-w-[38ch]">
                {release.summary}
              </p>
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-4 py-4 overscroll-contain">
          <div className="space-y-0.5">
            {highlights.map((item, i) => (
              <ItemRow key={item.text} item={item} index={i} />
            ))}
          </div>

          {rest.length > 0 && (
            <div className="mt-1">
              <button
                type="button"
                onClick={() => setShowRest(s => !s)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors"
                aria-expanded={showRest}
              >
                <span className="h-8 w-8 rounded-lg bg-muted/70 flex items-center justify-center shrink-0">
                  {showRest ? <CaretDown className="h-3.5 w-3.5" /> : <CaretRight className="h-3.5 w-3.5" />}
                </span>
                {showRest
                  ? 'Show less'
                  : `${rest.length} more improvement${rest.length !== 1 ? 's' : ''} & fixes`}
              </button>
              {showRest && (
                <div className="space-y-0.5 mt-0.5">
                  {rest.map((item, i) => (
                    <ItemRow key={item.text} item={item} index={i} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Releases missed since the user's last visit — one line each */}
          {missed.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/70">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground px-3 mb-1.5">
                Since your last visit
              </p>
              <div className="space-y-0.5">
                {missed.map(r => (
                  <Link
                    key={r.version}
                    to="/changelog"
                    onClick={() => handleOpenChange(false)}
                    className="flex items-baseline gap-2.5 rounded-lg px-3 py-1.5 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                  >
                    <span className="text-xs font-bold tabular-nums shrink-0" style={{ color: themeColors.primary }}>
                      v{heroVersion(r.version)}
                    </span>
                    <span className="text-xs text-muted-foreground leading-snug truncate">{r.summary}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/40 flex items-center justify-between">
          <Link
            to="/changelog"
            onClick={() => handleOpenChange(false)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            All release notes
            <ArrowSquareOut className="h-3 w-3" />
          </Link>
          <Button
            onClick={() => handleOpenChange(false)}
            className="gap-1.5 px-5"
            style={{
              backgroundColor: themeColors.primary,
              color: themeColors.primaryButtonText,
            }}
          >
            Got it
            <CaretRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
