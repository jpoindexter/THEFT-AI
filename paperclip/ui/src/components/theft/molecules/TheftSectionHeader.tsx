import * as React from "react"

import { TheftLabel } from "@/components/theft/atoms/TheftLabel"
import { cn } from "@/lib/utils"

type TheftSectionHeaderProps = Omit<React.ComponentProps<"header">, "title"> & {
  actions?: React.ReactNode
  description?: React.ReactNode
  eyebrow?: React.ReactNode
  title: React.ReactNode
}

const TheftSectionHeader = React.forwardRef<HTMLElement, TheftSectionHeaderProps>(
  function TheftSectionHeader(
    { actions, className, description, eyebrow, title, ...props },
    ref,
  ) {
    return (
      <header
        ref={ref}
        data-slot="theft-section-header"
        className={cn("flex items-start justify-between gap-4", className)}
        {...props}
      >
        <div className="min-w-0 space-y-1">
          {eyebrow ? <TheftLabel density="compact">{eyebrow}</TheftLabel> : null}
          <h2 className="text-xl font-semibold leading-tight text-foreground">{title}</h2>
          {description ? (
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </header>
    )
  },
)

TheftSectionHeader.displayName = "TheftSectionHeader"

export { TheftSectionHeader }
export type { TheftSectionHeaderProps }
