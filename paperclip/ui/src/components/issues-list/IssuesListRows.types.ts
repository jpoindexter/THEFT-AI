import type { Issue } from "@paperclipai/shared";
import type { InboxIssueColumn } from "../../lib/inbox";
import type {
  Agent,
  IssueExecutionWorkspaceSummary,
  IssueGroup,
  IssueListUserProfileMap,
  IssueListWorkspaceContext,
  IssueProjectSummary,
  IssueProjectWorkspaceSummary,
  IssueViewState,
} from "./types";
import type { WorkflowChecklistMeta } from "./workflow-checklist";

export type IssuesListRowsProps = {
  groups: IssueGroup[];
  rowLimit: number;
  viewState: IssueViewState;
  updateView: (patch: Partial<IssueViewState>) => void;
  openCreateIssueDialog: (groupKey?: string) => void;
  issueLinkState?: unknown;
  agents?: Agent[];
  liveIssueIds?: Set<string>;
  mutedIssueIds?: Set<string>;
  issueBadgeById?: Map<string, string>;
  issueById: ReadonlyMap<string, Issue>;
  projectById: ReadonlyMap<string, IssueProjectSummary>;
  projectWorkspaceById: ReadonlyMap<string, IssueProjectWorkspaceSummary>;
  executionWorkspaceById: ReadonlyMap<string, IssueExecutionWorkspaceSummary>;
  defaultProjectWorkspaceIdByProjectId: ReadonlyMap<string, string>;
  issueFilterWorkspaceContext: IssueListWorkspaceContext;
  companyUserProfileMap: IssueListUserProfileMap;
  companyUserLabelMap: ReadonlyMap<string, string>;
  currentUserId: string | null;
  visibleIssueColumnSet: ReadonlySet<InboxIssueColumn>;
  availableIssueColumnSet: ReadonlySet<InboxIssueColumn>;
  visibleTrailingIssueColumns: InboxIssueColumn[];
  workflowChecklistMeta: WorkflowChecklistMeta | null;
  assigneePickerIssueId: string | null;
  setAssigneePickerIssueId: (issueId: string | null) => void;
  assigneeSearch: string;
  setAssigneeSearch: (search: string) => void;
  assignIssue: (issueId: string, assigneeAgentId: string | null, assigneeUserId?: string | null) => void;
  agentName: (id: string | null) => string | null;
  filterToWorkspace: (workspaceId: string) => void;
  onUpdateIssue: (id: string, data: Record<string, unknown>) => void;
};
