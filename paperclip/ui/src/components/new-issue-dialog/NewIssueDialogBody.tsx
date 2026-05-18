import type { DragEvent, RefObject } from "react";
import type { ExecutionWorkspace } from "@paperclipai/shared";

import type { IssueModelLane } from "../../lib/issue-assignee-overrides";
import type { InlineEntityOption } from "../InlineEntitySelector";
import type { MarkdownEditorRef, MentionOption } from "../MarkdownEditor";
import { ExecutionWorkspaceFields } from "./ExecutionWorkspaceFields";
import { IssueAssigneeOptionsPanel } from "./IssueAssigneeOptionsPanel";
import { NewIssueAssignmentRows } from "./NewIssueAssignmentRows";
import { NewIssueDescriptionSection } from "./NewIssueDescriptionSection";
import { NewIssueParentIssueNotice } from "./NewIssueParentIssueNotice";
import { NewIssueTitleSection } from "./NewIssueTitleSection";
import type { StagedIssueFile } from "./useStagedIssueFiles";

type DialogAgent = {
  id: string;
  icon?: string | null;
};

type DialogProject = {
  id: string;
  color?: string | null;
};

type ThinkingEffortOption = {
  value: string;
  label: string;
};

export type NewIssueDialogBodyProps = {
  adapterType: string | null;
  agents: DialogAgent[];
  assigneeChrome: boolean;
  assigneeOptions: InlineEntityOption[];
  assigneeOptionsOpen: boolean;
  assigneeOptionsTitle: string;
  assigneeSelectorRef: RefObject<HTMLButtonElement | null>;
  assigneeSupportsCheapLane: boolean;
  assigneeThinkingEffort: string;
  assigneeValue: string;
  cheapProfile: { adapterConfig?: unknown } | null;
  currentAssignee: DialogAgent | null;
  currentProject: DialogProject | undefined;
  currentProjectSupportsExecutionWorkspace: boolean;
  description: string;
  descriptionEditorRef: RefObject<MarkdownEditorRef | null>;
  expanded: boolean;
  executionWorkspaceMode: string;
  imageUploadHandler: (file: File) => Promise<string>;
  isFileDragOver: boolean;
  isSubIssueMode: boolean;
  mentions: MentionOption[];
  modelLane: IssueModelLane;
  modelOverride: string;
  modelOverrideOptions: InlineEntityOption[];
  parentExecutionWorkspaceLabel: string;
  parentIssueLabel: string;
  parentTitle?: string | null;
  participantMenuOpen: boolean;
  pending: boolean;
  projectId: string;
  projectOptions: InlineEntityOption[];
  projectSelectorRef: RefObject<HTMLButtonElement | null>;
  projects: DialogProject[];
  recentAssigneeOptionIds: string[];
  recentProjectIds: string[];
  reusableWorkspaces: ExecutionWorkspace[];
  reviewerValue: string;
  approverValue: string;
  selectedExecutionWorkspaceId: string;
  selectedReusableExecutionWorkspace: ExecutionWorkspace | undefined;
  showApproverRow: boolean;
  showParentWorkspaceWarning: boolean;
  showReviewerRow: boolean;
  stagedFiles: StagedIssueFile[];
  supportsAssigneeOverrides: boolean;
  thinkingEffortOptions: readonly ThinkingEffortOption[];
  title: string;
  onApproverChange: (value: string) => void;
  onApproverRowToggle: () => void;
  onAssigneeChange: (value: string) => void;
  onAssigneeChromeToggle: () => void;
  onAssigneeConfirm: () => void;
  onAssigneeOptionsOpenChange: (open: boolean) => void;
  onDescriptionChange: (value: string) => void;
  onDragEnter: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onExecutionWorkspaceModeChange: (mode: string) => void;
  onModelLaneChange: (lane: IssueModelLane) => void;
  onModelOverrideChange: (model: string) => void;
  onParticipantMenuOpenChange: (open: boolean) => void;
  onProjectChange: (value: string) => void;
  onProjectConfirm: () => void;
  onRemoveStagedFile: (id: string) => void;
  onReviewerChange: (value: string) => void;
  onReviewerRowToggle: () => void;
  onSelectedExecutionWorkspaceIdChange: (workspaceId: string) => void;
  onThinkingEffortChange: (effort: string) => void;
  onTitleChange: (value: string) => void;
};

export function NewIssueDialogBody(props: NewIssueDialogBodyProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <NewIssueTitleSection
        value={props.title}
        pending={props.pending}
        assigneeValue={props.assigneeValue}
        projectId={props.projectId}
        descriptionEditorRef={props.descriptionEditorRef}
        assigneeSelectorRef={props.assigneeSelectorRef}
        projectSelectorRef={props.projectSelectorRef}
        onChange={props.onTitleChange}
      />

      <NewIssueAssignmentRows
        agents={props.agents}
        assigneeOptions={props.assigneeOptions}
        assigneeSelectorRef={props.assigneeSelectorRef}
        assigneeValue={props.assigneeValue}
        approverValue={props.approverValue}
        currentAssignee={props.currentAssignee}
        currentProject={props.currentProject}
        participantMenuOpen={props.participantMenuOpen}
        projectId={props.projectId}
        projectOptions={props.projectOptions}
        projectSelectorRef={props.projectSelectorRef}
        projects={props.projects}
        recentAssigneeOptionIds={props.recentAssigneeOptionIds}
        recentProjectIds={props.recentProjectIds}
        reviewerValue={props.reviewerValue}
        showApproverRow={props.showApproverRow}
        showReviewerRow={props.showReviewerRow}
        onApproverChange={props.onApproverChange}
        onApproverRowToggle={props.onApproverRowToggle}
        onAssigneeChange={props.onAssigneeChange}
        onAssigneeConfirm={props.onAssigneeConfirm}
        onParticipantMenuOpenChange={props.onParticipantMenuOpenChange}
        onProjectChange={props.onProjectChange}
        onProjectConfirm={props.onProjectConfirm}
        onReviewerChange={props.onReviewerChange}
        onReviewerRowToggle={props.onReviewerRowToggle}
      />

      <NewIssueParentIssueNotice
        isSubIssueMode={props.isSubIssueMode}
        parentIssueLabel={props.parentIssueLabel}
        parentTitle={props.parentTitle}
      />

      {props.currentProject && props.currentProjectSupportsExecutionWorkspace ? (
        <ExecutionWorkspaceFields
          executionWorkspaceMode={props.executionWorkspaceMode}
          parentExecutionWorkspaceLabel={props.parentExecutionWorkspaceLabel}
          reusableWorkspaces={props.reusableWorkspaces}
          selectedExecutionWorkspaceId={props.selectedExecutionWorkspaceId}
          selectedReusableExecutionWorkspace={props.selectedReusableExecutionWorkspace}
          showParentWorkspaceWarning={props.showParentWorkspaceWarning}
          onExecutionWorkspaceModeChange={props.onExecutionWorkspaceModeChange}
          onSelectedExecutionWorkspaceIdChange={props.onSelectedExecutionWorkspaceIdChange}
        />
      ) : null}

      <IssueAssigneeOptionsPanel
        adapterType={props.adapterType}
        assigneeChrome={props.assigneeChrome}
        assigneeOptionsOpen={props.assigneeOptionsOpen}
        assigneeOptionsTitle={props.assigneeOptionsTitle}
        assigneeSupportsCheapLane={props.assigneeSupportsCheapLane}
        assigneeThinkingEffort={props.assigneeThinkingEffort}
        cheapProfile={props.cheapProfile}
        modelLane={props.modelLane}
        modelOverride={props.modelOverride}
        modelOverrideOptions={props.modelOverrideOptions}
        supportsAssigneeOverrides={props.supportsAssigneeOverrides}
        thinkingEffortOptions={props.thinkingEffortOptions}
        onAssigneeChromeToggle={props.onAssigneeChromeToggle}
        onAssigneeOptionsOpenChange={props.onAssigneeOptionsOpenChange}
        onModelLaneChange={props.onModelLaneChange}
        onModelOverrideChange={props.onModelOverrideChange}
        onThinkingEffortChange={props.onThinkingEffortChange}
      />

      <NewIssueDescriptionSection
        value={props.description}
        expanded={props.expanded}
        mentions={props.mentions}
        descriptionEditorRef={props.descriptionEditorRef}
        imageUploadHandler={props.imageUploadHandler}
        stagedFiles={props.stagedFiles}
        isFileDragOver={props.isFileDragOver}
        pending={props.pending}
        onChange={props.onDescriptionChange}
        onDragEnter={props.onDragEnter}
        onDragOver={props.onDragOver}
        onDragLeave={props.onDragLeave}
        onDrop={props.onDrop}
        onRemoveStagedFile={props.onRemoveStagedFile}
      />
    </div>
  );
}
