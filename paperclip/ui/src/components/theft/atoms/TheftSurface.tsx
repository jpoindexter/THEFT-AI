import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const theftSurfaceVariants = cva("min-w-0", {
  variants: {
    tone: {
      default: "theft-surface",
      muted: "theft-surface-muted",
      panel: "theft-panel",
      plain: "theft-surface-plain",
      interactive:
        "theft-surface transition-colors hover:bg-accent/60 focus-within:ring-2 focus-within:ring-ring/20",
    },
    padding: {
      none: "p-0 py-0",
      sm: "p-3 py-3",
      md: "p-4 py-4",
      lg: "p-6 py-6",
    },
  },
  defaultVariants: {
    padding: "md",
    tone: "default",
  },
})

type TheftSurfaceProps = React.ComponentProps<typeof Card> &
  VariantProps<typeof theftSurfaceVariants>

const TheftSurface = React.forwardRef<HTMLDivElement, TheftSurfaceProps>(
  function TheftSurface({ className, padding, tone, ...props }, ref) {
    return (
      <Card
        ref={ref}
        data-slot="theft-surface"
        data-padding={padding}
        data-tone={tone}
        className={cn(theftSurfaceVariants({ padding, tone }), className)}
        {...props}
      />
    )
  },
)

TheftSurface.displayName = "TheftSurface"

export { TheftSurface, theftSurfaceVariants }
export type { TheftSurfaceProps }
