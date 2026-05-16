import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const theftChipVariants = cva("theft-chip", {
  variants: {
    tone: {
      default: "bg-card text-foreground",
      muted: "theft-chip-muted",
      important: "theft-chip-important",
      signal: "border-transparent bg-signal text-foreground",
      success: "border-chart-2/30 bg-chart-2/10 text-chart-2",
      warning: "border-chart-4/30 bg-chart-4/10 text-chart-4",
      danger: "border-destructive/30 bg-destructive/10 text-destructive",
      info: "border-chart-1/30 bg-chart-1/10 text-chart-1",
    },
    density: {
      default: "text-xs",
      compact: "px-2 py-0.5 text-micro",
    },
  },
  defaultVariants: {
    density: "default",
    tone: "default",
  },
})

type TheftChipProps = React.ComponentProps<typeof Badge> &
  VariantProps<typeof theftChipVariants>

function TheftChip({
  className,
  density,
  tone,
  variant = "outline",
  ...props
}: TheftChipProps) {
  return (
    <Badge
      data-slot="theft-chip"
      data-density={density}
      data-tone={tone}
      variant={variant}
      className={cn(theftChipVariants({ density, tone }), className)}
      {...props}
    />
  )
}

export { TheftChip, theftChipVariants }
export type { TheftChipProps }
