import { ISSUE_STATUSES, type IssueStatus } from "@paperclipai/shared";

export const ISSUE_SEARCH_DEBOUNCE_MS = 250;
export const ISSUE_SEARCH_RESULT_LIMIT = 200;
export const ISSUE_BOARD_COLUMN_RESULT_LIMIT = 200;
export const INITIAL_ISSUE_ROW_RENDER_LIMIT = 100;
export const ISSUE_ROW_RENDER_BATCH_SIZE = 150;
export const ISSUE_SCROLL_LOAD_THRESHOLD_PX = 320;

export const boardIssueStatuses = ISSUE_STATUSES;

export const issueStatusLabels: Record<IssueStatus, string> = {
  backlog: "Backlog",
  todo: "Todo",
  in_progress: "In progress",
  in_review: "In review",
  done: "Done",
  blocked: "Blocked",
  cancelled: "Cancelled",
};

export const progressSegmentClasses: Record<IssueStatus, string> = {
  backlog: "bg-muted-foreground/40",
  todo: "bg-blue-500",
  in_progress: "bg-yellow-500",
  in_review: "bg-violet-500",
  done: "bg-green-500",
  blocked: "bg-red-500",
  cancelled: "bg-neutral-400",
};

const progressSegmentWidthClasses = [
  "w-0",
  "w-1/6",
  "w-1/4",
  "w-1/3",
  "w-1/2",
  "w-2/3",
  "w-3/4",
  "w-5/6",
  "w-full",
];

const issueDepthClasses = ["pl-0", "pl-4", "pl-8", "pl-12", "pl-16", "pl-20", "pl-24", "pl-28"];

export function progressSegmentWidthClass(count: number, total: number) {
  if (total <= 0 || count <= 0) return progressSegmentWidthClasses[0];
  const index = Math.round((count / total) * (progressSegmentWidthClasses.length - 1));
  return progressSegmentWidthClasses[Math.min(Math.max(index, 0), progressSegmentWidthClasses.length - 1)];
}

export function issueDepthClass(depth: number) {
  return issueDepthClasses[Math.min(Math.max(depth, 0), issueDepthClasses.length - 1)];
}
