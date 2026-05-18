import { useCallback, type MutableRefObject } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Company, ExecutionWorkspace, IssueWorkMode, Project } from "@paperclipai/shared";

import { assetsApi } from "../../api/assets";
import { issuesApi } from "../../api/issues";
import type { ToastInput } from "../../context/ToastContext";
import { buildExecutionPolicy } from "../../lib/issue-execution-policy";
import {
  buildAssigneeAdapterOverrides,
  type IssueModelLane,
} from "../../lib/issue-assignee-overrides";
import { queryKeys } from "../../lib/queryKeys";
import { issueExecutionWorkspaceModeForExistingWorkspace } from "./issueDialogDefaults";
import { clearIssueDraft } from "./useIssueDraftState";
import type { StagedIssueFile } from "./useStagedIssueFiles";

type NewIssueSubmissionDefaults = {
  parentId?: string;
  goalId?: string;
};

type ExperimentalIssueSettings = {
  enableIsolatedWorkspaces?: boolean;
};

type UseNewIssueSubmissionArgs = {
  assigneeAdapterType: string | null;
  assigneeChrome: boolean;
  assigneeModelLane: IssueModelLane;
  assigneeModelOverride: string;
  assigneeSupportsCheapLane: boolean;
  assigneeThinkingEffort: string;
  approverValue: string;
  companies: Company[];
  descriptionRef: MutableRefObject<string>;
  effectiveCompanyId: string | null | undefined;
  executionWorkspaceMode: string;
  experimentalSettings: ExperimentalIssueSettings | null | undefined;
  newIssueDefaults: NewIssueSubmissionDefaults;
  orderedProjects: Project[];
  priority: string;
  projectId: string;
  projectWorkspaceId: string;
  pushToast: (input: ToastInput) => string | null;
  reviewerValue: string;
  selectedAssigneeAgentId: string | null | undefined;
  selectedAssigneeUserId: string | null | undefined;
  selectedExecutionWorkspaceId: string;
  selectedReusableExecutionWorkspace: Pick<ExecutionWorkspace, "mode"> | null | undefined;
  stagedFiles: StagedIssueFile[];
  status: string;
  titleRef: MutableRefObject<string>;
  workMode: IssueWorkMode;
  onClearPendingDraftSave: () => void;
  onClose: () => void;
  onReset: () => void;
};

export function useNewIssueSubmission({
  assigneeAdapterType,
  assigneeChrome,
  assigneeModelLane,
  assigneeModelOverride,
  assigneeSupportsCheapLane,
  assigneeThinkingEffort,
  approverValue,
  companies,
  descriptionRef,
  effectiveCompanyId,
  executionWorkspaceMode,
  experimentalSettings,
  newIssueDefaults,
  orderedProjects,
  priority,
  projectId,
  projectWorkspaceId,
  pushToast,
  reviewerValue,
  selectedAssigneeAgentId,
  selectedAssigneeUserId,
  selectedExecutionWorkspaceId,
  selectedReusableExecutionWorkspace,
  stagedFiles,
  status,
  titleRef,
  workMode,
  onClearPendingDraftSave,
  onClose,
  onReset,
}: UseNewIssueSubmissionArgs) {
  const queryClient = useQueryClient();

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
      onClearPendingDraftSave();
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
      clearIssueDraft();
      onReset();
      onClose();
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

  const handleSubmit = useCallback(() => {
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
  }, [
    assigneeAdapterType,
    assigneeChrome,
    assigneeModelLane,
    assigneeModelOverride,
    assigneeSupportsCheapLane,
    assigneeThinkingEffort,
    approverValue,
    createIssue,
    descriptionRef,
    effectiveCompanyId,
    executionWorkspaceMode,
    experimentalSettings?.enableIsolatedWorkspaces,
    newIssueDefaults.goalId,
    newIssueDefaults.parentId,
    orderedProjects,
    priority,
    projectId,
    projectWorkspaceId,
    reviewerValue,
    selectedAssigneeAgentId,
    selectedAssigneeUserId,
    selectedExecutionWorkspaceId,
    selectedReusableExecutionWorkspace?.mode,
    stagedFiles,
    status,
    titleRef,
    workMode,
  ]);

  const errorMessage =
    createIssue.error instanceof Error ? createIssue.error.message : "Failed to create issue. Try again.";

  return {
    errorMessage,
    handleSubmit,
    isError: createIssue.isError,
    isPending: createIssue.isPending,
    uploadDescriptionImageHandler,
  };
}
