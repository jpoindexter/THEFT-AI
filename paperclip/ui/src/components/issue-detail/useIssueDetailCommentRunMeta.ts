import { useMemo } from "react";
import type { RunForIssue } from "@/api/activity";
import type { ActiveRunForIssue, LiveRunForIssue } from "@/api/heartbeats";
import {
  applyLocalQueuedIssueCommentState,
  isQueuedIssueComment,
} from "@/lib/optimistic-issue-comments";
import type { ActivityEvent } from "@paperclipai/shared";

import type { IssueDetailComment } from "./IssueDetailChatTypes";

export function useIssueDetailCommentRunMeta({
  comments,
  liveRunIds,
  locallyQueuedCommentRunIds,
  queuedCommentReason,
  resolvedActivity,
  resolvedLinkedRuns,
  runningIssueRun,
}: {
  comments: IssueDetailComment[];
  liveRunIds: ReadonlySet<string>;
  locallyQueuedCommentRunIds: ReadonlyMap<string, string>;
  queuedCommentReason: "hold" | "active_run" | "other";
  resolvedActivity: readonly ActivityEvent[];
  resolvedLinkedRuns: readonly RunForIssue[];
  runningIssueRun: ActiveRunForIssue | LiveRunForIssue | null;
}) {
  return useMemo<IssueDetailComment[]>(() => {
    const activeRunStartedAt = runningIssueRun?.startedAt ?? runningIssueRun?.createdAt ?? null;
    const runMetaByCommentId = new Map<string, {
      runId: string;
      runAgentId: string | null;
      interruptedRunId: string | null;
    }>();
    const followUpCommentIds = new Set<string>();
    const agentIdByRunId = new Map<string, string>();

    for (const run of resolvedLinkedRuns) {
      agentIdByRunId.set(run.runId, run.agentId);
    }
    for (const evt of resolvedActivity) {
      if (evt.action !== "issue.comment_added" || !evt.runId) continue;
      const details = evt.details ?? {};
      const commentId = typeof details["commentId"] === "string" ? details["commentId"] : null;
      if (!commentId || runMetaByCommentId.has(commentId)) continue;
      const interruptedRunId =
        typeof details["interruptedRunId"] === "string" ? details["interruptedRunId"] : null;
      runMetaByCommentId.set(commentId, {
        runId: evt.runId,
        runAgentId: evt.agentId ?? agentIdByRunId.get(evt.runId) ?? null,
        interruptedRunId,
      });
    }
    for (const evt of resolvedActivity) {
      if (evt.action !== "issue.comment_added") continue;
      const details = evt.details ?? {};
      const commentId = typeof details["commentId"] === "string" ? details["commentId"] : null;
      if (!commentId) continue;
      if (details["followUpRequested"] === true || details["resumeIntent"] === true) {
        followUpCommentIds.add(commentId);
      }
    }

    return comments.map((comment) => {
      const meta = runMetaByCommentId.get(comment.id);
      const nextComment: IssueDetailComment = meta ? { ...comment, ...meta } : { ...comment };
      if (followUpCommentIds.has(comment.id)) {
        nextComment.followUpRequested = true;
      }
      const queuedTargetRunId = locallyQueuedCommentRunIds.get(comment.id) ?? null;
      const locallyQueuedComment = applyLocalQueuedIssueCommentState(nextComment, {
        queuedTargetRunId,
        targetRunIsLive: queuedTargetRunId ? liveRunIds.has(queuedTargetRunId) : false,
        runningRunId: runningIssueRun?.id ?? null,
      });
      if (locallyQueuedComment !== nextComment) {
        return locallyQueuedComment;
      }
      if (
        isQueuedIssueComment({
          comment: nextComment,
          activeRunStartedAt,
          activeRunAgentId: runningIssueRun?.agentId ?? null,
          activeRunCommentId: runningIssueRun?.contextCommentId ?? null,
          activeRunWakeCommentId: runningIssueRun?.contextWakeCommentId ?? null,
          runId: meta?.runId ?? nextComment.runId ?? null,
          interruptedRunId: meta?.interruptedRunId ?? nextComment.interruptedRunId ?? null,
        })
      ) {
        return {
          ...nextComment,
          queueState: "queued" as const,
          queueTargetRunId: runningIssueRun?.id ?? nextComment.queueTargetRunId ?? null,
          queueReason: queuedCommentReason,
        };
      }
      return nextComment;
    });
  }, [
    comments,
    liveRunIds,
    locallyQueuedCommentRunIds,
    queuedCommentReason,
    resolvedActivity,
    resolvedLinkedRuns,
    runningIssueRun,
  ]);
}
