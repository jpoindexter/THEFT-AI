import type { ReactNode } from "react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {title}
      </h3>
      <Separator />
      {children}
    </section>
  );
}

export function SubSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">{title}</h4>
      {children}
    </div>
  );
}

const swatchClasses: Record<string, string> = {
  "--background": "bg-background",
  "--foreground": "bg-foreground",
  "--card": "bg-card",
  "--primary": "bg-primary",
  "--primary-foreground": "bg-primary-foreground",
  "--secondary": "bg-secondary",
  "--muted": "bg-muted",
  "--muted-foreground": "bg-muted-foreground",
  "--accent": "bg-accent",
  "--destructive": "bg-destructive",
  "--border": "bg-border",
  "--ring": "bg-ring",
  "--sidebar": "bg-sidebar",
  "--sidebar-border": "bg-sidebar-border",
  "--chart-1": "bg-chart-1",
  "--chart-2": "bg-chart-2",
  "--chart-3": "bg-chart-3",
  "--chart-4": "bg-chart-4",
  "--chart-5": "bg-chart-5",
};

export function Swatch({ name, cssVar }: { name: string; cssVar: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("h-8 w-8 shrink-0 rounded-md border border-border", swatchClasses[cssVar])} />
      <div>
        <p className="text-xs font-mono">{cssVar}</p>
        <p className="text-xs text-muted-foreground">{name}</p>
      </div>
    </div>
  );
}
