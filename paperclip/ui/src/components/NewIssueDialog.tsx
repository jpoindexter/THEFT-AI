import { useState, useEffect, useRef, useCallback, useMemo, type ChangeEvent, type DragEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { IssueWorkMode } from "@paperclipai/shared";
import { useDialog } from "../context/DialogContext";
import { useCompany } from "../context/CompanyContext";
import { useAdapterCapabilities } from "../adapters/use-adapter-capabilities";
import { executionWorkspacesApi } from "../api/execution-workspaces";
import { issuesApi } from "../api/issues";
import { instanceSettingsApi } from "../api/instanceSettings";
import { projectsApi } from "../api/projects";
import { agentsApi } from "../api/agents";
import { accessApi } from "../api/access";
import { authApi } from "../api/auth";
import { assetsApi } from "../api/assets";
import { buildCompanyUserInlineOptions, buildMarkdownMentionOptions } from "../lib/company-members";
import { queryKeys } from "../lib/queryKeys";
import { orderReusableExecutionWorkspaces } from "../lib/reusable-execution-workspaces";
import { useProjectOrder } from "../hooks/useProjectOrder";
import { getRecentAssigneeIds, sortAgentsByRecency, trackRecentAssignee } from "../lib/recent-assignees";
import { getRecentProjectIds, trackRecentProject } from "../lib/recent-projects";
import { buildExecutionPolicy } from "../lib/issue-execution-policy";
import { useToastActions } from "../context/ToastContext";
import {
  assigneeValueFromSelection,
  currentUserAssigneeOption,
  parseAssigneeValue,
} from "../lib/assignees";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { cn } from "../lib/utils";
import { extractProviderIdWithFallback } from "../lib/model-utils";
import type { MarkdownEditorRef, MentionOption } from "./MarkdownEditor";
import type { InlineEntityOption } from "./InlineEntitySelector";
import { ExecutionWorkspaceFields } from "./new-issue-dialog/ExecutionWorkspaceFields";
import { NewIssueAssignmentRows } from "./new-issue-dialog/NewIssueAssignmentRows";
import { NewIssueDialogFooter } from "./new-issue-dialog/NewIssueDialogFooter";
import { NewIssueDialogHeader } from "./new-issue-dialog/NewIssueDialogHeader";
import { IssueAssigneeOptionsPanel } from "./new-issue-dialog/IssueAssigneeOptionsPanel";
import { IssuePropertyChips } from "./new-issue-dialog/IssuePropertyChips";
import { NewIssueDescriptionSection, type StagedIssueFile } from "./new-issue-dialog/NewIssueDescriptionSection";
import { NewIssueTitleSection } from "./new-issue-dialog/NewIssueTitleSection";
import { NewIssueParentIssueNotice } from "./new-issue-dialog/NewIssueParentIssueNotice";

const DRAFT_KEY = "paperclip:issue-draft";
const DEBOUNCE_MS = 800;


interface IssueDraft {
  title: string;
  description: string;
  status: string;
  priority: string;
  assigneeValue: string;
  reviewerValue: string;
  approverValue: string;
  assigneeId?: string;
  projectId: string;
  projectWorkspaceId?: string;
  assigneeModelLane?: IssueModelLane;
  assigneeModelOverride: string;
  assigneeThinkingEffort: string;
  assigneeChrome: boolean;
  executionWorkspaceMode?: string;
  selectedExecutionWorkspaceId?: string;
  useIsolatedExecutionWorkspace?: boolean;
  workMode?: IssueWorkMode;
}

import {
  buildAssigneeAdapterOverrides,
  ISSUE_OVERRIDE_ADAPTER_TYPES,
  type IssueModelLane,
} from "../lib/issue-assignee-overrides";

const ISSUE_THINKING_EFFORT_OPTIONS = {
  claude_local: [
    { value: "", label: "Default" },
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
  ],
  codex_local: [
    { value: "", label: "Default" },
    { value: "minimal", label: "Minimal" },
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "xhigh", label: "X-High" },
  ],
  opencode_local: [
    { value: "", label: "Default" },
    { value: "minimal", label: "Minimal" },
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "xhigh", label: "X-High" },
    { value: "max", label: "Max" },
  ],
} as const;

function isIssueWorkMode(value: unknown): value is IssueWorkMode {
  return value === "standard" || value === "planning";
}

function loadDraft(): IssueDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as IssueDraft;
  } catch {
    return null;
  }
}

function saveDraft(draft: IssueDraft) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

function isTextDocumentFile(file: File) {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".md") ||
    name.endsWith(".markdown") ||
    name.endsWith(".txt") ||
    file.type === "text/markdown" ||
    file.type === "text/plain"
  );
}

function fileBaseName(filename: string) {
  return filename.replace(/\.[^.]+$/, "");
}

function slugifyDocumentKey(input: string) {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "document";
}

function titleizeFilename(input: string) {
  return input
    .split(/[-_ ]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function createUniqueDocumentKey(baseKey: string, stagedFiles: StagedIssueFile[]) {
  const existingKeys = new Set(
    stagedFiles
      .filter((file) => file.kind === "document")
      .map((file) => file.documentKey)
      .filter((key): key is string => Boolean(key)),
  );
  if (!existingKeys.has(baseKey)) return baseKey;
  let suffix = 2;
  while (existingKeys.has(`${baseKey}-${suffix}`)) {
    suffix += 1;
  }
  return `${baseKey}-${suffix}`;
}

function defaultProjectWorkspaceIdForProject(project: { workspaces?: Array<{ id: string; isPrimary: boolean }>; executionWorkspacePolicy?: { defaultProjectWorkspaceId?: string | null } | null } | null | undefined) {
  if (!project) return "";
  return project.executionWorkspacePolicy?.defaultProjectWorkspaceId
    ?? project.workspaces?.find((workspace) => workspace.isPrimary)?.id
    ?? project.workspaces?.[0]?.id
    ?? "";
}

function defaultExecutionWorkspaceModeForProject(project: { executionWorkspacePolicy?: { enabled?: boolean; defaultMode?: string | null } | null } | null | undefined) {
  const defaultMode = project?.executionWorkspacePolicy?.enabled ? project.executionWorkspacePolicy.defaultMode : null;
  if (
    defaultMode === "isolated_workspace" ||
    defaultMode === "operator_branch" ||
    defaultMode === "adapter_default"
  ) {
    return defaultMode === "adapter_default" ? "agent_default" : defaultMode;
  }
  return "shared_workspace";
}

function defaultExecutionWorkspaceModeForIssueDefaults(
  defaults: {
    executionWorkspaceId?: unknown;
    executionWorkspaceMode?: unknown;
  },
  project: { executionWorkspacePolicy?: { enabled?: boolean; defaultMode?: string | null } | null } | null | undefined,
) {
  if (typeof defaults.executionWorkspaceId === "string" && defaults.executionWorkspaceId.length > 0) {
    return "reuse_existing";
  }
  return typeof defaults.executionWorkspaceMode === "string" && defaults.executionWorkspaceMode.length > 0
    ? defaults.executionWorkspaceMode
    : defaultExecutionWorkspaceModeForProject(project);
}

function issueExecutionWorkspaceModeForExistingWorkspace(mode: string | null | undefined) {
  if (mode === "isolated_workspace" || mode === "operator_branch" || mode === "shared_workspace") {
    return mode;
  }
  if (mode === "adapter_managed" || mode === "cloud_sandbox") {
    return "agent_default";
  }
  return "shared_workspace";
}

export function NewIssueDialog() {
  const { newIssueOpen, newIssueDefaults, closeNewIssue } = useDialog();
  const { companies, selectedCompanyId, selectedCompany } = useCompany();
  const queryClient = useQueryClient();
  const { pushToast } = useToastActions();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const titleRef = useRef("");
  const descriptionRef = useRef("");
  const [titleHasText, setTitleHasText] = useState(false);
  const [draftHasText, setDraftHasText] = useState(false);
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("");
  const [assigneeValue, setAssigneeValue] = useState("");
  const [reviewerValue, setReviewerValue] = useState("");
  const [approverValue, setApproverValue] = useState("");
  const [showReviewerRow, setShowReviewerRow] = useState(false);
  const [showApproverRow, setShowApproverRow] = useState(false);
  const [participantMenuOpen, setParticipantMenuOpen] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [projectWorkspaceId, setProjectWorkspaceId] = useState("");
  const [assigneeOptionsOpen, setAssigneeOptionsOpen] = useState(false);
  const [assigneeModelLane, setAssigneeModelLane] = useState<IssueModelLane>("primary");
  const [assigneeModelOverride, setAssigneeModelOverride] = useState("");
  const [assigneeThinkingEffort, setAssigneeThinkingEffort] = useState("");
  const [assigneeChrome, setAssigneeChrome] = useState(false);
  const [executionWorkspaceMode, setExecutionWorkspaceMode] = useState<string>("shared_workspace");
  const [selectedExecutionWorkspaceId, setSelectedExecutionWorkspaceId] = useState("");
  const [workMode, setWorkMode] = useState<IssueWorkMode>("standard");
  const [expanded, setExpanded] = useState(false);
  const [dialogCompanyId, setDialogCompanyId] = useState<string | null>(null);
  const [stagedFiles, setStagedFiles] = useState<StagedIssueFile[]>([]);
  const [isFileDragOver, setIsFileDragOver] = useState(false);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const executionWorkspaceDefaultProjectId = useRef<string | null>(null);
  const initializationKeyRef = useRef<string | null>(null);

  const effectiveCompanyId = dialogCompanyId ?? selectedCompanyId;
  const dialogCompany = companies.find((c) => c.id === effectiveCompanyId) ?? selectedCompany;
  const isSubIssueMode = Boolean(newIssueDefaults.parentId);
  const parentIssueLabel = newIssueDefaults.parentIdentifier
    ?? (newIssueDefaults.parentId ? newIssueDefaults.parentId.slice(0, 8) : "");
  const parentExecutionWorkspaceId = newIssueDefaults.executionWorkspaceId ?? "";
  const parentExecutionWorkspaceLabel = newIssueDefaults.parentExecutionWorkspaceLabel ?? parentExecutionWorkspaceId;

  // Popover states
  const [statusOpen, setStatusOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [workModeOpen, setWorkModeOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const descriptionEditorRef = useRef<MarkdownEditorRef>(null);
  const stageFileInputRef = useRef<HTMLInputElement | null>(null);
  const assigneeSelectorRef = useRef<HTMLButtonElement | null>(null);
  const projectSelectorRef = useRef<HTMLButtonElement | null>(null);

  const { data: agents } = useQuery({
    queryKey: queryKeys.agents.list(effectiveCompanyId!),
    queryFn: () => agentsApi.list(effectiveCompanyId!),
    enabled: !!effectiveCompanyId && newIssueOpen,
  });

  const { data: projects } = useQuery({
    queryKey: queryKeys.projects.list(effectiveCompanyId!),
    queryFn: () => projectsApi.list(effectiveCompanyId!),
    enabled: !!effectiveCompanyId && newIssueOpen,
  });
  const { data: reusableExecutionWorkspaces } = useQuery({
    queryKey: queryKeys.executionWorkspaces.list(effectiveCompanyId!, {
      projectId,
      projectWorkspaceId: projectWorkspaceId || undefined,
      reuseEligible: true,
    }),
    queryFn: () =>
      executionWorkspacesApi.list(effectiveCompanyId!, {
        projectId,
        projectWorkspaceId: projectWorkspaceId || undefined,
        reuseEligible: true,
      }),
    enabled: Boolean(effectiveCompanyId) && newIssueOpen && Boolean(projectId),
  });
  const { data: session } = useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: () => authApi.getSession(),
  });
  const { data: companyMembers } = useQuery({
    queryKey: queryKeys.access.companyUserDirectory(effectiveCompanyId!),
    queryFn: () => accessApi.listUserDirectory(effectiveCompanyId!),
    enabled: Boolean(effectiveCompanyId) && newIssueOpen,
  });
  const { data: experimentalSettings } = useQuery({
    queryKey: queryKeys.instance.experimentalSettings,
    queryFn: () => instanceSettingsApi.getExperimental(),
    enabled: newIssueOpen,
    retry: false,
  });
  const currentUserId = session?.user?.id ?? session?.session?.userId ?? null;
  const activeProjects = useMemo(
    () => (projects ?? []).filter((p) => !p.archivedAt),
    [projects],
  );
  const { orderedProjects } = useProjectOrder({
    projects: activeProjects,
    companyId: effectiveCompanyId,
    userId: currentUserId,
  });

  const selectedAssignee = useMemo(() => parseAssigneeValue(assigneeValue), [assigneeValue]);
  const selectedAssigneeAgentId = selectedAssignee.assigneeAgentId;
  const selectedAssigneeUserId = selectedAssignee.assigneeUserId;

  const assigneeAdapterType = (agents ?? []).find((agent) => agent.id === selectedAssigneeAgentId)?.adapterType ?? null;
  const supportsAssigneeOverrides = Boolean(
    assigneeAdapterType && ISSUE_OVERRIDE_ADAPTER_TYPES.has(assigneeAdapterType),
  );
  const getAdapterCapabilities = useAdapterCapabilities();
  const assigneeAdapterCapabilities = assigneeAdapterType
    ? getAdapterCapabilities(assigneeAdapterType)
    : null;
  const assigneeSupportsCheapLane = Boolean(
    supportsAssigneeOverrides && assigneeAdapterCapabilities?.supportsModelProfiles,
  );

  const { data: assigneeCheapProfiles } = useQuery({
    queryKey: effectiveCompanyId && assigneeAdapterType
      ? queryKeys.agents.adapterModelProfiles(effectiveCompanyId, assigneeAdapterType)
      : ["agents", "none", "adapter-model-profiles", assigneeAdapterType ?? "none"],
    queryFn: () => agentsApi.adapterModelProfiles(effectiveCompanyId!, assigneeAdapterType!),
    enabled: Boolean(effectiveCompanyId) && newIssueOpen && assigneeSupportsCheapLane,
  });
  const assigneeCheapProfile = useMemo(
    () => (assigneeCheapProfiles ?? []).find((profile) => profile.key === "cheap") ?? null,
    [assigneeCheapProfiles],
  );
  const mentionOptions = useMemo<MentionOption[]>(() => {
    return buildMarkdownMentionOptions({
      agents,
      projects: orderedProjects,
      members: companyMembers?.users,
    });
  }, [agents, companyMembers?.users, orderedProjects]);

  const { data: assigneeAdapterModels } = useQuery({
    queryKey:
      effectiveCompanyId && assigneeAdapterType
        ? queryKeys.agents.adapterModels(effectiveCompanyId, assigneeAdapterType)
        : ["agents", "none", "adapter-models", assigneeAdapterType ?? "none"],
    queryFn: () => agentsApi.adapterModels(effectiveCompanyId!, assigneeAdapterType!),
    enabled: Boolean(effectiveCompanyId) && newIssueOpen && supportsAssigneeOverrides,
  });

  const createIssue = useMutation({
    mutationFn: async ({
      companyId,
      stagedFiles: pendingStagedFiles,
      ...data
    }: { companyId: string; stagedFiles: StagedIssueFile[] } & Record<string, unknown>) => {
      const issue = await issuesApi.create(companyId, data);
      const failures: string[] = [];

      for (const stagedFile of pendingStagedFiles) {
        try {
          if (stagedFile.kind === "document") {
            const body = await stagedFile.file.text();
            await issuesApi.upsertDocument(issue.id, stagedFile.documentKey ?? "document", {
              title: stagedFile.documentKey === "plan" ? null : stagedFile.title ?? null,
              format: "markdown",
              body,
              baseRevisionId: null,
            });
          } else {
            await issuesApi.uploadAttachment(companyId, issue.id, stagedFile.file);
          }
        } catch {
          failures.push(stagedFile.file.name);
        }
      }

      return { issue, companyId, failures };
    },
    onSuccess: ({ issue, companyId, failures }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.list(companyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.listMineByMe(companyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.listTouchedByMe(companyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.listUnreadTouchedByMe(companyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sidebarBadges(companyId) });
      if (draftTimer.current) clearTimeout(draftTimer.current);
      if (failures.length > 0) {
        const prefix = (companies.find((company) => company.id === companyId)?.issuePrefix ?? "").trim();
        const issueRef = issue.identifier ?? issue.id;
        pushToast({
          title: `Created ${issueRef} with upload warnings`,
          body: `${failures.length} staged ${failures.length === 1 ? "file" : "files"} could not be added.`,
          tone: "warn",
          action: prefix
            ? { label: `Open ${issueRef}`, href: `/${prefix}/issues/${issueRef}` }
            : undefined,
        });
      }
      clearDraft();
      reset();
      closeNewIssue();
    },
  });

  const uploadDescriptionImage = useMutation({
    mutationFn: async (file: File) => {
      if (!effectiveCompanyId) throw new Error("No company selected");
      return assetsApi.uploadImage(effectiveCompanyId, file, "issues/drafts");
    },
  });
  const uploadDescriptionImageHandler = useCallback(async (file: File) => {
    const asset = await uploadDescriptionImage.mutateAsync(file);
    return asset.contentPath;
  }, [uploadDescriptionImage.mutateAsync]);

  // Debounced draft saving
  const scheduleSave = useCallback(
    (draft: IssueDraft) => {
      if (draftTimer.current) clearTimeout(draftTimer.current);
      draftTimer.current = setTimeout(() => {
        if (draft.title.trim()) saveDraft(draft);
      }, DEBOUNCE_MS);
    },
    [],
  );

  const setIssueText = useCallback((nextTitle: string, nextDescription: string) => {
    titleRef.current = nextTitle;
    descriptionRef.current = nextDescription;
    setTitle(nextTitle);
    setDescription(nextDescription);
    setTitleHasText(nextTitle.trim().length > 0);
    setDraftHasText(nextTitle.trim().length > 0 || nextDescription.trim().length > 0);
  }, []);

  const queueDraftSave = useCallback((overrides: { title?: string; description?: string } = {}) => {
    if (!newIssueOpen) return;
    const nextTitle = overrides.title ?? titleRef.current;
    const nextDescription = overrides.description ?? descriptionRef.current;
    scheduleSave({
      title: nextTitle,
      description: nextDescription,
      status,
      priority,
      assigneeValue,
      reviewerValue,
      approverValue,
      projectId,
      projectWorkspaceId,
      assigneeModelLane,
      assigneeModelOverride,
      assigneeThinkingEffort,
      assigneeChrome,
      executionWorkspaceMode,
      selectedExecutionWorkspaceId,
      workMode,
    });
  }, [
    newIssueOpen,
    scheduleSave,
    status,
    priority,
    assigneeValue,
    reviewerValue,
    approverValue,
    projectId,
    projectWorkspaceId,
    assigneeModelOverride,
    assigneeThinkingEffort,
    assigneeChrome,
    executionWorkspaceMode,
    selectedExecutionWorkspaceId,
    workMode,
  ]);

  const handleTitleChange = useCallback((nextTitle: string) => {
    titleRef.current = nextTitle;
    const nextTitleHasText = nextTitle.trim().length > 0;
    const nextDraftHasText = nextTitleHasText || descriptionRef.current.trim().length > 0;
    setTitleHasText((current) => current === nextTitleHasText ? current : nextTitleHasText);
    setDraftHasText((current) => current === nextDraftHasText ? current : nextDraftHasText);
    queueDraftSave({ title: nextTitle });
  }, [queueDraftSave]);

  const handleDescriptionChange = useCallback((nextDescription: string) => {
    descriptionRef.current = nextDescription;
    const nextDraftHasText = titleRef.current.trim().length > 0 || nextDescription.trim().length > 0;
    setDraftHasText((current) => current === nextDraftHasText ? current : nextDraftHasText);
    queueDraftSave({ description: nextDescription });
  }, [queueDraftSave]);

  // Save draft on meaningful changes
  useEffect(() => {
    if (!newIssueOpen) return;
    queueDraftSave();
  }, [
    status,
    priority,
    assigneeValue,
    reviewerValue,
    approverValue,
    projectId,
    projectWorkspaceId,
    assigneeModelLane,
    assigneeModelOverride,
    assigneeThinkingEffort,
    assigneeChrome,
    executionWorkspaceMode,
    selectedExecutionWorkspaceId,
    workMode,
    newIssueOpen,
    queueDraftSave,
  ]);

  // Restore draft or apply defaults when dialog opens
  useEffect(() => {
    if (!newIssueOpen) {
      initializationKeyRef.current = null;
      return;
    }
    const initializationKey = `${selectedCompanyId ?? ""}:${JSON.stringify(newIssueDefaults)}`;
    if (initializationKeyRef.current === initializationKey) return;
    initializationKeyRef.current = initializationKey;
    setDialogCompanyId(selectedCompanyId);
    executionWorkspaceDefaultProjectId.current = null;

    const draft = loadDraft();
    if (newIssueDefaults.parentId) {
      const nextWorkMode = isIssueWorkMode(newIssueDefaults.workMode) ? newIssueDefaults.workMode : "standard";
      const defaultProjectId = newIssueDefaults.projectId ?? "";
      const defaultProject = orderedProjects.find((project) => project.id === defaultProjectId);
      const hasExplicitProjectWorkspaceId = newIssueDefaults.projectWorkspaceId !== undefined;
      const defaultProjectWorkspaceId = newIssueDefaults.projectWorkspaceId
        ?? defaultProjectWorkspaceIdForProject(defaultProject);
      const defaultExecutionWorkspaceMode = defaultExecutionWorkspaceModeForIssueDefaults(newIssueDefaults, defaultProject);
      setIssueText(newIssueDefaults.title ?? "", newIssueDefaults.description ?? "");
      setStatus(newIssueDefaults.status ?? "todo");
      setPriority(newIssueDefaults.priority ?? "");
      setProjectId(defaultProjectId);
      setProjectWorkspaceId(defaultProjectWorkspaceId);
      setAssigneeValue(assigneeValueFromSelection(newIssueDefaults));
      setAssigneeModelLane("primary");
      setAssigneeModelOverride("");
      setAssigneeThinkingEffort("");
      setAssigneeChrome(false);
      setExecutionWorkspaceMode(defaultExecutionWorkspaceMode);
      setWorkMode(nextWorkMode);
      setSelectedExecutionWorkspaceId(newIssueDefaults.executionWorkspaceId ?? "");
      executionWorkspaceDefaultProjectId.current = hasExplicitProjectWorkspaceId || defaultProject
        ? defaultProjectId || null
        : null;
    } else if (newIssueDefaults.title) {
      const nextWorkMode = isIssueWorkMode(newIssueDefaults.workMode) ? newIssueDefaults.workMode : "standard";
      setIssueText(newIssueDefaults.title, newIssueDefaults.description ?? "");
      setStatus(newIssueDefaults.status ?? "todo");
      setPriority(newIssueDefaults.priority ?? "");
      const defaultProjectId = newIssueDefaults.projectId ?? "";
      const defaultProject = orderedProjects.find((project) => project.id === defaultProjectId);
      const hasExplicitProjectWorkspaceId = newIssueDefaults.projectWorkspaceId !== undefined;
      setProjectId(defaultProjectId);
      setProjectWorkspaceId(newIssueDefaults.projectWorkspaceId ?? defaultProjectWorkspaceIdForProject(defaultProject));
      setAssigneeValue(assigneeValueFromSelection(newIssueDefaults));
      setReviewerValue("");
      setApproverValue("");
      setShowReviewerRow(false);
      setShowApproverRow(false);
      setAssigneeModelOverride("");
      setAssigneeThinkingEffort("");
      setAssigneeChrome(false);
      setExecutionWorkspaceMode(defaultExecutionWorkspaceModeForIssueDefaults(newIssueDefaults, defaultProject));
      setWorkMode(nextWorkMode);
      setSelectedExecutionWorkspaceId(newIssueDefaults.executionWorkspaceId ?? "");
      executionWorkspaceDefaultProjectId.current = hasExplicitProjectWorkspaceId || newIssueDefaults.executionWorkspaceId || defaultProject
        ? defaultProjectId || null
        : null;
    } else if (draft && draft.title.trim()) {
      const nextWorkMode = isIssueWorkMode(draft.workMode) ? draft.workMode : "standard";
      const restoredProjectId = newIssueDefaults.projectId ?? draft.projectId;
      const restoredProject = orderedProjects.find((project) => project.id === restoredProjectId);
      const hasExplicitProjectWorkspaceId = newIssueDefaults.projectWorkspaceId !== undefined;
      const hasExplicitExecutionWorkspaceId = newIssueDefaults.executionWorkspaceId !== undefined;
      const hasExplicitExecutionWorkspaceMode = newIssueDefaults.executionWorkspaceMode !== undefined;
      setIssueText(draft.title, draft.description);
      setStatus(draft.status || "todo");
      setPriority(draft.priority);
      setAssigneeValue(
        newIssueDefaults.assigneeAgentId || newIssueDefaults.assigneeUserId
          ? assigneeValueFromSelection(newIssueDefaults)
          : (draft.assigneeValue ?? draft.assigneeId ?? ""),
      );
      setReviewerValue(draft.reviewerValue ?? "");
      setApproverValue(draft.approverValue ?? "");
      setShowReviewerRow(!!(draft.reviewerValue));
      setShowApproverRow(!!(draft.approverValue));
      setProjectId(restoredProjectId);
      setProjectWorkspaceId(
        hasExplicitProjectWorkspaceId
          ? (newIssueDefaults.projectWorkspaceId ?? "")
          : (draft.projectWorkspaceId ?? defaultProjectWorkspaceIdForProject(restoredProject)),
      );
      setAssigneeModelLane(draft.assigneeModelLane ?? "primary");
      setAssigneeModelOverride(draft.assigneeModelOverride ?? "");
      setAssigneeThinkingEffort(draft.assigneeThinkingEffort ?? "");
      setAssigneeChrome(draft.assigneeChrome ?? false);
      setExecutionWorkspaceMode(
        hasExplicitExecutionWorkspaceId || hasExplicitExecutionWorkspaceMode
          ? defaultExecutionWorkspaceModeForIssueDefaults(newIssueDefaults, restoredProject)
          : (
              draft.executionWorkspaceMode
              ?? (draft.useIsolatedExecutionWorkspace ? "isolated_workspace" : defaultExecutionWorkspaceModeForProject(restoredProject))
            ),
      );
      setWorkMode(nextWorkMode);
      setSelectedExecutionWorkspaceId(
        hasExplicitExecutionWorkspaceId
          ? (newIssueDefaults.executionWorkspaceId ?? "")
          : (draft.selectedExecutionWorkspaceId ?? ""),
      );
      executionWorkspaceDefaultProjectId.current = hasExplicitProjectWorkspaceId || hasExplicitExecutionWorkspaceId || draft.projectWorkspaceId || restoredProject
        ? restoredProjectId || null
        : null;
    } else {
      setWorkMode("standard");
      const defaultProjectId = newIssueDefaults.projectId ?? "";
      const defaultProject = orderedProjects.find((project) => project.id === defaultProjectId);
      const hasExplicitProjectWorkspaceId = newIssueDefaults.projectWorkspaceId !== undefined;
      setIssueText("", "");
      setStatus(newIssueDefaults.status ?? "todo");
      setPriority(newIssueDefaults.priority ?? "");
      setProjectId(defaultProjectId);
      setProjectWorkspaceId(newIssueDefaults.projectWorkspaceId ?? defaultProjectWorkspaceIdForProject(defaultProject));
      setAssigneeValue(assigneeValueFromSelection(newIssueDefaults));
      setReviewerValue("");
      setApproverValue("");
      setShowReviewerRow(false);
      setShowApproverRow(false);
      setAssigneeModelOverride("");
      setAssigneeThinkingEffort("");
      setAssigneeChrome(false);
      setExecutionWorkspaceMode(defaultExecutionWorkspaceModeForIssueDefaults(newIssueDefaults, defaultProject));
      setSelectedExecutionWorkspaceId(newIssueDefaults.executionWorkspaceId ?? "");
      executionWorkspaceDefaultProjectId.current = hasExplicitProjectWorkspaceId || newIssueDefaults.executionWorkspaceId || defaultProject
        ? defaultProjectId || null
        : null;
    }
  }, [newIssueOpen, newIssueDefaults, orderedProjects, selectedCompanyId, setIssueText]);

  useEffect(() => {
    if (!supportsAssigneeOverrides) {
      setAssigneeOptionsOpen(false);
      setAssigneeModelLane("primary");
      setAssigneeModelOverride("");
      setAssigneeThinkingEffort("");
      setAssigneeChrome(false);
      return;
    }
    if (!assigneeSupportsCheapLane && assigneeModelLane === "cheap") {
      setAssigneeModelLane("primary");
    }

    const validThinkingValues =
      assigneeAdapterType === "codex_local"
        ? ISSUE_THINKING_EFFORT_OPTIONS.codex_local
        : assigneeAdapterType === "opencode_local"
          ? ISSUE_THINKING_EFFORT_OPTIONS.opencode_local
          : ISSUE_THINKING_EFFORT_OPTIONS.claude_local;
    if (!validThinkingValues.some((option) => option.value === assigneeThinkingEffort)) {
      setAssigneeThinkingEffort("");
    }
  }, [
    supportsAssigneeOverrides,
    assigneeAdapterType,
    assigneeThinkingEffort,
    assigneeSupportsCheapLane,
    assigneeModelLane,
  ]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (draftTimer.current) clearTimeout(draftTimer.current);
    };
  }, []);

  function reset() {
    setIssueText("", "");
    setStatus("todo");
    setPriority("");
    setAssigneeValue("");
    setReviewerValue("");
    setApproverValue("");
    setShowReviewerRow(false);
    setShowApproverRow(false);
    setProjectId("");
    setProjectWorkspaceId("");
    setAssigneeOptionsOpen(false);
    setAssigneeModelLane("primary");
    setAssigneeModelOverride("");
    setAssigneeThinkingEffort("");
    setAssigneeChrome(false);
    setExecutionWorkspaceMode("shared_workspace");
    setSelectedExecutionWorkspaceId("");
    setWorkMode("standard");
    setExpanded(false);
    setDialogCompanyId(null);
    setStagedFiles([]);
    setIsFileDragOver(false);
    setCompanyOpen(false);
    executionWorkspaceDefaultProjectId.current = null;
    initializationKeyRef.current = null;
  }

  function handleCompanyChange(companyId: string) {
    if (isSubIssueMode) return;
    if (companyId === effectiveCompanyId) return;
    setDialogCompanyId(companyId);
    setAssigneeValue("");
    setReviewerValue("");
    setApproverValue("");
    setShowReviewerRow(false);
    setShowApproverRow(false);
    setProjectId("");
    setProjectWorkspaceId("");
    setAssigneeModelLane("primary");
    setAssigneeModelOverride("");
    setAssigneeThinkingEffort("");
    setAssigneeChrome(false);
    setExecutionWorkspaceMode("shared_workspace");
    setSelectedExecutionWorkspaceId("");
    setWorkMode("standard");
  }

  function discardDraft() {
    clearDraft();
    reset();
    closeNewIssue();
  }

  function handleSubmit() {
    const currentTitle = titleRef.current.trim();
    const currentDescription = descriptionRef.current.trim();
    if (!effectiveCompanyId || !currentTitle || createIssue.isPending) return;
    const effectiveLane = assigneeSupportsCheapLane
      ? assigneeModelLane
      : assigneeModelLane === "cheap"
        ? "primary"
        : assigneeModelLane;
    const assigneeAdapterOverrides = buildAssigneeAdapterOverrides({
      adapterType: assigneeAdapterType,
      lane: effectiveLane,
      modelOverride: assigneeModelOverride,
      thinkingEffortOverride: assigneeThinkingEffort,
      chrome: assigneeChrome,
    });
    const selectedProject = orderedProjects.find((project) => project.id === projectId);
    const executionWorkspacePolicy =
      experimentalSettings?.enableIsolatedWorkspaces === true
        ? selectedProject?.executionWorkspacePolicy ?? null
        : null;
    const selectedReusableExecutionWorkspace = deduplicatedReusableWorkspaces.find(
      (workspace) => workspace.id === selectedExecutionWorkspaceId,
    );
    const requestedExecutionWorkspaceMode =
      executionWorkspaceMode === "reuse_existing"
        ? issueExecutionWorkspaceModeForExistingWorkspace(selectedReusableExecutionWorkspace?.mode)
        : executionWorkspaceMode;
    const executionWorkspaceSettings = executionWorkspacePolicy?.enabled
      ? { mode: requestedExecutionWorkspaceMode }
      : null;
    const executionPolicy = buildExecutionPolicy({
      reviewerValues: reviewerValue ? [reviewerValue] : [],
      approverValues: approverValue ? [approverValue] : [],
    });
    createIssue.mutate({
      companyId: effectiveCompanyId,
      stagedFiles,
      title: currentTitle,
      description: currentDescription || undefined,
      status,
      priority: priority || "medium",
      workMode,
      ...(selectedAssigneeAgentId ? { assigneeAgentId: selectedAssigneeAgentId } : {}),
      ...(selectedAssigneeUserId ? { assigneeUserId: selectedAssigneeUserId } : {}),
      ...(newIssueDefaults.parentId ? { parentId: newIssueDefaults.parentId } : {}),
      ...(newIssueDefaults.goalId ? { goalId: newIssueDefaults.goalId } : {}),
      ...(projectId ? { projectId } : {}),
      ...(projectWorkspaceId ? { projectWorkspaceId } : {}),
      ...(assigneeAdapterOverrides ? { assigneeAdapterOverrides } : {}),
      ...(executionWorkspacePolicy?.enabled ? { executionWorkspacePreference: executionWorkspaceMode } : {}),
      ...(executionWorkspaceMode === "reuse_existing" && selectedExecutionWorkspaceId
        ? { executionWorkspaceId: selectedExecutionWorkspaceId }
        : {}),
      ...(executionWorkspaceSettings ? { executionWorkspaceSettings } : {}),
      ...(executionPolicy ? { executionPolicy } : {}),
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function stageFiles(files: File[]) {
    if (files.length === 0) return;
    setStagedFiles((current) => {
      const next = [...current];
      for (const file of files) {
        if (isTextDocumentFile(file)) {
          const baseName = fileBaseName(file.name);
          const documentKey = createUniqueDocumentKey(slugifyDocumentKey(baseName), next);
          next.push({
            id: `${file.name}:${file.size}:${file.lastModified}:${documentKey}`,
            file,
            kind: "document",
            documentKey,
            title: titleizeFilename(baseName),
          });
          continue;
        }
        next.push({
          id: `${file.name}:${file.size}:${file.lastModified}`,
          file,
          kind: "attachment",
        });
      }
      return next;
    });
  }

  function handleStageFilesPicked(evt: ChangeEvent<HTMLInputElement>) {
    stageFiles(Array.from(evt.target.files ?? []));
    if (stageFileInputRef.current) {
      stageFileInputRef.current.value = "";
    }
  }

  function handleFileDragEnter(evt: DragEvent<HTMLDivElement>) {
    if (!evt.dataTransfer.types.includes("Files")) return;
    evt.preventDefault();
    setIsFileDragOver(true);
  }

  function handleFileDragOver(evt: DragEvent<HTMLDivElement>) {
    if (!evt.dataTransfer.types.includes("Files")) return;
    evt.preventDefault();
    evt.dataTransfer.dropEffect = "copy";
    setIsFileDragOver(true);
  }

  function handleFileDragLeave(evt: DragEvent<HTMLDivElement>) {
    if (evt.currentTarget.contains(evt.relatedTarget as Node | null)) return;
    setIsFileDragOver(false);
  }

  function handleFileDrop(evt: DragEvent<HTMLDivElement>) {
    if (!evt.dataTransfer.files.length) return;
    evt.preventDefault();
    setIsFileDragOver(false);
    stageFiles(Array.from(evt.dataTransfer.files));
  }

  function removeStagedFile(id: string) {
    setStagedFiles((current) => current.filter((file) => file.id !== id));
  }

  const hasDraft = draftHasText || stagedFiles.length > 0;
  const currentAssignee = selectedAssigneeAgentId
    ? (agents ?? []).find((a) => a.id === selectedAssigneeAgentId) ?? null
    : null;
  const currentProject = orderedProjects.find((project) => project.id === projectId);
  const currentProjectExecutionWorkspacePolicy =
    experimentalSettings?.enableIsolatedWorkspaces === true
      ? currentProject?.executionWorkspacePolicy ?? null
      : null;
  const currentProjectSupportsExecutionWorkspace = Boolean(currentProjectExecutionWorkspacePolicy?.enabled);
  const deduplicatedReusableWorkspaces = useMemo(() => {
    return orderReusableExecutionWorkspaces(reusableExecutionWorkspaces ?? []);
  }, [reusableExecutionWorkspaces]);
  const selectedReusableExecutionWorkspace = deduplicatedReusableWorkspaces.find(
    (workspace) => workspace.id === selectedExecutionWorkspaceId,
  );
  const isUsingParentExecutionWorkspace = isSubIssueMode && parentExecutionWorkspaceId
    ? executionWorkspaceMode === "reuse_existing" && selectedExecutionWorkspaceId === parentExecutionWorkspaceId
    : false;
  const showParentWorkspaceWarning = isSubIssueMode
    && currentProjectSupportsExecutionWorkspace
    && Boolean(parentExecutionWorkspaceId)
    && !isUsingParentExecutionWorkspace;
  const assigneeOptionsTitle =
    assigneeAdapterType === "claude_local"
      ? "Claude options"
      : assigneeAdapterType === "codex_local"
        ? "Codex options"
        : assigneeAdapterType === "opencode_local"
          ? "OpenCode options"
        : "Agent options";
  const thinkingEffortOptions =
    assigneeAdapterType === "codex_local"
      ? ISSUE_THINKING_EFFORT_OPTIONS.codex_local
      : assigneeAdapterType === "opencode_local"
        ? ISSUE_THINKING_EFFORT_OPTIONS.opencode_local
      : ISSUE_THINKING_EFFORT_OPTIONS.claude_local;
  const recentAssigneeIds = useMemo(() => getRecentAssigneeIds(), [newIssueOpen]);
  const recentAssigneeOptionIds = useMemo(
    () => recentAssigneeIds.map((id) => assigneeValueFromSelection({ assigneeAgentId: id })),
    [recentAssigneeIds],
  );
  const recentProjectIds = useMemo(() => getRecentProjectIds(), [newIssueOpen]);
  const assigneeOptions = useMemo<InlineEntityOption[]>(
    () => [
      ...currentUserAssigneeOption(currentUserId),
      ...buildCompanyUserInlineOptions(companyMembers?.users, { excludeUserIds: [currentUserId] }),
      ...sortAgentsByRecency(
        (agents ?? []).filter((agent) => agent.status !== "terminated"),
        recentAssigneeIds,
      ).map((agent) => ({
        id: assigneeValueFromSelection({ assigneeAgentId: agent.id }),
        label: agent.name,
        searchText: `${agent.name} ${agent.role} ${agent.title ?? ""}`,
      })),
    ],
    [agents, companyMembers?.users, currentUserId, recentAssigneeIds],
  );
  const projectOptions = useMemo<InlineEntityOption[]>(
    () =>
      orderedProjects.map((project) => ({
        id: project.id,
        label: project.name,
        searchText: project.description ?? "",
      })),
    [orderedProjects],
  );
  const savedDraft = useMemo(() => newIssueOpen ? loadDraft() : null, [newIssueOpen]);
  const hasSavedDraft = Boolean(savedDraft?.title.trim() || savedDraft?.description.trim());
  const canDiscardDraft = hasDraft || hasSavedDraft;
  const createIssueErrorMessage =
    createIssue.error instanceof Error ? createIssue.error.message : "Failed to create issue. Try again.";
  const handleProjectChange = useCallback((nextProjectId: string) => {
    if (nextProjectId) trackRecentProject(nextProjectId);
    setProjectId(nextProjectId);
    const nextProject = orderedProjects.find((project) => project.id === nextProjectId);
    executionWorkspaceDefaultProjectId.current = nextProjectId || null;
    setProjectWorkspaceId(defaultProjectWorkspaceIdForProject(nextProject));
    setExecutionWorkspaceMode(defaultExecutionWorkspaceModeForProject(nextProject));
    setSelectedExecutionWorkspaceId("");
  }, [orderedProjects]);

  useEffect(() => {
    if (
      !newIssueOpen ||
      !projectId ||
      selectedExecutionWorkspaceId ||
      executionWorkspaceDefaultProjectId.current === projectId
    ) {
      return;
    }
    const project = orderedProjects.find((entry) => entry.id === projectId);
    if (!project) return;
    executionWorkspaceDefaultProjectId.current = projectId;
    setProjectWorkspaceId(defaultProjectWorkspaceIdForProject(project));
    setExecutionWorkspaceMode(defaultExecutionWorkspaceModeForProject(project));
    setSelectedExecutionWorkspaceId("");
  }, [newIssueOpen, orderedProjects, projectId, selectedExecutionWorkspaceId]);
  const modelOverrideOptions = useMemo<InlineEntityOption[]>(
    () => {
      return [...(assigneeAdapterModels ?? [])]
        .sort((a, b) => {
          const providerA = extractProviderIdWithFallback(a.id);
          const providerB = extractProviderIdWithFallback(b.id);
          const byProvider = providerA.localeCompare(providerB);
          if (byProvider !== 0) return byProvider;
          return a.id.localeCompare(b.id);
        })
        .map((model) => ({
          id: model.id,
          label: model.label,
          searchText: `${model.id} ${extractProviderIdWithFallback(model.id)}`,
        }));
    },
    [assigneeAdapterModels],
  );
  return (
    <Dialog
      open={newIssueOpen}
      onOpenChange={(open) => {
        if (!open && !createIssue.isPending) closeNewIssue();
      }}
    >
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className={cn(
          "flex h-dvh max-h-dvh flex-col gap-0 overflow-hidden p-0 sm:h-auto",
          expanded
            ? "sm:h-dvh sm:max-w-2xl"
            : "sm:max-w-lg"
        )}
        onKeyDown={handleKeyDown}
        onEscapeKeyDown={(event) => {
          if (createIssue.isPending) {
            event.preventDefault();
          }
        }}
        onPointerDownOutside={(event) => {
          if (createIssue.isPending) {
            event.preventDefault();
            return;
          }
          // Radix Dialog's modal DismissableLayer calls preventDefault() on
          // pointerdown events that originate outside the Dialog DOM tree.
          // Popover portals render at the body level (outside the Dialog), so
          // touch events on popover content get their default prevented — which
          // kills scroll gesture recognition on mobile.  Telling Radix "this
          // event is handled" skips that preventDefault, restoring touch scroll.
          const target = event.detail.originalEvent.target as HTMLElement | null;
          if (target?.closest("[data-radix-popper-content-wrapper]")) {
            event.preventDefault();
          }
        }}
      >
        <NewIssueDialogHeader
          companyOpen={companyOpen}
          companies={companies}
          dialogCompany={dialogCompany}
          effectiveCompanyId={effectiveCompanyId}
          expanded={expanded}
          isSubIssueMode={isSubIssueMode}
          pending={createIssue.isPending}
          onClose={closeNewIssue}
          onCompanyChange={handleCompanyChange}
          onCompanyOpenChange={setCompanyOpen}
          onExpandedChange={setExpanded}
        />

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <NewIssueTitleSection
            value={title}
            pending={createIssue.isPending}
            assigneeValue={assigneeValue}
            projectId={projectId}
            descriptionEditorRef={descriptionEditorRef}
            assigneeSelectorRef={assigneeSelectorRef}
            projectSelectorRef={projectSelectorRef}
            onChange={handleTitleChange}
          />

          <NewIssueAssignmentRows
            agents={agents ?? []}
            assigneeOptions={assigneeOptions}
            assigneeSelectorRef={assigneeSelectorRef}
            assigneeValue={assigneeValue}
            approverValue={approverValue}
            currentAssignee={currentAssignee}
            currentProject={currentProject}
            participantMenuOpen={participantMenuOpen}
            projectId={projectId}
            projectOptions={projectOptions}
            projectSelectorRef={projectSelectorRef}
            projects={orderedProjects}
            recentAssigneeOptionIds={recentAssigneeOptionIds}
            recentProjectIds={recentProjectIds}
            reviewerValue={reviewerValue}
            showApproverRow={showApproverRow}
            showReviewerRow={showReviewerRow}
            onApproverChange={setApproverValue}
            onApproverRowToggle={() => {
              setShowApproverRow((value) => !value);
              if (showApproverRow) setApproverValue("");
              setParticipantMenuOpen(false);
            }}
            onAssigneeChange={(value) => {
              const nextAssignee = parseAssigneeValue(value);
              if (nextAssignee.assigneeAgentId) {
                trackRecentAssignee(nextAssignee.assigneeAgentId);
              }
              setAssigneeValue(value);
            }}
            onAssigneeConfirm={() => {
              if (projectId) {
                descriptionEditorRef.current?.focus();
              } else {
                projectSelectorRef.current?.focus();
              }
            }}
            onParticipantMenuOpenChange={setParticipantMenuOpen}
            onProjectChange={handleProjectChange}
            onProjectConfirm={() => {
              descriptionEditorRef.current?.focus();
            }}
            onReviewerChange={setReviewerValue}
            onReviewerRowToggle={() => {
              setShowReviewerRow((value) => !value);
              if (showReviewerRow) setReviewerValue("");
              setParticipantMenuOpen(false);
            }}
          />

          <NewIssueParentIssueNotice
            isSubIssueMode={isSubIssueMode}
            parentIssueLabel={parentIssueLabel}
            parentTitle={newIssueDefaults.parentTitle}
          />

          {currentProject && currentProjectSupportsExecutionWorkspace ? (
            <ExecutionWorkspaceFields
              executionWorkspaceMode={executionWorkspaceMode}
              parentExecutionWorkspaceLabel={parentExecutionWorkspaceLabel}
              reusableWorkspaces={deduplicatedReusableWorkspaces}
              selectedExecutionWorkspaceId={selectedExecutionWorkspaceId}
              selectedReusableExecutionWorkspace={selectedReusableExecutionWorkspace}
              showParentWorkspaceWarning={showParentWorkspaceWarning}
              onExecutionWorkspaceModeChange={setExecutionWorkspaceMode}
              onSelectedExecutionWorkspaceIdChange={setSelectedExecutionWorkspaceId}
            />
          ) : null}

          <IssueAssigneeOptionsPanel
            adapterType={assigneeAdapterType}
            assigneeChrome={assigneeChrome}
            assigneeOptionsOpen={assigneeOptionsOpen}
            assigneeOptionsTitle={assigneeOptionsTitle}
            assigneeSupportsCheapLane={assigneeSupportsCheapLane}
            assigneeThinkingEffort={assigneeThinkingEffort}
            cheapProfile={assigneeCheapProfile}
            modelLane={assigneeModelLane}
            modelOverride={assigneeModelOverride}
            modelOverrideOptions={modelOverrideOptions}
            supportsAssigneeOverrides={supportsAssigneeOverrides}
            thinkingEffortOptions={thinkingEffortOptions}
            onAssigneeChromeToggle={() => setAssigneeChrome((value) => !value)}
            onAssigneeOptionsOpenChange={setAssigneeOptionsOpen}
            onModelLaneChange={setAssigneeModelLane}
            onModelOverrideChange={setAssigneeModelOverride}
            onThinkingEffortChange={setAssigneeThinkingEffort}
          />

          <NewIssueDescriptionSection
            value={description}
            expanded={expanded}
            mentions={mentionOptions}
            descriptionEditorRef={descriptionEditorRef}
            imageUploadHandler={uploadDescriptionImageHandler}
            stagedFiles={stagedFiles}
            isFileDragOver={isFileDragOver}
            pending={createIssue.isPending}
            onChange={handleDescriptionChange}
            onDragEnter={handleFileDragEnter}
            onDragOver={handleFileDragOver}
            onDragLeave={handleFileDragLeave}
            onDrop={handleFileDrop}
            onRemoveStagedFile={removeStagedFile}
          />
        </div>

        <IssuePropertyChips
          status={status}
          statusOpen={statusOpen}
          priority={priority}
          priorityOpen={priorityOpen}
          stageFileInputRef={stageFileInputRef}
          uploadDisabled={createIssue.isPending}
          workMode={workMode}
          workModeOpen={workModeOpen}
          moreOpen={moreOpen}
          onStatusChange={setStatus}
          onStatusOpenChange={setStatusOpen}
          onPriorityChange={setPriority}
          onPriorityOpenChange={setPriorityOpen}
          onStageFilesPicked={handleStageFilesPicked}
          onWorkModeChange={setWorkMode}
          onWorkModeOpenChange={setWorkModeOpen}
          onMoreOpenChange={setMoreOpen}
        />

        <NewIssueDialogFooter
          canDiscardDraft={canDiscardDraft}
          errorMessage={createIssue.isError ? createIssueErrorMessage : null}
          isSubIssueMode={isSubIssueMode}
          pending={createIssue.isPending}
          titleHasText={titleHasText}
          onDiscardDraft={discardDraft}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
