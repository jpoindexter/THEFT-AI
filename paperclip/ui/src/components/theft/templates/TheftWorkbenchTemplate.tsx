import * as React from "react"

import { TheftPageShell } from "@/components/theft/organisms/TheftPageShell"
import { cn } from "@/lib/utils"

type TheftWorkbenchTemplateProps = React.ComponentProps<typeof TheftPageShell> & {
  contentClassName?: string
}

function TheftWorkbenchTemplate({
  children,
  className,
  contentClassName,
  ...props
}: TheftWorkbenchTemplateProps) {
  return (
    <TheftPageShell
      data-template="theft-workbench"
      className={cn("bg-background", className)}
      {...props}
    >
      <div className={cn("grid min-w-0 gap-6", contentClassName)}>{children}</div>
    </TheftPageShell>
  )
}

export { TheftWorkbenchTemplate }
export type { TheftWorkbenchTemplateProps }
