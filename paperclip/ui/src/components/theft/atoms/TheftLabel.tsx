import * as React from "react"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

type TheftLabelProps = React.ComponentProps<"span"> & {
  asChild?: boolean
  density?: "default" | "compact"
}

const TheftLabel = React.forwardRef<HTMLSpanElement, TheftLabelProps>(
  function TheftLabel(
    { asChild = false, className, density = "default", ...props },
    ref,
  ) {
    const Comp = asChild ? Slot.Root : "span"

    return (
      <Comp
        ref={ref}
        data-slot="theft-label"
        data-density={density}
        className={cn(
          density === "compact" ? "theft-label-compact" : "theft-label",
          className,
        )}
        {...props}
      />
    )
  },
)

TheftLabel.displayName = "TheftLabel"

export { TheftLabel }
export type { TheftLabelProps }
