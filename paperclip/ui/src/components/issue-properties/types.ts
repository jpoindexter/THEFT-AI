import type { Issue } from "@paperclipai/shared";

export interface IssuePropertiesProps {
  issue: Issue;
  childIssues?: Issue[];
  onAddSubIssue?: () => void;
  onUpdate: (data: Record<string, unknown>) => void;
  inline?: boolean;
}

export type ExecutionStageType = "review" | "approval";
