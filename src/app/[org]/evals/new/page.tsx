import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/store";
import { PageTitle, Hint, Eyebrow } from "@/components/ui/primitives";
import { ArrowLeft, FlaskConical } from "lucide-react";

const AGENT_OPTIONS = [
  "Engineer",
  "Marketing",
  "Sales",
  "Design",
  "Operations",
  "Finance",
  "Legal",
  "Support",
];

const MODEL_OPTIONS = [
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
  { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
  { id: "claude-opus-4-7", label: "Claude Opus 4.7" },
];

export default async function NewEvalSuitePage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) notFound();

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-5">
        <Link
          href={`/${org}/evals`}
          className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-3" /> Back to evals
        </Link>

        <header>
          <PageTitle className="inline-flex items-center gap-2">
            <FlaskConical className="size-5 text-ink-muted" /> New eval suite
          </PageTitle>
          <Hint>
            Define the agent, model, and judge prompt. Add cases after the suite
            is created.
          </Hint>
        </header>

        <form className="space-y-5" action="#">
          {/* Suite name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-ink" htmlFor="suite-name">
              Suite name
            </label>
            <input
              id="suite-name"
              name="name"
              type="text"
              placeholder="e.g. Sales — cold email quality"
              className="w-full rounded-lg border border-line/70 bg-paper px-3 py-2 text-sm focus:outline-none focus:border-line-strong placeholder:text-ink-soft"
            />
          </div>

          {/* Agent + model row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink" htmlFor="suite-agent">
                Agent
              </label>
              <select
                id="suite-agent"
                name="agent"
                className="w-full rounded-lg border border-line/70 bg-paper px-3 py-2 text-sm focus:outline-none focus:border-line-strong text-ink"
              >
                {AGENT_OPTIONS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink" htmlFor="suite-model">
                Model to test against
              </label>
              <select
                id="suite-model"
                name="model"
                className="w-full rounded-lg border border-line/70 bg-paper px-3 py-2 text-sm focus:outline-none focus:border-line-strong text-ink"
              >
                {MODEL_OPTIONS.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Judge prompt */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-ink" htmlFor="suite-judge">
              Judge prompt
            </label>
            <Hint>
              This prompt scores each case. The judge receives the input and the
              agent&apos;s output, then returns pass/fail + reasoning.
            </Hint>
            <textarea
              id="suite-judge"
              name="judgePrompt"
              rows={6}
              placeholder={`You are evaluating whether an AI agent response meets quality standards.\n\nInput: {{input}}\nOutput: {{output}}\n\nReturn JSON: { "pass": true|false, "reason": "..." }`}
              className="w-full rounded-lg border border-line/70 bg-paper px-3 py-2 text-xs font-mono focus:outline-none focus:border-line-strong placeholder:text-ink-soft resize-none"
            />
          </div>

          {/* First case (optional) */}
          <div className="rounded-xl border border-line/70 bg-paper p-4 space-y-3">
            <Eyebrow>First case (optional)</Eyebrow>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink" htmlFor="case-input">
                Input
              </label>
              <textarea
                id="case-input"
                name="caseInput"
                rows={3}
                placeholder="The input the agent would receive…"
                className="w-full rounded-lg border border-line/70 bg-canvas px-3 py-2 text-xs font-mono focus:outline-none focus:border-line-strong placeholder:text-ink-soft resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink" htmlFor="case-expected">
                Expected output (or criteria)
              </label>
              <textarea
                id="case-expected"
                name="caseExpected"
                rows={3}
                placeholder="What a good response looks like, or an exact expected value…"
                className="w-full rounded-lg border border-line/70 bg-canvas px-3 py-2 text-xs font-mono focus:outline-none focus:border-line-strong placeholder:text-ink-soft resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Link
              href={`/${org}/evals`}
              className="text-sm rounded-md border border-line bg-paper px-3 py-1.5 hover:border-line-strong"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="text-sm rounded-md bg-ink text-paper px-3 py-1.5 hover:opacity-90"
            >
              Create suite
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
