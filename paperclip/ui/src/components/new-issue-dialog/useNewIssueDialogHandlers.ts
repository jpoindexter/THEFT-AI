import { useCallback, type Dispatch, type KeyboardEvent, type RefObject, type SetStateAction } from "react";

import { parseAssigneeValue } from "../../lib/assignees";
import { trackRecentAssignee } from "../../lib/recent-assignees";
import type { MarkdownEditorRef } from "../MarkdownEditor";
import { clearIssueDraft } from "./useIssueDraftState";

type UseNewIssueDialogHandlersInput = {
  closeNewIssue: () => void;
  descriptionEditorRef: RefObject<MarkdownEditorRef | null>;
  handleSubmit: () => void;
  projectId: string;
  projectSelectorRef: RefObject<HTMLButtonElement | null>;
  reset: () => void;
  setApproverValue: Dispatch<SetStateAction<string>>;
  setAssigneeChrome: Dispatch<SetStateAction<boolean>>;
  setAssigneeValue: Dispatch<SetStateAction<string>>;
  setParticipantMenuOpen: Dispatch<SetStateAction<boolean>>;
  setReviewerValue: Dispatch<SetStateAction<string>>;
  setShowApproverRow: Dispatch<SetStateAction<boolean>>;
  setShowReviewerRow: Dispatch<SetStateAction<boolean>>;
  showApproverRow: boolean;
  showReviewerRow: boolean;
};

export function useNewIssueDialogHandlers(input: UseNewIssueDialogHandlersInput) {
  const discardDraft = useCallback(() => {
    clearIssueDraft();
    input.reset();
    input.closeNewIssue();
  }, [input]);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      input.handleSubmit();
    }
  }, [input]);

  const handleAssigneeChange = useCallback((value: string) => {
    const nextAssignee = parseAssigneeValue(value);
    if (nextAssignee.assigneeAgentId) trackRecentAssignee(nextAssignee.assigneeAgentId);
    input.setAssigneeValue(value);
  }, [input]);

  const handleAssigneeConfirm = useCallback(() => {
    if (input.projectId) {
      input.descriptionEditorRef.current?.focus();
    } else {
      input.projectSelectorRef.current?.focus();
    }
  }, [input]);

  const handleApproverRowToggle = useCallback(() => {
    input.setShowApproverRow((value) => !value);
    if (input.showApproverRow) input.setApproverValue("");
    input.setParticipantMenuOpen(false);
  }, [input]);

  const handleReviewerRowToggle = useCallback(() => {
    input.setShowReviewerRow((value) => !value);
    if (input.showReviewerRow) input.setReviewerValue("");
    input.setParticipantMenuOpen(false);
  }, [input]);

  const handleAssigneeChromeToggle = useCallback(() => {
    input.setAssigneeChrome((value) => !value);
  }, [input]);

  const handleProjectConfirm = useCallback(() => {
    input.descriptionEditorRef.current?.focus();
  }, [input.descriptionEditorRef]);

  return {
    discardDraft,
    handleAssigneeChange,
    handleAssigneeChromeToggle,
    handleAssigneeConfirm,
    handleApproverRowToggle,
    handleKeyDown,
    handleProjectConfirm,
    handleReviewerRowToggle,
  };
}
