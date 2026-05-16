import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "@/lib/router";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Agent, Goal, Issue, IssueDocument, IssueThreadInteraction } from "@paperclipai/shared";
import {
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  CircleDot,
  FileText,
  Library,
  PanelRightClose,
  PanelRightOpen,
  Route,
  Send,
  Sparkles,
  Target,
  X,
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
  type CompanyBottleneck,
  type DepartmentCanvasRow,
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
  if (!agent) return "No lead assigned";
  const title = agent.title ? `${agent.title} · ` : "";
  return `${title}${agent.status}`;
}

function issuePriority(issue: Issue) {
  return (issue.priority ?? "medium").replace(/_/g, " ");
}

export function Dashboard() {
  const { selectedCompanyId, selectedCompany, companies } = useCompany();
  const { openOnboarding } = useDialogActions();
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();
  const [operatorDraft, setOperatorDraft] = useState("");
  const [operatorOpen, setOperatorOpen] = useState(false);
  const [selectedDepartmentKey, setSelectedDepartmentKey] = useState("engineering");

  useEffect(() => {
    setBreadcrumbs([{ label: "Mission Control" }]);
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
  const reviewIssues = attentionIssues.filter(
    (issue) => issue.status === "in_review" || issue.productivityReview,
  );
  const blockedIssues = attentionIssues.filter(
    (issue) => issue.status === "blocked" || issue.successfulRunHandoff?.required,
  );
  const setupTodoCount = profile.setupItems.filter((item) => item.status === "todo").length;
  const objectiveTitle =
    roadmapGoals.find((goal) => goal.level === "company")?.title ??
    roadmapGoals[0]?.title ??
    "Choose the first company outcome";
  const objectiveDetail =
    roadmapGoals.find((goal) => goal.level === "company")?.description ??
    profile.brief ??
    "Turn strategy into department work, reviewable outputs, and durable company memory.";
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
          `Created from THEFT Operator dock for ${selectedDepartment.title}.`,
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
          message="Create your first company to open Mission Control."
          action="Start Onboarding"
          onAction={openOnboarding}
        />
      );
    }
    return <EmptyState icon={Building2} message="Select a company to open Mission Control." />;
  }

  if (agentsLoading || issuesLoading || !selectedCompany) {
    return <PageSkeleton variant="dashboard" />;
  }

  const reviewCount = (approvals?.length ?? 0) + pendingInteractions.length + reviewIssues.length;

  return (
    <div className="mx-auto max-w-[1760px] min-w-0 space-y-6 overflow-x-hidden px-1 pb-28 text-foreground md:px-3">
      <section className={cn("grid min-w-0 gap-6", operatorOpen && "xl:grid-cols-[minmax(0,1fr)_420px]")}>
        <div className="min-w-0 space-y-6">
          <ObjectiveHeader
            companyName={selectedCompany.name}
            stage={profile.stage ? THEFT_STAGE_LABELS[profile.stage] : null}
            objective={objectiveTitle}
            detail={objectiveDetail}
            departments={departmentRows}
            reviewCount={reviewCount}
            outcomeCount={latestLibraryDocuments.length}
          />

          <div className={cn(
            "grid min-w-0 gap-6",
            operatorOpen ? "grid-cols-[minmax(0,1fr)]" : "xl:grid-cols-[minmax(0,1fr)_390px]",
          )}>
            <StrategyMapPanel
              objective={objectiveTitle}
              goals={roadmapGoals}
              departments={departmentRows}
              nextTasks={nextTasks}
            />

            <aside className="min-w-0 space-y-6">
              <ConstraintsPanel
                approvalsCount={approvals?.length ?? 0}
                interactionsCount={pendingInteractions.length}
                blockedCount={blockedIssues.length}
                setupTodoCount={setupTodoCount}
                outcomeCount={latestLibraryDocuments.length}
              />
              <DecisionsPanel
                reviewIssues={reviewIssues}
                approvalsCount={approvals?.length ?? 0}
                interactionsCount={pendingInteractions.length}
              />
              <ExecutionStatePanel departments={departmentRows} />
              <OutcomesPanel documents={latestLibraryDocuments} />
              <NextMovePanel bottleneck={bottleneck} />
            </aside>
          </div>
        </div>

        {operatorOpen ? (
          <OperatorDrawer
            operator={operator}
            departments={departmentRows}
            selectedDepartmentKey={selectedDepartmentKey}
            setSelectedDepartmentKey={setSelectedDepartmentKey}
            operatorDraft={operatorDraft}
            setOperatorDraft={setOperatorDraft}
            createTask={() => createTaskMutation.mutate()}
            error={createTaskMutation.error?.message}
            isPending={createTaskMutation.isPending}
            canSubmit={!!operatorDraft.trim()}
            nextMove={bottleneck}
            onClose={() => setOperatorOpen(false)}
          />
        ) : null}
      </section>

      <OperatorDock
        open={operatorOpen}
        onToggle={() => setOperatorOpen((value) => !value)}
        operatorDraft={operatorDraft}
        setOperatorDraft={setOperatorDraft}
        createTask={() => createTaskMutation.mutate()}
        isPending={createTaskMutation.isPending}
        canSubmit={!!operatorDraft.trim()}
      />
    </div>
  );
}

function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("theft-panel min-w-0 p-5 md:p-7", className)}>
      {children}
    </section>
  );
}

function ObjectiveHeader({
  companyName,
  stage,
  objective,
  detail,
  departments,
  reviewCount,
  outcomeCount,
}: {
  companyName: string;
  stage: string | null;
  objective: string;
  detail: string;
  departments: DepartmentCanvasRow[];
  reviewCount: number;
  outcomeCount: number;
}) {
  const activeDepartments = departments.filter((department) => department.agent).length;

  return (
    <Panel className="space-y-0 p-4 md:p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="hidden size-12 shrink-0 items-center justify-center bg-secondary md:flex">
            <Target className="size-5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="rounded-[10px] border-border bg-secondary px-3 py-1 text-foreground">
                Objective
              </Badge>
              <span className="truncate">{companyName}</span>
              {stage ? <span>{stage}</span> : null}
            </div>
            <h1 className="mt-3 max-w-5xl break-words text-2xl font-medium leading-tight tracking-normal text-foreground md:text-3xl">
              {objective}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{detail}</p>
          </div>
        </div>
        <div className="grid w-full min-w-0 grid-cols-3 gap-2 sm:min-w-[280px] lg:w-auto">
          <MissionStat value={activeDepartments} label="departments" />
          <MissionStat value={reviewCount} label="review" />
          <MissionStat value={outcomeCount} label="outcomes" />
        </div>
      </div>
    </Panel>
  );
}

function MissionStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-secondary px-4 py-3 text-center">
      <p className="text-xl font-medium tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function StrategyMapPanel({
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
    <Panel className="min-h-[660px] max-w-full overflow-hidden p-4 md:p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium">Workspace / Strategy map</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Objective to departments, tasks, and Library artifacts
          </p>
        </div>
        <Link to="/goals" className="bg-secondary px-4 py-2 text-sm text-muted-foreground no-underline hover:text-foreground">
          Tech Tree
        </Link>
      </div>

      <div className="min-w-0 max-w-full overflow-hidden bg-secondary p-4 md:p-5">
        <div className="mx-auto max-w-2xl min-w-0 bg-card px-6 py-5 text-center shadow-[0_16px_48px_rgb(20_24_20/0.05)]">
          <p className="text-sm text-muted-foreground">Current objective</p>
          <p className="mt-2 text-lg font-semibold text-foreground">{objective}</p>
        </div>

        <div className="mx-auto my-6 h-8 w-px bg-border" />

        <div className="grid gap-3 md:grid-cols-3">
          {visibleTracks.map((track) => (
            <div key={track} className="bg-card px-5 py-4 text-center shadow-sm">
              <p className="line-clamp-2 text-sm font-medium">{track}</p>
            </div>
          ))}
        </div>

        <div className="my-6 h-px bg-border" />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {departments.map((department) => (
            <Link
              key={department.key}
              to={`/departments/${department.key}`}
              className="group min-w-0 max-w-full overflow-hidden bg-card p-4 text-inherit no-underline shadow-sm transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold group-hover:text-foreground">{department.title}</h3>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{summarizeAgent(department.agent)}</p>
                </div>
                <Badge variant={department.activeCount > 0 ? "default" : "outline"} className="rounded-[10px]">
                  {department.activeCount} open
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
                <span className="min-w-0">
                  <span className="block tabular-nums text-foreground">{department.reviewCount}</span>
                  <span className="block truncate">rev</span>
                </span>
                <span className="min-w-0">
                  <span className="block tabular-nums text-foreground">{department.doneCount}</span>
                  <span className="block truncate">out</span>
                </span>
                <span className="min-w-0">
                  <span className="block tabular-nums text-foreground">{department.issues.length}</span>
                  <span className="block truncate">tasks</span>
                </span>
              </div>
              <div className="mt-3 min-h-10 min-w-0">
                {department.nextIssue ? (
                  <div className="flex min-w-0 items-start gap-2 text-xs">
                    <StatusIcon status={department.nextIssue.status} blockerAttention={department.nextIssue.blockerAttention} className="mt-0.5" />
                    <span className="min-w-0 break-words line-clamp-2 [overflow-wrap:anywhere]">{department.nextIssue.title}</span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No assigned tasks yet.</p>
                )}
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-muted-foreground">Available next work</p>
            <Route className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {(nextTasks.length > 0 ? nextTasks.slice(0, 3) : []).map((issue) => (
              <Link
              key={issue.id}
              to={issuePath(issue)}
              className="min-w-0 max-w-full overflow-hidden bg-secondary px-4 py-3 text-inherit no-underline hover:text-foreground"
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
    </Panel>
  );
}

function ConstraintsPanel({
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
    <Panel>
      <h2 className="text-xl font-semibold">Constraints</h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {constraints.map((constraint) => (
          <div key={constraint.label} className="rounded-[14px] bg-secondary p-4">
            <p className="text-xs text-muted-foreground">{constraint.label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{constraint.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{constraint.detail}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function DecisionsPanel({
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
    <Panel>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Decisions</h2>
        <Link to="/inbox" className="text-sm text-muted-foreground no-underline hover:text-foreground">
          View all
        </Link>
      </div>
      <div className="mt-3 divide-y divide-border overflow-hidden rounded-[14px] bg-secondary">
        {approvalsCount > 0 ? (
          <Link to="/approvals/pending" className="flex items-center justify-between gap-3 p-3 text-inherit no-underline hover:bg-accent">
            <span>
              <span className="block text-sm">Pending approvals</span>
              <span className="text-xs text-muted-foreground">Founder decision required</span>
            </span>
            <Badge variant="outline" className="rounded-[10px]">{approvalsCount}</Badge>
          </Link>
        ) : null}
        {interactionsCount > 0 ? (
          <Link to="/inbox/mine" className="flex items-center justify-between gap-3 p-3 text-inherit no-underline hover:bg-accent">
            <span>
              <span className="block text-sm">Agent questions</span>
              <span className="text-xs text-muted-foreground">Clarifications waiting</span>
            </span>
            <Badge variant="outline" className="rounded-[10px]">{interactionsCount}</Badge>
          </Link>
        ) : null}
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
    </Panel>
  );
}

function ExecutionStatePanel({ departments }: { departments: DepartmentCanvasRow[] }) {
  return (
    <Panel>
      <h2 className="text-base font-normal">Execution state</h2>
      <div className="mt-3 space-y-3">
        {departments.map((department) => {
          const total = Math.max(department.issues.length, 1);
          const score = Math.round(((department.doneCount + department.reviewCount * 0.7 + department.activeCount * 0.35) / total) * 100);
          return (
            <Link
              key={department.key}
              to={`/departments/${department.key}`}
              className="block text-inherit no-underline"
            >
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">{department.title}</span>
                <span className="text-muted-foreground tabular-nums">{score}%</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-secondary">
                <div className="h-full rounded-full bg-foreground" style={{ width: `${Math.min(score, 100)}%` }} />
              </div>
            </Link>
          );
        })}
      </div>
    </Panel>
  );
}

function OutcomesPanel({
  documents,
}: {
  documents: Array<{ issue: Issue; document: IssueDocument }>;
}) {
  return (
    <Panel>
      <div className="flex items-center justify-between gap-3">
        <div>
        <h2 className="text-xl font-semibold">Outcomes</h2>
          <p className="mt-1 text-sm text-muted-foreground">Latest Library artifacts and evidence.</p>
        </div>
        <Link to="/library" className="text-sm text-muted-foreground no-underline hover:text-foreground">
          Library
        </Link>
      </div>
      <div className="mt-3 grid gap-2">
        {documents.map(({ issue, document }) => (
          <Link
            key={`${issue.id}:${document.key}`}
            to={`/library?issue=${encodeURIComponent(issue.id)}&document=${encodeURIComponent(document.key)}`}
            className="flex min-w-0 max-w-full items-start gap-2 overflow-hidden rounded-[14px] bg-secondary p-4 text-inherit no-underline hover:text-foreground"
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
          <div className="flex items-center gap-2 rounded-[14px] bg-secondary p-4 text-sm text-muted-foreground">
            <Library className="h-4 w-4" />
            Outcomes will appear as departments publish work.
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

function NextMovePanel({ bottleneck }: { bottleneck: CompanyBottleneck }) {
  const content = (
    <div className="bg-primary p-6 text-primary-foreground shadow-[0_18px_54px_rgb(20_24_20/0.12)]">
      <p className="text-sm text-primary-foreground/65">Next move recommended</p>
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

function OperatorDrawer({
  operator,
  departments,
  selectedDepartmentKey,
  setSelectedDepartmentKey,
  operatorDraft,
  setOperatorDraft,
  createTask,
  error,
  isPending,
  canSubmit,
  nextMove,
  onClose,
}: {
  operator: Agent | null;
  departments: DepartmentCanvasRow[];
  selectedDepartmentKey: string;
  setSelectedDepartmentKey: (key: string) => void;
  operatorDraft: string;
  setOperatorDraft: (value: string) => void;
  createTask: () => void;
  error: string | undefined;
  isPending: boolean;
  canSubmit: boolean;
  nextMove: CompanyBottleneck;
  onClose: () => void;
}) {
  const selectedDepartment =
    departments.find((department) => department.key === selectedDepartmentKey) ?? departments[0] ?? null;
  const proposedTasks = [
    {
      title: nextMove.issue?.title ?? nextMove.label,
      department: selectedDepartment?.title ?? "Operator",
      artifact: "Decision brief",
    },
    {
      title: "Collect evidence for the recommended path",
      department: selectedDepartment?.title ?? "Operator",
      artifact: "Evidence notes",
    },
  ];

  return (
    <aside className="theft-panel flex max-h-[calc(100dvh-6rem)] min-h-[min(620px,calc(100dvh-7rem))] flex-col overflow-hidden p-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 p-5 pb-3 md:p-6 md:pb-3">
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Operator</p>
          <h2 className="mt-1 truncate text-lg font-medium">{operator?.name ?? "Operator"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Mission Control context</p>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Collapse Operator" className="m-4 shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 md:px-6">
        <div className="space-y-4">
          <div className="border border-border bg-secondary p-4">
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>You</span>
              <span>now</span>
            </div>
            <p className="mt-2 text-sm">What should we do next?</p>
          </div>

          <div className="border border-border p-4">
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>Operator</span>
              <span>recommended</span>
            </div>
            <div className="mt-3 border border-foreground bg-card p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Next move</p>
              <p className="mt-2 text-base font-medium">{nextMove.label}</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {nextMove.tone === "clear" ? "Ready to advance." : "High leverage based on current constraints."}
              </p>
            </div>

            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Rationale</p>
              <ul className="mt-2 space-y-1.5 text-sm leading-5 text-muted-foreground">
                <li>Locks the current bottleneck into one concrete action.</li>
                <li>Uses latest execution state and Library evidence.</li>
                <li>Creates a reviewable artifact instead of more status.</li>
              </ul>
            </div>

            <div className="mt-4 grid gap-2">
              <EvidenceChip label="Constraint" value={nextMove.tone === "clear" ? "Clear" : "Needs action"} />
              <EvidenceChip label="Department" value={selectedDepartment?.title ?? "Operator"} />
              <EvidenceChip label="Artifact" value="Expected Library output" />
            </div>

            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Tradeoffs</p>
              <div className="mt-2 grid gap-2 text-xs text-muted-foreground">
                <div className="border border-border p-2">
                  <span className="font-medium text-foreground">Upside:</span> moves the company toward a durable outcome.
                </div>
                <div className="border border-border p-2">
                  <span className="font-medium text-foreground">Risk:</span> may need revision if context is incomplete.
                </div>
              </div>
            </div>
          </div>

          <div className="border border-border p-4">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Proposed tasks</p>
            <div className="mt-3 space-y-2">
              {proposedTasks.map((task) => (
                <div key={task.title} className="border border-border bg-secondary p-3">
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {task.department} · {task.artifact}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Route to department</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {departments.map((department) => (
                <button
                  key={department.key}
                  type="button"
                  onClick={() => setSelectedDepartmentKey(department.key)}
                  className={cn(
                    "border px-3 py-3 text-left text-xs transition-colors",
                    selectedDepartmentKey === department.key
                      ? "border-foreground bg-secondary text-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="block truncate">{department.title}</span>
                  <span className="mt-0.5 block truncate">{department.agent?.name ?? "No lead"}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border p-5 md:p-6">
        <Textarea
          value={operatorDraft}
          onChange={(event) => setOperatorDraft(event.target.value)}
          placeholder="Ask Operator about this recommendation..."
          className="min-h-24 resize-none rounded-none border-0 bg-secondary p-4"
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button className="col-span-2 rounded-none" disabled={isPending} onClick={createTask}>
            <Send className="h-4 w-4" />
            {isPending ? "Routing..." : "Create recommended task"}
          </Button>
          <Button variant="outline" size="sm" className="rounded-none">Compare options</Button>
          <Button variant="outline" size="sm" className="rounded-none">Explain risk</Button>
        </div>
      </div>
    </aside>
  );
}

function EvidenceChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border border-border p-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-medium">{value}</span>
    </div>
  );
}

function OperatorDock({
  open,
  onToggle,
  operatorDraft,
  setOperatorDraft,
  createTask,
  isPending,
  canSubmit,
}: {
  open: boolean;
  onToggle: () => void;
  operatorDraft: string;
  setOperatorDraft: (value: string) => void;
  createTask: () => void;
  isPending: boolean;
  canSubmit: boolean;
}) {
  if (open) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-30 flex items-center gap-2 border border-border bg-white/94 p-2 shadow-[0_18px_54px_rgb(20_24_20/0.12)] backdrop-blur md:bottom-6 md:left-1/2 md:right-auto md:w-[min(980px,calc(100vw-9rem))] md:-translate-x-1/2">
      <button
        type="button"
        onClick={onToggle}
        title="Open Operator"
        className="flex h-11 shrink-0 items-center gap-2 bg-secondary px-3 text-left text-sm hover:bg-accent md:h-12 md:px-4"
      >
        <Bot className="h-5 w-5" />
        <span>
          <span className="block text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Operator</span>
          <span className="block text-xs">Collapsed</span>
        </span>
      </button>
      <input
        value={operatorDraft}
        onChange={(event) => setOperatorDraft(event.target.value)}
        placeholder="Ask Operator..."
        className="hidden min-w-0 flex-1 bg-secondary px-5 py-3 text-base outline-none placeholder:text-muted-foreground sm:block"
      />
      <Button variant="ghost" onClick={onToggle} className="hidden h-12 gap-2 rounded-none px-3 sm:inline-flex" aria-label="Explain next move">
        <Sparkles className="h-4 w-4" />
        <span className="hidden text-xs lg:inline">Explain</span>
      </Button>
      <Button variant="ghost" onClick={onToggle} className="hidden h-12 gap-2 rounded-none px-3 sm:inline-flex" aria-label="Route work">
        <Route className="h-4 w-4" />
        <span className="hidden text-xs lg:inline">Route</span>
      </Button>
      <Button variant="ghost" onClick={onToggle} className="hidden h-12 gap-2 rounded-none px-3 sm:inline-flex" aria-label="Review work">
        <CheckCircle2 className="h-4 w-4" />
        <span className="hidden text-xs lg:inline">Review</span>
      </Button>
      <Button variant="outline" onClick={onToggle} className="ml-auto h-11 gap-2 rounded-none px-3 sm:hidden" aria-label="Open Operator">
        <Sparkles className="h-4 w-4" />
        <span className="text-xs">Open</span>
      </Button>
      <Button disabled={!canSubmit || isPending} onClick={createTask} className="hidden h-12 gap-2 rounded-none px-4 sm:inline-flex">
        <Send className="h-4 w-4" />
        <span className="hidden text-xs lg:inline">{isPending ? "Routing" : "Task"}</span>
      </Button>
    </div>
  );
}
