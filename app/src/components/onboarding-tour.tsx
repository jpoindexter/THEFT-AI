"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, X, Sparkles } from "lucide-react";

const STORAGE_KEY = "theft.canvas.tour.dismissed";

type Step = {
  title: string;
  body: string;
  cta: { label: string; href: (org: string) => string } | null;
};

const STEPS: Step[] = [
  {
    title: "This is your canvas",
    body: "Every department is a node. Click one to drop into its workspace, see its agents, and start a task.",
    cta: null,
  },
  {
    title: "Talk to Operator",
    body: "The chat in the bottom-right is Operator. Tell it what you want; it routes to the right agent and shows you the plan first.",
    cta: null,
  },
  {
    title: "Pin durable context to memory",
    body: "Anything every agent should know — pricing, ICP, voice rules — lives in Company Memory. Pin it and it travels with every prompt.",
    cta: { label: "Open memory", href: (o) => `/${o}/memory` },
  },
  {
    title: "Use local adapters",
    body: "Choose Claude Code, Codex CLI, Gemini CLI, OpenCode, or a local endpoint in AI Settings. Agents run through that harness first.",
    cta: { label: "Open AI settings", href: (o) => `/${o}/settings/ai-settings` },
  },
];

export default function OnboardingTour({ org }: { org: string }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(STORAGE_KEY) === "1") return;
    const t = window.setTimeout(() => setOpen(true), 800);
    return () => window.clearTimeout(t);
  }, []);

  function dismiss() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "1");
    }
    setOpen(false);
  }

  if (!open) return null;
  const s = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <div className="absolute bottom-4 left-4 z-30 w-80 rounded-lg border border-line/70 bg-paper shadow-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-2xs uppercase tracking-wider text-ink-soft inline-flex items-center gap-1">
          <Sparkles className="size-3 text-mustard-ink" /> Quick tour ·{" "}
          {step + 1} of {STEPS.length}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close tour"
          className="size-6 rounded-md inline-flex items-center justify-center text-ink-muted hover:text-ink"
        >
          <X className="size-3" />
        </button>
      </div>
      <div>
        <div className="text-base font-medium tracking-tight">{s.title}</div>
        <p className="text-sm text-ink-muted leading-relaxed mt-1">{s.body}</p>
      </div>
      <div className="flex items-center justify-between pt-1">
        <div className="flex gap-1">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`size-1.5 rounded-full ${
                i === step ? "bg-ink" : "bg-line"
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-1">
          {s.cta && (
            <Link
              href={s.cta.href(org)}
              onClick={dismiss}
              className="text-xs rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
            >
              {s.cta.label}
            </Link>
          )}
          {last ? (
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex items-center gap-1 text-xs rounded-md bg-ink text-paper px-2 py-1 hover:opacity-90"
            >
              Got it
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="inline-flex items-center gap-1 text-xs rounded-md bg-ink text-paper px-2 py-1 hover:opacity-90"
            >
              Next <ArrowRight className="size-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
