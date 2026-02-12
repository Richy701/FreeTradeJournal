import { SiteHeader } from '@/components/site-header'
import { Footer7 } from '@/components/ui/footer-7'
import { footerConfig } from '@/components/ui/footer-config'
import { Badge } from '@/components/ui/badge'
import { changelog, type ChangelogItemType } from '@/constants/changelog'
import { Plus, Zap, Bug } from 'lucide-react'

const typeConfig: Record<ChangelogItemType, { label: string; icon: typeof Plus; color: string; bg: string }> = {
  new: { label: 'New', icon: Plus, color: '#22c55e', bg: '#22c55e15' },
  improved: { label: 'Improved', icon: Zap, color: '#3b82f6', bg: '#3b82f615' },
  fixed: { label: 'Fixed', icon: Bug, color: '#f59e0b', bg: '#f59e0b15' },
}

export default function Changelog() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Release Notes</h1>
          <p className="mt-2 text-muted-foreground">
            Everything new, improved, and fixed in FreeTradeJournal.
          </p>
        </header>

        <hr className="border-border" />

        <div className="space-y-12">
          {changelog.map((release, releaseIndex) => (
            <section key={release.version} className="space-y-4">
              {/* Version header */}
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  v{release.version}
                </h2>
                <span className="text-sm text-muted-foreground">
                  {new Date(release.date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                {releaseIndex === 0 && (
                  <Badge className="text-xs border-0" style={{ backgroundColor: '#22c55e20', color: '#22c55e' }}>
                    Latest
                  </Badge>
                )}
              </div>

              {/* Summary */}
              <p className="text-muted-foreground leading-relaxed">
                {release.summary}
              </p>

              {/* Items */}
              <div className="space-y-5 mt-2">
                {release.items.map((item, i) => {
                  const config = typeConfig[item.type]
                  const Icon = config.icon
                  return (
                    <div key={i} className="flex gap-3.5">
                      <div
                        className="mt-1 shrink-0 h-6 w-6 rounded-md flex items-center justify-center"
                        style={{ backgroundColor: config.bg }}
                      >
                        <Icon className="h-3.5 w-3.5" style={{ color: config.color }} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{item.text}</span>
                          <Badge
                            className="text-[10px] px-1.5 py-0 border-0 font-medium"
                            style={{ backgroundColor: config.bg, color: config.color }}
                          >
                            {config.label}
                          </Badge>
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Separator */}
              {releaseIndex < changelog.length - 1 && (
                <hr className="border-border mt-8" />
              )}
            </section>
          ))}
        </div>
      </div>

      <Footer7 {...footerConfig} />
    </div>
  )
}
