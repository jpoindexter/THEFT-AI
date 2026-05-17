import type {
  ReasoningMessagePart,
  ThreadMessage,
  ToolCallMessagePart,
} from "@assistant-ui/react";
import type { Agent } from "@paperclipai/shared";
import { useEffect, useMemo, useRef, useState } from "react";
import { Brain, ChevronDown, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AgentIcon } from "@/components/AgentIconPicker";
import { formatDurationWords, type SegmentTiming } from "@/lib/issue-chat-messages";
import { cn } from "@/lib/utils";

import {
  IssueChatRollingToolPart,
  IssueChatToolPart,
  toolCountSummary,
} from "./ToolCallParts";

export type IssueChatCoTPart = ReasoningMessagePart | ToolCallMessagePart;

function findCoTSegmentIndex(
  messageParts: ReadonlyArray<{ type: string }>,
  cotParts: ReadonlyArray<{ type: string }>,
): number {
  if (cotParts.length === 0) return -1;
  const firstPart = cotParts[0];
  let segIdx = -1;
  let inCoT = false;
  for (const part of messageParts) {
    if (part.type === "reasoning" || part.type === "tool-call") {
      if (!inCoT) {
        segIdx++;
        inCoT = true;
      }
      if (part === firstPart) return segIdx;
    } else {
      inCoT = false;
    }
  }
  return -1;
}

function useLiveElapsed(startMs: number | null | undefined, active: boolean): string | null {
  const [, rerender] = useState(0);
  useEffect(() => {
    if (!active || !startMs) return;
    const interval = setInterval(() => rerender((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, [active, startMs]);
  if (!active || !startMs) return null;
  return formatDurationWords(Date.now() - startMs);
}

export function IssueChatChainOfThought({
  message,
  cotParts,
  agentMap,
}: {
  message: ThreadMessage;
  cotParts: readonly IssueChatCoTPart[];
  agentMap?: Map<string, Agent>;
}) {
  const custom = message.metadata.custom as Record<string, unknown>;
  const runAgentId = typeof custom.runAgentId === "string" ? custom.runAgentId : null;
  const authorAgentId = typeof custom.authorAgentId === "string" ? custom.authorAgentId : null;
  const agentId = authorAgentId ?? runAgentId;
  const agentIcon = agentId ? agentMap?.get(agentId)?.icon : undefined;
  const isMessageRunning = message.role === "assistant" && message.status?.type === "running";

  const myIndex = useMemo(
    () => findCoTSegmentIndex(message.content, cotParts),
    [message.content, cotParts],
  );

  const allReasoningText = cotParts
    .filter((p): p is { type: "reasoning"; text: string } => p.type === "reasoning" && !!p.text)
    .map((p) => p.text)
    .join("\n");
  const toolParts = cotParts.filter(
    (p): p is ToolCallMessagePart => p.type === "tool-call",
  );

  const isActive = isMessageRunning;
  const [expanded, setExpanded] = useState(isActive);

  const rawSegments = Array.isArray(custom.chainOfThoughtSegments)
    ? (custom.chainOfThoughtSegments as SegmentTiming[])
    : [];
  const segmentTiming = myIndex >= 0 ? rawSegments[myIndex] ?? null : null;
  const liveElapsed = useLiveElapsed(segmentTiming?.startMs, isActive);

  useEffect(() => {
    if (isActive) setExpanded(true);
  }, [isActive]);

  let headerVerb: string;
  let headerSuffix: string | null = null;
  if (isActive) {
    headerVerb = "Working";
    if (liveElapsed) headerSuffix = `for ${liveElapsed}`;
  } else if (segmentTiming) {
    const durationMs = segmentTiming.endMs - segmentTiming.startMs;
    const durationText = formatDurationWords(durationMs);
    headerVerb = "Worked";
    if (durationText) headerSuffix = `for ${durationText}`;
  } else {
    headerVerb = "Worked";
  }

  const toolSummary = toolCountSummary(toolParts);
  const hasContent = allReasoningText.trim().length > 0 || toolParts.length > 0;

  return (
    <div>
      <Button
        type="button"
        variant="ghost"
        className="group h-auto w-full justify-start gap-2.5 px-1 py-2 text-left hover:bg-accent/5"
        onClick={() => hasContent && setExpanded((current) => !current)}
      >
        <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80">
          {agentIcon ? (
            <AgentIcon icon={agentIcon} className="h-4 w-4 shrink-0" />
          ) : isActive ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <span className="flex h-4 w-4 shrink-0 items-center justify-center">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/70" />
            </span>
          )}
          {isActive ? (
            <span className="shimmer-text">{headerVerb}</span>
          ) : (
            headerVerb
          )}
        </span>
        {headerSuffix ? (
          <span className="text-xs text-muted-foreground/60">{headerSuffix}</span>
        ) : null}
        {toolSummary ? (
          <span className="text-xs text-muted-foreground/40">· {toolSummary}</span>
        ) : null}
        {hasContent ? (
          <ChevronDown className={cn("ml-auto h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform", expanded && "rotate-180")} />
        ) : null}
      </Button>
      {expanded && hasContent ? (
        <div className="space-y-1 py-1">
          {isActive ? (
            <>
              {allReasoningText ? <IssueChatReasoningPart text={allReasoningText} /> : null}
              {toolParts.length > 0 ? <IssueChatRollingToolPart toolParts={toolParts} /> : null}
            </>
          ) : (
            <>
              {allReasoningText ? <IssueChatReasoningPart text={allReasoningText} /> : null}
              {toolParts.map((tool) => (
                <IssueChatToolPart
                  key={tool.toolCallId}
                  toolName={tool.toolName}
                  args={tool.args}
                  argsText={tool.argsText}
                  result={tool.result}
                  isError={false}
                />
              ))}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function IssueChatReasoningPart({ text }: { text: string }) {
  const lines = text.split("\n").filter((line) => line.trim());
  const lastLine = lines[lines.length - 1] ?? text.slice(-200);
  const prevRef = useRef(lastLine);
  const [ticker, setTicker] = useState<{
    key: number;
    current: string;
    exiting: string | null;
  }>({ key: 0, current: lastLine, exiting: null });

  useEffect(() => {
    if (lastLine !== prevRef.current) {
      const prev = prevRef.current;
      prevRef.current = lastLine;
      setTicker((current) => ({ key: current.key + 1, current: lastLine, exiting: prev }));
    }
  }, [lastLine]);

  return (
    <div className="flex gap-2 px-1">
      <div className="flex flex-col items-center pt-0.5">
        <Brain className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
      </div>
      <div className="relative h-5 min-w-0 flex-1 overflow-hidden">
        {ticker.exiting !== null && (
          <span
            key={`out-${ticker.key}`}
            className="cot-line-exit absolute inset-x-0 truncate text-sm italic leading-5 text-muted-foreground/70"
            onAnimationEnd={() => setTicker((current) => ({ ...current, exiting: null }))}
          >
            {ticker.exiting}
          </span>
        )}
        <span
          key={`in-${ticker.key}`}
          className={cn(
            "absolute inset-x-0 truncate text-sm italic leading-5 text-muted-foreground/70",
            ticker.key > 0 && "cot-line-enter",
          )}
        >
          {ticker.current}
        </span>
      </div>
    </div>
  );
}
