import * as React from "react"

import { TheftSectionHeader } from "@/components/theft/molecules/TheftSectionHeader"
import { cn } from "@/lib/utils"

type TheftPageShellProps = Omit<React.ComponentProps<"section">, "title"> & {
  actions?: React.ReactNode
  aside?: React.ReactNode
  description?: React.ReactNode
  eyebrow?: React.ReactNode
  footer?: React.ReactNode
  title?: React.ReactNode
}

const TheftPageShell = React.forwardRef<HTMLElement, TheftPageShellProps>(
  function TheftPageShell(
    {
      actions,
      aside,
      children,
      className,
      description,
      eyebrow,
      footer,
      title,
      ...props
    },
    ref,
  ) {
    const hasHeader = Boolean(title || description || eyebrow || actions)

    return (
      <section
        ref={ref}
        data-slot="theft-page-shell"
        className={cn("flex h-full min-h-0 flex-col bg-background", className)}
        {...props}
      >
        {hasHeader ? (
          <div className="border-b bg-background px-6 py-4">
            <TheftSectionHeader
              actions={actions}
              description={description}
              eyebrow={eyebrow}
              title={title}
            />
          </div>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div
            className={cn(
              "mx-auto grid w-full max-w-screen-2xl gap-6 px-6 py-6",
              aside ? "lg:grid-cols-4" : "",
            )}
          >
            <main
              data-slot="theft-page-main"
              className={cn("min-w-0", aside ? "lg:col-span-3" : "")}
            >
              {children}
            </main>
            {aside ? (
              <aside data-slot="theft-page-aside" className="min-w-0">
                {aside}
              </aside>
            ) : null}
          </div>
        </div>
        {footer ? <div className="border-t bg-background px-6 py-3">{footer}</div> : null}
      </section>
    )
  },
)

TheftPageShell.displayName = "TheftPageShell"

export { TheftPageShell }
export type { TheftPageShellProps }
