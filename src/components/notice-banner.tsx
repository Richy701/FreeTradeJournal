import type { ReactNode, ElementType } from 'react'
import { X } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

export type NoticeTone = 'info' | 'warning' | 'neutral'

const TONE_CLASSES: Record<NoticeTone, { root: string; icon: string }> = {
  info: { root: 'border-border/70 bg-card', icon: 'text-primary' },
  warning: { root: 'border-border/70 bg-card', icon: 'text-amber-500' },
  neutral: { root: 'border-border/70 bg-muted/30', icon: 'text-muted-foreground' },
}

interface NoticeBannerProps {
  tone?: NoticeTone
  icon?: ElementType
  title: ReactNode
  /** Secondary text. Rendered below the title for a consistent reading order. */
  description?: ReactNode
  /** Buttons/links, right-aligned. Use shadcn Button size="sm". */
  actions?: ReactNode
  onDismiss?: () => void
  dismissLabel?: string
  className?: string
}

/**
 * Single-row notice used for promos, quota notices and warnings across the app.
 * Layout: [icon] Title · description ........ [actions] [x]
 * Stacks vertically below the sm breakpoint.
 */
export function NoticeBanner({
  tone = 'info',
  icon: Icon,
  title,
  description,
  actions,
  onDismiss,
  dismissLabel = 'Dismiss',
  className,
}: NoticeBannerProps) {
  const t = TONE_CLASSES[tone]
  return (
    <div
      role="status"
      className={cn(
        'relative rounded-xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4',
        onDismiss && 'pr-10 sm:pr-4',
        t.root,
        className,
      )}
    >
      {/* Icon sits on the first text line at every width. Centring it against
          the block floats it between lines once the description wraps. */}
      <div className="flex-1 min-w-0 flex items-start gap-2.5">
        {Icon && <Icon className={cn('h-4 w-4 shrink-0 mt-0.5', t.icon)} aria-hidden="true" />}
        <p className="text-sm min-w-0 leading-snug">
          <span className="font-semibold text-foreground">{title}</span>
          {description && (
            <>

              <span className="text-muted-foreground block mt-1 text-xs leading-relaxed">{description}</span>
            </>
          )}
        </p>
      </div>
      {(actions || onDismiss) && (
        <div className="flex items-center gap-2 shrink-0 sm:ml-auto">
          {actions && (
            <div className="flex flex-wrap items-center gap-2 [&_a]:gap-1.5 [&_button]:gap-1.5 [&_a_svg]:size-3.5 [&_button_svg]:size-3.5 [&_a_svg]:shrink-0 [&_button_svg]:shrink-0">
              {actions}
            </div>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="absolute top-2.5 right-2.5 sm:static text-muted-foreground hover:text-foreground shrink-0 p-2 sm:-mr-1 transition-colors rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={dismissLabel}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
