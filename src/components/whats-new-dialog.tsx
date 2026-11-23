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
import { CaretRight, CaretDown, ArrowSquareOut, ChartBar, BookOpen, Palette } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { FeatureScreenshot } from '@/components/feature-screenshot'

function ReleaseIcon({ item }: { item: ChangelogItem }) {
  const Icon = item.icon ? { dashboard: ChartBar, journal: BookOpen, appearance: Palette }[item.icon] : null
  return Icon ? <Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" /> : null
}

const typeConfig: Record<ChangelogItemType, { label: string }> = {
  new: { label: 'New' },
  improved: { label: 'Improved' },
  fixed: { label: 'Fixed' },
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
function FeatureCard({ item, onNavigate }: { item: ChangelogItem; onNavigate: () => void }) {
  const { themeColors } = useThemePresets()
  const config = typeConfig[item.type]
  return (
    <div
      className="rounded-lg border border-border/60 bg-card overflow-hidden"
    >
      {item.image && (
        <FeatureScreenshot
          src={item.image.src}
          darkSrc={item.image.darkSrc}
          alt={item.image.alt}
          className="border-b border-border/60"
        />
      )}
      <div className="p-5">
        <div className="flex items-center gap-2">
          <ReleaseIcon item={item} />
          {!item.highlight && <span
            className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-md border border-border text-muted-foreground"

          >
            {config.label}
          </span>}
          <span className="min-w-0 text-lg font-semibold tracking-tight text-foreground leading-snug">
            {item.text}
          </span>
        </div>
        {item.description && (
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {item.description}
          </p>
        )}
        {item.link && (
          <Link
            to={item.link.to}
            onClick={onNavigate}
            className="mt-4 inline-flex min-h-9 items-center gap-1 text-sm font-medium hover:underline"
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
function ItemRow({ item, onNavigate, featured = false }: { item: ChangelogItem; onNavigate: () => void; featured?: boolean }) {
  const config = typeConfig[item.type]
  return (
    <article className={featured ? "rounded-xl bg-muted/45 p-5 sm:p-6" : "py-4 first:pt-0"}>
      {!item.highlight && <span className="inline-block mb-2 rounded-md border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{config.label}</span>}
      <div className="flex items-start gap-2"><ReleaseIcon item={item} /><h3 className={featured ? "max-w-[24ch] text-2xl sm:text-3xl font-semibold tracking-tight leading-tight" : "text-base font-semibold tracking-tight leading-snug"}>{item.text}</h3></div>
      {item.description && <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.description}</p>}
      {item.link && <Link to={item.link.to} onClick={onNavigate} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">{item.link.label}<CaretRight className="h-3.5 w-3.5" /></Link>}
    </article>
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
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {highlights.map((item, index) =>
          item.image ? (
            <FeatureCard key={item.text} item={item} onNavigate={onNavigate} />
          ) : (
            <div key={item.text} className="md:col-span-2 border-t border-border/60 pt-5"><ItemRow item={item} featured={index === 0} onNavigate={onNavigate} /></div>
          )
        )}
      </div>

      {rest.length > 0 && (
        <div className="mt-1">
          <button
            type="button"
            onClick={onToggle}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
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
              {rest.map((item) => (
                <ItemRow key={item.text} item={item} onNavigate={onNavigate} />
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
  const { themeColors } = useThemePresets()
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
      <DialogContent className="w-[95vw] max-w-4xl sm:max-w-4xl max-h-[85vh] flex flex-col gap-0 p-0 sm:p-0 overflow-hidden outline-none">
        <div className="relative shrink-0 overflow-hidden bg-card border-b border-border/60 px-6 pt-6 pb-5">
          <DialogHeader className="relative text-left space-y-0">
            <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 pr-8 text-xs text-muted-foreground">
              <span className="font-medium text-primary">What's new · v{heroVersion(release.version)}</span>
              <span>{dateLabel}</span>
            </div>
            <DialogTitle className="max-w-[28ch] pr-6 text-2xl sm:text-3xl font-semibold leading-tight tracking-tight">{release.title ?? "What's new"}</DialogTitle>
            <DialogDescription asChild>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {release.summary}
              </p>
            </DialogDescription>
            {full.length > 1 && (
              <p className="relative text-xs text-muted-foreground mt-2">
                Also in this update: {full.slice(1).map(r => `v${heroVersion(r.version)}`).join(', ')}
              </p>
            )}
          </DialogHeader>
        </div>

        {/* Scrollable content */}
        <div className="min-h-0 overflow-y-auto flex-1 px-6 py-5 overscroll-contain">
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
                    className="flex items-baseline gap-2.5 rounded-lg px-3 py-1.5 transition-colors hover:bg-muted/50"
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
        <div className="shrink-0 px-6 py-4 border-t border-border/60 bg-card flex items-center justify-between gap-3">
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
