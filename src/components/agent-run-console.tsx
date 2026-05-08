"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, Cpu, Wrench, MessageCircle, Pause, Play, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardBody,
  Eyebrow,
  Pill,
} from "@/components/ui/primitives";

type Turn =
  | { kind: "user_message"; text: string; ts: string }
  | { kind: "text"; text: string; ts: string }
  | { kind: "tool_call"; tool: string; input: unknown; ts: string }
  | { kind: "tool_result"; tool: string; output: unknown; ok: boolean; ts: string }
  | { kind: "pause"; reason: string; ts: string }
  | { kind: "done"; summary: string; ts: string };

type RawTurn =
  | { kind: "user_message"; text: string }
  | { kind: "text"; text: string }
  | { kind: "tool_call"; tool_use_id: string; name: string; input: unknown }
  | { kind: "tool_result"; tool_use_id: string; name: string; output: unknown }
  | { kind: "tool_answer"; tool_use_id: string; answer: unknown }
  | { kind: "pause"; tool_use_id: string; tool: string; input: { question?: string } }
  | { kind: "done" };

function adaptTurn(t: RawTurn): Turn | null {
  const ts = new Date().toLocaleTimeString("en", { timeStyle: "medium" });
  switch (t.kind) {
    case "user_message": return { kind: "user_message", text: t.text, ts };
    case "text": return { kind: "text", text: t.text, ts };
    case "tool_call": return { kind: "tool_call", tool: t.name, input: t.input, ts };
    case "tool_result": return { kind: "tool_result", tool: t.name, output: t.output, ok: true, ts };
    case "pause": return { kind: "pause", reason: t.input.question ?? "Waiting for input", ts };
    case "done": return { kind: "done", summary: "Task complete.", ts };
    case "tool_answer": return null;
  }
}

const SAMPLE: Turn[] = [
  {
    kind: "user_message",
    text: "Add a Stripe checkout flow for the new pricing page.",
    ts: "12:42:01",
  },
  { kind: "text", text: "Reading repo for existing payment paths…", ts: "12:42:03" },
  {
    kind: "tool_call",
    tool: "search_repo",
    input: { q: "stripe" },
    ts: "12:42:04",
  },
  {
    kind: "tool_result",
    tool: "search_repo",
    output: { hits: 0 },
    ok: true,
    ts: "12:42:06",
  },
  {
    kind: "text",
    text: "No prior Stripe wiring. I'll add /api/stripe/checkout, a webhook route, and update the pricing page.",
    ts: "12:42:08",
  },
  {
    kind: "tool_call",
    tool: "open_pull_request",
    input: { branch: "feat/stripe-checkout", title: "Stripe checkout for pricing" },
    ts: "12:42:31",
  },
  {
    kind: "pause",
    reason: "Approval required: Stripe live keys not yet present in Settings > Stripe.",
    ts: "12:42:33",
  },
];

export default function AgentRunConsole({
  turns: propTurns,
  status: propStatus,
  taskId,
  orgSlug,
  noCard,
}: {
  turns?: Turn[];
  status?: "running" | "paused" | "done" | "error" | "idle";
  taskId?: string;
  orgSlug?: string;
  noCard?: boolean;
}) {
  const isLive = Boolean(taskId && orgSlug);
  const [liveTurns, setLiveTurns] = useState<Turn[]>([]);
  const [liveStatus, setLiveStatus] = useState<"idle" | "running" | "paused" | "done" | "error">("idle");
  const startedRef = useRef(false);

  const turns = isLive ? liveTurns : (propTurns ?? SAMPLE);
  const status = isLive ? liveStatus : (propStatus ?? "paused");

  useEffect(() => {
    if (!isLive || startedRef.current) return;
    startedRef.current = true;

    fetch(`/api/${orgSlug}/tasks/${taskId}/run`)
      .then((r) => r.json())
      .then((d: { turns?: RawTurn[]; paused?: unknown }) => {
        if (d.turns?.length) {
          const adapted = d.turns.flatMap((t) => {
            const a = adaptTurn(t);
            return a ? [a] : [];
          });
          setLiveTurns(adapted);
          setLiveStatus(d.paused ? "paused" : "done");
        }
        // No existing turns → show empty state; user clicks "Run agent" to start
      })
      .catch(() => { /* keep idle */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startRun() {
    if (!taskId || !orgSlug) return;
    setLiveStatus("running");
    let res: Response;
    try {
      res = await fetch(`/api/${orgSlug}/tasks/${taskId}/run`, { method: "POST" });
    } catch {
      setLiveStatus("error");
      return;
    }
    if (!res.body) { setLiveStatus("error"); return; }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let finalStatus: "done" | "paused" | "error" = "done";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const raw = JSON.parse(line) as RawTurn;
          const adapted = adaptTurn(raw);
          if (adapted) setLiveTurns((prev) => [...prev, adapted]);
          if (raw.kind === "done") finalStatus = "done";
          if (raw.kind === "pause") finalStatus = "paused";
        } catch { /* skip malformed line */ }
      }
    }
    setLiveStatus(finalStatus);
  }

  // Inline empty state (used when noCard=true and no content yet)
  const isEmpty = turns.length === 0 && status !== "running";

  if (noCard) {
    if (isEmpty) {
      return (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <CheckCircle2 className="size-8 text-line-strong" />
          <div>
            <div className="text-base font-medium text-ink">No workflow items</div>
            <p className="text-xs text-ink-muted mt-1 max-w-xs">
              This workflow has no pending approvals or generated artifacts right now.
            </p>
          </div>
          {isLive && (
            <button
              type="button"
              onClick={() => void startRun()}
              className="inline-flex items-center gap-1 text-2xs rounded-md bg-ink text-paper px-2.5 py-1.5"
            >
              <Play className="size-2.5" /> Run agent
            </button>
          )}
        </div>
      );
    }
    return (
      <ol className="space-y-2">
        {turns.map((t, i) => (
          <Row key={i} t={t} />
        ))}
        {status === "running" && (
          <li className="text-2xs text-ink-soft animate-pulse">Agent is thinking…</li>
        )}
      </ol>
    );
  }

  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between">
          <Eyebrow className="inline-flex items-center gap-1.5">
            <Cpu className="size-3" /> Agent run
          </Eyebrow>
          <div className="flex items-center gap-2">
            {isLive && liveStatus === "idle" && (
              <button
                type="button"
                onClick={() => void startRun()}
                className="inline-flex items-center gap-1 text-2xs rounded-md bg-ink text-paper px-2 py-1"
              >
                <Play className="size-2.5" /> Run
              </button>
            )}
            <Pill
              tone={
                status === "running"
                  ? "sage"
                  : status === "paused"
                    ? "mustard"
                    : status === "error"
                      ? "brick"
                      : "neutral"
              }
            >
              {status}
            </Pill>
          </div>
        </div>
        <ol className="mt-3 space-y-2">
          {turns.map((t, i) => (
            <Row key={i} t={t} />
          ))}
          {status === "running" && (
            <li className="text-2xs text-ink-soft animate-pulse">Agent is thinking…</li>
          )}
        </ol>
      </CardBody>
    </Card>
  );
}

function Row({ t }: { t: Turn }) {
  if (t.kind === "user_message") {
    return (
      <li className="text-sm">
        <Eyebrow className="inline-flex items-center gap-1">
          <MessageCircle className="size-3" /> You · {t.ts}
        </Eyebrow>
        <p className="mt-1 text-ink">{t.text}</p>
      </li>
    );
  }
  if (t.kind === "text") {
    return (
      <li className="text-sm">
        <Eyebrow>Agent · {t.ts}</Eyebrow>
        <p className="mt-1 text-ink">{t.text}</p>
      </li>
    );
  }
  if (t.kind === "tool_call" || t.kind === "tool_result") {
    return <ToolRow t={t} />;
  }
  if (t.kind === "pause") {
    return (
      <li className="rounded-md border border-mustard/40 bg-mustard/15 px-3 py-2 text-sm">
        <Eyebrow className="inline-flex items-center gap-1 text-mustard-ink">
          <Pause className="size-3" /> Paused · {t.ts}
        </Eyebrow>
        <p className="mt-1 text-ink">{t.reason}</p>
      </li>
    );
  }
  return (
    <li className="rounded-md border border-sage/40 bg-sage/15 px-3 py-2 text-sm">
      <Eyebrow className="text-sage-ink">Done · {t.ts}</Eyebrow>
      <p className="mt-1 text-ink">{t.summary}</p>
    </li>
  );
}

function ToolRow({
  t,
}: {
  t: Extract<Turn, { kind: "tool_call" | "tool_result" }>;
}) {
  const [open, setOpen] = useState(false);
  const isCall = t.kind === "tool_call";
  return (
    <li className="text-xs">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left flex items-center gap-2 rounded-md border border-line/70 bg-canvas px-2.5 py-1.5 hover:border-line-strong"
      >
        <ChevronRight
          className={`size-3 text-ink-soft transition-transform ${open ? "rotate-90" : ""}`}
        />
        <Wrench className="size-3 text-ink-muted" />
        <span className="font-mono text-ink">{t.tool}</span>
        <span className="text-ink-soft">·</span>
        <span className="text-ink-muted">
          {isCall ? "called" : (t as Extract<Turn, { kind: "tool_result" }>).ok ? "ok" : "failed"}
        </span>
        <span className="ml-auto text-ink-soft">{t.ts}</span>
      </button>
      {open && (
        <pre className="mt-1 text-2xs font-mono whitespace-pre-wrap leading-relaxed bg-canvas border border-line/70 rounded-md p-2 text-ink">
          {JSON.stringify(isCall ? (t as Extract<Turn, { kind: "tool_call" }>).input : (t as Extract<Turn, { kind: "tool_result" }>).output, null, 2)}
        </pre>
      )}
    </li>
  );
}
