import type {
  Agent,
  Approval,
  FeedbackVote,
  FeedbackVoteValue,
} from "@paperclipai/shared";
import type { IssueTimelineEvent } from "../../lib/issue-timeline-events";
import type { MentionOption } from "../MarkdownEditor";
import { runTimestamp } from "./commentThreadHelpers";
import type { CommentWithRunMeta, LinkedRunItem, TimelineItem } from "./CommentThreadTypes";

export function buildCommentTimeline({
  comments,
  linkedApprovals,
  timelineEvents,
  linkedRuns,
}: {
  comments: CommentWithRunMeta[];
  linkedApprovals: Approval[];
  timelineEvents: IssueTimelineEvent[];
  linkedRuns: LinkedRunItem[];
}) {
  const followUpCommentIds = new Set(
    timelineEvents
      .filter((event) => event.followUpRequested && event.commentId)
      .map((event) => event.commentId as string),
  );
  const commentItems: TimelineItem[] = comments.map((comment) => {
    const followUpRequested = comment.followUpRequested === true || followUpCommentIds.has(comment.id);
    return {
      kind: "comment",
      id: comment.id,
      createdAtMs: new Date(comment.createdAt).getTime(),
      comment: followUpRequested ? { ...comment, followUpRequested } : comment,
    };
  });
  const approvalItems: TimelineItem[] = linkedApprovals.map((approval) => ({
    kind: "approval",
    id: approval.id,
    createdAtMs: new Date(approval.createdAt).getTime(),
    approval,
  }));
  const eventItems: TimelineItem[] = timelineEvents.map((event) => ({
    kind: "event",
    id: event.id,
    createdAtMs: new Date(event.createdAt).getTime(),
    event,
  }));
  const runItems: TimelineItem[] = linkedRuns.map((run) => ({
    kind: "run",
    id: run.runId,
    createdAtMs: new Date(runTimestamp(run)).getTime(),
    run,
  }));
  return [...commentItems, ...approvalItems, ...eventItems, ...runItems].sort((a, b) => {
    if (a.createdAtMs !== b.createdAtMs) return a.createdAtMs - b.createdAtMs;
    if (a.kind === b.kind) return a.id.localeCompare(b.id);
    const kindOrder = { event: 0, approval: 1, comment: 2, run: 3 } as const;
    return kindOrder[a.kind] - kindOrder[b.kind];
  });
}

export function buildFeedbackVoteMap(feedbackVotes: FeedbackVote[]) {
  const map = new Map<string, FeedbackVoteValue>();
  for (const feedbackVote of feedbackVotes) {
    if (feedbackVote.targetType !== "issue_comment") continue;
    map.set(feedbackVote.targetId, feedbackVote.vote);
  }
  return map;
}

export function buildMentionOptions(agentMap?: Map<string, Agent>, providedMentions?: MentionOption[]) {
  if (providedMentions) return providedMentions;
  if (!agentMap) return [];
  return Array.from(agentMap.values())
    .filter((agent) => agent.status !== "terminated")
    .map((agent) => ({
      id: `agent:${agent.id}`,
      name: agent.name,
      kind: "agent" as const,
      agentId: agent.id,
      agentIcon: agent.icon,
    }));
}
