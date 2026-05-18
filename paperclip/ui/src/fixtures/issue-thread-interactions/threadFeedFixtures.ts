import type { LiveRunForIssue } from "../../api/heartbeats";
import type {
  IssueChatComment,
  IssueChatTranscriptEntry,
} from "../../lib/issue-chat-messages";
import type { IssueTimelineEvent } from "../../lib/issue-timeline-events";
import { pendingAskUserQuestionsInteraction } from "./questionInteractionFixtures";
import { pendingRequestConfirmationInteraction } from "./confirmationInteractionFixtures";
import { acceptedSuggestedTasksInteraction } from "./suggestedTaskInteractionFixtures";
import { createComment, issueThreadInteractionFixtureMeta } from "./issueThreadInteractionFactories";

export const issueThreadInteractionComments: IssueChatComment[] = [
  createComment({
    id: "comment-thread-board",
    body: "Pressure-test first-class issue-thread interactions before we touch persistence. I want to see the cards in the real feed, not in a disconnected mock.",
    createdAt: new Date("2026-04-20T14:02:00.000Z"),
    updatedAt: new Date("2026-04-20T14:02:00.000Z"),
  }),
  createComment({
    id: "comment-thread-agent",
    authorAgentId: "agent-codex",
    authorUserId: null,
    body: "I found the existing issue chat surface and I am adding prototype-only interaction records so the Storybook review can happen before persistence work.",
    createdAt: new Date("2026-04-20T14:09:00.000Z"),
    updatedAt: new Date("2026-04-20T14:09:00.000Z"),
    runId: "run-thread-interaction",
    runAgentId: "agent-codex",
  }),
];

export const issueThreadInteractionEvents: IssueTimelineEvent[] = [
  {
    id: "event-thread-checkout",
    createdAt: new Date("2026-04-20T14:01:00.000Z"),
    actorType: "user",
    actorId: issueThreadInteractionFixtureMeta.currentUserId,
    statusChange: {
      from: "todo",
      to: "in_progress",
    },
  },
];

export const issueThreadInteractionLiveRuns: LiveRunForIssue[] = [
  {
    id: "run-thread-live",
    status: "running",
    invocationSource: "manual",
    triggerDetail: null,
    startedAt: "2026-04-20T14:26:00.000Z",
    finishedAt: null,
    createdAt: "2026-04-20T14:26:00.000Z",
    agentId: "agent-codex",
    agentName: "CodexCoder",
    adapterType: "codex_local",
  },
];

export const issueThreadInteractionTranscriptsByRunId = new Map<
  string,
  readonly IssueChatTranscriptEntry[]
>([
  [
    "run-thread-live",
    [
      {
        kind: "assistant",
        ts: "2026-04-20T14:26:02.000Z",
        text: "Wiring the prototype interaction cards into the same issue feed that already renders comments and live runs.",
      },
      {
        kind: "thinking",
        ts: "2026-04-20T14:26:04.000Z",
        text: "Need to keep the payload shapes local to the UI layer so Phase 0 stays non-persistent.",
      },
    ],
  ],
]);

export const mixedIssueThreadInteractions = [
  acceptedSuggestedTasksInteraction,
  pendingRequestConfirmationInteraction,
  pendingAskUserQuestionsInteraction,
];
