import { useRef, useState } from "react";
import type { IssueWorkMode } from "@paperclipai/shared";

import { useCompany } from "../../context/CompanyContext";
import { useDialog } from "../../context/DialogContext";
import { useToastActions } from "../../context/ToastContext";
import type { IssueModelLane } from "../../lib/issue-assignee-overrides";
import type { MarkdownEditorRef } from "../MarkdownEditor";
import type { NewIssueDialogSurfaceProps } from "./NewIssueDialogSurface";
import { useIssueDraftState } from "./useIssueDraftState";
import { useNewIssueDialogData } from "./useNewIssueDialogData";
import { useNewIssueDialogHandlers } from "./useNewIssueDialogHandlers";
import { useNewIssueDialogInitialization } from "./useNewIssueDialogInitialization";
import { useNewIssueDialogReset } from "./useNewIssueDialogReset";
import { useNewIssueProjectSelection } from "./useNewIssueProjectSelection";
import { useNewIssueSubmission } from "./useNewIssueSubmission";
import { useStagedIssueFiles } from "./useStagedIssueFiles";

export function useNewIssueDialogController(): NewIssueDialogSurfaceProps {
  const { newIssueOpen, newIssueDefaults, closeNewIssue } = useDialog();
  const { companies, selectedCompanyId, selectedCompany } = useCompany();
  const { pushToast } = useToastActions();
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
  const [executionWorkspaceMode, setExecutionWorkspaceMode] = useState("shared_workspace");
  const [selectedExecutionWorkspaceId, setSelectedExecutionWorkspaceId] = useState("");
  const [workMode, setWorkMode] = useState<IssueWorkMode>("standard");
  const [expanded, setExpanded] = useState(false);
  const [dialogCompanyId, setDialogCompanyId] = useState<string | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [workModeOpen, setWorkModeOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const descriptionEditorRef = useRef<MarkdownEditorRef>(null);
  const assigneeSelectorRef = useRef<HTMLButtonElement | null>(null);
  const projectSelectorRef = useRef<HTMLButtonElement | null>(null);
  const executionWorkspaceDefaultProjectId = useRef<string | null>(null);
  const initializationKeyRef = useRef<string | null>(null);
  const draftState = useIssueDraftState({
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
  });
  const stagedFileState = useStagedIssueFiles();
  const effectiveCompanyId = dialogCompanyId ?? selectedCompanyId;
  const dialogCompany = companies.find((company) => company.id === effectiveCompanyId) ?? selectedCompany;
  const isSubIssueMode = Boolean(newIssueDefaults.parentId);
  const parentIssueLabel =
    newIssueDefaults.parentIdentifier ?? (newIssueDefaults.parentId ? newIssueDefaults.parentId.slice(0, 8) : "");
  const parentExecutionWorkspaceId = newIssueDefaults.executionWorkspaceId ?? "";
  const parentExecutionWorkspaceLabel = newIssueDefaults.parentExecutionWorkspaceLabel ?? parentExecutionWorkspaceId;
  const data = useNewIssueDialogData({
    assigneeModelLane,
    assigneeThinkingEffort,
    assigneeValue,
    companyId: effectiveCompanyId,
    newIssueOpen,
    projectId,
    projectWorkspaceId,
    selectedExecutionWorkspaceId,
    onAssigneeChromeChange: setAssigneeChrome,
    onAssigneeModelLaneChange: setAssigneeModelLane,
    onAssigneeModelOverrideChange: setAssigneeModelOverride,
    onAssigneeOptionsOpenChange: setAssigneeOptionsOpen,
    onAssigneeThinkingEffortChange: setAssigneeThinkingEffort,
  });

  useNewIssueDialogInitialization({
    executionWorkspaceDefaultProjectId,
    initializationKeyRef,
    newIssueDefaults,
    newIssueOpen,
    orderedProjects: data.orderedProjects,
    selectedCompanyId,
    setApproverValue,
    setAssigneeChrome,
    setAssigneeModelLane,
    setAssigneeModelOverride,
    setAssigneeThinkingEffort,
    setAssigneeValue,
    setDialogCompanyId,
    setExecutionWorkspaceMode,
    setIssueText: draftState.setIssueText,
    setPriority,
    setProjectId,
    setProjectWorkspaceId,
    setReviewerValue,
    setSelectedExecutionWorkspaceId,
    setShowApproverRow,
    setShowReviewerRow,
    setStatus,
    setWorkMode,
  });
  const { handleCompanyChange, reset } = useNewIssueDialogReset({
    effectiveCompanyId,
    executionWorkspaceDefaultProjectId,
    initializationKeyRef,
    isSubIssueMode,
    resetStagedFiles: stagedFileState.resetStagedFiles,
    setApproverValue,
    setAssigneeChrome,
    setAssigneeModelLane,
    setAssigneeModelOverride,
    setAssigneeOptionsOpen,
    setAssigneeThinkingEffort,
    setAssigneeValue,
    setCompanyOpen,
    setDialogCompanyId,
    setExecutionWorkspaceMode,
    setExpanded,
    setIssueText: draftState.setIssueText,
    setPriority,
    setProjectId,
    setProjectWorkspaceId,
    setReviewerValue,
    setSelectedExecutionWorkspaceId,
    setShowApproverRow,
    setShowReviewerRow,
    setStatus,
    setWorkMode,
  });
  const selectedReusableExecutionWorkspace = data.selectedReusableExecutionWorkspace;
  const submission = useNewIssueSubmission({
    assigneeAdapterType: data.assigneeAdapterType,
    assigneeChrome,
    assigneeModelLane,
    assigneeModelOverride,
    assigneeSupportsCheapLane: data.assigneeSupportsCheapLane,
    assigneeThinkingEffort,
    approverValue,
    companies,
    descriptionRef: draftState.descriptionRef,
    effectiveCompanyId,
    executionWorkspaceMode,
    experimentalSettings: data.experimentalSettings,
    newIssueDefaults,
    orderedProjects: data.orderedProjects,
    priority,
    projectId,
    projectWorkspaceId,
    pushToast,
    reviewerValue,
    selectedAssigneeAgentId: data.selectedAssigneeAgentId,
    selectedAssigneeUserId: data.selectedAssigneeUserId,
    selectedExecutionWorkspaceId,
    selectedReusableExecutionWorkspace,
    stagedFiles: stagedFileState.stagedFiles,
    status,
    titleRef: draftState.titleRef,
    workMode,
    onClearPendingDraftSave: draftState.clearPendingDraftSave,
    onClose: closeNewIssue,
    onReset: reset,
  });
  const handleProjectChange = useNewIssueProjectSelection({
    executionWorkspaceDefaultProjectId,
    newIssueOpen,
    orderedProjects: data.orderedProjects,
    projectId,
    selectedExecutionWorkspaceId,
    setExecutionWorkspaceMode,
    setProjectId,
    setProjectWorkspaceId,
    setSelectedExecutionWorkspaceId,
  });
  const handlers = useNewIssueDialogHandlers({
    closeNewIssue,
    descriptionEditorRef,
    handleSubmit: submission.handleSubmit,
    projectId,
    projectSelectorRef,
    reset,
    setApproverValue,
    setAssigneeChrome,
    setAssigneeValue,
    setParticipantMenuOpen,
    setReviewerValue,
    setShowApproverRow,
    setShowReviewerRow,
    showApproverRow,
    showReviewerRow,
  });

  const hasDraft = draftState.draftHasText || stagedFileState.stagedFiles.length > 0;
  const isUsingParentExecutionWorkspace = isSubIssueMode && parentExecutionWorkspaceId
    ? executionWorkspaceMode === "reuse_existing" && selectedExecutionWorkspaceId === parentExecutionWorkspaceId
    : false;

  return {
    adapterType: data.assigneeAdapterType, agents: data.agents ?? [], assigneeChrome,
    assigneeOptions: data.assigneeOptions, assigneeOptionsOpen, assigneeOptionsTitle: data.assigneeOptionsTitle,
    assigneeSelectorRef, assigneeThinkingEffort, assigneeValue,
    assigneeSupportsCheapLane: data.assigneeSupportsCheapLane,
    canDiscardDraft: hasDraft || draftState.hasSavedDraft,
    cheapProfile: data.assigneeCheapProfile, closeNewIssue, companies, companyOpen,
    currentAssignee: data.currentAssignee, currentProject: data.currentProject,
    currentProjectSupportsExecutionWorkspace: data.currentProjectSupportsExecutionWorkspace,
    description: draftState.description, descriptionEditorRef, dialogCompany, effectiveCompanyId,
    errorMessage: submission.isError ? submission.errorMessage : null,
    expanded, imageUploadHandler: submission.uploadDescriptionImageHandler,
    isFileDragOver: stagedFileState.isFileDragOver, isSubIssueMode, mentions: data.mentionOptions,
    modelLane: assigneeModelLane, modelOverride: assigneeModelOverride, modelOverrideOptions: data.modelOverrideOptions,
    moreOpen, newIssueOpen, parentExecutionWorkspaceLabel, parentIssueLabel,
    parentTitle: newIssueDefaults.parentTitle, participantMenuOpen, pending: submission.isPending,
    priority, priorityOpen, projectId, projectOptions: data.projectOptions, projectSelectorRef,
    projects: data.orderedProjects, recentAssigneeOptionIds: data.recentAssigneeOptionIds,
    recentProjectIds: data.recentProjectIds, reusableWorkspaces: data.deduplicatedReusableWorkspaces,
    reviewerValue, approverValue, selectedExecutionWorkspaceId, selectedReusableExecutionWorkspace, showApproverRow,
    showParentWorkspaceWarning: isSubIssueMode
      && data.currentProjectSupportsExecutionWorkspace
      && Boolean(parentExecutionWorkspaceId)
      && !isUsingParentExecutionWorkspace,
    showReviewerRow, stageFileInputRef: stagedFileState.stageFileInputRef, stagedFiles: stagedFileState.stagedFiles,
    status, statusOpen, supportsAssigneeOverrides: data.supportsAssigneeOverrides,
    thinkingEffortOptions: data.thinkingEffortOptions, title: draftState.title, titleHasText: draftState.titleHasText,
    uploadDisabled: submission.isPending, workMode, workModeOpen, executionWorkspaceMode,
    onApproverChange: setApproverValue, onApproverRowToggle: handlers.handleApproverRowToggle,
    onAssigneeChange: handlers.handleAssigneeChange, onAssigneeChromeToggle: handlers.handleAssigneeChromeToggle,
    onAssigneeConfirm: handlers.handleAssigneeConfirm, onAssigneeOptionsOpenChange: setAssigneeOptionsOpen,
    onClose: closeNewIssue, onCompanyChange: handleCompanyChange, onCompanyOpenChange: setCompanyOpen,
    onDescriptionChange: draftState.handleDescriptionChange, onDiscardDraft: handlers.discardDraft,
    onDragEnter: stagedFileState.handleFileDragEnter, onDragLeave: stagedFileState.handleFileDragLeave,
    onDragOver: stagedFileState.handleFileDragOver, onDrop: stagedFileState.handleFileDrop,
    onExecutionWorkspaceModeChange: setExecutionWorkspaceMode, onExpandedChange: setExpanded,
    onKeyDown: handlers.handleKeyDown, onModelLaneChange: setAssigneeModelLane,
    onModelOverrideChange: setAssigneeModelOverride, onMoreOpenChange: setMoreOpen,
    onParticipantMenuOpenChange: setParticipantMenuOpen, onPriorityChange: setPriority,
    onPriorityOpenChange: setPriorityOpen, onProjectChange: handleProjectChange,
    onProjectConfirm: handlers.handleProjectConfirm, onRemoveStagedFile: stagedFileState.removeStagedFile,
    onReviewerChange: setReviewerValue, onReviewerRowToggle: handlers.handleReviewerRowToggle,
    onSelectedExecutionWorkspaceIdChange: setSelectedExecutionWorkspaceId,
    onStageFilesPicked: stagedFileState.handleStageFilesPicked, onStatusChange: setStatus,
    onStatusOpenChange: setStatusOpen, onSubmit: submission.handleSubmit,
    onThinkingEffortChange: setAssigneeThinkingEffort, onTitleChange: draftState.handleTitleChange,
    onWorkModeChange: setWorkMode, onWorkModeOpenChange: setWorkModeOpen,
  };
}
