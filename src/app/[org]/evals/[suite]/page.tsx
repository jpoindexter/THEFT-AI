import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Card,
  CardBody,
  Eyebrow,
  Hint,
  PageTitle,
  Pill,
} from "@/components/ui/primitives";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Plus,
  FlaskConical,
} from "lucide-react";

type CaseStatus = "pass" | "fail" | "pending";

type Case = {
  id: string;
  prompt: string;
  expected: string;
  actual: string;
  status: CaseStatus;
  judge: string;
};

const FIXTURES: Record<string, { name: string; agent: string; cases: Case[] }> = {
  "engineer-bug-fix": {
    name: "Engineer · bug fix flow",
    agent: "Engineer",
    cases: [
      {
        id: "case-1",
        prompt: "Bug: clicking 'Save' on the Memory page does nothing.",
        expected:
          "Diagnoses event handler binding, references memory/page.tsx, proposes one focused fix with tests.",
        actual:
          "Diagnoses event handler binding in memory/page.tsx, proposes a fix and adds a Vitest case.",
        status: "pass",
        judge: "structure + scope-discipline",
      },
      {
        id: "case-2",
        prompt: "Bug: invoices export returns a 500 only on Sundays.",
        expected:
          "Forms a hypothesis tied to the cron schedule, asks one disambiguating question.",
        actual:
          "Forms a cron-schedule hypothesis, runs a sample query, then asks about timezone of the cron.",
        status: "pass",
        judge: "hypothesis-first",
      },
      {
        id: "case-3",
        prompt: "Bug: signup form silently drops errors when email is taken.",
        expected: "Surfaces error to UI, adds a regression test.",
        actual: "Adds a try/catch wrapper but does not surface to UI.",
        status: "fail",
        judge: "user-visible-error",
      },
    ],
  },
  "marketing-launch-tone": {
    name: "Marketing · launch tone",
    agent: "Marketing",
    cases: [
      {
        id: "case-1",
        prompt: "Draft a launch tweet for Stripe checkout shipping.",
        expected:
          "Active voice, no exclamation marks, one concrete fact, max 240 chars.",
        actual:
          "Stripe checkout is live. One-click for Team and Studio. No reroutes, no pricing surprise.",
        status: "pass",
        judge: "voice-rules + length",
      },
    ],
  },
};

export default async function EvalSuitePage({
  params,
}: {
  params: Promise<{ org: string; suite: string }>;
}) {
  const { org, suite } = await params;
  const data = FIXTURES[suite];
  if (!data) notFound();

  const tally = data.cases.reduce(
    (a, c) => ({ ...a, [c.status]: a[c.status] + 1 }),
    { pass: 0, fail: 0, pending: 0 },
  );

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <Link
          href={`/${org}/evals`}
          className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-3" /> Back to evals
        </Link>

        <header className="flex items-start justify-between gap-3">
          <div>
            <Eyebrow>{data.agent}</Eyebrow>
            <PageTitle className="inline-flex items-center gap-2">
              <FlaskConical className="size-5 text-ink-muted" /> {data.name}
            </PageTitle>
            <Hint>
              {data.cases.length} cases · {tally.pass} pass · {tally.fail} fail · {tally.pending} pending
            </Hint>
          </div>
          <div className="flex items-center gap-1">
            <button className="inline-flex items-center gap-1 text-xs rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong">
              <Plus className="size-3" /> Add case
            </button>
            <button className="inline-flex items-center gap-1 text-sm rounded-md bg-ink text-paper px-3 py-1.5 hover:opacity-90">
              <Play className="size-3.5" /> Run all
            </button>
          </div>
        </header>

        <ul className="space-y-3">
          {data.cases.map((c) => (
            <li key={c.id}>
              <CaseCard c={c} />
            </li>
          ))}
        </ul>

        <Card>
          <CardBody>
            <Eyebrow>Judge prompt</Eyebrow>
            <Hint>
              The case grader. Tweak this and every case re-scores on the next
              run. Lives at <code className="font-mono">/{org}/evals/{suite}/judge</code>.
            </Hint>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function CaseCard({ c }: { c: Case }) {
  const Icon =
    c.status === "pass" ? CheckCircle2 : c.status === "fail" ? XCircle : Clock;
  const tone =
    c.status === "pass" ? "sage" : c.status === "fail" ? "brick" : "mustard";
  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="inline-flex items-center gap-2 text-xs">
            <Icon
              className={`size-4 ${
                c.status === "pass"
                  ? "text-sage-ink"
                  : c.status === "fail"
                    ? "text-brick-ink"
                    : "text-mustard-ink"
              }`}
            />
            <span className="font-mono text-ink-muted">{c.id}</span>
          </span>
          <Pill tone={tone}>{c.judge}</Pill>
        </div>
        <div className="space-y-2 text-sm">
          <Field label="Prompt">{c.prompt}</Field>
          <Field label="Expected">{c.expected}</Field>
          <Field label="Actual">{c.actual}</Field>
        </div>
      </CardBody>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-2xs uppercase tracking-wider text-ink-soft">
        {label}
      </div>
      <div className="text-ink leading-relaxed">{children}</div>
    </div>
  );
}
