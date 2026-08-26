import * as React from "react"

import { cn } from "@/lib/utils"

type Variant = "chart" | "outline"

// Two families used across the app:
//  - chart:   soft track, white active pill (chart view toggles, dialogs)
//  - outline: bordered track, muted active pill (dashboard period pills, P&L toggle)
const ROOT: Record<Variant, string> = {
  chart: "flex items-center rounded-lg bg-muted/50 p-0.5",
  outline: "flex items-center rounded-lg border border-border/60 bg-muted/30 p-0.5",
}

const ITEM_BASE = "rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

const ITEM: Record<Variant, { on: string; off: string }> = {
  chart: {
    on: "bg-background text-foreground shadow-sm",
    off: "text-muted-foreground hover:text-foreground",
  },
  outline: {
    on: "border border-border/60 bg-muted text-foreground shadow-sm",
    off: "border border-transparent text-muted-foreground hover:text-foreground",
  },
}

// eslint-disable-next-line react-refresh/only-export-components
export function segmentedRootClass(variant: Variant = "chart", className?: string) {
  return cn(ROOT[variant], className)
}

// eslint-disable-next-line react-refresh/only-export-components
export function segmentedItemClass(active: boolean, variant: Variant = "chart", className?: string) {
  return cn(ITEM_BASE, "px-3 py-1.5", active ? ITEM[variant].on : ITEM[variant].off, className)
}

export type SegmentedOption<T extends string> = {
  value: T
  /** Visible label. Omit for icon-only items and supply `ariaLabel`. */
  label?: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
  ariaLabel?: string
  title?: string
}

type SegmentedControlProps<T extends string> = {
  value: T
  onChange: (value: T) => void
  options: readonly SegmentedOption<T>[]
  variant?: Variant
  /** Stretch items to fill the track. */
  fullWidth?: boolean
  className?: string
  itemClassName?: string
  "aria-label"?: string
}

function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  variant = "chart",
  fullWidth = false,
  className,
  itemClassName,
  "aria-label": ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div role="group" aria-label={ariaLabel} className={segmentedRootClass(variant, className)}>
      {options.map((opt) => {
        const active = opt.value === value
        const Icon = opt.icon
        const iconOnly = Icon && opt.label == null
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            aria-label={opt.ariaLabel}
            title={opt.title}
            className={cn(
              ITEM_BASE,
              iconOnly ? "p-1.5" : "px-3 py-1.5",
              fullWidth && "flex-1 px-2 whitespace-nowrap",
              Icon && !iconOnly && "flex items-center gap-1.5",
              active ? ITEM[variant].on : ITEM[variant].off,
              itemClassName
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export { SegmentedControl }
