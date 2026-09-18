// Phosphor instead of lucide, like the rest of ui/ (the CLI default is lucide).
import { SpinnerGap } from "@phosphor-icons/react"

import { cn } from "@/lib/utils"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <SpinnerGap
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
