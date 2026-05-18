import type {
  ReasoningMessagePart,
  TextMessagePart,
  ToolCallMessagePart,
} from "@assistant-ui/react";
import {
  ISSUE_CHAT_TRANSCRIPT_MAX_VISIBLE_ENTRIES,
  type IssueChatTranscriptEntry,
  type JsonObject,
  type JsonValue,
  type SegmentTiming,
} from "./types";
import { computeSegmentTimings } from "./timing";
import { summarizeNotice } from "../transcriptPresentation";

function normalizeJsonValue(input: unknown): JsonValue {
  if (
    input === null ||
    typeof input === "string" ||
    typeof input === "number" ||
    typeof input === "boolean"
  ) {
    return input;
  }
  if (Array.isArray(input)) {
    return input.map((entry) => normalizeJsonValue(entry));
  }
  if (typeof input === "object" && input) {
    const entries = Object.entries(input as Record<string, unknown>).map(([key, value]) => [
      key,
      normalizeJsonValue(value),
    ]);
    return Object.fromEntries(entries) as JsonObject;
  }
  return String(input);
}

function normalizeToolArgs(input: unknown): JsonObject {
  if (typeof input === "object" && input && !Array.isArray(input)) {
    return normalizeJsonValue(input) as JsonObject;
  }
  if (input === undefined) return {};
  return { value: normalizeJsonValue(input) };
}

function stringifyUnknown(value: unknown) {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function mergePartText(
  previous: TextMessagePart | ReasoningMessagePart,
  next: TextMessagePart | ReasoningMessagePart,
) {
  if (!previous.text) return next.text;
  if (!next.text) return previous.text;
  if (
    previous.text.endsWith("\n")
    || next.text.startsWith("\n")
    || previous.text.endsWith(" ")
    || next.text.startsWith(" ")
  ) {
    return `${previous.text}${next.text}`;
  }
  return previous.type === "text"
    ? `${previous.text} ${next.text}`
    : `${previous.text}\n${next.text}`;
}

function formatDiffBlock(lines: string[]) {
  return `\`\`\`diff\n${lines.join("\n")}\n\`\`\``;
}

function isIssueChatRenderableTranscriptEntry(entry: IssueChatTranscriptEntry) {
  return entry.kind !== "init"
    && entry.kind !== "stderr"
    && entry.kind !== "stdout"
    && entry.kind !== "system";
}

export function compactIssueChatTranscript(
  entries: readonly IssueChatTranscriptEntry[],
  maxVisibleEntries = ISSUE_CHAT_TRANSCRIPT_MAX_VISIBLE_ENTRIES,
): readonly IssueChatTranscriptEntry[] {
  const renderable = entries
    .map((entry, fullIndex) => ({ entry, fullIndex }))
    .filter(({ entry }) => isIssueChatRenderableTranscriptEntry(entry));

  if (renderable.length <= maxVisibleEntries) {
    return entries;
  }

  let startPos = Math.max(0, renderable.length - maxVisibleEntries);
  while (
    startPos > 0
    && renderable[startPos]?.entry.kind === "diff"
    && renderable[startPos - 1]?.entry.kind === "diff"
  ) {
    startPos -= 1;
  }

  const keptRenderablePositions = new Set<number>();
  for (let pos = startPos; pos < renderable.length; pos += 1) {
    keptRenderablePositions.add(pos);
  }

  for (let pos = startPos; pos < renderable.length; pos += 1) {
    const entry = renderable[pos]?.entry;
    if (entry?.kind !== "tool_result" || !entry.toolUseId) continue;
    for (let scan = pos - 1; scan >= 0; scan -= 1) {
      const candidate = renderable[scan]?.entry;
      if (candidate?.kind === "tool_call" && candidate.toolUseId === entry.toolUseId) {
        keptRenderablePositions.add(scan);
        break;
      }
    }
  }

  const keptFullIndices = new Set<number>();
  for (const pos of keptRenderablePositions) {
    const fullIndex = renderable[pos]?.fullIndex;
    if (fullIndex !== undefined) keptFullIndices.add(fullIndex);
  }

  return entries.filter((_entry, index) => keptFullIndices.has(index));
}

export function buildAssistantPartsFromTranscript(entries: readonly IssueChatTranscriptEntry[]): {
  parts: Array<TextMessagePart | ReasoningMessagePart | ToolCallMessagePart<JsonObject, unknown>>;
  notices: string[];
  segments: SegmentTiming[];
} {
  const orderedParts: Array<TextMessagePart | ReasoningMessagePart | ToolCallMessagePart<JsonObject, unknown>> = [];
  const toolParts = new Map<string, ToolCallMessagePart<JsonObject, unknown>>();
  const toolIndices = new Map<string, number>();
  const notices: string[] = [];
  let pendingDiffLines: string[] = [];
  let pendingDiffParentId: string | undefined;

  const flushPendingDiff = () => {
    if (pendingDiffLines.length === 0) return;
    orderedParts.push({
      type: "text",
      text: formatDiffBlock(pendingDiffLines),
      parentId: pendingDiffParentId,
    });
    pendingDiffLines = [];
    pendingDiffParentId = undefined;
  };

  for (const [index, entry] of entries.entries()) {
    if (entry.kind === "diff") {
      pendingDiffParentId ??= `diff-group:${index}`;
      pendingDiffLines.push(entry.text ?? "");
      continue;
    }

    flushPendingDiff();

    if (entry.kind === "assistant" && entry.text) {
      orderedParts.push({ type: "text", text: entry.text });
      continue;
    }
    if (entry.kind === "thinking" && entry.text) {
      orderedParts.push({ type: "reasoning", text: entry.text });
      continue;
    }
    if (entry.kind === "tool_call") {
      const toolCallId = entry.toolUseId || `tool-${index}`;
      const nextPart: ToolCallMessagePart<JsonObject, unknown> = {
        type: "tool-call",
        toolCallId,
        toolName: entry.name || "tool",
        args: normalizeToolArgs(entry.input),
        argsText: stringifyUnknown(entry.input),
      };
      if (!toolParts.has(toolCallId)) {
        toolIndices.set(toolCallId, orderedParts.length);
        orderedParts.push(nextPart);
      } else {
        const existingIndex = toolIndices.get(toolCallId);
        if (existingIndex !== undefined) orderedParts[existingIndex] = nextPart;
      }
      toolParts.set(toolCallId, nextPart);
      continue;
    }
    if (entry.kind === "tool_result") {
      const toolCallId = entry.toolUseId || `tool-result-${index}`;
      const existing = toolParts.get(toolCallId);
      const nextPart: ToolCallMessagePart<JsonObject, unknown> = {
        type: "tool-call",
        toolCallId,
        toolName: existing?.toolName || entry.toolName || "tool",
        args: existing?.args ?? {},
        argsText: existing?.argsText ?? "",
        result: entry.content ?? "",
        isError: entry.isError === true,
      };
      if (existing) {
        const existingIndex = toolIndices.get(toolCallId);
        if (existingIndex !== undefined) orderedParts[existingIndex] = nextPart;
      } else {
        toolIndices.set(toolCallId, orderedParts.length);
        orderedParts.push(nextPart);
      }
      toolParts.set(toolCallId, nextPart);
      continue;
    }
    if (entry.kind === "init" || entry.kind === "stderr" || entry.kind === "stdout" || entry.kind === "system") continue;
    if (entry.kind === "result") {
      if (entry.isError && entry.errors?.length) {
        for (const error of entry.errors) {
          orderedParts.push({ type: "reasoning", text: `Run error: ${summarizeNotice(error)}` });
        }
      } else if (entry.text) {
        orderedParts.push({
          type: "reasoning",
          text: entry.isError
            ? `Run error: ${summarizeNotice(entry.text)}`
            : summarizeNotice(entry.text),
        });
      }
    }
  }

  flushPendingDiff();

  const mergedParts: Array<TextMessagePart | ReasoningMessagePart | ToolCallMessagePart<JsonObject, unknown>> = [];
  for (const part of orderedParts) {
    if (part.type === "tool-call") {
      mergedParts.push(part);
      continue;
    }
    const previous = mergedParts.at(-1);
    if (previous && previous.type === part.type && previous.parentId === part.parentId) {
      mergedParts[mergedParts.length - 1] = {
        ...previous,
        text: mergePartText(previous, part),
      };
      continue;
    }
    mergedParts.push(part);
  }

  return {
    parts: mergedParts,
    notices,
    segments: computeSegmentTimings(entries),
  };
}
