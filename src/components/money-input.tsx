import * as React from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface UnitInputProps extends React.ComponentProps<typeof Input> {
  /** Text shown inside the field on the left (e.g. a currency symbol). */
  prefix?: string
  /** Text shown inside the field on the right (e.g. %, :1, pips). */
  suffix?: string
}

/**
 * Number input with the unit shown inside the field, so money reads as money
 * and percentages read as percentages instead of a bare number box.
 */
export const UnitInput = React.forwardRef<HTMLInputElement, UnitInputProps>(
  ({ prefix, suffix, className, ...props }, ref) => {
    return (
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
            {prefix}
          </span>
        )}
        <Input
          ref={ref}
          type="number"
          className={cn(prefix && 'pl-7', suffix && 'pr-12', className)}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    )
  }
)
UnitInput.displayName = 'UnitInput'

/**
 * Single policy for reading a number input's value: empty or unparsable
 * input becomes undefined, never NaN. (Bare parseFloat storing NaN has
 * already caused a crash-on-reload bug once — see TradeLog history.)
 */
export function parseNumberInput(raw: string): number | undefined {
  if (raw.trim() === '') return undefined
  const n = parseFloat(raw)
  return Number.isFinite(n) ? n : undefined
}
