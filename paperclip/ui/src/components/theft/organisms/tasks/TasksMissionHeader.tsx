import type { Agent, Issue } from "@paperclipai/shared";
import { Link } from "@/lib/router";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  FileCheck2,
  GitBranch,
  ListChecks,
  MessageSquare,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusIcon } from "@/components/StatusIcon";
import { TheftChip, TheftSectionHeader, TheftStat, TheftSurface } from "@/components/theft";
import type { createIssueDetailLocationState } from "@/lib/issueDetailBreadcrumb";
import type { FounderTaskBuckets } from "@/lib/issuesPage";

export function TasksMissionHeader({
  buckets,
  isLoading,
  issueLinkState,
  agents,
}: {
  buckets: FounderTaskBuckets;
  isLoading: boolean;
  issueLinkState: ReturnType<typeof createIssueDetailLocationState>;
  agents?: Agent[];
}) {
  const nextIssue = buckets.needsAction[0] ?? buckets.ongoing[0] ?? buckets.todo[0] ?? null;
  const secondaryIssues = buckets.needsAction.slice(1, 5);
  const ownerName = getIssueOwnerName(nextIssue, agents);
  const actionReason = nextIssue ? getFounderActionReason(nextIssue) : "No current blocker";
  const decisionItems = nextIssue ? getIssueDecisionItems(nextIssue) : [];

  return (
    <TheftSurface tone="panel" padding="none" className="overflow-hidden">
      <div className="theft-tasks-mission-grid grid gap-0">
        <div className="space-y-5 p-5 md:p-7">
          <TasksMissionIntro buckets={buckets} />
          <div className="theft-tasks-next-grid grid gap-4">
            <RecommendedTaskCard
              issue={nextIssue}
              issueLinkState={issueLinkState}
              isLoading={isLoading}
              actionReason={actionReason}
              ownerName={ownerName}
              decisionItems={decisionItems}
            />
            <QueuedTasksCard issues={secondaryIssues} issueLinkState={issueLinkState} />
          </div>
        </div>
        <TasksOperatorPanel />
      </div>
    </TheftSurface>
  );
}

function TasksMissionIntro({ buckets }: { buckets: FounderTaskBuckets }) {
  return (
    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
      <div className="max-w-2xl space-y-3">
        <TheftChip tone="muted" density="compact" className="inline-flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5" />
          Needs Action
        </TheftChip>
        <TheftSectionHeader
          title={<span className="text-2xl md:text-3xl">Task review queue</span>}
          description="The queue surfaces decisions, blocked work, and ready outputs first. Runtime detail stays available below."
        />
      </div>
      <div className="theft-tasks-stat-grid grid grid-cols-2 gap-2 sm:grid-cols-4">
        <TaskBucketStat icon={AlertTriangle} label="Needs action" value={buckets.needsAction.length} tone="attention" />
        <TaskBucketStat icon={Clock3} label="Ongoing" value={buckets.ongoing.length} />
        <TaskBucketStat icon={ListChecks} label="Todo" value={buckets.todo.length} />
        <TaskBucketStat icon={CheckCircle2} label="Done" value={buckets.done.length} />
      </div>
    </div>
  );
}

function RecommendedTaskCard({
  issue,
  issueLinkState,
  isLoading,
  actionReason,
  ownerName,
  decisionItems,
}: {
  issue: Issue | null;
  issueLinkState: ReturnType<typeof createIssueDetailLocationState>;
  isLoading: boolean;
  actionReason: string;
  ownerName: string;
  decisionItems: Array<{ icon: LucideIcon; label: string; value: string }>;
}) {
  return (
    <TheftSurface tone="plain" padding="md">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="theft-label-compact">Recommended next move</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading ? "Loading active company tasks..." : issue ? actionReason : "No active task pressure right now."}
          </p>
        </div>
        {issue ? (
          <TheftChip tone="muted" density="compact">
            {issue.priority ?? "medium"} priority
          </TheftChip>
        ) : null}
      </div>

      {issue ? (
        <Link
          to={`/issues/${issue.identifier ?? issue.id}`}
          state={issueLinkState}
          className="group block border border-border bg-background px-4 py-4 transition hover:border-foreground/50 hover:bg-muted/25"
        >
          <div className="flex min-w-0 items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <StatusIcon status={issue.status} blockerAttention={issue.blockerAttention} className="mt-1" />
              <div className="min-w-0">
                <h2 className="break-words text-lg font-semibold leading-7 text-foreground">{issue.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {issue.identifier ?? "Unnumbered"} · {issue.status.replace(/_/g, " ")} · {ownerName}
                </p>
              </div>
            </div>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
          </div>
          {issue.description ? (
            <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted-foreground">{issue.description}</p>
          ) : null}
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {decisionItems.map((item) => (
              <TaskSignal key={item.label} icon={item.icon} label={item.label} value={item.value} />
            ))}
          </div>
        </Link>
      ) : (
        <div className="border border-dashed border-border bg-background/60 px-4 py-8 text-sm text-muted-foreground">
          {isLoading ? "Loading tasks..." : "Create or route the next task when you are ready to advance the company."}
        </div>
      )}
    </TheftSurface>
  );
}

function QueuedTasksCard({
  issues,
  issueLinkState,
}: {
  issues: Issue[];
  issueLinkState: ReturnType<typeof createIssueDetailLocationState>;
}) {
  return (
    <TheftSurface tone="muted" padding="md">
      <div className="flex items-center justify-between gap-3">
        <p className="theft-label-compact">Up next</p>
        <TheftChip tone="muted" density="compact">{issues.length} queued</TheftChip>
      </div>
      <div className="mt-3 space-y-2">
        {issues.length > 0 ? issues.map((issue) => (
          <Link
            key={issue.id}
            to={`/issues/${issue.identifier ?? issue.id}`}
            state={issueLinkState}
            className="flex items-start gap-2 border border-border bg-background px-3 py-2 text-sm transition hover:border-foreground/40 hover:bg-card"
          >
            <StatusIcon status={issue.status} blockerAttention={issue.blockerAttention} className="mt-0.5" />
            <span className="min-w-0">
              <span className="block truncate font-medium text-foreground">{issue.title}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{getFounderActionReason(issue)}</span>
            </span>
          </Link>
        )) : (
          <div className="border border-dashed border-border bg-background/60 px-3 py-6 text-sm text-muted-foreground">
            No extra review items.
          </div>
        )}
      </div>
    </TheftSurface>
  );
}

function TasksOperatorPanel() {
  return (
    <aside className="border-t border-border bg-muted/20 p-5 md:p-6 lg:border-l lg:border-t-0">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background">
          <Bot className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-foreground">Operator</h2>
          <p className="text-xs text-muted-foreground">Ask what to do next.</p>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        <Button variant="outline" className="h-auto w-full justify-start px-3 py-3 text-left text-sm font-normal">
          Summarize the bottleneck
        </Button>
        <Button variant="outline" className="h-auto w-full justify-start px-3 py-3 text-left text-sm font-normal">
          Route this to a department
        </Button>
        <Button variant="outline" className="h-auto w-full justify-start px-3 py-3 text-left text-sm font-normal">
          Draft the approval comment
        </Button>
      </div>
      <TheftSurface tone="plain" padding="sm" className="mt-5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MessageSquare className="h-3.5 w-3.5" />
          Persistent chat is docked here.
        </div>
        <p className="mt-2 text-sm text-foreground">What should move first?</p>
      </TheftSurface>
    </aside>
  );
}

function TaskBucketStat({
  icon: Icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone?: "attention" | "neutral";
}) {
  return (
    <TheftStat
      value={value}
      label={label}
      icon={<Icon />}
      tone={tone === "attention" ? "warning" : "default"}
      surfaceTone="muted"
      className="px-3 py-3"
    />
  );
}

function TaskSignal({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <TheftSurface tone="muted" padding="sm" className="px-3 py-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 truncate text-sm font-medium text-foreground">{value}</p>
    </TheftSurface>
  );
}

function getIssueOwnerName(issue: Issue | null, agents?: Agent[]): string {
  if (!issue) return "No owner";
  const agent = agents?.find((candidate) => candidate.id === issue.assigneeAgentId);
  if (agent) return agent.name;
  if (issue.assigneeUserId) return "Founder";
  return "Unassigned";
}

function getFounderActionReason(issue: Issue): string {
  if (issue.status === "blocked") return "Blocked: decide, reroute, or unblock";
  if (issue.status === "in_review") return "Review output and approve the next step";
  if (issue.productivityReview != null) return "Review agent productivity signal";
  if (issue.successfulRunHandoff?.required === true) return "Needs concrete handoff into the next task";
  if (issue.blockerAttention?.state === "stalled") return "Stalled: choose a recovery path";
  if (issue.blockerAttention?.state === "needs_attention") return "Needs founder attention";
  if (issue.status === "in_progress") return "Monitor execution";
  return "Ready to schedule";
}

function getIssueDecisionItems(issue: Issue): Array<{ icon: LucideIcon; label: string; value: string }> {
  return [
    { icon: GitBranch, label: "Execution", value: issue.status.replace(/_/g, " ") },
    { icon: FileCheck2, label: "Output", value: issue.successfulRunHandoff?.required === true ? "Needs handoff" : "Check evidence" },
    { icon: AlertTriangle, label: "Decision", value: getFounderActionReason(issue) },
  ];
}
