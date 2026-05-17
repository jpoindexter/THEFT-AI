import type { IssueFilterState } from "../../lib/issue-filters";

export type AgentOption = {
  id: string;
  name: string;
};

export type ProjectOption = {
  id: string;
  name: string;
};

export type LabelOption = {
  id: string;
  name: string;
  color: string;
};

export type WorkspaceOption = {
  id: string;
  name: string;
};

export type CreatorOption = {
  id: string;
  label: string;
  kind: "agent" | "user";
  searchText?: string;
};

export interface IssueFiltersPopoverProps {
  state: IssueFilterState;
  onChange: (patch: Partial<IssueFilterState>) => void;
  activeFilterCount: number;
  agents?: AgentOption[];
  projects?: ProjectOption[];
  labels?: LabelOption[];
  currentUserId?: string | null;
  enableRoutineVisibilityFilter?: boolean;
  buttonVariant?: "ghost" | "outline";
  iconOnly?: boolean;
  workspaces?: WorkspaceOption[];
  creators?: CreatorOption[];
}
