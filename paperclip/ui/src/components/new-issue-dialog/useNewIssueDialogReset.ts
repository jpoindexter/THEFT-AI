import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import type { IssueWorkMode } from "@paperclipai/shared";

import type { IssueModelLane } from "../../lib/issue-assignee-overrides";

type UseNewIssueDialogResetInput = {
  effectiveCompanyId: string | null | undefined;
  executionWorkspaceDefaultProjectId: MutableRefObject<string | null>;
  initializationKeyRef: MutableRefObject<string | null>;
  isSubIssueMode: boolean;
  resetStagedFiles: () => void;
  setApproverValue: Dispatch<SetStateAction<string>>;
  setAssigneeChrome: Dispatch<SetStateAction<boolean>>;
  setAssigneeModelLane: Dispatch<SetStateAction<IssueModelLane>>;
  setAssigneeModelOverride: Dispatch<SetStateAction<string>>;
  setAssigneeOptionsOpen: Dispatch<SetStateAction<boolean>>;
  setAssigneeThinkingEffort: Dispatch<SetStateAction<string>>;
  setAssigneeValue: Dispatch<SetStateAction<string>>;
  setCompanyOpen: Dispatch<SetStateAction<boolean>>;
  setDialogCompanyId: Dispatch<SetStateAction<string | null>>;
  setExecutionWorkspaceMode: Dispatch<SetStateAction<string>>;
  setExpanded: Dispatch<SetStateAction<boolean>>;
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

export function useNewIssueDialogReset(input: UseNewIssueDialogResetInput) {
  const resetAssignmentState = useCallback(() => {
    input.setAssigneeValue("");
    input.setReviewerValue("");
    input.setApproverValue("");
    input.setShowReviewerRow(false);
    input.setShowApproverRow(false);
    input.setAssigneeModelLane("primary");
    input.setAssigneeModelOverride("");
    input.setAssigneeThinkingEffort("");
    input.setAssigneeChrome(false);
    input.setExecutionWorkspaceMode("shared_workspace");
    input.setSelectedExecutionWorkspaceId("");
    input.setWorkMode("standard");
  }, [input]);

  const reset = useCallback(() => {
    input.setIssueText("", "");
    input.setStatus("todo");
    input.setPriority("");
    resetAssignmentState();
    input.setProjectId("");
    input.setProjectWorkspaceId("");
    input.setAssigneeOptionsOpen(false);
    input.setExpanded(false);
    input.setDialogCompanyId(null);
    input.resetStagedFiles();
    input.setCompanyOpen(false);
    input.executionWorkspaceDefaultProjectId.current = null;
    input.initializationKeyRef.current = null;
  }, [input, resetAssignmentState]);

  const handleCompanyChange = useCallback((companyId: string) => {
    if (input.isSubIssueMode) return;
    if (companyId === input.effectiveCompanyId) return;
    input.setDialogCompanyId(companyId);
    resetAssignmentState();
    input.setProjectId("");
    input.setProjectWorkspaceId("");
  }, [input, resetAssignmentState]);

  return { handleCompanyChange, reset };
}
