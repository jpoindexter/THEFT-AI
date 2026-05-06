"use client";

// Generic agent chat — renders whatever turns the agent emits.
// Replaces the hand-coded brief widget. The agent decides what to ask, what
// tools to call, what artifacts to produce.

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, ArrowUp, Wrench } from "lucide-react";

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
}: {
  organization: { id: string; slug: string };
  onboarding?: boolean;
  emptyHeader?: React.ReactNode;
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [paused, setPaused] = useState<Paused>(null);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // load existing state on mount
  useEffect(() => {
    void fetch(`/api/${organization.slug}/agent/run`)
      .then((r) => r.json())
      .then((j: { turns?: Turn[]; paused?: Paused }) => {
        setTurns(j.turns ?? []);
        setPaused(j.paused ?? null);
        // if onboarding and no turns yet, kick the agent off
        if (onboarding && (!j.turns || j.turns.length === 0)) {
          void kick();
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
        {turns.map((t, i) => (
          <Turn
            key={i}
            t={t}
            paused={paused}
            answering={busy}
            onAnswer={answer}
          />
        ))}
        {busy && (
          <div className="text-[11px] text-stone-400 inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-300 animate-pulse" />
            Cofounder is thinking…
          </div>
        )}
      </div>
      <div className="border-t border-stone-200/80 p-2.5">
        <div className="rounded-lg border border-stone-200/80 bg-white focus-within:border-stone-400 transition-colors flex items-end gap-1">
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
                ? "Or type a freeform answer…"
                : "Ask Cofounder anything about your company…"
            }
            rows={2}
            className="flex-1 resize-none bg-transparent px-3 py-2 text-[13px] focus:outline-none placeholder:text-stone-400"
          />
          <button
            type="button"
            onClick={() => void send(input)}
            disabled={busy || !input.trim()}
            aria-label="Send"
            className="size-6 mb-1.5 mr-1.5 rounded-md bg-stone-200 text-stone-500 inline-flex items-center justify-center disabled:opacity-50 hover:bg-stone-300"
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
  onAnswer,
}: {
  t: Turn;
  paused: Paused;
  answering: boolean;
  onAnswer: (a: Answer) => void;
}) {
  if (t.kind === "user_message") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-lg bg-stone-100 px-3 py-1.5 text-[13px] text-stone-900">
          {t.text}
        </div>
      </div>
    );
  }
  if (t.kind === "text") {
    return (
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 text-[11px] text-stone-600 bg-amber-100/40 px-1.5 py-0.5 rounded-sm">
          <span className="size-3 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 inline-block" />
          Cofounder
        </div>
        <div className="text-[13px] leading-relaxed text-stone-800 bg-amber-100/40 px-1 py-0.5 rounded-sm whitespace-pre-wrap">
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
      <div className="text-[11px] text-stone-500 inline-block bg-stone-100 rounded-sm px-1.5 py-0.5">
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
        onAnswer={onAnswer}
      />
    );
  }
  return null;
}

function ToolCallCard({ name, input }: { name: string; input: unknown }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border border-stone-200/80 bg-white text-[12px]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-2.5 py-1.5 hover:bg-stone-50"
      >
        <span className="inline-flex items-center gap-1.5 text-stone-700">
          <Wrench className="size-3 text-stone-400" />
          <span className="font-mono text-[11px]">{name}</span>
        </span>
        {open ? (
          <ChevronDown className="size-3 text-stone-400" />
        ) : (
          <ChevronRight className="size-3 text-stone-400" />
        )}
      </button>
      {open && (
        <pre className="border-t border-stone-200/70 p-2 text-[10px] font-mono text-stone-600 bg-stone-50 rounded-b-md whitespace-pre-wrap">
          {JSON.stringify(input, null, 2)}
        </pre>
      )}
    </div>
  );
}

function AskUserQuestion({
  input,
  disabled,
  onAnswer,
}: {
  input: AskUserQuestionInput;
  disabled: boolean;
  onAnswer: (a: Answer) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [custom, setCustom] = useState("");

  return (
    <div className="rounded-lg border border-stone-200/80 bg-white">
      <div className="px-3 py-1.5 text-[11px] text-stone-500 border-b border-stone-200/70 inline-flex items-center gap-1">
        Cofounder is asking
      </div>
      <div className="p-3 space-y-3">
        <p className="text-[13px] text-stone-900 leading-snug">
          {input.question}
        </p>
        <div className="space-y-1">
          {input.options.map((o) => {
            const selected = picked === o.key;
            return (
              <button
                key={o.key}
                onClick={() => {
                  setPicked(o.key);
                  setCustom("");
                }}
                disabled={disabled}
                className={`w-full text-left rounded-md px-2.5 py-2 transition-colors disabled:opacity-50 ${
                  selected ? "bg-stone-100" : "hover:bg-stone-50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[12px] font-medium text-stone-900">
                    {o.label}
                  </div>
                  {o.recommended && (
                    <span className="text-[9px] text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded-sm">
                      Recommended
                    </span>
                  )}
                </div>
                {o.description && (
                  <p className="text-[11px] text-stone-500 mt-1 leading-snug">
                    {o.description}
                  </p>
                )}
              </button>
            );
          })}
        </div>
        {input.allow_custom && (
          <input
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value);
              setPicked(null);
            }}
            disabled={disabled}
            placeholder="Something else…"
            className="w-full text-[12px] border-b border-stone-200 bg-transparent px-1 py-1 focus:outline-none focus:border-stone-400"
          />
        )}
      </div>
      <div className="flex items-center justify-end gap-1.5 border-t border-stone-200/70 p-2">
        <button
          type="button"
          disabled={disabled || (!picked && !custom.trim())}
          onClick={() => {
            if (custom.trim()) {
              onAnswer({ custom: custom.trim() });
            } else if (picked) {
              const o = input.options.find((x) => x.key === picked);
              onAnswer({ key: picked, label: o?.label });
            }
          }}
          className="text-[11px] rounded-md bg-stone-900 text-white px-2.5 py-1 hover:bg-stone-800 disabled:opacity-40"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
