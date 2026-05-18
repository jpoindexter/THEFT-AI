import { Link } from "@/lib/router";
import type { Issue } from "@paperclipai/shared";
import { ArrowRight, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { StatusIcon } from "@/components/StatusIcon";
import { TheftSurface } from "@/components/theft";
import { timeAgo } from "@/lib/timeAgo";
import { cn } from "@/lib/utils";

export function issuePath(issue: Issue) {
  return `/issues/${issue.identifier ?? issue.id}`;
}

export function skillLabel(skill: string) {
  return skill.split("/").pop()?.replace(/-/g, " ") ?? skill;
}

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

export function DepartmentFocusCard({ label, value }: { label: string; value: string }) {
  return (
    <TheftSurface tone="muted" padding="sm">
      <p className="theft-label-compact">{label}</p>
      <p className="mt-2 break-words text-sm leading-6 text-foreground [overflow-wrap:anywhere]">{value}</p>
    </TheftSurface>
  );
}

export function DepartmentStat({ label, value }: { label: string; value: number }) {
  return (
    <TheftSurface tone="muted" padding="sm">
      <p className="text-lg font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </TheftSurface>
  );
}

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-b-0 last:pb-0">
      <span className="text-xs uppercase tracking-normal text-muted-foreground">{label}</span>
      <span className="truncate text-right font-medium">{value}</span>
    </div>
  );
}

export function WorkPanel({
  title,
  description,
  icon: Icon,
  issues,
  empty,
  tone = "default",
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  issues: Issue[];
  empty: string;
  tone?: "default" | "attention";
}) {
  return (
    <TheftSurface tone="plain" padding="md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={cn("mt-0.5 rounded-md p-2", tone === "attention" ? "bg-destructive/10 text-destructive" : "bg-muted text-foreground")}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <Badge variant="outline">{issues.length}</Badge>
      </div>
      <div className="theft-inset-surface mt-4 divide-y divide-border overflow-hidden">
        {issues.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">{empty}</p>
        ) : (
          issues.map((issue) => (
            <Link
              key={issue.id}
              to={issuePath(issue)}
              className="flex min-w-0 items-center justify-between gap-3 p-3 text-inherit no-underline transition-colors hover:bg-accent/40"
            >
              <div className="flex min-w-0 items-center gap-3">
                <StatusIcon status={issue.status} blockerAttention={issue.blockerAttention} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{issue.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {issue.identifier ?? statusLabel(issue.status)} - Updated {timeAgo(issue.updatedAt)}
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ))
        )}
      </div>
    </TheftSurface>
  );
}
