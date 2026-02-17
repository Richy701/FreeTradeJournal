import { useThemePresets } from '@/contexts/theme-presets'
import { changelog, type ChangelogItemType } from '@/constants/changelog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Megaphone, Plus, Zap, Bug, ChevronRight, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

const typeConfig: Record<ChangelogItemType, { label: string; icon: typeof Plus; color: string; bg: string }> = {
  new: { label: 'New', icon: Plus, color: '#22c55e', bg: '#22c55e15' },
  improved: { label: 'Improved', icon: Zap, color: '#3b82f6', bg: '#3b82f615' },
  fixed: { label: 'Fixed', icon: Bug, color: '#f59e0b', bg: '#f59e0b15' },
}

interface WhatsNewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WhatsNewDialog({ open, onOpenChange }: WhatsNewDialogProps) {
  const { themeColors, alpha } = useThemePresets()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        {/* Gradient header */}
        <div className="px-6 pt-6 pb-5">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">What's New</DialogTitle>
            <DialogDescription className="text-sm mt-0.5">
              The latest updates to FreeTradeJournal
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {changelog.map((release, releaseIndex) => (
            <div key={release.version}>
              {/* Version header */}
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className={
                    releaseIndex === 0
                      ? "h-6 px-2.5 rounded-full flex items-center text-xs font-bold"
                      : "h-6 px-2.5 rounded-full flex items-center text-xs font-bold bg-muted text-muted-foreground"
                  }
                  style={
                    releaseIndex === 0
                      ? { backgroundColor: alpha(themeColors.primary, '15'), color: themeColors.primary }
                      : undefined
                  }
                >
                  v{release.version}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(release.date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                {releaseIndex === 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 border-0 bg-primary/10 text-primary">
                    Latest
                  </Badge>
                )}
              </div>

              {/* Items */}
              <div className="space-y-1.5 ml-1">
                {release.items.map((item, i) => {
                  const config = typeConfig[item.type]
                  const Icon = config.icon
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
                    >
                      <div
                        className="mt-0.5 shrink-0 h-5 w-5 rounded-md flex items-center justify-center"
                        style={{ backgroundColor: config.bg }}
                      >
                        <Icon className="h-3 w-3" style={{ color: config.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-foreground/90 leading-snug">
                          {item.text}
                        </span>
                      </div>
                      <Badge
                        className="text-[10px] px-1.5 py-0 shrink-0 border-0 font-medium"
                        style={{
                          backgroundColor: config.bg,
                          color: config.color,
                        }}
                      >
                        {config.label}
                      </Badge>
                    </div>
                  )
                })}
              </div>

              {/* Separator between releases */}
              {releaseIndex < changelog.length - 1 && (
                <div className="border-b border-border/60 mt-5" />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between">
          <Link
            to="/changelog"
            onClick={() => onOpenChange(false)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            View all release notes
            <ExternalLink className="h-3 w-3" />
          </Link>
          <Button
            onClick={() => onOpenChange(false)}
            className="gap-1.5"
            style={{
              backgroundColor: themeColors.primary,
              color: themeColors.primaryButtonText,
            }}
          >
            Got it
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
