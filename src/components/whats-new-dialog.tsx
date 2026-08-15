import { useState } from 'react'
import { useThemePresets } from '@/contexts/theme-presets'
import { changelog, type ChangelogEntry, type ChangelogItem, type ChangelogItemType } from '@/constants/changelog'
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
  /** The version the user last dismissed. Every release shipped after it
   *  renders in full (up to MAX_FULL_RELEASES; older ones become one-line
   *  summaries). Omit/null for manual opens (sidebar) — shows the batch of
   *  releases that shipped on the latest release's date. */
  sinceVersion?: string | null
}

// "2.62.0" reads like a build artifact in a hero; "2.62" reads like a release.
function heroVersion(v: string): string {
  return v.replace(/\.0$/, '')
}

// A screenshot-led feature card — the image is the star, with the note and a
// jump-in link beneath it. Used for items that ship with a screenshot.
function FeatureCard({ item, index, onNavigate }: { item: ChangelogItem; index: number; onNavigate: () => void }) {
  const { themeColors } = useThemePresets()
  const config = typeConfig[item.type]
  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both rounded-xl border border-border/60 bg-card/50 overflow-hidden"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms`, animationDuration: '350ms' }}
    >
      {item.image && (
        <img
          src={item.image.src}
          alt={item.image.alt}
          loading="lazy"
          className="w-full border-b border-border/60"
        />
      )}
      <div className="p-3.5">
        <div className="flex items-center gap-2">
          <span
            className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{ color: config.color, backgroundColor: config.bg }}
          >
            {config.label}
          </span>
          <span className="min-w-0 text-sm font-semibold text-foreground leading-snug">
            {item.text}
          </span>
        </div>
        {item.description && (
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed line-clamp-3">
            {item.description}
          </p>
        )}
        {item.link && (
          <Link
            to={item.link.to}
            onClick={onNavigate}
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold hover:underline"
            style={{ color: themeColors.primary }}
          >
            {item.link.label}
            <CaretRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  )
}

// Compact row for items without a screenshot.
function ItemRow({ item, index, onNavigate }: { item: ChangelogItem; index: number; onNavigate: () => void }) {
  const { themeColors } = useThemePresets()
  const config = typeConfig[item.type]
  const Icon = config.icon
  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms`, animationDuration: '350ms' }}
    >
      <div className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.05]">
        <div
          className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: config.bg }}
        >
          <Icon className="h-4 w-4" weight="bold" style={{ color: config.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
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
          {/* The written release note used to live only on /changelog — the
              dialog showed bare one-liners. Clamped so long notes don't take
              over; the full text stays on /changelog. */}
          {item.description && (
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-3">
              {item.description}
            </p>
          )}
          {item.link && (
            <Link
              to={item.link.to}
              onClick={onNavigate}
              className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium hover:underline"
              style={{ color: themeColors.primary }}
            >
              {item.link.label}
              <CaretRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// How many releases render in full. Beyond this, missed releases compress to
// one line each — a user who has been away a month should not get an archive.
const MAX_FULL_RELEASES = 3

// One release's items: the flagged highlights, then the rest behind "+N more".
function ReleaseItems({
  release,
  expanded,
  onToggle,
  onNavigate,
}: {
  release: ChangelogEntry
  expanded: boolean
  onToggle: () => void
  onNavigate: () => void
}) {
  const flagged = release.items.filter(i => i.highlight)
  const highlights = flagged.length > 0 ? flagged : release.items.slice(0, 3)
  const rest = release.items.filter(i => !highlights.includes(i))
  return (
    <>
      <div className="space-y-3">
        {highlights.map((item, i) =>
          item.image ? (
            <FeatureCard key={item.text} item={item} index={i} onNavigate={onNavigate} />
          ) : (
            <ItemRow key={item.text} item={item} index={i} onNavigate={onNavigate} />
          )
        )}
      </div>

      {rest.length > 0 && (
        <div className="mt-1">
          <button
            type="button"
            onClick={onToggle}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors"
            aria-expanded={expanded}
          >
            <span className="h-8 w-8 rounded-lg bg-muted/70 flex items-center justify-center shrink-0">
              {expanded ? <CaretDown className="h-3.5 w-3.5" /> : <CaretRight className="h-3.5 w-3.5" />}
            </span>
            {expanded
              ? 'Show less'
              : `${rest.length} more improvement${rest.length !== 1 ? 's' : ''} & fixes`}
          </button>
          {expanded && (
            <div className="space-y-0.5 mt-0.5">
              {rest.map((item, i) => (
                <ItemRow key={item.text} item={item} index={i} onNavigate={onNavigate} />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}

// Shows every release the user has not seen yet, in full: a hero header for
// the latest, then each release's flagged highlights with the rest collapsed
// behind "+N more". Several releases can ship in one day, so the dialog must
// not stop at changelog[0]. Beyond MAX_FULL_RELEASES, missed releases compress
// to one line each. Full history lives at /changelog.
export function WhatsNewDialog({ open, onOpenChange, sinceVersion }: WhatsNewDialogProps) {
  const { themeColors, alpha } = useThemePresets()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const release = changelog[0]
  if (!release) return null

  // Releases to render in full. Auto-open: everything newer than the version
  // the user last dismissed. Manual open (sidebar) or unknown version: the
  // whole batch that shipped on the latest release's date.
  const unseenCount = (() => {
    if (sinceVersion) {
      const sinceIdx = changelog.findIndex(r => r.version === sinceVersion)
      if (sinceIdx > 0) return sinceIdx
    }
    let n = 0
    while (n < changelog.length && changelog[n].date === release.date) n++
    return Math.max(1, n)
  })()
  const full = changelog.slice(0, Math.min(unseenCount, MAX_FULL_RELEASES))
  // Anything unseen beyond the full cap — one line each, never full item lists.
  const missed = changelog.slice(full.length, unseenCount)

  const handleOpenChange = (next: boolean) => {
    if (!next) setExpanded({})
    onOpenChange(next)
  }

  const dateLabel = new Date(release.date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* p-0 alone doesn't beat the base dialog's sm:p-6 (twMerge keeps other
          breakpoints) — without sm:p-0 the hero renders inset in a gutter.
          outline-none: this dialog auto-opens, so the browser paints its
          default focus outline around the programmatically-focused content. */}
      <DialogContent className="w-[95vw] max-w-lg sm:max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0 sm:p-0 overflow-hidden outline-none [&>button]:text-white/70 [&>button:hover]:text-white">
        {/* Hero — always dark, like the Wrapped dialog: a deliberate
            announcement card instead of a tinted wash that goes muddy in
            light mode. The user's theme color is the accent. */}
        <div className="relative shrink-0 overflow-hidden bg-[#09090c] px-6 pt-6 pb-6">
          <div
            className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full blur-3xl"
            style={{ backgroundColor: alpha(themeColors.primary, '1a') }}
          />
          <DialogHeader className="relative text-left space-y-0">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: themeColors.primary }}
            >
              What's New
            </p>
            <div className="flex items-baseline justify-between gap-3 mt-2.5">
              <DialogTitle asChild>
                <h2 className="font-display text-4xl leading-none font-bold tracking-tight text-white">
                  v{heroVersion(release.version)}
                </h2>
              </DialogTitle>
              <span className="text-xs text-zinc-500 shrink-0">{dateLabel}</span>
            </div>
            <DialogDescription asChild>
              <p className="text-sm text-zinc-400 leading-relaxed mt-3 text-pretty">
                {release.summary}
              </p>
            </DialogDescription>
            {full.length > 1 && (
              <p className="relative text-xs text-zinc-500 mt-2">
                Also in this update: {full.slice(1).map(r => `v${heroVersion(r.version)}`).join(', ')}
              </p>
            )}
          </DialogHeader>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-4 py-4 overscroll-contain">
          {full.map((r, ri) => (
            <div key={r.version} className={ri > 0 ? 'mt-5 pt-4 border-t border-border/70' : undefined}>
              {/* The hero already introduces the latest release; older
                  unseen releases get their own compact header. */}
              {ri > 0 && (
                <div className="px-3 mb-2.5">
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-sm font-bold tabular-nums shrink-0" style={{ color: themeColors.primary }}>
                      v{heroVersion(r.version)}
                    </span>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed text-pretty">{r.summary}</p>
                </div>
              )}
              <ReleaseItems
                release={r}
                expanded={!!expanded[r.version]}
                onToggle={() => setExpanded(e => ({ ...e, [r.version]: !e[r.version] }))}
                onNavigate={() => handleOpenChange(false)}
              />
            </div>
          ))}

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
        <div className="shrink-0 px-6 py-4 border-t bg-muted/40 flex items-center justify-between">
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
