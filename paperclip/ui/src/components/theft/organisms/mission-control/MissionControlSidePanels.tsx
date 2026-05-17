import type { Issue, IssueDocument } from "@paperclipai/shared";
import { Link } from "@/lib/router";
import { ArrowRight, CheckCircle2, CircleDot, FileText, Library } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TheftSectionHeader, TheftStat } from "@/components/theft";
import { StatusIcon } from "@/components/StatusIcon";
import {
  issuePath,
  issuePriority,
  progressWidthClass,
} from "@/lib/missionControl";
import { timeAgo } from "@/lib/timeAgo";
import type { CompanyBottleneck, DepartmentCanvasRow } from "@/lib/theft-canvas";
import { cn } from "@/lib/utils";
import { MissionControlPanel } from "./MissionControlPanel";

export function ConstraintsPanel({
  approvalsCount,
  interactionsCount,
  blockedCount,
  setupTodoCount,
  outcomeCount,
}: {
  approvalsCount: number;
  interactionsCount: number;
  blockedCount: number;
  setupTodoCount: number;
  outcomeCount: number;
}) {
  const constraints = [
    { label: "Founder review", value: approvalsCount + interactionsCount, detail: "Decisions and questions" },
    { label: "Blocked work", value: blockedCount, detail: "Tasks unable to move" },
    { label: "Setup gaps", value: setupTodoCount, detail: "Company context missing" },
    { label: "Proof", value: outcomeCount, detail: "Recent Library outputs" },
  ];

  return (
    <MissionControlPanel>
      <TheftSectionHeader title="Constraints" />
      <div className="mt-3 grid grid-cols-2 gap-2">
        {constraints.map((constraint) => (
          <TheftStat
            key={constraint.label}
            label={constraint.label}
            value={constraint.value}
            description={constraint.detail}
            surfaceTone="muted"
          />
        ))}
      </div>
    </MissionControlPanel>
  );
}

export function DecisionsPanel({
  reviewIssues,
  approvalsCount,
  interactionsCount,
}: {
  reviewIssues: Issue[];
  approvalsCount: number;
  interactionsCount: number;
}) {
  const hasDecisions = approvalsCount > 0 || interactionsCount > 0 || reviewIssues.length > 0;

  return (
    <MissionControlPanel>
      <TheftSectionHeader
        title="Decisions"
        actions={
          <Link to="/inbox" className="text-sm text-muted-foreground no-underline hover:text-foreground">
            View all
          </Link>
        }
      />
      <div className="theft-surface-muted mt-3 divide-y divide-border overflow-hidden">
        {approvalsCount > 0 ? <DecisionCountLink to="/approvals/pending" title="Pending approvals" count={approvalsCount} /> : null}
        {interactionsCount > 0 ? <DecisionCountLink to="/inbox/mine" title="Agent questions" count={interactionsCount} /> : null}
        {reviewIssues.slice(0, 3).map((issue) => (
          <Link key={issue.id} to={issuePath(issue)} className="flex items-start gap-2 p-3 text-inherit no-underline hover:bg-accent">
            <StatusIcon status={issue.status} blockerAttention={issue.blockerAttention} className="mt-0.5" />
            <span className="min-w-0">
              <span className="line-clamp-1 text-sm">{issue.title}</span>
              <span className="mt-1 block text-xs text-muted-foreground">Review output · {issuePriority(issue)}</span>
            </span>
          </Link>
        ))}
        {!hasDecisions ? (
          <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" />
            No founder decision pending.
          </div>
        ) : null}
      </div>
    </MissionControlPanel>
  );
}

function DecisionCountLink({ to, title, count }: { to: string; title: string; count: number }) {
  return (
    <Link to={to} className="flex items-center justify-between gap-3 p-3 text-inherit no-underline hover:bg-accent">
      <span>
        <span className="block text-sm">{title}</span>
        <span className="text-xs text-muted-foreground">Founder decision required</span>
      </span>
      <Badge variant="outline">{count}</Badge>
    </Link>
  );
}

export function ExecutionStatePanel({ departments }: { departments: DepartmentCanvasRow[] }) {
  return (
    <MissionControlPanel>
      <TheftSectionHeader title="Execution state" />
      <div className="mt-3 space-y-3">
        {departments.map((department) => {
          const total = Math.max(department.issues.length, 1);
          const score = Math.round(((department.doneCount + department.reviewCount * 0.7 + department.activeCount * 0.35) / total) * 100);
          return (
            <Link key={department.key} to={`/departments/${department.key}`} className="block text-inherit no-underline">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">{department.title}</span>
                <span className="text-muted-foreground tabular-nums">{score}%</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-secondary">
                <div className={cn("h-full rounded-full bg-foreground", progressWidthClass(score))} />
              </div>
            </Link>
          );
        })}
      </div>
    </MissionControlPanel>
  );
}

export function OutcomesPanel({ documents }: { documents: Array<{ issue: Issue; document: IssueDocument }> }) {
  return (
    <MissionControlPanel>
      <TheftSectionHeader
        title="Outcomes"
        description="Latest Library artifacts and evidence."
        actions={
          <Link to="/library" className="text-sm text-muted-foreground no-underline hover:text-foreground">
            Library
          </Link>
        }
      />
      <div className="mt-3 grid gap-2">
        {documents.map(({ issue, document }) => (
          <Link
            key={`${issue.id}:${document.key}`}
            to={`/library?issue=${encodeURIComponent(issue.id)}&document=${encodeURIComponent(document.key)}`}
            className="flex min-w-0 max-w-full items-start gap-2 overflow-hidden rounded-lg bg-secondary p-4 text-inherit no-underline hover:text-foreground"
          >
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              <span className="line-clamp-1 text-sm">{document.title ?? document.key}</span>
              <span className="mt-1 block line-clamp-1 text-xs text-muted-foreground">
                {issue.identifier ?? issue.id.slice(0, 8)} · {timeAgo(document.updatedAt)}
              </span>
            </span>
          </Link>
        ))}
        {documents.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg bg-secondary p-4 text-sm text-muted-foreground">
            <Library className="h-4 w-4" />
            Outcomes will appear as departments publish work.
          </div>
        ) : null}
      </div>
    </MissionControlPanel>
  );
}

export function NextMovePanel({ bottleneck }: { bottleneck: CompanyBottleneck }) {
  const content = (
    <div className="theft-next-move-card p-6 text-primary-foreground">
      <p className="text-sm text-primary-foreground/65">Next Move recommended</p>
      <div className="mt-3 flex items-start gap-3">
        <CircleDot className="mt-0.5 h-5 w-5 shrink-0 text-primary-foreground" />
        <span className="min-w-0">
          <span className="block text-2xl font-semibold leading-tight">{bottleneck.label}</span>
          <span className="mt-3 block break-words text-sm leading-6 text-primary-foreground/70 [overflow-wrap:anywhere]">{bottleneck.detail}</span>
        </span>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-primary-foreground/15 pt-4 text-xs text-primary-foreground/60">
        <span>{bottleneck.tone === "clear" ? "Ready for founder prompt" : "Recommended by current constraints"}</span>
        <span className="flex items-center gap-2 font-medium text-primary-foreground">
          Review recommendation
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </div>
  );

  if (bottleneck.issue) {
    return (
      <Link to={issuePath(bottleneck.issue)} className="block text-inherit no-underline">
        {content}
      </Link>
    );
  }

  return content;
}
