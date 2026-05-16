import * as React from "react"

import { TheftPageShell } from "@/components/theft/organisms/TheftPageShell"
import { cn } from "@/lib/utils"

type TheftDetailReviewTemplateProps = Omit<
  React.ComponentProps<typeof TheftPageShell>,
  "children"
> & {
  activity?: React.ReactNode
  children: React.ReactNode
  inspector?: React.ReactNode
  summary?: React.ReactNode
}

function TheftDetailReviewTemplate({
  activity,
  children,
  className,
  inspector,
  summary,
  ...props
}: TheftDetailReviewTemplateProps) {
  return (
    <TheftPageShell
      data-template="theft-detail-review"
      className={cn("bg-background", className)}
      aside={inspector}
      {...props}
    >
      <div className="grid min-w-0 gap-6">
        {summary ? <div className="min-w-0">{summary}</div> : null}
        <div className="min-w-0">{children}</div>
        {activity ? <div className="min-w-0">{activity}</div> : null}
      </div>
    </TheftPageShell>
  )
}

export { TheftDetailReviewTemplate }
export type { TheftDetailReviewTemplateProps }
