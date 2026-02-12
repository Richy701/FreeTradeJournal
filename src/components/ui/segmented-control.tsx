import * as React from "react"
import { cn } from "@/lib/utils"

interface SegmentedControlProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
  size?: "sm" | "md" | "lg"
}

const SegmentedControl = React.forwardRef<
  HTMLDivElement,
  SegmentedControlProps
>(({ className, checked, onCheckedChange, size = "md", ...props }, ref) => {
  const sizeClasses = {
    sm: "h-6 text-xs",
    md: "h-7 sm:h-8 text-xs sm:text-sm", 
    lg: "h-8 sm:h-10 text-sm"
  }

  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-md bg-muted p-0.5 transition-colors touch-manipulation",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <button
        type="button"
        onClick={() => onCheckedChange(false)}
        className={cn(
          "flex-1 rounded-sm px-2 py-1 font-medium transition-shadow duration-200",
          !checked 
            ? "bg-background text-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        OFF
      </button>
      <button
        type="button"
        onClick={() => onCheckedChange(true)}
        className={cn(
          "flex-1 rounded-sm px-2 py-1 font-medium transition-shadow duration-200",
          checked 
            ? "bg-background text-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        ON
      </button>
    </div>
  )
})

SegmentedControl.displayName = "SegmentedControl"

export { SegmentedControl }