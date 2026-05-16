import * as React from "react"

import { TheftChip } from "@/components/theft/atoms/TheftChip"
import { TheftLabel } from "@/components/theft/atoms/TheftLabel"
import { TheftSurface } from "@/components/theft/atoms/TheftSurface"
import { cn } from "@/lib/utils"

type TheftStatTone = "default" | "signal" | "success" | "warning" | "danger" | "muted"

type TheftStatProps = Omit<React.ComponentProps<typeof TheftSurface>, "tone"> & {
  description?: React.ReactNode
  icon?: React.ReactNode
  label: React.ReactNode
  meta?: React.ReactNode
  surfaceTone?: React.ComponentProps<typeof TheftSurface>["tone"]
  tone?: TheftStatTone
  value: React.ReactNode
}

const toneClasses: Record<TheftStatTone, string> = {
  default: "",
  danger: "text-destructive",
  muted: "text-muted-foreground",
  signal: "text-foreground",
  success: "text-chart-2",
  warning: "text-chart-4",
}

function TheftStat({
  className,
  description,
  icon,
  label,
  meta,
  surfaceTone,
  tone = "default",
  value,
  ...surfaceProps
}: TheftStatProps) {
  return (
    <TheftSurface
      data-slot="theft-stat"
      padding="md"
      tone={surfaceTone}
      className={cn("gap-3", className)}
      {...surfaceProps}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <TheftLabel density="compact">{label}</TheftLabel>
          <div className={cn("text-2xl font-semibold leading-none", toneClasses[tone])}>
            {value}
          </div>
        </div>
        {icon ? (
          <div className="text-muted-foreground [&_svg]:size-4">{icon}</div>
        ) : null}
      </div>
      {description ? (
        <div className="text-sm leading-snug text-muted-foreground">{description}</div>
      ) : null}
      {meta ? <TheftChip tone={tone === "default" ? "muted" : tone}>{meta}</TheftChip> : null}
    </TheftSurface>
  )
}

export { TheftStat }
export type { TheftStatProps, TheftStatTone }
