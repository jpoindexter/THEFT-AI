import type {
  Approval,
  FeedbackDataSharingPreference,
  FeedbackVoteValue,
  IssueComment,
} from "@paperclipai/shared";
import type { IssueTimelineEvent } from "../../lib/issue-timeline-events";

export interface CommentWithRunMeta extends IssueComment {
  runId?: string | null;
  runAgentId?: string | null;
  clientId?: string;
  clientStatus?: "pending" | "queued";
  queueState?: "queued";
  queueTargetRunId?: string | null;
  followUpRequested?: boolean;
}

export interface LinkedRunItem {
  runId: string;
  status: string;
  agentId: string;
  createdAt: Date | string;
  startedAt: Date | string | null;
  environment?: {
    id: string;
    name: string;
    driver: string;
  } | null;
  environmentLease?: {
    id: string;
    status: string;
    leasePolicy: string;
    provider: string | null;
    providerLeaseId: string | null;
    executionWorkspaceId: string | null;
    workspacePath: string | null;
    failureReason: string | null;
    cleanupStatus: string | null;
  } | null;
  finishedAt?: Date | string | null;
}

export interface CommentReassignment {
  assigneeAgentId: string | null;
  assigneeUserId: string | null;
}

export type CommentVoteHandler = (
  vote: FeedbackVoteValue,
  options?: { allowSharing?: boolean; reason?: string },
) => Promise<void>;

export interface CommentFeedbackProps {
  feedbackVote?: FeedbackVoteValue | null;
  feedbackDataSharingPreference?: FeedbackDataSharingPreference;
  feedbackTermsUrl?: string | null;
  onVote?: CommentVoteHandler;
  voting?: boolean;
}

export type TimelineItem =
  | { kind: "comment"; id: string; createdAtMs: number; comment: CommentWithRunMeta }
  | { kind: "approval"; id: string; createdAtMs: number; approval: Approval }
  | { kind: "event"; id: string; createdAtMs: number; event: IssueTimelineEvent }
  | { kind: "run"; id: string; createdAtMs: number; run: LinkedRunItem };
