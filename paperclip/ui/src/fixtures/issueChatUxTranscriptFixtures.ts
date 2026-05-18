import type { IssueChatTranscriptEntry } from "../lib/issue-chat-messages";

export const issueChatUxTranscriptsByRunId = new Map<string, readonly IssueChatTranscriptEntry[]>([
  [
    "run-history-1",
    [
      {
        kind: "thinking",
        ts: "2026-04-06T11:58:03.000Z",
        text: "Reviewing the issue thread to see where transcript noise still leaks into the conversation.",
      },
      {
        kind: "tool_call",
        ts: "2026-04-06T11:58:07.000Z",
        name: "read_file",
        toolUseId: "tool-history-1",
        input: { path: "ui/src/lib/issue-chat-messages.ts" },
      },
      {
        kind: "tool_result",
        ts: "2026-04-06T11:58:11.000Z",
        toolUseId: "tool-history-1",
        content: "Found the run projection path that decides whether transcript output survives after completion.",
        isError: false,
      },
      {
        kind: "assistant",
        ts: "2026-04-06T11:59:24.000Z",
        text: "Kept the completed run context attached to the chat timeline so the reasoning can stay folded instead of disappearing.",
      },
    ],
  ],
  [
    "run-live-1",
    [
      {
        kind: "assistant",
        ts: "2026-04-06T12:04:02.000Z",
        text: "I am reshaping the issue page so the thread reads like a conversation instead of a run log.",
      },
      {
        kind: "thinking",
        ts: "2026-04-06T12:04:05.000Z",
        text: "Need to remove the internal scrollbox first, otherwise the page still feels like a nested console.",
      },
      {
        kind: "tool_call",
        ts: "2026-04-06T12:04:08.000Z",
        name: "read_file",
        toolUseId: "tool-read-1",
        input: { path: "ui/src/components/IssueChatThread.tsx" },
      },
      {
        kind: "tool_result",
        ts: "2026-04-06T12:04:11.000Z",
        toolUseId: "tool-read-1",
        content: "Loaded the current chat surface and found the max-h viewport constraint.",
        isError: false,
      },
      {
        kind: "tool_call",
        ts: "2026-04-06T12:04:14.000Z",
        name: "apply_patch",
        toolUseId: "tool-edit-1",
        input: { file: "ui/src/components/IssueChatThread.tsx", action: "remove scroll pane" },
      },
      {
        kind: "tool_result",
        ts: "2026-04-06T12:04:22.000Z",
        toolUseId: "tool-edit-1",
        content: "Updated layout classes and swapped Jump to latest to page-level scrolling.",
        isError: false,
      },
      {
        kind: "stderr",
        ts: "2026-04-06T12:04:24.000Z",
        text: "vite warm-up: rebuilding route chunks",
      },
    ],
  ],
]);
