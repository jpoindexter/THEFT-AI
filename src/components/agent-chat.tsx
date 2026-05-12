"use client";

// Generic agent chat — renders whatever turns the agent emits.
// Replaces the hand-coded brief widget. The agent decides what to ask, what
// tools to call, what artifacts to produce.

import { Fragment, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, ChevronLeft, ArrowUp, Wrench, Maximize2 } from "lucide-react";
import SlashMenu from "@/components/slash-menu";

type Answer = { key?: string; label?: string; custom?: string };

type Turn =
  | { kind: "user_message"; text: string }
  | { kind: "text"; text: string }
  | { kind: "tool_call"; tool_use_id: string; name: string; input: unknown }
  | { kind: "tool_result"; tool_use_id: string; name: string; output: unknown }
  | { kind: "tool_answer"; tool_use_id: string; answer: Answer }
  | {
      kind: "pause";
      tool_use_id: string;
      tool: "ask_user_question";
      input: AskUserQuestionInput;
    }
  | { kind: "done" };

type AskUserQuestionInput = {
  question: string;
  options: {
    key: string;
    label: string;
    description?: string;
    recommended?: boolean;
  }[];
  allow_custom?: boolean;
};

type Paused = {
  tool_use_id: string;
  tool: "ask_user_question";
  input: AskUserQuestionInput;
} | null;

export default function AgentChat({
  organization,
  onboarding,
  emptyHeader,
  onFirstTurn,
}: {
  organization: { id: string; slug: string; name: string };
  onboarding?: boolean;
  emptyHeader?: React.ReactNode;
  onFirstTurn?: () => void;
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [paused, setPaused] = useState<Paused>(null);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const firstTurnFired = useRef(false);

  // load existing state on mount
  useEffect(() => {
    void fetch(`/api/${organization.slug}/agent/run`)
      .then((r) => r.json())
      .then((j: { turns?: Turn[]; paused?: Paused }) => {
        setTurns(j.turns ?? []);
        setPaused(j.paused ?? null);
        if ((j.turns ?? []).length > 0 && !firstTurnFired.current) {
          firstTurnFired.current = true;
          onFirstTurn?.();
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization.slug]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [turns]);

  async function kick() {
    setBusy(true);
    try {
      const r = await fetch(`/api/${organization.slug}/agent/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "kick" }),
      });
      const j = await r.json();
      if (j.turns) setTurns((prev) => [...prev, ...j.turns]);
      setPaused(j.paused ?? null);
    } finally {
      setBusy(false);
    }
  }

  async function send(text: string) {
    if (!text.trim() || busy) return;
    setBusy(true);
    setInput("");
    if (!firstTurnFired.current) {
      firstTurnFired.current = true;
      onFirstTurn?.();
    }
    setTurns((p) => [...p, { kind: "user_message", text }]);
    try {
      const r = await fetch(`/api/${organization.slug}/agent/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "user_message", text }),
      });
      const j = await r.json();
      if (j.turns) setTurns((p) => [...p, ...j.turns]);
      setPaused(j.paused ?? null);
    } finally {
      setBusy(false);
    }
  }

  function goBack() {
    let lastAnswerIdx = -1;
    for (let i = turns.length - 1; i >= 0; i--) {
      if (turns[i].kind === "tool_answer") { lastAnswerIdx = i; break; }
    }
    if (lastAnswerIdx < 0) return;
    const trimmed = turns.slice(0, lastAnswerIdx);
    let prevPause: typeof paused = null;
    for (let i = trimmed.length - 1; i >= 0; i--) {
      const t = trimmed[i];
      if (t.kind === "pause") { prevPause = t; break; }
    }
    setTurns(trimmed);
    setPaused(prevPause);
  }

  async function answer(a: Answer) {
    if (!paused || busy) return;
    setBusy(true);
    setTurns((p) => [
      ...p,
      { kind: "tool_answer", tool_use_id: paused.tool_use_id, answer: a },
    ]);
    setPaused(null);
    try {
      const r = await fetch(`/api/${organization.slug}/agent/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "tool_result",
          tool_use_id: paused.tool_use_id,
          answer: a,
        }),
      });
      const j = await r.json();
      if (j.turns) setTurns((p) => [...p, ...j.turns]);
      setPaused(j.paused ?? null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {turns.length === 0 && !busy && emptyHeader}
        {(() => {
          const pauseTurns = turns.filter((t) => t.kind === "pause");
          const total = pauseTurns.length || undefined;
          return turns.map((t, i) => {
            // Business plan tool call: render answered-questions summary + plan card
            if (t.kind === "tool_call" && t.name === "set_business_plan") {
              const prevPauses = turns.slice(0, i).filter((x): x is Extract<Turn, { kind: "pause" }> => x.kind === "pause");
              const prevAnswers = turns.slice(0, i).filter((x): x is Extract<Turn, { kind: "tool_answer" }> => x.kind === "tool_answer");
              return (
                <Fragment key={i}>
                  {prevPauses.length > 0 && (
                    <AgentAnsweredCard pauses={prevPauses} answers={prevAnswers} />
                  )}
                  <AgentBusinessPlanCard
                    plan={t.input as Record<string, unknown>}
                    orgName={organization.name}
                    orgSlug={organization.slug}
                  />
                </Fragment>
              );
            }
            // Skip tool_result for set_business_plan (shown above) and complete_onboarding
            if (t.kind === "tool_result" && (t.name === "set_business_plan" || t.name === "complete_onboarding")) {
              return null;
            }
            // Skip tool_call for complete_onboarding
            if (t.kind === "tool_call" && t.name === "complete_onboarding") {
              return null;
            }
            const pauseIdx = t.kind === "pause"
              ? pauseTurns.findIndex((p) => (p as typeof t).kind === "pause" && turns.indexOf(p as Turn) === i)
              : -1;
            const step = pauseIdx >= 0 ? pauseIdx + 1 : undefined;
            return (
              <Turn
                key={i}
                t={t}
                paused={paused}
                answering={busy}
                step={step}
                total={total}
                onAnswer={answer}
                onBack={goBack}
                onDecideThis={() => void send("Decide this one for me")}
                onDecideAll={() => void send("Decide all remaining questions for me")}
              />
            );
          });
        })()}
        {busy && (
          <div className="text-xs text-ink-soft inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-mustard animate-pulse" />
            Cofounder is thinking…
          </div>
        )}
      </div>
      <div className="border-t border-line/80 p-2.5">
        <div className="rounded-lg border border-line/80 bg-paper focus-within:border-line-strong transition-colors flex items-end gap-1 relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            placeholder={
              paused
                ? 'Or type a freeform answer… ("/" for commands)'
                : onboarding && !turns.some((t) => t.kind === "user_message")
                  ? "Share what you're building…"
                  : onboarding
                    ? "Ask for follow up changes…"
                    : 'Ask Cofounder anything… ("/" for commands)'
            }
            rows={2}
            className="flex-1 resize-none bg-transparent px-3 py-2 text-base focus:outline-none placeholder:text-ink-soft"
          />
          {input.startsWith("/") && !input.includes(" ") && (
            <SlashMenu
              q={input.slice(1)}
              onPick={(cmd) => setInput(cmd.label + " ")}
              onClose={() => setInput(input.replace(/^\//, ""))}
            />
          )}
          <button
            type="button"
            onClick={() => void send(input)}
            disabled={busy || !input.trim()}
            aria-label="Send"
            className="size-6 mb-1.5 mr-1.5 rounded-md bg-line text-ink-muted inline-flex items-center justify-center disabled:opacity-50 hover:bg-line"
          >
            <ArrowUp className="size-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}

function Turn({
  t,
  paused,
  answering,
  step,
  total,
  onAnswer,
  onBack,
  onDecideThis,
  onDecideAll,
}: {
  t: Turn;
  paused: Paused;
  answering: boolean;
  step?: number;
  total?: number;
  onAnswer: (a: Answer) => void;
  onBack?: () => void;
  onDecideThis?: () => void;
  onDecideAll?: () => void;
}) {
  if (t.kind === "user_message") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-lg bg-cream px-3 py-1.5 text-base text-ink">
          {t.text}
        </div>
      </div>
    );
  }
  if (t.kind === "text") {
    return (
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 text-xs text-ink-muted bg-mustard/30 px-1.5 py-0.5 rounded-sm">
          <span className="size-3 rounded-full  bg-mustard/30 inline-block" />
          Cofounder
        </div>
        <div className="text-base leading-relaxed text-ink bg-mustard/30 px-1 py-0.5 rounded-sm whitespace-pre-wrap">
          {t.text}
        </div>
      </div>
    );
  }
  if (t.kind === "tool_call") {
    if (t.name === "ask_user_question") {
      // pause render handled below — skip the call card here
      return null;
    }
    return <ToolCallCard name={t.name} input={t.input} />;
  }
  if (t.kind === "tool_result") {
    return null; // results inline with tool_call card
  }
  if (t.kind === "tool_answer") {
    return (
      <div className="text-xs text-ink-muted inline-block bg-cream rounded-sm px-1.5 py-0.5">
        {t.answer.label ?? t.answer.custom ?? t.answer.key}
      </div>
    );
  }
  if (t.kind === "pause") {
    // Only render pause UI for the CURRENT pause
    if (paused?.tool_use_id !== t.tool_use_id) return null;
    return (
      <AskUserQuestion
        input={t.input}
        disabled={answering}
        step={step}
        total={total}
        onAnswer={onAnswer}
        onBack={onBack}
        onDecideThis={onDecideThis}
        onDecideAll={onDecideAll}
      />
    );
  }
  return null;
}

function ToolCallCard({ name, input }: { name: string; input: unknown }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border border-line/80 bg-paper text-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-2.5 py-1.5 hover:bg-canvas"
      >
        <span className="inline-flex items-center gap-1.5 text-ink">
          <Wrench className="size-3 text-ink-soft" />
          <span className="font-mono text-xs">{name}</span>
        </span>
        {open ? (
          <ChevronDown className="size-3 text-ink-soft" />
        ) : (
          <ChevronRight className="size-3 text-ink-soft" />
        )}
      </button>
      {open && (
        <pre className="border-t border-line/70 p-2 text-2xs font-mono text-ink-muted bg-canvas rounded-b-md whitespace-pre-wrap">
          {JSON.stringify(input, null, 2)}
        </pre>
      )}
    </div>
  );
}

function AskUserQuestion({
  input,
  disabled,
  step,
  total,
  onAnswer,
  onBack,
  onDecideThis,
  onDecideAll,
}: {
  input: AskUserQuestionInput;
  disabled: boolean;
  step?: number;
  total?: number;
  onAnswer: (a: Answer) => void;
  onBack?: () => void;
  onDecideThis?: () => void;
  onDecideAll?: () => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [custom, setCustom] = useState("");
  const isLast = step !== undefined && total !== undefined && step >= total;

  return (
    <div className="rounded-lg border border-line/80 bg-paper">
      <div className="px-3 py-1.5 border-b border-line/70 flex items-center justify-between">
        <div className="inline-flex items-center gap-1 text-xs text-ink-muted">
          {step !== undefined && step > 1 && onBack && (
            <button
              type="button"
              onClick={onBack}
              disabled={disabled}
              className="hover:text-ink disabled:opacity-40"
              aria-label="Previous question"
            >
              <ChevronLeft className="size-3" />
            </button>
          )}
          {step !== undefined && total !== undefined && (
            <span className="font-mono">{step}/{total}</span>
          )}
          <ChevronRight className="size-3 text-ink-soft" />
        </div>
      </div>
      <div className="p-3 space-y-3">
        <p className="text-base text-ink leading-snug font-medium">
          {input.question}
        </p>
        <div className="space-y-1">
          {input.options.map((o) => {
            const selected = picked === o.key;
            return (
              <button
                key={o.key}
                onClick={() => { setPicked(o.key); setCustom(""); }}
                disabled={disabled}
                className={`w-full text-left rounded-md px-2.5 py-2 transition-colors disabled:opacity-50 ${
                  selected ? "bg-cream border border-line" : "hover:bg-canvas border border-transparent"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-medium text-ink">{o.label}</div>
                  {o.recommended && (
                    <span className="text-2xs text-mustard-ink bg-mustard/30 px-1.5 py-0.5 rounded-sm shrink-0">
                      Recommended
                    </span>
                  )}
                </div>
                {o.description && (
                  <p className="text-xs text-ink-muted mt-0.5 leading-snug">{o.description}</p>
                )}
              </button>
            );
          })}
        </div>
        {input.allow_custom !== false && (
          <input
            value={custom}
            onChange={(e) => { setCustom(e.target.value); setPicked(null); }}
            disabled={disabled}
            placeholder="Something else"
            className="w-full text-sm border-b border-line bg-transparent px-1 py-1 focus:outline-none focus:border-line-strong placeholder:text-ink-soft"
          />
        )}
      </div>
      <div className="flex items-center justify-between gap-1.5 border-t border-line/70 px-3 py-2">
        <div className="flex items-center gap-1.5">
          {onDecideAll && (
            <button
              type="button"
              disabled={disabled}
              onClick={onDecideAll}
              className="text-xs text-ink-muted hover:text-ink border border-line rounded-md px-2.5 py-1 disabled:opacity-40"
            >
              Decide all
            </button>
          )}
          {onDecideThis && (
            <button
              type="button"
              disabled={disabled}
              onClick={onDecideThis}
              className="text-xs text-ink-muted hover:text-ink border border-line rounded-md px-2.5 py-1 disabled:opacity-40"
            >
              Decide this one
            </button>
          )}
        </div>
        {isLast && (
          <button
            type="button"
            disabled={disabled || (!picked && !custom.trim())}
            onClick={() => {
              if (custom.trim()) onAnswer({ custom: custom.trim() });
              else if (picked) onAnswer({ key: picked, label: input.options.find((x) => x.key === picked)?.label });
            }}
            className="text-xs rounded-md bg-ink text-paper px-3 py-1 hover:opacity-90 disabled:opacity-40"
          >
            Submit
          </button>
        )}
        {!isLast && (
          <button
            type="button"
            disabled={disabled || (!picked && !custom.trim())}
            onClick={() => {
              if (custom.trim()) onAnswer({ custom: custom.trim() });
              else if (picked) onAnswer({ key: picked, label: input.options.find((x) => x.key === picked)?.label });
            }}
            className="text-xs rounded-md border border-line bg-paper px-2.5 py-1 hover:border-line-strong disabled:opacity-40"
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}

function AgentAnsweredCard({
  pauses,
  answers,
}: {
  pauses: Extract<Turn, { kind: "pause" }>[];
  answers: Extract<Turn, { kind: "tool_answer" }>[];
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  return (
    <div className="space-y-2">
      <div className="text-xs text-ink-muted inline-flex items-center gap-1">
        <span aria-hidden>↳</span> Running Tool: Ask User Question
      </div>
      <div className="rounded-lg border border-line/80 bg-paper p-3 space-y-2.5">
        <div>
          <div className="text-sm font-medium text-ink">Answered questions</div>
          <div className="text-xs text-ink-muted">You chose</div>
        </div>
        {pauses.map((pause) => {
          const ans = answers.find((a) => a.tool_use_id === pause.tool_use_id);
          if (!ans) return null;
          const label = ans.answer.label ?? ans.answer.custom ?? ans.answer.key;
          const isOpen = open[pause.tool_use_id] !== false;
          return (
            <div key={pause.tool_use_id} className="border-t border-line/60 pt-2 first:border-0 first:pt-0">
              <button
                type="button"
                onClick={() => setOpen((s) => ({ ...s, [pause.tool_use_id]: !isOpen }))}
                className="w-full flex items-start justify-between gap-2 text-left"
              >
                <span className="text-sm text-ink leading-snug">{pause.input.question}</span>
                <span className="inline-flex items-center gap-1 text-2xs text-ink-muted shrink-0">
                  <span className="rounded bg-cream px-1.5 py-0.5">Answered</span>
                  <ChevronDown className={`size-3 transition-transform ${isOpen ? "" : "-rotate-90"}`} />
                </span>
              </button>
              {isOpen && (
                <div className="mt-1.5 inline-block bg-cream rounded-sm px-1.5 py-0.5 text-xs text-ink">
                  {label}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AgentBusinessPlanCard({
  plan,
  orgName,
  orgSlug,
}: {
  plan: Record<string, unknown>;
  orgName: string;
  orgSlug: string;
}) {
  const [activating, setActivating] = useState(false);

  const KNOWN: { key: string; label: string }[] = [
    { key: "product", label: "Product or Service" },
    { key: "icp", label: "ICP" },
    { key: "mission", label: "Mission" },
    { key: "business_model", label: "Business Model" },
    { key: "differentiator", label: "Key Differentiator" },
    { key: "go_to_market", label: "Go-To-Market Strategy" },
  ];

  const sections: { label: string; body: string | string[] }[] = [];
  const knownKeys = new Set(KNOWN.map((k) => k.key));

  for (const { key, label } of KNOWN) {
    const v = plan[key];
    if (!v) continue;
    if (typeof v === "string" && v.trim()) sections.push({ label, body: v.trim() });
    else if (Array.isArray(v) && v.length > 0) sections.push({ label, body: v.map(String) });
  }
  // Render any extra array/string fields the agent may have added
  for (const [key, v] of Object.entries(plan)) {
    if (knownKeys.has(key)) continue;
    const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    if (typeof v === "string" && v.trim()) sections.push({ label, body: v.trim() });
    else if (Array.isArray(v) && v.length > 0) sections.push({ label, body: v.map(String) });
  }

  return (
    <div className="rounded-lg border border-line/70 bg-paper overflow-hidden">
      <div className="px-3 py-2.5 border-b border-line/70 flex items-center gap-2">
        <div className="size-5 rounded-sm bg-canvas border border-line/70 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 16 16" className="size-3 text-ink-muted" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 2h7l3 3v9H3z" /><path d="M10 2v3h3" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-ink">Business Plan</div>
          <div className="text-2xs text-ink-muted truncate">{orgName} · {orgSlug}</div>
        </div>
        <button type="button" className="text-2xs text-ink-muted border border-line/70 rounded px-2 py-0.5 hover:border-line-strong shrink-0">
          Edit
        </button>
        <button type="button" className="size-5 flex items-center justify-center text-ink-soft hover:text-ink shrink-0">
          <Maximize2 className="size-3" />
        </button>
      </div>
      <div className="p-3 space-y-3 max-h-72 overflow-y-auto">
        {sections.map((s) => (
          <div key={s.label}>
            <span className="inline-block text-2xs uppercase tracking-wider px-1.5 py-0.5 rounded bg-sage/15 text-ink mb-1.5">
              {s.label}
            </span>
            {Array.isArray(s.body) ? (
              <ul className="space-y-0.5">
                {s.body.map((item, idx) => (
                  <li key={idx} className="text-xs text-ink flex items-start gap-1.5">
                    <span className="mt-1 text-ink-soft shrink-0">•</span>
                    <span className="leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-ink leading-snug">{s.body}</p>
            )}
          </div>
        ))}
      </div>
      <div className="border-t border-line/70 p-3">
        <button
          type="button"
          disabled={activating}
          onClick={() => {
            setActivating(true);
            window.location.reload();
          }}
          className="w-full rounded-md bg-ink text-paper text-sm py-2 hover:bg-ink/80 disabled:opacity-60"
        >
          {activating ? "Activating departments…" : "Accept & activate departments"}
        </button>
      </div>
    </div>
  );
}
