import type { Goal, Issue } from "@paperclipai/shared";
import { Link } from "@/lib/router";
import { Route } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TheftSectionHeader } from "@/components/theft";
import { StatusIcon } from "@/components/StatusIcon";
import {
  formatStatusLabel,
  issuePath,
  summarizeAgent,
} from "@/lib/missionControl";
import type { DepartmentCanvasRow } from "@/lib/theft-canvas";
import { MissionControlPanel } from "./MissionControlPanel";

export function StrategyMapPanel({
  objective,
  goals,
  departments,
  nextTasks,
}: {
  objective: string;
  goals: Goal[];
  departments: DepartmentCanvasRow[];
  nextTasks: Issue[];
}) {
  const tracks = goals.slice(0, 3);
  const fallbackTracks = ["Define and de-risk offer", "Build proof", "Acquire first users"];
  const visibleTracks = tracks.length > 0 ? tracks.map((goal) => goal.title) : fallbackTracks;

  return (
    <MissionControlPanel className="theft-strategy-map-panel max-w-full overflow-hidden p-4 md:p-5">
      <TheftSectionHeader
        className="mb-5"
        title="Workspace / Strategy map"
        description="Objective to departments, tasks, and Library artifacts"
        actions={
          <Link
            to="/goals"
            className="bg-secondary px-4 py-2 text-sm text-muted-foreground no-underline hover:text-foreground"
          >
            Tech Tree
          </Link>
        }
      />

      <div className="theft-surface-muted min-w-0 max-w-full overflow-hidden p-4 md:p-5">
        <div className="theft-objective-card mx-auto max-w-2xl min-w-0 px-6 py-5 text-center">
          <p className="text-sm text-muted-foreground">Current objective</p>
          <p className="mt-2 text-lg font-semibold text-foreground">{objective}</p>
        </div>

        <div className="mx-auto my-6 h-8 w-px bg-border" />

        <div className="grid gap-3 md:grid-cols-3">
          {visibleTracks.map((track) => (
            <div key={track} className="theft-surface-plain px-5 py-4 text-center">
              <p className="line-clamp-2 text-sm font-medium">{track}</p>
            </div>
          ))}
        </div>

        <div className="my-6 h-px bg-border" />

        <DepartmentCards departments={departments} />

        <div className="theft-surface-plain mt-6 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-muted-foreground">Available next work</p>
            <Route className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {nextTasks.slice(0, 3).map((issue) => (
              <Link
                key={issue.id}
                to={issuePath(issue)}
                className="theft-surface-muted min-w-0 max-w-full overflow-hidden px-4 py-3 text-inherit no-underline hover:text-foreground"
              >
                <p className="min-w-0 break-words line-clamp-1 text-sm [overflow-wrap:anywhere]">{issue.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatStatusLabel(issue.status)}</p>
              </Link>
            ))}
            {nextTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active tasks yet. Ask Operator for the first move.</p>
            ) : null}
          </div>
        </div>
      </div>
    </MissionControlPanel>
  );
}

function DepartmentCards({ departments }: { departments: DepartmentCanvasRow[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {departments.map((department) => (
        <Link
          key={department.key}
          to={`/departments/${department.key}`}
          className="theft-surface-plain group min-w-0 max-w-full overflow-hidden p-4 text-inherit no-underline transition-transform hover:-translate-y-0.5 hover:border-primary/70 hover:bg-accent/40"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold group-hover:text-foreground">{department.title}</h3>
              <p className="mt-1 truncate text-xs text-muted-foreground">{summarizeAgent(department.agent)}</p>
            </div>
            <Badge variant={department.activeCount > 0 ? "default" : "outline"}>
              {department.activeCount} open
            </Badge>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
            <DepartmentMetric value={department.reviewCount} label="rev" />
            <DepartmentMetric value={department.doneCount} label="out" />
            <DepartmentMetric value={department.issues.length} label="tasks" />
          </div>
          <div className="mt-3 min-h-10 min-w-0">
            {department.nextIssue ? (
              <div className="flex min-w-0 items-start gap-2 text-xs">
                <StatusIcon
                  status={department.nextIssue.status}
                  blockerAttention={department.nextIssue.blockerAttention}
                  className="mt-0.5"
                />
                <span className="min-w-0 break-words line-clamp-2 [overflow-wrap:anywhere]">
                  {department.nextIssue.title}
                </span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No assigned tasks yet.</p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

function DepartmentMetric({ value, label }: { value: number; label: string }) {
  return (
    <span className="min-w-0">
      <span className="block tabular-nums text-foreground">{value}</span>
      <span className="block truncate">{label}</span>
    </span>
  );
}
