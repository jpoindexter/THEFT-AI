import type { ReactNode } from "react";
import { TheftSurface } from "@/components/theft";
import { cn } from "@/lib/utils";

export function MissionControlPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <TheftSurface tone="panel" padding="lg" className={cn("min-w-0 p-5 md:p-7", className)}>
      {children}
    </TheftSurface>
  );
}
