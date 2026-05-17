import type {
  IssueComment,
  RequestConfirmationInteraction,
  SuggestTasksInteraction,
} from "@paperclipai/shared";

import type {
  IssueCommentReassignment,
  OptimisticIssueComment,
} from "@/lib/optimistic-issue-comments";

export type CommentReassignment = IssueCommentReassignment;
export type ActionableIssueThreadInteraction =
  | SuggestTasksInteraction
  | RequestConfirmationInteraction;

export type IssueDetailComment = (IssueComment | OptimisticIssueComment) & {
  runId?: string | null;
  runAgentId?: string | null;
  interruptedRunId?: string | null;
  queueState?: "queued";
  queueTargetRunId?: string | null;
  queueReason?: "hold" | "active_run" | "other";
};
