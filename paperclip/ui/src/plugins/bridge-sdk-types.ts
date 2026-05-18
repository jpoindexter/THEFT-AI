import type { FileTreeProps as HostFileTreeProps } from "@/components/FileTree";

export type PluginFileTreePathCollection = ReadonlySet<string> | readonly string[];

export type PluginFileTreeProps = Omit<
  HostFileTreeProps,
  | "expandedDirs"
  | "checkedFiles"
  | "renderFileExtra"
  | "fileRowClassName"
  | "selectedFile"
  | "showCheckboxes"
  | "onToggleDir"
  | "onSelectFile"
> & {
  selectedFile?: string | null;
  expandedPaths?: PluginFileTreePathCollection;
  checkedPaths?: PluginFileTreePathCollection;
  showCheckboxes?: boolean;
  onToggleDir?: (path: string) => void;
  onSelectFile?: (path: string) => void;
};

export type PluginMarkdownBlockProps = {
  content: string;
  className?: string;
  enableWikiLinks?: boolean;
  wikiLinkRoot?: string;
  resolveWikiLinkHref?: (target: string, label: string) => string | null | undefined;
};

export type PluginMarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  contentClassName?: string;
  onBlur?: () => void;
  bordered?: boolean;
  readOnly?: boolean;
  onSubmit?: () => void;
};

export type PluginIssuesListFilters = {
  status?: string;
  projectId?: string;
  parentId?: string;
  assigneeAgentId?: string;
  participantAgentId?: string;
  assigneeUserId?: string;
  labelId?: string;
  workspaceId?: string;
  executionWorkspaceId?: string;
  originKind?: string;
  originKindPrefix?: string;
  originId?: string;
  descendantOf?: string;
  includeRoutineExecutions?: boolean;
};

export type PluginIssuesListProps = {
  companyId: string | null;
  projectId?: string | null;
  filters?: PluginIssuesListFilters;
  viewStateKey?: string;
  initialSearch?: string;
  createIssueLabel?: string;
  searchWithinLoadedIssues?: boolean;
};

export type PluginAssigneePickerSelection = {
  assigneeAgentId: string | null;
  assigneeUserId: string | null;
};

export type PluginAssigneePickerProps = {
  companyId?: string | null;
  value: string;
  onChange: (value: string, selection: PluginAssigneePickerSelection) => void;
  placeholder?: string;
  noneLabel?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  includeUsers?: boolean;
  includeTerminatedAgents?: boolean;
  className?: string;
  onConfirm?: () => void;
};

export type PluginProjectPickerProps = {
  companyId?: string | null;
  value: string;
  onChange: (projectId: string) => void;
  placeholder?: string;
  noneLabel?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  includeArchived?: boolean;
  className?: string;
  onConfirm?: () => void;
};
