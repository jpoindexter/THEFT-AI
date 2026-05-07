import Link from "next/link";
import {
  Card,
  CardBody,
  Eyebrow,
  Hint,
  PageTitle,
  Pill,
} from "@/components/ui/primitives";
import { FlaskConical, Plus, CheckCircle2, XCircle, Clock } from "lucide-react";

type Tone = "sage" | "mustard" | "brick" | "neutral";

type Suite = {
  id: string;
  name: string;
  agent: string;
  cases: number;
  pass: number;
  fail: number;
  pending: number;
  last: string;
  ran_against: string;
  tone: Tone;
};

const SUITES: Suite[] = [
  {
    id: "engineer-bug-fix",
    name: "Engineer · bug fix flow",
    agent: "Engineer",
    cases: 14,
    pass: 13,
    fail: 1,
    pending: 0,
    last: "2026-05-06 18:42",
    ran_against: "claude-opus-4-7",
    tone: "mustard",
  },
  {
    id: "marketing-launch-tone",
    name: "Marketing · launch tone",
    agent: "Marketing",
    cases: 9,
    pass: 9,
    fail: 0,
    pending: 0,
    last: "2026-05-06 17:11",
    ran_against: "claude-opus-4-7",
    tone: "sage",
  },
  {
    id: "support-triage",
    name: "Support · case triage classifier",
    agent: "Support",
    cases: 22,
    pass: 19,
    fail: 1,
    pending: 2,
    last: "2026-05-06 09:00",
    ran_against: "claude-haiku-4-5",
    tone: "mustard",
  },
  {
    id: "finance-invoice-extract",
    name: "Finance · invoice line extraction",
    agent: "Finance",
    cases: 30,
    pass: 24,
    fail: 6,
    pending: 0,
    last: "2026-05-05 22:30",
    ran_against: "claude-opus-4-7",
    tone: "brick",
  },
];

export default async function EvalsPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const totals = SUITES.reduce(
    (a, s) => ({
      cases: a.cases + s.cases,
      pass: a.pass + s.pass,
      fail: a.fail + s.fail,
      pending: a.pending + s.pending,
    }),
    { cases: 0, pass: 0, fail: 0, pending: 0 },
  );
  const passRate = totals.cases ? Math.round((totals.pass / totals.cases) * 100) : 0;

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-5">
        <header className="flex items-start justify-between gap-3">
          <div>
            <Eyebrow>Workspace</Eyebrow>
            <PageTitle className="inline-flex items-center gap-2">
              <FlaskConical className="size-5 text-ink-muted" /> Evals
            </PageTitle>
            <Hint>
              Pinned test cases that must pass before a prompt change ships.
              Suites run on every model update and on demand.
            </Hint>
          </div>
          <Link
            href={`/${org}/evals/new`}
            className="inline-flex items-center gap-1 text-sm rounded-md bg-ink text-paper px-3 py-1.5 hover:opacity-90"
          >
            <Plus className="size-3.5" /> New suite
          </Link>
        </header>

        <div className="grid grid-cols-4 gap-3">
          <SummaryStat label="Suites" value={String(SUITES.length)} />
          <SummaryStat label="Cases" value={String(totals.cases)} />
          <SummaryStat
            label="Pass rate"
            value={`${passRate}%`}
            tone={passRate >= 95 ? "sage" : passRate >= 85 ? "mustard" : "brick"}
          />
          <SummaryStat label="Failing" value={String(totals.fail)} tone="brick" />
        </div>

        <Card>
          <CardBody className="p-0">
            <ul className="divide-y divide-line/60">
              {SUITES.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/${org}/evals/${s.id}`}
                    className="grid grid-cols-12 items-center px-4 py-3 hover:bg-cream/40"
                  >
                    <div className="col-span-5 min-w-0">
                      <div className="text-sm font-medium tracking-tight truncate">
                        {s.name}
                      </div>
                      <div className="text-2xs text-ink-soft mt-0.5">
                        {s.agent} · {s.ran_against}
                      </div>
                    </div>
                    <div className="col-span-4 inline-flex items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-0.5 text-sage-ink">
                        <CheckCircle2 className="size-3" /> {s.pass}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-brick-ink">
                        <XCircle className="size-3" /> {s.fail}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-ink-muted">
                        <Clock className="size-3" /> {s.pending}
                      </span>
                      <span className="text-ink-soft">/ {s.cases} cases</span>
                    </div>
                    <div className="col-span-2 text-2xs text-ink-soft">
                      {s.last}
                    </div>
                    <div className="col-span-1 text-right">
                      <Pill tone={s.tone}>
                        {s.fail === 0 && s.pending === 0
                          ? "green"
                          : s.fail > 0
                            ? "regressed"
                            : "running"}
                      </Pill>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Eyebrow>How evals work</Eyebrow>
            <Hint>
              Each suite is a list of cases: input + expected output. Cases run
              on every prompt or model change and are scored by a judge prompt
              you control. Failures block the change from auto-merging.
            </Hint>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: Tone;
}) {
  return (
    <div className="rounded-md border border-line/70 bg-paper p-3">
      <div className="text-2xs uppercase tracking-wider text-ink-soft">{label}</div>
      <div className="text-base font-medium tracking-tight mt-0.5 text-ink inline-flex items-center gap-2">
        {value}
        {tone && <Pill tone={tone}>·</Pill>}
      </div>
    </div>
  );
}
