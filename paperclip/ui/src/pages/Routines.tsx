import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "@/lib/router";
import { Plus, Repeat } from "lucide-react";
import { routinesApi } from "../api/routines";
import { useCompany } from "../context/CompanyContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useToastActions } from "../context/ToastContext";
import { queryKeys } from "../lib/queryKeys";
import { createIssueDetailLocationState } from "../lib/issueDetailBreadcrumb";
import { trackRecentAssignee } from "../lib/recent-assignees";
import { trackRecentProject } from "../lib/recent-projects";
import { EmptyState } from "../components/EmptyState";
import { IssuesList } from "../components/IssuesList";
import { PageSkeleton } from "../components/PageSkeleton";
import { PageTabBar } from "../components/PageTabBar";
import type { MarkdownEditorRef } from "../components/MarkdownEditor";
import { RoutineRunVariablesDialog } from "../components/RoutineRunVariablesDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import type { RoutineListItem } from "@paperclipai/shared";
import { RoutineComposerDialog } from "./routines/RoutineComposerDialog";
import { RoutinesGroupedList } from "./routines/RoutinesGroupedList";
import { RoutinesListControls } from "./routines/RoutinesListControls";
import {
  autoResizeTextarea,
  buildRoutineGroups,
  buildRoutinesTabHref,
  defaultRoutineDraft,
  getRoutineViewState,
  saveRoutineViewState,
  sortRoutines,
  type RoutineDraft,
  type RoutinesTab,
  type RoutineViewState,
} from "./routines/routinesModel";
import { useRoutinesActions } from "./routines/useRoutinesActions";
import { useRoutinesPageData } from "./routines/useRoutinesPageData";

export { buildRoutineGroups, sortRoutines } from "./routines/routinesModel";

export function Routines() {
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { pushToast } = useToastActions();
  const descriptionEditorRef = useRef<MarkdownEditorRef>(null);
  const titleInputRef = useRef<HTMLTextAreaElement | null>(null);
  const assigneeSelectorRef = useRef<HTMLButtonElement | null>(null);
  const projectSelectorRef = useRef<HTMLButtonElement | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const activeTab: RoutinesTab = searchParams.get("tab") === "runs" ? "runs" : "routines";
  const [draft, setDraft] = useState<RoutineDraft>({ ...defaultRoutineDraft });
  const routineViewStateKey = selectedCompanyId
    ? `paperclip:routines-view:${selectedCompanyId}`
    : "paperclip:routines-view";
  const [routineViewState, setRoutineViewState] = useState<RoutineViewState>(() => getRoutineViewState(routineViewStateKey));

  useEffect(() => {
    setBreadcrumbs([{ label: "Routines" }]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    setRoutineViewState(getRoutineViewState(routineViewStateKey));
  }, [routineViewStateKey]);

  const { data: routines, isLoading, error } = useQuery({
    queryKey: queryKeys.routines.list(selectedCompanyId!),
    queryFn: () => routinesApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });
  const {
    agents,
    projects,
    mentionOptions,
    recentAssigneeIds,
    recentProjectIds,
    assigneeOptions,
    projectOptions,
    agentById,
    projectById,
    currentAssignee,
    currentProject,
    liveIssueIds,
    routineExecutionIssues,
    recentRunsLoading,
    recentRunsError,
  } = useRoutinesPageData({ activeTab, composerOpen, draft, selectedCompanyId });

  useEffect(() => {
    autoResizeTextarea(titleInputRef.current);
  }, [draft.title, composerOpen]);

  const {
    createRoutine,
    updateIssue,
    runRoutine,
    runningRoutineId,
    statusMutationRoutineId,
    runDialogRoutine,
    setRunDialogRoutine,
    handleRunNow,
    handleToggleEnabled,
    handleToggleArchived,
  } = useRoutinesActions({
    draft,
    navigate,
    pushToast,
    selectedCompanyId: selectedCompanyId ?? "",
    setAdvancedOpen,
    setComposerOpen,
    setDraft,
  });

  const sortedRoutines = useMemo(
    () => sortRoutines(routines ?? [], routineViewState.sortField, routineViewState.sortDir),
    [routineViewState.sortDir, routineViewState.sortField, routines],
  );
  const routineGroups = useMemo(
    () => buildRoutineGroups(sortedRoutines, routineViewState.groupBy, projectById, agentById),
    [agentById, projectById, routineViewState.groupBy, sortedRoutines],
  );
  const recentRunsIssueLinkState = useMemo(
    () =>
      createIssueDetailLocationState(
        "Recent Runs",
        buildRoutinesTabHref("runs"),
        "issues",
      ),
    [],
  );
  function updateRoutineView(patch: Partial<RoutineViewState>) {
    setRoutineViewState((current) => {
      const next = { ...current, ...patch };
      saveRoutineViewState(routineViewStateKey, next);
      return next;
    });
  }

  function handleTabChange(tab: string) {
    const nextTab = tab === "runs" ? "runs" : "routines";
    startTransition(() => {
      navigate(buildRoutinesTabHref(nextTab));
    });
  }

  if (!selectedCompanyId) {
    return <EmptyState icon={Repeat} message="Select a company to view routines." />;
  }

  if (isLoading) {
    return <PageSkeleton variant="issues-list" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Routines
          </h1>
          <p className="text-sm text-muted-foreground">
            Recurring work definitions that materialize into auditable execution issues.
          </p>
        </div>
        <Button onClick={() => setComposerOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create routine
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <PageTabBar
          align="start"
          value={activeTab}
          onValueChange={handleTabChange}
          items={[
            { value: "routines", label: "Routines" },
            { value: "runs", label: "Recent Runs" },
          ]}
        />
        <TabsContent value="routines" className="space-y-4">
          <RoutinesListControls
            routineCount={(routines ?? []).length}
            viewState={routineViewState}
            onChangeView={updateRoutineView}
          />
        </TabsContent>
        <TabsContent value="runs">
          <IssuesList
            issues={routineExecutionIssues ?? []}
            isLoading={recentRunsLoading}
            error={recentRunsError as Error | null}
            agents={agents}
            projects={projects}
            liveIssueIds={liveIssueIds}
            viewStateKey="paperclip:routine-recent-runs-view"
            issueLinkState={recentRunsIssueLinkState}
            onUpdateIssue={(id, data) => updateIssue.mutate({ id, data })}
          />
        </TabsContent>
      </Tabs>

      <RoutineComposerDialog
        open={composerOpen}
        advancedOpen={advancedOpen}
        createError={createRoutine.error}
        draft={draft}
        isPending={createRoutine.isPending}
        mentionOptions={mentionOptions}
        currentAssignee={currentAssignee}
        currentProject={currentProject}
        assigneeOptions={assigneeOptions}
        projectOptions={projectOptions}
        recentAssigneeIds={recentAssigneeIds}
        recentProjectIds={recentProjectIds}
        agentById={agentById}
        projectById={projectById}
        titleInputRef={titleInputRef}
        descriptionEditorRef={descriptionEditorRef}
        assigneeSelectorRef={assigneeSelectorRef}
        projectSelectorRef={projectSelectorRef}
        setAdvancedOpen={setAdvancedOpen}
        setDraft={setDraft}
        onOpenChange={(open) => {
          if (!createRoutine.isPending) setComposerOpen(open);
        }}
        onCreate={() => createRoutine.mutate()}
        onTrackAssignee={trackRecentAssignee}
        onTrackProject={trackRecentProject}
      />

      {error ? (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">
            {error instanceof Error ? error.message : "Failed to load routines"}
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "routines" ? (
        <RoutinesGroupedList
          routineCount={(routines ?? []).length}
          routineGroups={routineGroups}
          routineViewState={routineViewState}
          projectById={projectById}
          agentById={agentById}
          runningRoutineId={runningRoutineId}
          statusMutationRoutineId={statusMutationRoutineId}
          onChangeView={updateRoutineView}
          onRunNow={handleRunNow}
          onToggleEnabled={handleToggleEnabled}
          onToggleArchived={handleToggleArchived}
        />
      ) : null}

      <RoutineRunVariablesDialog
        open={runDialogRoutine !== null}
        onOpenChange={(next) => {
          if (!next) setRunDialogRoutine(null);
        }}
        companyId={selectedCompanyId}
        routineName={runDialogRoutine?.title ?? null}
        agents={agents ?? []}
        projects={projects ?? []}
        defaultProjectId={runDialogRoutine?.projectId ?? null}
        defaultAssigneeAgentId={runDialogRoutine?.assigneeAgentId ?? null}
        variables={runDialogRoutine?.variables ?? []}
        isPending={runRoutine.isPending}
        onSubmit={(data) => {
          if (!runDialogRoutine) return;
          runRoutine.mutate({ id: runDialogRoutine.id, data });
        }}
      />
    </div>
  );
}
