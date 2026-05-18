import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import type { IssueThreadInteraction } from "@paperclipai/shared";
import { Building2 } from "lucide-react";
import { agentsApi } from "../api/agents";
import { approvalsApi } from "../api/approvals";
import { goalsApi } from "../api/goals";
import { issuesApi } from "../api/issues";
import {
  ConstraintsPanel,
  DecisionsPanel,
  ExecutionStatePanel,
  FreshCompanyPanel,
  NextMovePanel,
  ObjectiveHeader,
  OperatorDock,
  OperatorDrawer,
  OutcomesPanel,
  TheftPageShell,
  StrategyMapPanel,
} from "@/components/theft";
import { EmptyState } from "../components/EmptyState";
import { PageSkeleton } from "../components/PageSkeleton";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useCompany } from "../context/CompanyContext";
import { useDialogActions } from "../context/DialogContext";
import { queryKeys } from "../lib/queryKeys";
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
  const isFreshCompany = (issues?.length ?? 0) === 0 && latestLibraryDocuments.length === 0;

  return (
    <TheftPageShell
      className="min-h-0 bg-background text-foreground"
      contentClassName="theft-dashboard-container block space-y-6 overflow-x-hidden px-1 pb-28 md:px-3"
    >
      <section className="theft-dashboard-shell-grid grid min-w-0 gap-6" data-operator-open={String(operatorOpen)}>
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

          {isFreshCompany ? (
            <FreshCompanyPanel onAskOperator={() => setOperatorOpen(true)} />
          ) : null}

          <div className="theft-dashboard-content-grid grid min-w-0 gap-6" data-operator-open={String(operatorOpen)}>
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
    </TheftPageShell>
  );
}
