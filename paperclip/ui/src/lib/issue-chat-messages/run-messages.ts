import type {
  TextMessagePart,
  ThreadAssistantMessage,
  ThreadSystemMessage,
} from "@assistant-ui/react";
import type { Agent } from "@paperclipai/shared";
import type { ActiveRunForIssue, LiveRunForIssue } from "../../api/heartbeats";
import { createAssistantMetadata } from "./metadata";
import { buildAssistantPartsFromTranscript, compactIssueChatTranscript } from "./transcript";
import { formatStatusLabel, runDurationLabel, runTimestamp, toDate, toTimestamp } from "./timing";
import type { IssueChatLinkedRun, IssueChatTranscriptEntry } from "./types";

export function createHistoricalRunMessage(run: IssueChatLinkedRun, agentMap?: Map<string, Agent>) {
  const agentName = run.agentName ?? agentMap?.get(run.agentId)?.name ?? run.agentId.slice(0, 8);
  const message: ThreadSystemMessage = {
    id: `run:${run.runId}`,
    role: "system",
    createdAt: toDate(runTimestamp(run)),
    content: [{ type: "text", text: `${agentName} run ${run.runId.slice(0, 8)} ${formatStatusLabel(run.status)}` }],
    metadata: {
      custom: {
        kind: "run",
        anchorId: `run-${run.runId}`,
        runId: run.runId,
        runAgentId: run.agentId,
        runAgentName: agentName,
        runStatus: run.status,
      },
    },
  };
  return message;
}

export function createHistoricalTranscriptMessage(args: {
  run: IssueChatLinkedRun;
  transcript: readonly IssueChatTranscriptEntry[];
  hasOutput: boolean;
  agentMap?: Map<string, Agent>;
}) {
  const { run, transcript, hasOutput, agentMap } = args;
  const agentName = run.agentName ?? agentMap?.get(run.agentId)?.name ?? run.agentId.slice(0, 8);
  const compactedTranscript = compactIssueChatTranscript(transcript);
  const { parts, notices, segments } = buildAssistantPartsFromTranscript(compactedTranscript);
  const waitingText = hasOutput ? "" : "Run finished";
  const content = parts.length > 0
    ? parts
    : waitingText
      ? [{ type: "text", text: waitingText } satisfies TextMessagePart]
      : [];

  const message: ThreadAssistantMessage = {
    id: `run-assistant:${run.runId}`,
    role: "assistant",
    createdAt: toDate(run.startedAt ?? run.createdAt),
    content,
    status: { type: "complete", reason: "stop" },
    metadata: createAssistantMetadata({
      kind: "historical-run",
      anchorId: `run-${run.runId}`,
      runId: run.runId,
      runAgentId: run.agentId,
      runAgentName: agentName,
      runStatus: run.status,
      notices,
      waitingText,
      chainOfThoughtLabel: runDurationLabel(run),
      chainOfThoughtSegments: segments,
    }),
  };
  return message;
}

export function normalizeLiveRuns(
  liveRuns: readonly LiveRunForIssue[],
  activeRun: ActiveRunForIssue | null | undefined,
  issueId?: string,
) {
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
      startedAt: activeRun.startedAt ? toDate(activeRun.startedAt).toISOString() : null,
      finishedAt: activeRun.finishedAt ? toDate(activeRun.finishedAt).toISOString() : null,
      createdAt: toDate(activeRun.createdAt).toISOString(),
      agentId: activeRun.agentId,
      agentName: activeRun.agentName,
      adapterType: activeRun.adapterType,
      issueId,
    });
  }
  return [...deduped.values()].sort((a, b) => toTimestamp(a.createdAt) - toTimestamp(b.createdAt));
}

export function createLiveRunMessage(args: {
  run: LiveRunForIssue;
  transcript: readonly IssueChatTranscriptEntry[];
}) {
  const { run, transcript } = args;
  const compactedTranscript = compactIssueChatTranscript(transcript);
  const { parts, notices, segments } = buildAssistantPartsFromTranscript(compactedTranscript);
  const waitingText =
    run.status === "queued"
      ? "Queued..."
      : parts.length > 0
        ? ""
        : "Working...";

  const message: ThreadAssistantMessage = {
    id: `run-assistant:${run.id}`,
    role: "assistant",
    createdAt: toDate(run.startedAt ?? run.createdAt),
    content: parts,
    status: { type: "running" },
    metadata: createAssistantMetadata({
      kind: "live-run",
      runId: run.id,
      runAgentId: run.agentId,
      runAgentName: run.agentName,
      runStatus: run.status,
      adapterType: run.adapterType,
      notices,
      waitingText,
      chainOfThoughtLabel: runDurationLabel(run),
      chainOfThoughtSegments: segments,
    }),
  };
  return message;
}
