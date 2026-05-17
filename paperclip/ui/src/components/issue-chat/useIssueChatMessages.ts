import { useMemo, useRef } from "react";
import type { ThreadMessage } from "@assistant-ui/react";
import type { Agent } from "@paperclipai/shared";

import type { ActiveRunForIssue, LiveRunForIssue } from "../../api/heartbeats";
import { useLiveRunTranscripts } from "../transcript/useLiveRunTranscripts";
import {
  buildIssueChatMessages,
  stabilizeThreadMessages,
  type IssueChatComment,
  type IssueChatLinkedRun,
  type IssueChatTranscriptEntry,
  type StableThreadMessageCacheEntry,
} from "../../lib/issue-chat-messages";
import type { IssueThreadInteraction } from "../../lib/issue-thread-interactions";
import { resolveIssueChatTranscriptRuns } from "../../lib/issueChatTranscriptRuns";
import type { IssueTimelineEvent } from "../../lib/issue-timeline-events";
import { toIsoString } from "./ComposerHelpers";

export function useIssueChatMessages({
  activeRun,
  agentMap,
  comments,
  companyId,
  currentUserId,
  enableLiveTranscriptPolling,
  hasOutputForRunOverride,
  includeSucceededRunsWithoutOutput,
  interactions,
  linkedRuns,
  liveRuns,
  projectId,
  timelineEvents,
  transcriptsByRunId,
  userLabelMap,
}: {
  activeRun: ActiveRunForIssue | null;
  agentMap?: Map<string, Agent>;
  comments: IssueChatComment[];
  companyId?: string | null;
  currentUserId?: string | null;
  enableLiveTranscriptPolling: boolean;
  hasOutputForRunOverride?: (runId: string) => boolean;
  includeSucceededRunsWithoutOutput: boolean;
  interactions: IssueThreadInteraction[];
  linkedRuns: IssueChatLinkedRun[];
  liveRuns: LiveRunForIssue[];
  projectId?: string | null;
  timelineEvents: IssueTimelineEvent[];
  transcriptsByRunId?: ReadonlyMap<string, readonly IssueChatTranscriptEntry[]>;
  userLabelMap?: ReadonlyMap<string, string> | null;
}) {
  const displayLiveRuns = useMemo(() => {
    const deduped = new Map<string, LiveRunForIssue>();
    for (const run of liveRuns) {
      deduped.set(run.id, run);
    }
    if (activeRun) {
      deduped.set(activeRun.id, {
        id: activeRun.id,
        status: activeRun.status,
        invocationSource: activeRun.invocationSource,
        triggerDetail: activeRun.triggerDetail,
        startedAt: toIsoString(activeRun.startedAt),
        finishedAt: toIsoString(activeRun.finishedAt),
        createdAt: toIsoString(activeRun.createdAt) ?? new Date().toISOString(),
        agentId: activeRun.agentId,
        agentName: activeRun.agentName,
        adapterType: activeRun.adapterType,
        logBytes: activeRun.logBytes,
        lastOutputBytes: activeRun.lastOutputBytes,
      });
    }
    return [...deduped.values()].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [activeRun, liveRuns]);
  const transcriptRuns = useMemo(() => {
    return resolveIssueChatTranscriptRuns({
      linkedRuns,
      liveRuns: displayLiveRuns,
      activeRun,
    });
  }, [activeRun, displayLiveRuns, linkedRuns]);
  const activeRunIds = useMemo(() => {
    const ids = new Set<string>();
    for (const run of displayLiveRuns) {
      if (run.status === "queued" || run.status === "running") {
        ids.add(run.id);
      }
    }
    return ids;
  }, [displayLiveRuns]);
  const { transcriptByRun, hasOutputForRun } = useLiveRunTranscripts({
    runs: enableLiveTranscriptPolling ? transcriptRuns : [],
    companyId,
  });
  const resolvedTranscriptByRun = transcriptsByRunId ?? transcriptByRun;
  const resolvedHasOutputForRun = hasOutputForRunOverride ?? hasOutputForRun;
  const rawMessages = useMemo(
    () =>
      buildIssueChatMessages({
        comments,
        interactions,
        timelineEvents,
        linkedRuns,
        liveRuns,
        activeRun,
        transcriptsByRunId: resolvedTranscriptByRun,
        hasOutputForRun: resolvedHasOutputForRun,
        includeSucceededRunsWithoutOutput,
        companyId,
        projectId,
        agentMap,
        currentUserId,
        userLabelMap,
      }),
    [
      comments,
      interactions,
      timelineEvents,
      linkedRuns,
      liveRuns,
      activeRun,
      resolvedTranscriptByRun,
      resolvedHasOutputForRun,
      includeSucceededRunsWithoutOutput,
      companyId,
      projectId,
      agentMap,
      currentUserId,
      userLabelMap,
    ],
  );
  const stableMessagesRef = useRef<readonly ThreadMessage[]>([]);
  const stableMessageCacheRef = useRef<Map<string, StableThreadMessageCacheEntry>>(new Map());
  const messages = useMemo(() => {
    const stabilized = stabilizeThreadMessages(
      rawMessages,
      stableMessagesRef.current,
      stableMessageCacheRef.current,
    );
    stableMessagesRef.current = stabilized.messages;
    stableMessageCacheRef.current = stabilized.cache;
    return stabilized.messages;
  }, [rawMessages]);
  const isRunning = displayLiveRuns.some((run) => run.status === "queued" || run.status === "running");

  return {
    activeRunIds,
    isRunning,
    messages,
  };
}
