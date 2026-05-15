import { useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/router";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Agent, Issue, IssueDocument, IssueThreadInteraction } from "@paperclipai/shared";
import {
  AlertCircle,
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  FileText,
  GitBranch,
  Inbox,
  Library,
  MessageSquarePlus,
  Route,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { agentsApi } from "../api/agents";
import { approvalsApi } from "../api/approvals";
import { goalsApi } from "../api/goals";
import { issuesApi } from "../api/issues";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "../components/EmptyState";
import { PageSkeleton } from "../components/PageSkeleton";
import { StatusIcon } from "../components/StatusIcon";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useCompany } from "../context/CompanyContext";
import { useDialogActions } from "../context/DialogContext";
import { queryKeys } from "../lib/queryKeys";
import { timeAgo } from "../lib/timeAgo";
import { cn } from "../lib/utils";
import {
  THEFT_STAGE_LABELS,
  buildDepartmentCanvasRows,
  findOperatorAgent,
  getAttentionIssues,
  getCurrentBottleneck,
  getPendingInteractionsByIssue,
  getRoadmapGoals,
  parseCompanyProfileSummary,
} from "../lib/theft-canvas";

const ATTENTION_INTERACTION_ISSUE_LIMIT = 12;
const LIBRARY_ISSUE_LIMIT = 8;

function issuePath(issue: Issue) {
  return `/issues/${issue.identifier ?? issue.id}`;
}

function formatStatusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function summarizeAgent(agent: Agent | null) {
  if (!agent) return "No agent assigned";
  const title = agent.title ? `${agent.title} · ` : "";
  return `${title}${agent.status}`;
}

export function Dashboard() {
  const { selectedCompanyId, selectedCompany, companies } = useCompany();
  const { openOnboarding } = useDialogActions();
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();
  const [operatorDraft, setOperatorDraft] = useState("");
  const [selectedDepartmentKey, setSelectedDepartmentKey] = useState("engineering");

  useEffect(() => {
    setBreadcrumbs([{ label: "Command Center" }]);
  }, [setBreadcrumbs]);

  const { data: agents, isLoading: agentsLoading } = useQuery({
    queryKey: queryKeys.agents.list(selectedCompanyId!),
    queryFn: () => agentsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const { data: issues, isLoading: issuesLoading } = useQuery({
    queryKey: queryKeys.issues.list(selectedCompanyId!),
    queryFn: () => issuesApi.list(selectedCompanyId!, { includeBlockedBy: true }),
    enabled: !!selectedCompanyId,
  });

  const { data: goals } = useQuery({
    queryKey: queryKeys.goals.list(selectedCompanyId!),
    queryFn: () => goalsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const { data: approvals } = useQuery({
    queryKey: queryKeys.approvals.list(selectedCompanyId!, "pending"),
    queryFn: () => approvalsApi.list(selectedCompanyId!, "pending"),
    enabled: !!selectedCompanyId,
  });

  const profile = selectedCompany
    ? parseCompanyProfileSummary(selectedCompany)
    : { stage: null, setupItems: [], brief: null };
  const departmentRows = useMemo(
    () => buildDepartmentCanvasRows(agents ?? [], issues ?? []),
    [agents, issues],
  );
  const operator = useMemo(() => findOperatorAgent(agents ?? []), [agents]);
  const selectedDepartment =
    departmentRows.find((department) => department.key === selectedDepartmentKey) ?? departmentRows[0] ?? null;
  const attentionIssues = useMemo(() => getAttentionIssues(issues ?? []), [issues]);
  const roadmapGoals = useMemo(() => getRoadmapGoals(goals ?? []), [goals]);
  const openIssues = (issues ?? []).filter((issue) => !["done", "cancelled"].includes(issue.status));
  const nextTasks = [...openIssues]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);
  const libraryIssueCandidates = useMemo(
    () =>
      [...(issues ?? [])]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, LIBRARY_ISSUE_LIMIT),
    [issues],
  );

  const interactionIssueIds = attentionIssues
    .slice(0, ATTENTION_INTERACTION_ISSUE_LIMIT)
    .map((issue) => issue.id);
  const interactionQueries = useQueries({
    queries: interactionIssueIds.map((issueId) => ({
      queryKey: queryKeys.issues.interactions(issueId),
      queryFn: () => issuesApi.listInteractions(issueId),
      enabled: !!selectedCompanyId,
    })),
  });
  const interactionsByIssueId = interactionIssueIds.reduce<Record<string, IssueThreadInteraction[] | undefined>>(
    (acc, issueId, index) => {
      acc[issueId] = interactionQueries[index]?.data;
      return acc;
    },
    {},
  );
  const pendingInteractions = getPendingInteractionsByIssue(interactionsByIssueId);
  const bottleneck = useMemo(
    () =>
      getCurrentBottleneck({
        attentionIssues,
        openIssues,
        setupItems: profile.setupItems,
        approvalsCount: approvals?.length ?? 0,
        interactionsCount: pendingInteractions.length,
      }),
    [attentionIssues, approvals?.length, openIssues, pendingInteractions.length, profile.setupItems],
  );
  const libraryDocumentQueries = useQueries({
    queries: libraryIssueCandidates.map((issue) => ({
      queryKey: queryKeys.issues.documents(issue.id),
      queryFn: () => issuesApi.listDocuments(issue.id),
      enabled: !!selectedCompanyId,
    })),
  });
  const latestLibraryDocuments = useMemo(
    () =>
      libraryIssueCandidates
        .flatMap((issue, index) =>
          (libraryDocumentQueries[index]?.data ?? []).map((document) => ({ issue, document })),
        )
        .sort((a, b) => new Date(b.document.updatedAt).getTime() - new Date(a.document.updatedAt).getTime())
        .slice(0, 4),
    [libraryDocumentQueries, libraryIssueCandidates],
  );

  const createTaskMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCompanyId || !selectedDepartment) {
        throw new Error("Select a company and department first.");
      }
      const title = operatorDraft.trim();
      if (!title) {
        throw new Error("Describe the task first.");
      }
      return issuesApi.create(selectedCompanyId, {
        title,
        description: [
          `Created from THEFT Operator tray for ${selectedDepartment.title}.`,
          operator ? `Operator: ${operator.name}` : null,
        ].filter(Boolean).join("\n"),
        status: "todo",
        priority: "medium",
        assigneeAgentId: selectedDepartment.agent?.id ?? null,
      });
    },
    onSuccess: async () => {
      setOperatorDraft("");
      if (!selectedCompanyId) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.issues.list(selectedCompanyId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(selectedCompanyId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.activity(selectedCompanyId) }),
      ]);
    },
  });

  if (!selectedCompanyId) {
    if (companies.length === 0) {
      return (
        <EmptyState
          icon={Building2}
          message="Create your first company to open the operator canvas."
          action="Start Onboarding"
          onAction={openOnboarding}
        />
      );
    }
    return <EmptyState icon={Building2} message="Select a company to open the operator canvas." />;
  }

  if (agentsLoading || issuesLoading || !selectedCompany) {
    return <PageSkeleton variant="dashboard" />;
  }

  const setupDoneCount = profile.setupItems.filter((item) => item.status === "done").length;
  const setupTodoCount = profile.setupItems.filter((item) => item.status === "todo").length;

  return (
    <div className="space-y-5">
      <section className="border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-md">
                THEFT company
              </Badge>
              {profile.stage ? (
                <Badge variant="secondary" className="rounded-md">
                  {THEFT_STAGE_LABELS[profile.stage]}
                </Badge>
              ) : null}
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-normal text-foreground">
              {selectedCompany.name}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {profile.brief ?? "Company profile is ready for onboarding notes, operating context, and roadmap decisions."}
            </p>
          </div>
          <div className="grid min-w-[220px] grid-cols-3 gap-2 text-center">
            <CanvasStat value={departmentRows.filter((department) => department.agent).length} label="departments" />
            <CanvasStat value={openIssues.length} label="open tasks" />
            <CanvasStat value={(approvals?.length ?? 0) + pendingInteractions.length} label="reviews" />
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <SummaryPill icon={Bot} label="Operator" value={operator ? `${operator.name} · ${operator.status}` : "Not seeded"} />
          <SummaryPill
            icon={CheckCircle2}
            label="Setup"
            value={profile.setupItems.length ? `${setupDoneCount} done · ${setupTodoCount} open` : "No setup profile"}
          />
          <SummaryPill icon={GitBranch} label="Roadmap" value={`${roadmapGoals.length} active goals`} />
        </div>
        <BottleneckPanel bottleneck={bottleneck} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <div className="border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Departments</h2>
                <p className="text-sm text-muted-foreground">Each department owns a queue, a lead, and the next outcomes to ship.</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {departmentRows.map((department) => (
                <Link
                  key={department.key}
                  to={`/departments/${department.key}`}
                  className="block border border-border p-3 text-inherit no-underline transition-colors hover:bg-accent/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-medium">{department.title}</h3>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {summarizeAgent(department.agent)}
                      </p>
                    </div>
                    <Badge variant={department.activeCount > 0 ? "default" : "outline"} className="rounded-md">
                      {department.activeCount} open
                    </Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <span>{department.reviewCount} review</span>
                    <span>{department.doneCount} done</span>
                    <span>{department.issues.length} total</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {department.issues.slice(0, 2).map((issue) => (
                      <div key={issue.id} className="flex min-w-0 items-center gap-2 text-xs">
                        <StatusIcon status={issue.status} blockerAttention={issue.blockerAttention} />
                        <span className="truncate">{issue.title}</span>
                      </div>
                    ))}
                    {department.issues.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No assigned tasks yet.</p>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <TechTreePanel goals={roadmapGoals} nextTasks={nextTasks} />
            <AttentionPanel
              issues={attentionIssues}
              approvalsCount={approvals?.length ?? 0}
              interactionsCount={pendingInteractions.length}
            />
          </div>
        </div>

        <aside className="space-y-5">
          <div className="border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-md bg-primary/10 p-2 text-primary">
                <MessageSquarePlus className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Operator tray</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ask the Operator to route work to the right department.
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {departmentRows.map((department) => (
                  <button
                    key={department.key}
                    type="button"
                    onClick={() => setSelectedDepartmentKey(department.key)}
                    className={cn(
                      "rounded-md border px-3 py-2 text-left text-xs transition-colors",
                      selectedDepartmentKey === department.key
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-accent/50",
                    )}
                  >
                    <span className="block truncate font-medium">{department.title}</span>
                    <span className="mt-0.5 block truncate text-muted-foreground">
                      {department.agent?.name ?? "No lead"}
                    </span>
                  </button>
                ))}
              </div>
              <Textarea
                value={operatorDraft}
                onChange={(event) => setOperatorDraft(event.target.value)}
                placeholder="Ask Operator to create the next concrete task..."
                className="min-h-28 resize-none"
              />
              {createTaskMutation.error ? (
                <p className="text-sm text-destructive">{createTaskMutation.error.message}</p>
              ) : null}
              <Button
                className="w-full"
                disabled={!operatorDraft.trim() || createTaskMutation.isPending}
                onClick={() => createTaskMutation.mutate()}
              >
                <Sparkles className="h-4 w-4" />
                {createTaskMutation.isPending ? "Routing task..." : "Route task"}
              </Button>
            </div>
          </div>

          <LibraryOutputsPanel documents={latestLibraryDocuments} />

          <div className="border border-border bg-card p-4">
            <h2 className="text-base font-semibold">Next task area</h2>
            <div className="mt-3 divide-y divide-border border border-border">
              {nextTasks.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">No active tasks yet.</p>
              ) : (
                nextTasks.map((issue) => (
                  <Link
                    key={issue.id}
                    to={issuePath(issue)}
                    className="flex items-start gap-2 p-3 text-inherit no-underline transition-colors hover:bg-accent/40"
                  >
                    <StatusIcon status={issue.status} blockerAttention={issue.blockerAttention} className="mt-0.5" />
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-sm">{issue.title}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {issue.identifier ?? issue.id.slice(0, 8)} · {formatStatusLabel(issue.status)} · {timeAgo(issue.updatedAt)}
                      </span>
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function BottleneckPanel({ bottleneck }: { bottleneck: ReturnType<typeof getCurrentBottleneck> }) {
  const toneClass =
    bottleneck.tone === "attention"
      ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
      : bottleneck.tone === "review"
        ? "border-primary/30 bg-primary/10 text-primary"
        : "border-border bg-background text-foreground";
  const content = (
    <div className={cn("mt-4 flex items-start justify-between gap-3 border px-3 py-3", toneClass)}>
      <span className="min-w-0">
        <span className="block text-xs font-medium uppercase tracking-normal">Current bottleneck</span>
        <span className="mt-1 block text-sm font-medium">{bottleneck.label}</span>
        <span className="mt-1 block line-clamp-2 text-xs opacity-80">{bottleneck.detail}</span>
      </span>
      {bottleneck.issue ? <ArrowRight className="mt-1 h-4 w-4 shrink-0" /> : null}
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

function CanvasStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="border border-border px-3 py-2">
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function SummaryPill({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 border border-border px-3 py-2">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0">
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span className="block truncate text-sm">{value}</span>
      </span>
    </div>
  );
}

function TechTreePanel({ goals, nextTasks }: { goals: ReturnType<typeof getRoadmapGoals>; nextTasks: Issue[] }) {
  return (
    <div className="border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Tech tree</h2>
          <p className="text-sm text-muted-foreground">Company roadmap, dependencies, and next unlocks.</p>
        </div>
        <Route className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="space-y-3">
        {goals.slice(0, 4).map((goal) => (
          <Link key={goal.id} to={`/goals/${goal.id}`} className="block border border-border p-3 text-inherit no-underline hover:bg-accent/40">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate text-sm font-medium">{goal.title}</span>
              <Badge variant="outline" className="rounded-md">{goal.status}</Badge>
            </div>
            <p className="mt-1 text-[11px] uppercase tracking-normal text-muted-foreground">
              {goal.level} node{goal.parentId ? " · dependent" : " · root"}
            </p>
            {goal.description ? (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{goal.description}</p>
            ) : null}
          </Link>
        ))}
        {goals.length === 0 ? (
          <div className="border border-dashed border-border p-3 text-sm text-muted-foreground">
            No roadmap goals yet. Launch the first outcome to create the opening path.
          </div>
        ) : null}
        {nextTasks[0] ? (
          <Link to={issuePath(nextTasks[0])} className="flex items-center justify-between gap-3 text-sm text-primary no-underline hover:underline">
            Open next task <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function LibraryOutputsPanel({
  documents,
}: {
  documents: Array<{ issue: Issue; document: IssueDocument }>;
}) {
  return (
    <div className="border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Latest Library outputs</h2>
          <p className="text-sm text-muted-foreground">Recent docs created by the company.</p>
        </div>
        <Link to="/library" className="text-sm text-muted-foreground hover:text-foreground">
          Library
        </Link>
      </div>
      <div className="divide-y divide-border border border-border">
        {documents.map(({ issue, document }) => (
          <Link
            key={`${issue.id}:${document.key}`}
            to={`/library?issue=${encodeURIComponent(issue.id)}&document=${encodeURIComponent(document.key)}`}
            className="flex items-start gap-2 p-3 text-inherit no-underline transition-colors hover:bg-accent/40"
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
          <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
            <Library className="h-4 w-4" />
            Outputs will appear here as departments publish work.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AttentionPanel({
  issues,
  approvalsCount,
  interactionsCount,
}: {
  issues: Issue[];
  approvalsCount: number;
  interactionsCount: number;
}) {
  const hasAttention = issues.length > 0 || approvalsCount > 0 || interactionsCount > 0;

  return (
    <div className="border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Attention queue</h2>
          <p className="text-sm text-muted-foreground">Reviews, approvals, blocked tasks, and pending interactions.</p>
        </div>
        <AlertCircle className={cn("h-4 w-4", hasAttention ? "text-amber-500" : "text-muted-foreground")} />
      </div>
      <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
        <Link to="/approvals/pending" className="border border-border p-3 text-inherit no-underline hover:bg-accent/40">
          <span className="block font-medium">{approvalsCount}</span>
          <span className="text-xs text-muted-foreground">pending approvals</span>
        </Link>
        <Link to="/inbox/mine" className="border border-border p-3 text-inherit no-underline hover:bg-accent/40">
          <span className="block font-medium">{interactionsCount}</span>
          <span className="text-xs text-muted-foreground">agent questions</span>
        </Link>
      </div>
      <div className="divide-y divide-border border border-border">
        {issues.slice(0, 5).map((issue) => (
          <Link
            key={issue.id}
            to={issuePath(issue)}
            className="flex items-start gap-2 p-3 text-inherit no-underline transition-colors hover:bg-accent/40"
          >
            <StatusIcon status={issue.status} blockerAttention={issue.blockerAttention} className="mt-0.5" />
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 text-sm">{issue.title}</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {issue.status === "blocked" ? "Blocked" : issue.status === "in_review" ? "Needs review" : "Needs attention"}
              </span>
            </span>
          </Link>
        ))}
        {issues.length === 0 ? (
          <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
            <Inbox className="h-4 w-4" />
            Nothing needs review right now.
          </div>
        ) : null}
      </div>
    </div>
  );
}
