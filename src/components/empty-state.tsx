import type { ReactNode } from 'react'
import type { Icon } from '@phosphor-icons/react'
import { useThemePresets } from '@/contexts/theme-presets'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: Icon
  title: string
  description: string
  children?: ReactNode
  className?: string
  compact?: boolean
}

export function EmptyState({ icon: Icon, title, description, children, className, compact = false }: EmptyStateProps) {
  const { themeColors, alpha } = useThemePresets()
  return <section className={cn('w-full rounded-xl border border-border bg-card', compact ? 'px-5 py-6' : 'px-6 py-8 sm:px-8 sm:py-10', className)}>
    <div className={cn('grid items-center gap-6', children && !compact && 'md:grid-cols-[minmax(0,1fr)_minmax(260px,1fr)] md:gap-10')}>
      <div className="min-w-0">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl" style={{backgroundColor: alpha(themeColors.primary, '12'), color: themeColors.primary}}><Icon className="h-6 w-6" aria-hidden="true" /></div>
        <h3 className={cn('font-semibold tracking-tight text-foreground', compact ? 'text-base' : 'text-xl sm:text-2xl')}>{title}</h3>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {children && <div className="flex min-w-0 flex-col items-start gap-3">{children}</div>}
    </div>
  </section>
}

export function EmptyStateAction({ icon: Icon, title, description, onClick }: {
  icon: Icon; title: string; description: string; onClick: () => void
}) {
  const { themeColors, alpha } = useThemePresets()
  return <button type="button" onClick={onClick} className="group flex w-full items-center gap-4 rounded-xl border border-border bg-background px-5 py-5 text-left transition-colors hover:border-primary/40 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{backgroundColor:alpha(themeColors.primary, '10'),color:themeColors.primary}}><Icon className="h-5 w-5" aria-hidden="true" /></span>
    <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{title}</span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{description}</span></span>
    <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{backgroundColor:themeColors.primary,color:themeColors.primaryButtonText}}>→</span>
  </button>
}
