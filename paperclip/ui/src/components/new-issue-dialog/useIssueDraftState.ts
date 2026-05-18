import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { IssueWorkMode } from "@paperclipai/shared";
import type { IssueModelLane } from "../../lib/issue-assignee-overrides";

const DRAFT_KEY = "paperclip:issue-draft";
const DEBOUNCE_MS = 800;

export interface IssueDraft {
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

type UseIssueDraftStateArgs = {
  newIssueOpen: boolean;
  status: string;
  priority: string;
  assigneeValue: string;
  reviewerValue: string;
  approverValue: string;
  projectId: string;
  projectWorkspaceId: string;
  assigneeModelLane: IssueModelLane;
  assigneeModelOverride: string;
  assigneeThinkingEffort: string;
  assigneeChrome: boolean;
  executionWorkspaceMode: string;
  selectedExecutionWorkspaceId: string;
  workMode: IssueWorkMode;
};

export function isIssueWorkMode(value: unknown): value is IssueWorkMode {
  return value === "standard" || value === "planning";
}

export function loadIssueDraft(): IssueDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as IssueDraft;
  } catch {
    return null;
  }
}

function saveIssueDraft(draft: IssueDraft) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function clearIssueDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

export function useIssueDraftState({
  newIssueOpen,
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
}: UseIssueDraftStateArgs) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const titleRef = useRef("");
  const descriptionRef = useRef("");
  const [titleHasText, setTitleHasText] = useState(false);
  const [draftHasText, setDraftHasText] = useState(false);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingDraftSave = useCallback(() => {
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = null;
  }, []);

  const scheduleSave = useCallback(
    (draft: IssueDraft) => {
      clearPendingDraftSave();
      draftTimer.current = setTimeout(() => {
        if (draft.title.trim()) saveIssueDraft(draft);
      }, DEBOUNCE_MS);
    },
    [clearPendingDraftSave],
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

  useEffect(() => {
    return () => {
      clearPendingDraftSave();
    };
  }, [clearPendingDraftSave]);

  const savedDraft = useMemo(() => newIssueOpen ? loadIssueDraft() : null, [newIssueOpen]);
  const hasSavedDraft = Boolean(savedDraft?.title.trim() || savedDraft?.description.trim());

  return {
    title,
    description,
    titleRef,
    descriptionRef,
    titleHasText,
    draftHasText,
    hasSavedDraft,
    setIssueText,
    handleTitleChange,
    handleDescriptionChange,
    clearPendingDraftSave,
  };
}
