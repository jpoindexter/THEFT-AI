"use client";

import { useState } from "react";
import { ChevronRight, Cpu, Wrench, MessageCircle, Pause } from "lucide-react";
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
  turns = SAMPLE,
  status = "paused",
}: {
  turns?: Turn[];
  status?: "running" | "paused" | "done" | "error" | "idle";
}) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between">
          <Eyebrow className="inline-flex items-center gap-1.5">
            <Cpu className="size-3" /> Agent run
          </Eyebrow>
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
        <ol className="mt-3 space-y-2">
          {turns.map((t, i) => (
            <Row key={i} t={t} />
          ))}
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
          {isCall ? "called" : t.ok ? "ok" : "failed"}
        </span>
        <span className="ml-auto text-ink-soft">{t.ts}</span>
      </button>
      {open && (
        <pre className="mt-1 text-2xs font-mono whitespace-pre-wrap leading-relaxed bg-canvas border border-line/70 rounded-md p-2 text-ink">
          {JSON.stringify(isCall ? t.input : t.output, null, 2)}
        </pre>
      )}
    </li>
  );
}
