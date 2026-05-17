import type { ThreadMessage } from "@assistant-ui/react";
import type {
  Agent,
  FeedbackVote,
  FeedbackVoteValue,
  IssueRelationIssueSummary,
} from "@paperclipai/shared";
import { useMemo, useRef } from "react";

export function useIssueChatThreadDerivedState({
  agentMap,
  blockedBy,
  currentAssigneeValue,
  feedbackVotes,
  messages,
}: {
  agentMap?: Map<string, Agent>;
  blockedBy: IssueRelationIssueSummary[];
  currentAssigneeValue: string;
  feedbackVotes: FeedbackVote[];
  messages: readonly ThreadMessage[];
}) {
  const unresolvedBlockers = useMemo(
    () => blockedBy.filter((blocker) => blocker.status !== "done" && blocker.status !== "cancelled"),
    [blockedBy],
  );
  const assignedAgent = useMemo(() => {
    if (!currentAssigneeValue.startsWith("agent:")) return null;
    const assigneeAgentId = currentAssigneeValue.slice("agent:".length);
    return agentMap?.get(assigneeAgentId) ?? null;
  }, [agentMap, currentAssigneeValue]);
  const feedbackVoteByTargetId = useMemo(() => {
    const map = new Map<string, FeedbackVoteValue>();
    for (const feedbackVote of feedbackVotes) {
      if (feedbackVote.targetType !== "issue_comment") continue;
      map.set(feedbackVote.targetId, feedbackVote.vote);
    }
    return map;
  }, [feedbackVotes]);
  const previousErrorBoundaryMessagesRef = useRef<readonly ThreadMessage[] | null>(null);
  const errorBoundaryResetVersionRef = useRef(0);
  if (previousErrorBoundaryMessagesRef.current !== messages) {
    previousErrorBoundaryMessagesRef.current = messages;
    errorBoundaryResetVersionRef.current += 1;
  }

  return {
    assignedAgent,
    errorBoundaryResetKey: String(errorBoundaryResetVersionRef.current),
    feedbackVoteByTargetId,
    unresolvedBlockers,
  };
}
