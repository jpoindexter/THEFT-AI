"use client";

import { Pause, Play, Square, RefreshCcw } from "lucide-react";
import { useState } from "react";
import { Pill } from "@/components/ui/primitives";
import { toast } from "@/components/toast-host";

type State = "idle" | "running" | "paused" | "error" | "terminated";

const NEXT: Record<State, State> = {
  idle: "running",
  running: "paused",
  paused: "running",
  error: "running",
  terminated: "idle",
};

const TONE: Record<State, "neutral" | "sage" | "mustard" | "brick"> = {
  idle: "neutral",
  running: "sage",
  paused: "mustard",
  error: "brick",
  terminated: "neutral",
};

export default function AgentControls({
  initial = "idle",
  agentName,
}: {
  initial?: State;
  agentName: string;
}) {
  const [state, setState] = useState<State>(initial);

  function toggle() {
    const next = NEXT[state];
    setState(next);
    toast(
      next === "running"
        ? `${agentName} resumed`
        : next === "paused"
          ? `${agentName} paused`
          : `${agentName} ${next}`,
      next === "running" ? "ok" : "info",
    );
  }

  function stop() {
    setState("terminated");
    toast(`${agentName} stopped`, "warn");
  }

  function reset() {
    setState("idle");
    toast(`${agentName} reset to idle`, "info");
  }

  const primaryLabel = state === "running" ? "Pause" : state === "paused" ? "Resume" : "Run";
  const PrimaryIcon = state === "running" ? Pause : Play;

  return (
    <div className="rounded-lg border border-line/70 bg-paper p-3 flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <Pill tone={TONE[state]}>{state}</Pill>
        <span className="text-ink-muted">{agentName}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={reset}
          title="Reset to idle"
          className="text-xs inline-flex items-center gap-1 rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
        >
          <RefreshCcw className="size-3" /> Reset
        </button>
        <button
          type="button"
          onClick={stop}
          title="Stop run"
          className="text-xs inline-flex items-center gap-1 rounded-md border border-brick/40 bg-brick/10 text-brick-ink px-2 py-1 hover:bg-brick/20"
        >
          <Square className="size-3" /> Stop
        </button>
        <button
          type="button"
          onClick={toggle}
          className="text-xs inline-flex items-center gap-1 rounded-md bg-ink text-paper px-3 py-1 hover:opacity-90"
        >
          <PrimaryIcon className="size-3" /> {primaryLabel}
        </button>
      </div>
    </div>
  );
}
