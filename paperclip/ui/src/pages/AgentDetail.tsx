import { useCallback, useMemo, useState, useRef } from "react";
import { useParams, useNavigate, Navigate, useBeforeUnload } from "@/lib/router";
import { useQuery } from "@tanstack/react-query";
import { agentsApi } from "../api/agents";
import { budgetsApi } from "../api/budgets";
import { heartbeatsApi } from "../api/heartbeats";
import { issuesApi } from "../api/issues";
import { usePanel } from "../context/PanelContext";
import { useSidebar } from "../context/SidebarContext";
import { useCompany } from "../context/CompanyContext";
import { useDialogActions } from "../context/DialogContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { queryKeys } from "../lib/queryKeys";
import { PageSkeleton } from "../components/PageSkeleton";
import { BudgetPolicyCard } from "../components/BudgetPolicyCard";
import { cn } from "../lib/utils";
import {
  isUuidLike,
  type AgentDetail as AgentDetailRecord,
} from "@paperclipai/shared";
import { agentRouteRef } from "../lib/utils";
import { AgentDetailHeader } from "./agent-detail/AgentDetailHeader";
import { RunsTab } from "./agent-detail/RunsTab";
import { AgentSkillsTab } from "./agent-detail/AgentSkillsTab";
import { RunDetail } from "./agent-detail/RunDetail";
import { RunInvocationCard } from "./agent-detail/RunInvocationCard";
import { AgentOverview } from "./agent-detail/AgentOverview";
import { AgentConfigurePage } from "./agent-detail/AgentConfiguration";
import { PromptsTab } from "./agent-detail/PromptsTab";
import { LogViewer } from "./agent-detail/LogViewer";
import { AgentDetailConfigActionBar } from "./agent-detail/AgentDetailConfigActionBar";
import { AgentDetailTabs } from "./agent-detail/AgentDetailTabs";
import { AgentPendingApprovalBanner } from "./agent-detail/AgentPendingApprovalBanner";
import { parseAgentDetailView, type AgentDetailView } from "./agent-detail/agentDetailView";
import { useAgentBudgetSummary } from "./agent-detail/useAgentBudgetSummary";
import { useAgentDetailMutations } from "./agent-detail/useAgentDetailMutations";
import { useAgentDetailRouteEffects } from "./agent-detail/useAgentDetailRouteEffects";

export { AgentSkillsTab, RunInvocationCard };

export function AgentDetail() {
  const { companyPrefix, agentId, tab: urlTab, runId: urlRunId } = useParams<{
    companyPrefix?: string;
    agentId: string;
    tab?: string;
    runId?: string;
  }>();
  const { companies, selectedCompanyId, setSelectedCompanyId } = useCompany();
  const { closePanel } = usePanel();
  const { openNewIssue } = useDialogActions();
  const { setBreadcrumbs } = useBreadcrumbs();
  const navigate = useNavigate();
  const [actionError, setActionError] = useState<string | null>(null);
  const activeView = urlRunId ? "runs" as AgentDetailView : parseAgentDetailView(urlTab ?? null);
  const needsDashboardData = activeView === "dashboard";
  const needsRunData = activeView === "runs" || Boolean(urlRunId);
  const shouldLoadHeartbeats = needsDashboardData || needsRunData;
  const [configDirty, setConfigDirty] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const saveConfigActionRef = useRef<(() => void) | null>(null);
  const cancelConfigActionRef = useRef<(() => void) | null>(null);
  const { isMobile } = useSidebar();
  const routeAgentRef = agentId ?? "";
  const routeCompanyId = useMemo(() => {
    if (!companyPrefix) return null;
    const requestedPrefix = companyPrefix.toUpperCase();
    return companies.find((company) => company.issuePrefix.toUpperCase() === requestedPrefix)?.id ?? null;
  }, [companies, companyPrefix]);
  const lookupCompanyId = routeCompanyId ?? selectedCompanyId ?? undefined;
  const canFetchAgent = routeAgentRef.length > 0 && (isUuidLike(routeAgentRef) || Boolean(lookupCompanyId));
  const setSaveConfigAction = useCallback((fn: (() => void) | null) => { saveConfigActionRef.current = fn; }, []);
  const setCancelConfigAction = useCallback((fn: (() => void) | null) => { cancelConfigActionRef.current = fn; }, []);

  const { data: agent, isLoading, error } = useQuery<AgentDetailRecord>({
    queryKey: [...queryKeys.agents.detail(routeAgentRef), lookupCompanyId ?? null],
    queryFn: () => agentsApi.get(routeAgentRef, lookupCompanyId),
    enabled: canFetchAgent,
  });
  const resolvedCompanyId = agent?.companyId ?? selectedCompanyId;
  const canonicalAgentRef = agent ? agentRouteRef(agent) : routeAgentRef;
  const agentLookupRef = agent?.id ?? routeAgentRef;
  const resolvedAgentId = agent?.id ?? null;

  const { data: runtimeState } = useQuery({
    queryKey: queryKeys.agents.runtimeState(resolvedAgentId ?? routeAgentRef),
    queryFn: () => agentsApi.runtimeState(resolvedAgentId!, resolvedCompanyId ?? undefined),
    enabled: Boolean(resolvedAgentId) && needsDashboardData,
  });

  const { data: heartbeats } = useQuery({
    queryKey: queryKeys.heartbeats(resolvedCompanyId!, agent?.id ?? undefined),
    queryFn: () => heartbeatsApi.list(resolvedCompanyId!, agent?.id ?? undefined),
    enabled: !!resolvedCompanyId && !!agent?.id && shouldLoadHeartbeats,
  });

  const { data: allIssues } = useQuery({
    queryKey: [...queryKeys.issues.list(resolvedCompanyId!), "participant-agent", resolvedAgentId ?? "__none__"],
    queryFn: () => issuesApi.list(resolvedCompanyId!, { participantAgentId: resolvedAgentId! }),
    enabled: !!resolvedCompanyId && !!resolvedAgentId && needsDashboardData,
  });

  const { data: allAgents } = useQuery({
    queryKey: queryKeys.agents.list(resolvedCompanyId!),
    queryFn: () => agentsApi.list(resolvedCompanyId!),
    enabled: !!resolvedCompanyId && needsDashboardData,
  });

  const { data: budgetOverview } = useQuery({
    queryKey: queryKeys.budgets.overview(resolvedCompanyId ?? "__none__"),
    queryFn: () => budgetsApi.overview(resolvedCompanyId!),
    enabled: !!resolvedCompanyId,
    refetchInterval: 30_000,
    staleTime: 5_000,
  });

  const assignedIssues = (allIssues ?? [])
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const reportsToAgent = (allAgents ?? []).find((a) => a.id === agent?.reportsTo);
  const directReports = (allAgents ?? []).filter((a) => a.reportsTo === agent?.id && a.status !== "terminated");
  const agentBudgetSummary = useAgentBudgetSummary({
    agent,
    policies: budgetOverview?.policies,
    resolvedCompanyId,
    routeAgentRef,
  });
  const mobileLiveRun = useMemo(
    () => (heartbeats ?? []).find((r) => r.status === "running" || r.status === "queued") ?? null,
    [heartbeats],
  );

  const { agentAction, budgetMutation, resetTaskSession, updateIcon, updatePermissions } = useAgentDetailMutations({
    agent,
    agentLookupRef,
    canonicalAgentRef,
    navigate,
    resolvedCompanyId,
    routeAgentRef,
    setActionError,
  });

  useAgentDetailRouteEffects({
    activeView,
    agent,
    canonicalAgentRef,
    closePanel,
    navigate,
    routeAgentRef,
    selectedCompanyId,
    setBreadcrumbs,
    setSelectedCompanyId,
    urlRunId,
    urlTab,
  });

  useBeforeUnload(
    useCallback((event) => {
      if (!configDirty) return;
      event.preventDefault();
      event.returnValue = "";
    }, [configDirty]),
  );

  if (isLoading) return <PageSkeleton variant="detail" />;
  if (error) return <p className="text-sm text-destructive">{error.message}</p>;
  if (!agent) return null;
  if (!urlRunId && !urlTab) {
    return <Navigate to={`/agents/${canonicalAgentRef}/dashboard`} replace />;
  }
  const isPendingApproval = agent.status === "pending_approval";
  const showConfigActionBar = (activeView === "configuration" || activeView === "instructions") && (configDirty || configSaving);

  return (
    <div className={cn("space-y-6", isMobile && showConfigActionBar && "pb-24")}>
      <AgentDetailHeader
        agent={agent}
        canonicalAgentRef={canonicalAgentRef}
        mobileLiveRun={mobileLiveRun}
        isPendingApproval={isPendingApproval}
        onIconChange={(icon) => updateIcon.mutate(icon)}
        onOpenNewIssue={openNewIssue}
        agentAction={agentAction}
        resetTaskSession={resetTaskSession}
      />

      {!urlRunId && (
        <AgentDetailTabs
          activeView={activeView}
          agentRouteId={canonicalAgentRef}
          onNavigate={navigate}
        />
      )}

      {actionError && <p className="text-sm text-destructive">{actionError}</p>}
      <AgentPendingApprovalBanner agentAction={agentAction} visible={isPendingApproval} />
      <AgentDetailConfigActionBar
        isMobile={isMobile}
        onCancel={() => cancelConfigActionRef.current?.()}
        onSave={() => saveConfigActionRef.current?.()}
        saving={configSaving}
        visible={showConfigActionBar}
      />

      {activeView === "dashboard" && (
        <AgentOverview
          agent={agent}
          runs={heartbeats ?? []}
          assignedIssues={assignedIssues}
          runtimeState={runtimeState}
          agentId={agent.id}
          agentRouteId={canonicalAgentRef}
        />
      )}

      {activeView === "instructions" && (
        <PromptsTab
          agent={agent}
          companyId={resolvedCompanyId ?? undefined}
          onDirtyChange={setConfigDirty}
          onSaveActionChange={setSaveConfigAction}
          onCancelActionChange={setCancelConfigAction}
          onSavingChange={setConfigSaving}
        />
      )}

      {activeView === "configuration" && (
        <AgentConfigurePage
          agent={agent}
          agentId={agent.id}
          companyId={resolvedCompanyId ?? undefined}
          onDirtyChange={setConfigDirty}
          onSaveActionChange={setSaveConfigAction}
          onCancelActionChange={setCancelConfigAction}
          onSavingChange={setConfigSaving}
          updatePermissions={updatePermissions}
        />
      )}

      {activeView === "skills" && (
        <AgentSkillsTab
          agent={agent}
          companyId={resolvedCompanyId ?? undefined}
        />
      )}

      {activeView === "runs" && (
        <RunsTab
          runs={heartbeats ?? []}
          agentRouteId={canonicalAgentRef}
          selectedRunId={urlRunId ?? null}
          renderRunDetail={(run) => (
            <RunDetail
              key={run.id}
              run={run}
              agentRouteId={canonicalAgentRef}
              adapterType={agent.adapterType}
              adapterConfig={agent.adapterConfig}
              renderLogViewer={(detailRun, detailAdapterType) => (
                <LogViewer run={detailRun} adapterType={detailAdapterType} />
              )}
            />
          )}
        />
      )}

      {activeView === "budget" && resolvedCompanyId ? (
        <div className="max-w-3xl">
          <BudgetPolicyCard
            summary={agentBudgetSummary}
            isSaving={budgetMutation.isPending}
            onSave={(amount) => budgetMutation.mutate(amount)}
            variant="plain"
          />
        </div>
      ) : null}
    </div>
  );
}

/* ---- Log Viewer ---- */
