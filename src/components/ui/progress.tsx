import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

type ProgressProps = React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
  /** Runtime colour for the fill (theme presets are runtime values, not Tailwind classes). */
  indicatorColor?: string
  indicatorClassName?: string
}

// Track height defaults to h-2; pass `className="h-1.5"` etc. to override.
// The fill animates width (not translateX) so absolutely positioned children
// such as marker lines can be layered on top of the track.
const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, indicatorColor, indicatorClassName, children, ...props }, ref) => {
  const pct = Math.max(0, Math.min(100, value ?? 0))
  return (
    <ProgressPrimitive.Root
      ref={ref}
      value={pct}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full rounded-full transition-[width] duration-500 ease-out",
          indicatorColor ? undefined : "bg-primary",
          indicatorClassName
        )}
        style={{ width: `${pct}%`, backgroundColor: indicatorColor }}
      />
      {children}
    </ProgressPrimitive.Root>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
