import * as React from "react"

import { TheftSectionHeader } from "@/components/theft/molecules/TheftSectionHeader"
import { cn } from "@/lib/utils"

type TheftSplitCanvasFormTemplateProps = Omit<
  React.ComponentProps<"section">,
  "children" | "title"
> & {
  actions?: React.ReactNode
  canvas: React.ReactNode
  form: React.ReactNode
  formFooter?: React.ReactNode
  formHeader?: React.ReactNode
  header?: React.ReactNode
  kicker?: React.ReactNode
  title?: React.ReactNode
}

function TheftSplitCanvasFormTemplate({
  actions,
  canvas,
  className,
  form,
  formFooter,
  formHeader,
  header,
  kicker,
  title,
  ...props
}: TheftSplitCanvasFormTemplateProps) {
  return (
    <section
      data-template="theft-split-canvas-form"
      className={cn("flex h-full min-h-0 flex-col bg-background", className)}
      {...props}
    >
      {header ?? (
        <div className="border-b bg-background px-6 py-4">
          <TheftSectionHeader actions={actions} eyebrow={kicker} title={title ?? "Setup"} />
        </div>
      )}
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(360px,520px)]">
        <div className="min-h-0 overflow-hidden border-r bg-muted/20">{canvas}</div>
        <aside className="flex min-h-0 flex-col bg-background">
          {formHeader ? <div className="border-b px-6 py-4">{formHeader}</div> : null}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6">
            {form}
          </div>
          {formFooter ? <div className="border-t px-6 py-4">{formFooter}</div> : null}
        </aside>
      </div>
    </section>
  )
}

export { TheftSplitCanvasFormTemplate }
export type { TheftSplitCanvasFormTemplateProps }
