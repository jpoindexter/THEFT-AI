import type { Agent } from "@paperclipai/shared";
import type { ActiveRunForIssue, LiveRunForIssue } from "../../api/heartbeats";
import {
  createCommentMessage,
  createInteractionMessage,
  createTimelineEventMessage,
  type IssueThreadInteraction,
} from "./comment-event-messages";
import {
  createHistoricalRunMessage,
  createHistoricalTranscriptMessage,
  createLiveRunMessage,
  normalizeLiveRuns,
} from "./run-messages";
import { runTimestamp, sortByCreated, toTimestamp } from "./timing";
import type {
  IssueChatComment,
  IssueChatLinkedRun,
  IssueChatTranscriptEntry,
  MessageWithOrder,
  SortBoundaryItem,
} from "./types";
import type { IssueTimelineEvent } from "../issue-timeline-events";

function latestSameRunHandoffTimestamp(args: {
  interactionCreatedAtMs: number;
  sourceRunId: string;
  comments: readonly IssueChatComment[];
  timelineEvents: readonly IssueTimelineEvent[];
  linkedRuns: readonly IssueChatLinkedRun[];
  liveRuns: readonly LiveRunForIssue[];
}) {
  const {
    interactionCreatedAtMs,
    sourceRunId,
    comments,
    timelineEvents,
    linkedRuns,
    liveRuns,
  } = args;
  const handoffItems: SortBoundaryItem[] = [
    ...comments.map((comment) => ({
      createdAtMs: toTimestamp(comment.createdAt),
      runId: comment.runId ?? null,
    })),
    ...timelineEvents.map((event) => ({
      createdAtMs: toTimestamp(event.createdAt),
      runId: event.runId ?? null,
    })),
  ];
  const barrierItems: SortBoundaryItem[] = [
    ...handoffItems,
    ...linkedRuns.map((run) => ({
      createdAtMs: toTimestamp(runTimestamp(run)),
      runId: run.runId,
    })),
    ...liveRuns.map((run) => ({
      createdAtMs: toTimestamp(run.startedAt ?? run.createdAt),
      runId: run.id,
    })),
  ];
  const barrierAtMs = barrierItems
    .filter((item) => item.createdAtMs > interactionCreatedAtMs && item.runId !== sourceRunId)
    .reduce<number | null>(
      (earliest, item) =>
        earliest === null ? item.createdAtMs : Math.min(earliest, item.createdAtMs),
      null,
    );

  return handoffItems
    .filter((item) =>
      item.createdAtMs > interactionCreatedAtMs
      && item.runId === sourceRunId
      && (barrierAtMs === null || item.createdAtMs < barrierAtMs)
    )
    .reduce<number | null>(
      (latest, item) =>
        latest === null ? item.createdAtMs : Math.max(latest, item.createdAtMs),
      null,
    );
}

export function buildIssueChatMessages(args: {
  comments: readonly IssueChatComment[];
  interactions?: readonly IssueThreadInteraction[];
  timelineEvents: readonly IssueTimelineEvent[];
  linkedRuns: readonly IssueChatLinkedRun[];
  liveRuns: readonly LiveRunForIssue[];
  activeRun?: ActiveRunForIssue | null;
  transcriptsByRunId?: ReadonlyMap<string, readonly IssueChatTranscriptEntry[]>;
  hasOutputForRun?: (runId: string) => boolean;
  includeSucceededRunsWithoutOutput?: boolean;
  issueId?: string;
  companyId?: string | null;
  projectId?: string | null;
  agentMap?: Map<string, Agent>;
  currentUserId?: string | null;
  userLabelMap?: ReadonlyMap<string, string> | null;
}) {
  const {
    comments,
    interactions = [],
    timelineEvents,
    linkedRuns,
    liveRuns,
    activeRun,
    transcriptsByRunId,
    hasOutputForRun,
    includeSucceededRunsWithoutOutput = false,
    issueId,
    companyId,
    projectId,
    agentMap,
    currentUserId,
    userLabelMap,
  } = args;

  const orderedMessages: MessageWithOrder[] = [];

  for (const comment of sortByCreated(comments)) {
    orderedMessages.push({
      createdAtMs: toTimestamp(comment.createdAt),
      order: 1,
      message: createCommentMessage({ comment, agentMap, currentUserId, userLabelMap, companyId, projectId }),
    });
  }

  for (const interaction of sortByCreated(interactions)) {
    const createdAtMs = toTimestamp(interaction.createdAt);
    const handoffAtMs = interaction.kind === "request_confirmation" && interaction.sourceRunId
      ? latestSameRunHandoffTimestamp({
        interactionCreatedAtMs: createdAtMs,
        sourceRunId: interaction.sourceRunId,
        comments,
        timelineEvents,
        linkedRuns,
        liveRuns,
      })
      : null;
    orderedMessages.push({
      createdAtMs: handoffAtMs ?? createdAtMs,
      order: 2,
      message: createInteractionMessage(interaction),
    });
  }

  for (const event of sortByCreated(timelineEvents)) {
    orderedMessages.push({
      createdAtMs: toTimestamp(event.createdAt),
      order: 0,
      message: createTimelineEventMessage({ event, agentMap, currentUserId, userLabelMap }),
    });
  }

  for (const run of [...linkedRuns].sort((a, b) => toTimestamp(runTimestamp(a)) - toTimestamp(runTimestamp(b)))) {
    const transcript = transcriptsByRunId?.get(run.runId) ?? [];
    const hasRunOutput = transcript.length > 0 || (hasOutputForRun?.(run.runId) ?? false);
    if (hasRunOutput || run.status !== "succeeded") {
      orderedMessages.push({
        createdAtMs: toTimestamp(run.startedAt ?? run.createdAt),
        order: 2,
        message: createHistoricalTranscriptMessage({
          run,
          transcript,
          hasOutput: hasRunOutput,
          agentMap,
        }),
      });
      continue;
    }
    if (!includeSucceededRunsWithoutOutput) continue;
    orderedMessages.push({
      createdAtMs: toTimestamp(runTimestamp(run)),
      order: 2,
      message: createHistoricalRunMessage(run, agentMap),
    });
  }

  for (const run of normalizeLiveRuns(liveRuns, activeRun, issueId)) {
    orderedMessages.push({
      createdAtMs: toTimestamp(run.startedAt ?? run.createdAt),
      order: 3,
      message: createLiveRunMessage({
        run,
        transcript: transcriptsByRunId?.get(run.id) ?? [],
      }),
    });
  }

  return orderedMessages
    .sort((a, b) => {
      if (a.createdAtMs !== b.createdAtMs) return a.createdAtMs - b.createdAtMs;
      if (a.order !== b.order) return a.order - b.order;
      return a.message.id.localeCompare(b.message.id);
    })
    .map((entry) => entry.message);
}
