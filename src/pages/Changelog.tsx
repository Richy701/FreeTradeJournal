import { SiteHeader } from '@/components/site-header'
import { AppFooter } from '@/components/app-footer'
import { changelog, type ChangelogItemType } from '@/constants/changelog'

const typeConfig: Record<ChangelogItemType, { label: string; className: string }> = {
  new:      { label: 'New',      className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  improved: { label: 'Improved', className: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
  fixed:    { label: 'Fixed',    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
}

export default function Changelog() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="max-w-2xl mx-auto px-6 py-14">
        <div className="mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-2">Changelog</p>
          <h1 className="font-display text-4xl font-bold tracking-tight">Release Notes</h1>
          <p className="mt-3 text-muted-foreground">Everything new, improved, and fixed in FreeTradeJournal.</p>
        </div>

        <div className="space-y-16">
          {changelog.map((release, releaseIndex) => (
            <div key={release.version}>
              {/* Version header */}
              <div className="flex items-baseline gap-3 mb-1">
                <h2 className="text-2xl font-bold text-foreground">v{release.version}</h2>
                <span className="text-sm text-muted-foreground">
                  {new Date(release.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
                {releaseIndex === 0 && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    Latest
                  </span>
                )}
              </div>

              {/* Items */}
              <div className="space-y-5 mt-5">
                {release.items.map((item, i) => {
                  const config = typeConfig[item.type]
                  return (
                    <div key={i} className="grid grid-cols-[72px_1fr] gap-4">
                      <span className={`mt-0.5 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded h-fit text-center ${config.className}`}>
                        {config.label}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.text}</p>
                        {item.description && (
                          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {releaseIndex < changelog.length - 1 && (
                <div className="border-t border-border mt-12" />
              )}
            </div>
          ))}
        </div>
      </div>

      <AppFooter />
    </div>
  )
}
