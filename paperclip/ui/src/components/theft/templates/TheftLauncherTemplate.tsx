import * as React from "react"

import { TheftSurface } from "@/components/theft/atoms/TheftSurface"
import { cn } from "@/lib/utils"

type TheftLauncherTemplateProps = Omit<React.ComponentProps<"section">, "title"> & {
  actions: React.ReactNode
  footer?: React.ReactNode
  meta?: React.ReactNode
  title: React.ReactNode
}

function TheftLauncherTemplate({
  actions,
  className,
  footer,
  meta,
  title,
  ...props
}: TheftLauncherTemplateProps) {
  return (
    <section
      data-template="theft-launcher"
      className={cn(
        "grid min-h-dvh place-items-center bg-background px-6 py-10 text-foreground",
        className,
      )}
      {...props}
    >
      <TheftSurface className="w-full max-w-2xl space-y-6" padding="lg">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-normal">{title}</h1>
          {meta ? <div className="text-sm text-muted-foreground">{meta}</div> : null}
        </div>
        <div className="grid gap-3">{actions}</div>
        {footer ? <div className="border-t pt-4">{footer}</div> : null}
      </TheftSurface>
    </section>
  )
}

export { TheftLauncherTemplate }
export type { TheftLauncherTemplateProps }
