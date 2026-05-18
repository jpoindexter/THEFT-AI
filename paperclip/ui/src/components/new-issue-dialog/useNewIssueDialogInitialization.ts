import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import type { IssueWorkMode } from "@paperclipai/shared";

import type { useDialog } from "../../context/DialogContext";
import { assigneeValueFromSelection } from "../../lib/assignees";
import type { IssueModelLane } from "../../lib/issue-assignee-overrides";
import {
  defaultExecutionWorkspaceModeForIssueDefaults,
  defaultExecutionWorkspaceModeForProject,
  defaultProjectWorkspaceIdForProject,
} from "./issueDialogDefaults";
import { isIssueWorkMode, loadIssueDraft } from "./useIssueDraftState";

type ProjectForDefaults = NonNullable<Parameters<typeof defaultProjectWorkspaceIdForProject>[0]> & {
  id: string;
};

type UseNewIssueDialogInitializationInput = {
  executionWorkspaceDefaultProjectId: MutableRefObject<string | null>;
  initializationKeyRef: MutableRefObject<string | null>;
  newIssueDefaults: ReturnType<typeof useDialog>["newIssueDefaults"];
  newIssueOpen: boolean;
  orderedProjects: ProjectForDefaults[];
  selectedCompanyId: string | null | undefined;
  setApproverValue: Dispatch<SetStateAction<string>>;
  setAssigneeChrome: Dispatch<SetStateAction<boolean>>;
  setAssigneeModelLane: Dispatch<SetStateAction<IssueModelLane>>;
  setAssigneeModelOverride: Dispatch<SetStateAction<string>>;
  setAssigneeThinkingEffort: Dispatch<SetStateAction<string>>;
  setAssigneeValue: Dispatch<SetStateAction<string>>;
  setDialogCompanyId: Dispatch<SetStateAction<string | null>>;
  setExecutionWorkspaceMode: Dispatch<SetStateAction<string>>;
  setIssueText: (title: string, description: string) => void;
  setPriority: Dispatch<SetStateAction<string>>;
  setProjectId: Dispatch<SetStateAction<string>>;
  setProjectWorkspaceId: Dispatch<SetStateAction<string>>;
  setReviewerValue: Dispatch<SetStateAction<string>>;
  setSelectedExecutionWorkspaceId: Dispatch<SetStateAction<string>>;
  setShowApproverRow: Dispatch<SetStateAction<boolean>>;
  setShowReviewerRow: Dispatch<SetStateAction<boolean>>;
  setStatus: Dispatch<SetStateAction<string>>;
  setWorkMode: Dispatch<SetStateAction<IssueWorkMode>>;
};

export function useNewIssueDialogInitialization(input: UseNewIssueDialogInitializationInput) {
  const {
    executionWorkspaceDefaultProjectId,
    initializationKeyRef,
    newIssueDefaults,
    newIssueOpen,
    orderedProjects,
    selectedCompanyId,
    setApproverValue,
    setAssigneeChrome,
    setAssigneeModelLane,
    setAssigneeModelOverride,
    setAssigneeThinkingEffort,
    setAssigneeValue,
    setDialogCompanyId,
    setExecutionWorkspaceMode,
    setIssueText,
    setPriority,
    setProjectId,
    setProjectWorkspaceId,
    setReviewerValue,
    setSelectedExecutionWorkspaceId,
    setShowApproverRow,
    setShowReviewerRow,
    setStatus,
    setWorkMode,
  } = input;

  useEffect(() => {
    if (!newIssueOpen) {
      initializationKeyRef.current = null;
      return;
    }
    const initializationKey = `${selectedCompanyId ?? ""}:${JSON.stringify(newIssueDefaults)}`;
    if (initializationKeyRef.current === initializationKey) return;
    initializationKeyRef.current = initializationKey;
    setDialogCompanyId(selectedCompanyId ?? null);
    executionWorkspaceDefaultProjectId.current = null;

    const draft = loadIssueDraft();
    if (newIssueDefaults.parentId) {
      const nextWorkMode = isIssueWorkMode(newIssueDefaults.workMode) ? newIssueDefaults.workMode : "standard";
      const defaultProjectId = newIssueDefaults.projectId ?? "";
      const defaultProject = orderedProjects.find((project) => project.id === defaultProjectId);
      const hasExplicitProjectWorkspaceId = newIssueDefaults.projectWorkspaceId !== undefined;
      setIssueText(newIssueDefaults.title ?? "", newIssueDefaults.description ?? "");
      setStatus(newIssueDefaults.status ?? "todo");
      setPriority(newIssueDefaults.priority ?? "");
      setProjectId(defaultProjectId);
      setProjectWorkspaceId(newIssueDefaults.projectWorkspaceId ?? defaultProjectWorkspaceIdForProject(defaultProject));
      setAssigneeValue(assigneeValueFromSelection(newIssueDefaults));
      setAssigneeModelLane("primary");
      setAssigneeModelOverride("");
      setAssigneeThinkingEffort("");
      setAssigneeChrome(false);
      setExecutionWorkspaceMode(defaultExecutionWorkspaceModeForIssueDefaults(newIssueDefaults, defaultProject));
      setWorkMode(nextWorkMode);
      setSelectedExecutionWorkspaceId(newIssueDefaults.executionWorkspaceId ?? "");
      executionWorkspaceDefaultProjectId.current = hasExplicitProjectWorkspaceId || defaultProject
        ? defaultProjectId || null
        : null;
    } else if (newIssueDefaults.title) {
      const nextWorkMode = isIssueWorkMode(newIssueDefaults.workMode) ? newIssueDefaults.workMode : "standard";
      const defaultProjectId = newIssueDefaults.projectId ?? "";
      const defaultProject = orderedProjects.find((project) => project.id === defaultProjectId);
      const hasExplicitProjectWorkspaceId = newIssueDefaults.projectWorkspaceId !== undefined;
      setIssueText(newIssueDefaults.title, newIssueDefaults.description ?? "");
      setStatus(newIssueDefaults.status ?? "todo");
      setPriority(newIssueDefaults.priority ?? "");
      setProjectId(defaultProjectId);
      setProjectWorkspaceId(newIssueDefaults.projectWorkspaceId ?? defaultProjectWorkspaceIdForProject(defaultProject));
      setAssigneeValue(assigneeValueFromSelection(newIssueDefaults));
      setReviewerValue("");
      setApproverValue("");
      setShowReviewerRow(false);
      setShowApproverRow(false);
      setAssigneeModelLane("primary");
      setAssigneeModelOverride("");
      setAssigneeThinkingEffort("");
      setAssigneeChrome(false);
      setExecutionWorkspaceMode(defaultExecutionWorkspaceModeForIssueDefaults(newIssueDefaults, defaultProject));
      setWorkMode(nextWorkMode);
      setSelectedExecutionWorkspaceId(newIssueDefaults.executionWorkspaceId ?? "");
      executionWorkspaceDefaultProjectId.current =
        hasExplicitProjectWorkspaceId || newIssueDefaults.executionWorkspaceId || defaultProject
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
      setShowReviewerRow(!!draft.reviewerValue);
      setShowApproverRow(!!draft.approverValue);
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
              ?? (draft.useIsolatedExecutionWorkspace
                ? "isolated_workspace"
                : defaultExecutionWorkspaceModeForProject(restoredProject))
            ),
      );
      setWorkMode(nextWorkMode);
      setSelectedExecutionWorkspaceId(
        hasExplicitExecutionWorkspaceId ? (newIssueDefaults.executionWorkspaceId ?? "") : (draft.selectedExecutionWorkspaceId ?? ""),
      );
      executionWorkspaceDefaultProjectId.current =
        hasExplicitProjectWorkspaceId || hasExplicitExecutionWorkspaceId || draft.projectWorkspaceId || restoredProject
          ? restoredProjectId || null
          : null;
    } else {
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
      setWorkMode("standard");
      executionWorkspaceDefaultProjectId.current =
        hasExplicitProjectWorkspaceId || newIssueDefaults.executionWorkspaceId || defaultProject
          ? defaultProjectId || null
          : null;
    }
  }, [input, newIssueDefaults, newIssueOpen, orderedProjects, selectedCompanyId]);
}
