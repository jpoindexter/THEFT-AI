"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, ChevronDown, X } from "lucide-react";
import { QUESTIONS, type BriefAnswer } from "@/lib/business-brief/questions";

type Msg = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  created_at: string;
};

type BriefPlan = {
  product_or_service?: string;
  icp?: string;
  mission?: string;
  key_features?: string[];
  pricing_thesis?: string;
  go_to_market_thesis?: string;
} & Record<string, unknown>;

export default function CofounderChat({
  organization,
  showBrief = false,
  onboarding = false,
}: {
  organization: { id: string; slug: string };
  showBrief?: boolean;
  onboarding?: boolean;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [briefStarted, setBriefStarted] = useState(false);
  const [briefQuestions, setBriefQuestions] = useState<typeof QUESTIONS | null>(
    null,
  );
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefAnswers, setBriefAnswers] = useState<BriefAnswer[]>([]);
  const [briefStep, setBriefStep] = useState(0);
  const [briefDone, setBriefDone] = useState(false);
  const [briefPlan, setBriefPlan] = useState<BriefPlan | null>(null);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [activating, setActivating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void fetch(`/api/${organization.slug}/cofounder/messages`)
      .then((r) => r.json())
      .then((j) => setMessages(j.messages ?? []));
  }, [organization.slug]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, briefStep, briefDone, actionsOpen]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setBusy(true);
    setMessages((m) => [
      ...m,
      {
        id: crypto.randomUUID(),
        role: "user",
        text,
        created_at: new Date().toISOString(),
      },
    ]);
    try {
      const res = await fetch(`/api/${organization.slug}/cofounder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const j = await res.json();
      if (j.reply) {
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: j.reply,
            created_at: new Date().toISOString(),
          },
        ]);
      }
      // If we're in onboarding mode and user just gave the idea description,
      // generate dynamic brief questions tailored to their business.
      if (showBrief && !briefStarted) {
        setBriefStarted(true);
        setBriefLoading(true);
        try {
          const r = await fetch(
            `/api/${organization.slug}/brief/generate`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idea: text }),
            },
          );
          if (r.ok) {
            const j = await r.json();
            setBriefQuestions(j.questions);
          } else {
            // fall back to static questions
            setBriefQuestions(QUESTIONS);
          }
        } catch {
          setBriefQuestions(QUESTIONS);
        } finally {
          setBriefLoading(false);
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function submitBrief() {
    setBusy(true);
    setActionsOpen(false);
    try {
      const idea = messages.find((m) => m.role === "user")?.text;
      const res = await fetch(`/api/${organization.slug}/brief`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: briefAnswers, idea }),
      });
      const j = await res.json();
      setBriefPlan(j.plan ?? {});
      setBriefDone(true);
    } finally {
      setBusy(false);
    }
  }

  async function activateDepartments() {
    setActivating(true);
    try {
      // Reload to pick up business_plan presence and re-render workspace.
      // The brief route already updated org.business_plan.
      window.location.reload();
    } catch {
      setActivating(false);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {isEmpty && onboarding && (
          <div className="flex flex-col items-center text-center gap-3 pt-4 pb-2">
            <div className="size-8 rounded-full bg-mustard/30" />
            <p className="text-sm text-ink tracking-tight">
              Tell me more about your company
            </p>
            <p className="text-xs text-ink-muted max-w-[260px] leading-snug">
              Answer the brief below or share what you&apos;re building in the chat.
            </p>
          </div>
        )}
        {isEmpty && !onboarding && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 px-6">
            <div className="size-10 rounded-full  bg-mustard/30" />
            <p className="text-base text-ink-muted leading-snug">
              Ask Cofounder anything about{" "}
              <span className="text-ink">{organization.slug}</span>.
            </p>
          </div>
        )}

        {messages.map((m) => (
          <Message key={m.id} m={m} />
        ))}

        {/* Inline brief widget — appears after user sends first message in onboarding */}
        {showBrief && briefStarted && !briefDone && briefLoading && (
          <div className="rounded-lg border border-line/80 bg-paper p-4 text-sm text-ink-muted inline-flex items-center gap-2">
            <span className="size-2 rounded-full bg-mustard animate-pulse" />
            Cofounder is building a brief from your idea…
          </div>
        )}
        {showBrief && briefStarted && !briefDone && !briefLoading && (
          <BriefWidget
            questions={briefQuestions ?? QUESTIONS}
            step={briefStep}
            setStep={setBriefStep}
            answers={briefAnswers}
            setAnswers={setBriefAnswers}
            onSubmit={submitBrief}
            submitting={busy}
            actionsOpen={actionsOpen}
            setActionsOpen={setActionsOpen}
          />
        )}

        {/* Once brief is done: show answered questions, ran-actions, summary */}
        {showBrief && briefDone && briefPlan && (
          <>
            <AnsweredQuestionsCard
              questions={briefQuestions ?? QUESTIONS}
              answers={briefAnswers}
            />
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setActionsOpen((o) => !o)}
                className="text-xs text-ink-muted inline-flex items-center gap-1 hover:text-ink"
              >
                <ChevronDown
                  className={`size-3 transition-transform ${actionsOpen ? "" : "-rotate-90"}`}
                />
                Ran 2 actions
              </button>
              {actionsOpen && (
                <div className="text-xs text-ink-muted space-y-1 pl-4">
                  <div className="flex items-center gap-1.5">
                    <span aria-hidden>⏱</span>
                    Waited for the user&apos;s answer
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span aria-hidden>🧠</span>
                    Thought through the next step
                  </div>
                </div>
              )}
            </div>
            <BusinessPlanCard
              plan={briefPlan}
              orgSlug={organization.slug}
              onActivate={activateDepartments}
              activating={activating}
            />
          </>
        )}

        {busy && !briefStarted && (
          <div className="text-2xs uppercase tracking-[0.12em] text-ink-soft">
            Cofounder is thinking…
          </div>
        )}
      </div>
      <div className="border-t border-line/80 p-2.5">
        <div className="rounded-lg border border-line/80 bg-paper focus-within:border-line-strong transition-colors flex items-end gap-1">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder={
              isEmpty && onboarding
                ? "Share what you're building…"
                : briefDone
                  ? "Ask for follow up changes…"
                  : "Ask Cofounder anything…"
            }
            rows={2}
            className="flex-1 resize-none bg-transparent px-3 py-2 text-base focus:outline-none placeholder:text-ink-soft"
          />
          <button
            type="button"
            onClick={send}
            disabled={busy || !input.trim()}
            aria-label="Send"
            className="size-6 mb-1.5 mr-1.5 rounded-md bg-line text-ink-muted inline-flex items-center justify-center disabled:opacity-50 hover:bg-line transition-colors"
          >
            ↑
          </button>
        </div>
      </div>
    </>
  );
}

function Message({ m }: { m: Msg }) {
  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-lg bg-cream px-3 py-1.5 text-base text-ink">
          {m.text}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      <div className="inline-flex items-center gap-1.5 text-xs text-ink-muted bg-mustard/30 px-1.5 py-0.5 rounded-sm">
        <span className="size-3 rounded-full  bg-mustard/30 inline-block" />
        Cofounder
      </div>
      <div className="text-sm leading-relaxed text-ink whitespace-pre-wrap bg-mustard/30 px-1 rounded-sm inline">
        {m.text}
      </div>
    </div>
  );
}

function AnsweredQuestionsCard({
  questions,
  answers,
}: {
  questions: typeof QUESTIONS;
  answers: BriefAnswer[];
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  return (
    <div className="space-y-2">
      <div className="text-xs text-ink-muted inline-flex items-center gap-1">
        <span aria-hidden>↳</span> Running Tool: Ask User Question
      </div>
      <div className="rounded-lg border border-line/80 bg-paper p-3 space-y-2.5">
        <div>
          <div className="text-sm font-medium text-ink">
            Answered questions
          </div>
          <div className="text-xs text-ink-muted">You chose</div>
        </div>
        {questions.map((q) => {
          const a = answers.find((x) => x.questionId === q.id);
          if (!a) return null;
          const opt = q.options.find((o) => o.key === a.optionKey);
          const label = a.custom ?? opt?.label ?? a.optionKey;
          const isOpen = open[q.id] !== false;
          return (
            <div
              key={q.id}
              className="border-t border-line/60 pt-2 first:border-0 first:pt-0"
            >
              <button
                type="button"
                onClick={() =>
                  setOpen((s) => ({ ...s, [q.id]: s[q.id] === false }))
                }
                className="w-full flex items-start justify-between gap-2 text-left"
              >
                <span className="text-sm text-ink leading-snug">
                  {q.prompt}
                </span>
                <span className="inline-flex items-center gap-1 text-2xs text-ink-muted shrink-0">
                  <span className="rounded bg-cream px-1.5 py-0.5">
                    Answered
                  </span>
                  <ChevronDown
                    className={`size-3 transition-transform ${isOpen ? "" : "-rotate-90"}`}
                  />
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

function BriefWidget({
  questions,
  step,
  setStep,
  answers,
  setAnswers,
  onSubmit,
  submitting,
  actionsOpen,
  setActionsOpen,
}: {
  questions: typeof QUESTIONS;
  step: number;
  setStep: (n: number) => void;
  answers: BriefAnswer[];
  setAnswers: (
    a: BriefAnswer[] | ((prev: BriefAnswer[]) => BriefAnswer[]),
  ) => void;
  onSubmit: () => void;
  submitting: boolean;
  actionsOpen: boolean;
  setActionsOpen: (b: boolean) => void;
}) {
  const total = questions.length;
  const isLast = step === total - 1;
  const q = questions[step];
  const currentAnswer = answers.find((a) => a.questionId === q.id);
  const [custom, setCustom] = useState("");

  function pick(optionKey: string) {
    setCustom("");
    setAnswers((prev) => {
      const without = prev.filter((a) => a.questionId !== q.id);
      return [...without, { questionId: q.id, optionKey }];
    });
  }

  function setCustomAnswer(text: string) {
    setCustom(text);
    setAnswers((prev) => {
      const without = prev.filter((a) => a.questionId !== q.id);
      if (!text.trim()) return without;
      return [
        ...without,
        { questionId: q.id, optionKey: "__custom", custom: text.trim() },
      ];
    });
  }

  function decideAll() {
    // Pick the recommended option for every remaining question (incl current).
    setAnswers((prev) => {
      const next = [...prev];
      for (let i = step; i < questions.length; i++) {
        const qq = questions[i];
        const rec = qq.options.find((o) => o.recommended) ?? qq.options[0];
        const idx = next.findIndex((a) => a.questionId === qq.id);
        const a = { questionId: qq.id, optionKey: rec.key };
        if (idx >= 0) next[idx] = a;
        else next.push(a);
      }
      return next;
    });
    onSubmit();
  }

  return (
    <div className="space-y-2">
      {isLast && (
        <div className="text-xs text-ink-muted inline-flex items-center gap-1">
          <ChevronDown
            className={`size-3 transition-transform ${actionsOpen ? "" : "-rotate-90"}`}
            onClick={() => setActionsOpen(!actionsOpen)}
            role="button"
          />
          Ran 2 actions
        </div>
      )}
      {actionsOpen && (
        <div className="text-xs text-ink-muted space-y-1 pl-4">
          <div className="flex items-center gap-1.5">
            <span aria-hidden>✎</span> Wrote to workspace
          </div>
          <div className="flex items-center gap-1.5">
            <span aria-hidden>›</span> Thought through the next step
          </div>
          <div className="flex items-center gap-1.5">
            <span aria-hidden>▷</span> Running terminal command
          </div>
        </div>
      )}

      <div className="rounded-lg border border-line/80 bg-paper overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 text-xs text-ink-muted border-b border-line/70">
          <span className="inline-flex items-center gap-1">
            {step + 1}/{total}
            <ChevronRight className="size-3 text-ink-soft" />
          </span>
          <button
            type="button"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="disabled:opacity-30 hover:text-ink"
            aria-label="Close" title="Close"
          >
            <X className="size-3" />
          </button>
        </div>
        <div className="p-3 space-y-3">
          <p className="text-base leading-snug text-ink">{q.prompt}</p>
          <div className="space-y-1">
            {q.options.map((o) => {
              const selected = currentAnswer?.optionKey === o.key;
              return (
                <button
                  key={o.key}
                  onClick={() => pick(o.key)}
                  className={`w-full text-left rounded-md px-2.5 py-2 transition-colors ${
                    selected
                      ? "bg-cream"
                      : "hover:bg-canvas"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-medium text-ink">
                      {o.label}
                    </div>
                    {o.recommended && (
                      <span className="text-2xs text-ink bg-cream px-1.5 py-0.5 rounded-sm">
                        Recommended
                      </span>
                    )}
                  </div>
                  {o.description && (
                    <p className="text-xs text-ink-muted mt-1 leading-snug">
                      {o.description}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
          {q.allowCustom && (
            <input
              type="text"
              value={custom}
              onChange={(e) => setCustomAnswer(e.target.value)}
              placeholder="Something else…"
              className="w-full text-sm border-b border-line bg-transparent px-1 py-1 focus:outline-none focus:border-line-strong"
            />
          )}
        </div>
        <div className="flex items-center justify-end gap-1.5 border-t border-line/70 p-2">
          <button
            type="button"
            onClick={decideAll}
            disabled={submitting}
            className="text-xs rounded-md border border-line/80 bg-paper px-2.5 py-1 hover:border-line-strong disabled:opacity-40"
          >
            Decide all
          </button>
          <button
            type="button"
            onClick={() => {
              if (!currentAnswer) return;
              if (step < total - 1) setStep(step + 1);
              else onSubmit();
            }}
            disabled={!currentAnswer || submitting}
            className="text-xs rounded-md bg-ink text-paper px-2.5 py-1 hover:bg-ink/80 disabled:opacity-40"
          >
            {submitting
              ? "Submitting…"
              : isLast
                ? "Submit"
                : "Decide this one"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BusinessPlanCard({
  plan,
  onActivate,
  activating,
}: {
  plan: BriefPlan;
  orgSlug: string;
  onActivate: () => void;
  activating: boolean;
}) {
  // render summary as prose with **bold** labels, on a soft highlighter bg —
  // matches the cofounder.co Cofounder reply look
  const sections: { label: string; body?: string | string[] }[] = [
    { label: "Product", body: pickStr(plan.product_or_service) },
    { label: "ICP", body: pickStr(plan.icp) },
    { label: "Business Model", body: pickStr(plan.pricing_thesis) },
    { label: "Mission", body: pickStr(plan.mission) },
    {
      label: "Differentiator",
      body: pickStr(
        (plan as Record<string, unknown>).differentiator as string | undefined,
      ),
    },
    {
      label: "Go-to-market",
      body: pickStr(plan.go_to_market_thesis),
    },
  ].filter((s) => Boolean(s.body));

  return (
    <div className="space-y-3">
      <p className="bg-mustard/30 px-1 rounded-sm text-base text-ink leading-relaxed">
        The business brief is ready to review. Here&apos;s a summary of
        what&apos;s in it:
      </p>
      <div className="space-y-3 text-base leading-relaxed text-ink">
        {sections.map((s) => (
          <p key={s.label} className="bg-mustard/30 px-1 rounded-sm">
            <strong>{s.label}:</strong>{" "}
            {Array.isArray(s.body) ? s.body.join(", ") : s.body}
          </p>
        ))}
      </div>
      <div className="text-2xs text-ink-soft inline-flex items-center gap-1.5">
        {new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        <button
          type="button"
          className="hover:text-ink"
          aria-label="Copy"
        >
          ⎘
        </button>
      </div>
      <button
        type="button"
        onClick={onActivate}
        disabled={activating}
        className="w-full rounded-md bg-ink text-paper text-sm py-2 hover:bg-ink/80 disabled:opacity-60"
      >
        {activating
          ? "Activating departments…"
          : "Accept & activate departments"}
      </button>
    </div>
  );
}

function pickStr(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

function PlanSection({
  label,
  tone,
  children,
}: {
  label: string;
  tone: "amber" | "violet" | "sky" | "rose" | "lime";
  children: React.ReactNode;
}) {
  const palette: Record<string, string> = {
    amber: "text-mustard-ink bg-mustard/15",
    violet: "text-ink bg-cream",
    sky: "text-ink bg-cream",
    rose: "text-ink bg-cream",
    lime: "text-sage-ink bg-sage/15",
  };
  return (
    <div>
      <span
        className={`inline-block text-2xs uppercase tracking-wider px-1.5 py-0.5 rounded ${palette[tone]}`}
      >
        {label}
      </span>
      <div className="text-sm text-ink mt-1.5 leading-snug">
        {children}
      </div>
    </div>
  );
}

function DocIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-4 text-ink-muted"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 2h7l3 3v9H3z" />
      <path d="M10 2v3h3" />
      <path d="M5.5 8h5M5.5 10.5h5M5.5 13h3" />
    </svg>
  );
}
