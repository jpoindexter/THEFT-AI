import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate, useParams } from "@/lib/router";
import { accessApi } from "../../api/access";
import { agentsApi } from "../../api/agents";
import { heartbeatsApi } from "../../api/heartbeats";
import { projectsApi } from "../../api/projects";
import { routinesApi } from "../../api/routines";
import type { RoutineHistoryDirtyFieldDescriptor } from "../../components/RoutineHistoryTab";
import type { MarkdownEditorRef, MentionOption } from "../../components/MarkdownEditor";
import { useBreadcrumbs } from "../../context/BreadcrumbContext";
import { useCompany } from "../../context/CompanyContext";
import { useToastActions } from "../../context/ToastContext";
import { buildMarkdownMentionOptions } from "../../lib/company-members";
import { queryKeys } from "../../lib/queryKeys";
import { getRecentAssigneeIds, sortAgentsByRecency } from "../../lib/recent-assignees";
import { getRecentProjectIds } from "../../lib/recent-projects";
import type { InlineEntityOption } from "../../components/InlineEntitySelector";
import {
  autoResizeTextarea,
  getRoutineTabFromSearch,
  isRoutineTab,
  type NewRoutineTriggerDraft,
  type RoutineEditDraft,
  type SecretMessage,
} from "./routineDetailModel";
import { useRoutineDetailMutations } from "./useRoutineDetailMutations";

const defaultEditDraft: RoutineEditDraft = {
  title: "",
  description: "",
  projectId: "",
  assigneeAgentId: "",
  priority: "medium",
  concurrencyPolicy: "coalesce_if_active",
  catchUpPolicy: "skip_missed",
  variables: [],
};

export function useRoutineDetailController() {
  const { routineId } = useParams<{ routineId: string }>();
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { pushToast } = useToastActions();
  const hydratedRoutineIdRef = useRef<string | null>(null);
  const titleInputRef = useRef<HTMLTextAreaElement | null>(null);
  const descriptionEditorRef = useRef<MarkdownEditorRef>(null);
  const assigneeSelectorRef = useRef<HTMLButtonElement | null>(null);
  const projectSelectorRef = useRef<HTMLButtonElement | null>(null);
  const [secretMessage, setSecretMessage] = useState<SecretMessage | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [saveConflict, setSaveConflict] = useState(false);
  const [runVariablesOpen, setRunVariablesOpen] = useState(false);
  const [newTrigger, setNewTrigger] = useState<NewRoutineTriggerDraft>({
    kind: "schedule",
    cronExpression: "0 10 * * *",
    signingMode: "bearer",
    replayWindowSec: "300",
  });
  const [editDraft, setEditDraft] = useState<RoutineEditDraft>(defaultEditDraft);
  const activeTab = useMemo(() => getRoutineTabFromSearch(location.search), [location.search]);

  const routineQuery = useQuery({
    queryKey: queryKeys.routines.detail(routineId!),
    queryFn: () => routinesApi.get(routineId!),
    enabled: !!routineId,
  });
  const routine = routineQuery.data;
  const activeIssueId = routine?.activeIssue?.id;
  const liveRunsQuery = useQuery({
    queryKey: queryKeys.issues.liveRuns(activeIssueId!),
    queryFn: () => heartbeatsApi.liveRunsForIssue(activeIssueId!),
    enabled: !!activeIssueId,
    refetchInterval: 3000,
  });
  const hasLiveRun = (liveRunsQuery.data ?? []).length > 0;
  const routineRunsQuery = useQuery({
    queryKey: queryKeys.routines.runs(routineId!),
    queryFn: () => routinesApi.listRuns(routineId!),
    enabled: !!routineId,
    refetchInterval: hasLiveRun ? 3000 : false,
  });
  const relatedActivityIds = useMemo(
    () => ({
      triggerIds: routine?.triggers.map((trigger) => trigger.id) ?? [],
      runIds: routineRunsQuery.data?.map((run) => run.id) ?? [],
    }),
    [routine?.triggers, routineRunsQuery.data],
  );
  const activityQuery = useQuery({
    queryKey: [
      ...queryKeys.routines.activity(selectedCompanyId!, routineId!),
      relatedActivityIds.triggerIds.join(","),
      relatedActivityIds.runIds.join(","),
    ],
    queryFn: () => routinesApi.activity(selectedCompanyId!, routineId!, relatedActivityIds),
    enabled: !!selectedCompanyId && !!routineId && !!routine,
  });
  const agentsQuery = useQuery({
    queryKey: queryKeys.agents.list(selectedCompanyId!),
    queryFn: () => agentsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });
  const projectsQuery = useQuery({
    queryKey: queryKeys.projects.list(selectedCompanyId!),
    queryFn: () => projectsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });
  const companyMembersQuery = useQuery({
    queryKey: queryKeys.access.companyUserDirectory(selectedCompanyId!),
    queryFn: () => accessApi.listUserDirectory(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const routineDefaults = useMemo<RoutineEditDraft | null>(
    () =>
      routine
        ? {
            title: routine.title,
            description: routine.description ?? "",
            projectId: routine.projectId ?? "",
            assigneeAgentId: routine.assigneeAgentId ?? "",
            priority: routine.priority,
            concurrencyPolicy: routine.concurrencyPolicy,
            catchUpPolicy: routine.catchUpPolicy,
            variables: routine.variables,
          }
        : null,
    [routine],
  );
  const dirtyFields = useMemo<RoutineHistoryDirtyFieldDescriptor[]>(() => {
    if (!routineDefaults) return [];
    const result: RoutineHistoryDirtyFieldDescriptor[] = [];
    if (editDraft.title !== routineDefaults.title) result.push({ key: "title", label: "the title" });
    if (editDraft.description !== routineDefaults.description) result.push({ key: "description", label: "the description" });
    if (editDraft.projectId !== routineDefaults.projectId) result.push({ key: "projectId", label: "the project" });
    if (editDraft.assigneeAgentId !== routineDefaults.assigneeAgentId) result.push({ key: "assigneeAgentId", label: "the default agent" });
    if (editDraft.priority !== routineDefaults.priority) result.push({ key: "priority", label: "the priority" });
    if (editDraft.concurrencyPolicy !== routineDefaults.concurrencyPolicy) result.push({ key: "concurrencyPolicy", label: "the concurrency policy" });
    if (editDraft.catchUpPolicy !== routineDefaults.catchUpPolicy) result.push({ key: "catchUpPolicy", label: "the catch-up policy" });
    if (JSON.stringify(editDraft.variables) !== JSON.stringify(routineDefaults.variables)) result.push({ key: "variables", label: "the variables" });
    return result;
  }, [editDraft, routineDefaults]);
  const isEditDirty = dirtyFields.length > 0;

  useEffect(() => {
    if (!routine) return;
    setBreadcrumbs([{ label: "Routines", href: "/routines" }, { label: routine.title }]);
    if (!routineDefaults) return;
    const changedRoutine = hydratedRoutineIdRef.current !== routine.id;
    if (changedRoutine || !isEditDirty) {
      setEditDraft(routineDefaults);
      hydratedRoutineIdRef.current = routine.id;
    }
  }, [routine, routineDefaults, isEditDirty, setBreadcrumbs]);

  useEffect(() => {
    autoResizeTextarea(titleInputRef.current);
  }, [editDraft.title, routine?.id]);

  const setActiveTab = (value: string) => {
    if (!routineId || !isRoutineTab(value)) return;
    const params = new URLSearchParams(location.search);
    if (value === "triggers") params.delete("tab");
    else params.set("tab", value);
    const search = params.toString();
    navigate({ pathname: location.pathname, search: search ? `?${search}` : "" }, { replace: true });
  };

  const { mutations, actions } = useRoutineDetailMutations({
    routineId,
    selectedCompanyId,
    routine,
    editDraft,
    newTrigger,
    queryClient,
    pushToast,
    setActiveTab,
    setEditDraft,
    setSaveConflict,
    setSecretMessage,
    setRunVariablesOpen,
    hydratedRoutineIdRef,
  });

  const agentById = useMemo(() => new Map((agentsQuery.data ?? []).map((agent) => [agent.id, agent])), [agentsQuery.data]);
  const projectById = useMemo(() => new Map((projectsQuery.data ?? []).map((project) => [project.id, project])), [projectsQuery.data]);
  const recentAssigneeIds = useMemo(() => getRecentAssigneeIds(), [routine?.id]);
  const recentProjectIds = useMemo(() => getRecentProjectIds(), [routine?.id]);
  const assigneeOptions = useMemo<InlineEntityOption[]>(
    () =>
      sortAgentsByRecency(
        (agentsQuery.data ?? []).filter((agent) => agent.status !== "terminated"),
        recentAssigneeIds,
      ).map((agent) => ({
        id: agent.id,
        label: agent.name,
        searchText: `${agent.name} ${agent.role} ${agent.title ?? ""}`,
      })),
    [agentsQuery.data, recentAssigneeIds],
  );
  const projectOptions = useMemo<InlineEntityOption[]>(
    () =>
      (projectsQuery.data ?? []).map((project) => ({
        id: project.id,
        label: project.name,
        searchText: project.description ?? "",
      })),
    [projectsQuery.data],
  );
  const mentionOptions = useMemo<MentionOption[]>(
    () =>
      buildMarkdownMentionOptions({
        agents: agentsQuery.data,
        projects: projectsQuery.data,
        members: companyMembersQuery.data?.users,
      }),
    [agentsQuery.data, companyMembersQuery.data?.users, projectsQuery.data],
  );

  const copySecretValue = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      pushToast({ title: `${label} copied`, tone: "success" });
    } catch (error) {
      pushToast({
        title: `Failed to copy ${label.toLowerCase()}`,
        body: error instanceof Error ? error.message : "Clipboard access was denied.",
        tone: "error",
      });
    }
  };

  const reloadLatest = (defaults: RoutineEditDraft) => {
    setSaveConflict(false);
    setEditDraft(defaults);
    queryClient.invalidateQueries({ queryKey: queryKeys.routines.detail(routineId!) });
  };

  return {
    selectedCompanyId,
    routineId,
    routine,
    isLoading: routineQuery.isLoading,
    error: routineQuery.error,
    refs: { titleInputRef, descriptionEditorRef, assigneeSelectorRef, projectSelectorRef },
    editor: {
      editDraft,
      setEditDraft,
      updateDraft: (patch: Partial<RoutineEditDraft>) => setEditDraft((current) => ({ ...current, ...patch })),
      routineDefaults,
      dirtyFields,
      isEditDirty,
      advancedOpen,
      setAdvancedOpen,
      saveConflict,
      reloadLatest,
    },
    selectors: {
      agentById,
      projectById,
      assigneeOptions,
      projectOptions,
      recentAssigneeIds,
      recentProjectIds,
      mentionOptions,
    },
    tabs: {
      activeTab,
      setActiveTab,
      routineRuns: routineRunsQuery.data,
      activity: activityQuery.data,
      hasLiveRun,
      activeIssueId,
      newTrigger,
      setNewTrigger: (patch: Partial<NewRoutineTriggerDraft>) => setNewTrigger((current) => ({ ...current, ...patch })),
    },
    secretMessage,
    copySecretValue,
    runVariables: { open: runVariablesOpen, setOpen: setRunVariablesOpen },
    mutations,
    actions: {
      ...actions,
      discardEdits: () => {
        if (routineDefaults) setEditDraft(routineDefaults);
      },
    },
    data: {
      agents: agentsQuery.data ?? [],
      projects: projectsQuery.data ?? [],
    },
  };
}
