import { useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { AppFooter } from '@/components/app-footer'
import { Button } from '@/components/ui/button'
import { changelog, type ChangelogItemType } from '@/constants/changelog'

const typeConfig: Record<ChangelogItemType, { tag: string; section: string; className: string }> = {
  new:      { tag: 'New',      section: 'New features', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  improved: { tag: 'Improved', section: 'Improvements', className: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
  fixed:    { tag: 'Fixed',    section: 'Fixes',        className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
}

const sectionOrder: ChangelogItemType[] = ['new', 'improved', 'fixed']
const filterOptions: Array<{ value: ChangelogItemType | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'improved', label: 'Improved' },
  { value: 'fixed', label: 'Fixed' },
]
const PAGE_SIZE = 5

export default function Changelog() {
  const [filter, setFilter] = useState<ChangelogItemType | 'all'>('all')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const filtered = changelog
    .map(release => ({
      ...release,
      items: filter === 'all' ? release.items : release.items.filter(item => item.type === filter),
    }))
    .filter(release => release.items.length > 0)

  const visible = filtered.slice(0, visibleCount)
  const latestVersion = changelog[0]?.version

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="max-w-3xl mx-auto px-6 py-14">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-2">Changelog</p>
          <h1 className="font-display text-4xl font-bold tracking-tight">Release Notes</h1>
          <p className="mt-3 text-muted-foreground">Everything new, improved, and fixed in FreeTradeJournal.</p>
        </div>

        <div className="flex items-center gap-2 mb-12">
          {filterOptions.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setFilter(option.value)
                setVisibleCount(PAGE_SIZE)
              }}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                filter === option.value
                  ? 'bg-foreground text-background'
                  : 'border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="space-y-14">
          {visible.map((release, releaseIndex) => {
            const typesInRelease = sectionOrder.filter(type => release.items.some(item => item.type === type))
            return (
              <div key={release.version}>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <time dateTime={release.date}>
                    {new Date(release.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </time>
                  <span>v{release.version}</span>
                  {release.version === latestVersion && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      Latest
                    </span>
                  )}
                </div>

                <div className="mt-2.5 flex items-center gap-1.5">
                  {typesInRelease.map(type => (
                    <span
                      key={type}
                      className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${typeConfig[type].className}`}
                    >
                      {typeConfig[type].tag}
                    </span>
                  ))}
                </div>

                <h2 className="mt-2.5 text-xl font-bold text-foreground">{release.summary}</h2>

                <div className="mt-6 space-y-8">
                  {sectionOrder.map(type => {
                    const items = release.items.filter(item => item.type === type)
                    if (items.length === 0) return null
                    return (
                      <div key={type}>
                        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                          {typeConfig[type].section}
                        </h3>
                        <ul className="list-disc pl-5 marker:text-muted-foreground/60 space-y-4">
                          {items.map((item, i) => (
                            <li key={i}>
                              <p className="text-sm font-medium text-foreground">{item.text}</p>
                              {item.highlight && item.description && (
                                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                              )}
                              {item.highlight && item.image && (
                                <img
                                  src={item.image.src}
                                  alt={item.image.alt}
                                  loading="lazy"
                                  className="mt-3 w-full rounded-lg border border-border/60"
                                />
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}
                </div>

                {releaseIndex < visible.length - 1 && <div className="border-t border-border mt-12" />}
              </div>
            )
          })}
        </div>

        {filtered.length > visibleCount && (
          <div className="mt-14 flex justify-center">
            <Button variant="outline" onClick={() => setVisibleCount(count => count + PAGE_SIZE)}>
              Load more
            </Button>
          </div>
        )}
      </div>

      <AppFooter />
    </div>
  )
}
