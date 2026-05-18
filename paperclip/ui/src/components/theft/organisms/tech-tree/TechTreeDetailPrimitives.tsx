import type { ReactNode } from "react";
import { Link } from "@/lib/router";
import { ArrowRight, Layers3, type LucideIcon } from "lucide-react";

import { TheftSurface } from "@/components/theft/atoms/TheftSurface";

export function TechTreeMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <TheftSurface tone="plain" padding="sm">
      <div className="theft-label-compact flex items-center gap-2 font-medium">
        <Icon className="h-3.5 w-3.5 text-foreground" />
        {label}
      </div>
      <div className="mt-2 truncate text-sm font-medium text-foreground">{value}</div>
    </TheftSurface>
  );
}

export function TechTreeEvidenceGate({
  childrenCount,
  projectCount,
  taskCount,
}: {
  childrenCount: number;
  projectCount: number;
  taskCount: number;
}) {
  return (
    <TheftSurface tone="plain" padding="sm">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Layers3 className="h-4 w-4 text-foreground" />
        Evidence gate
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        This node is real when work exists under it: department tasks, linked projects, Library outputs, or an
        explicit next action.
      </p>
      <div className="mt-3 grid grid-cols-3 border border-border text-center">
        <TechTreeMiniStat value={childrenCount} label="children" />
        <TechTreeMiniStat value={projectCount} label="projects" />
        <TechTreeMiniStat value={taskCount} label="tasks" />
      </div>
    </TheftSurface>
  );
}

function TechTreeMiniStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="border-r border-border px-2 py-2 last:border-r-0">
      <div className="text-base font-semibold tabular-nums">{value}</div>
      <div className="theft-label-nano">{label}</div>
    </div>
  );
}

export function TechTreeLinkRow({
  title,
  subtitle,
  to,
  children,
}: {
  title: string;
  subtitle: string;
  to: string;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between gap-3 border border-border bg-card px-3 py-2 text-sm text-inherit no-underline hover:border-primary/70 hover:bg-accent/40"
    >
      <span className="min-w-0">
        <span className="block truncate font-medium">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {children}
        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
      </span>
    </Link>
  );
}
