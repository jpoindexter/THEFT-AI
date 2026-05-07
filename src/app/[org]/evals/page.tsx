"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardBody,
  Eyebrow,
  Hint,
  PageTitle,
  Pill,
  StatCard,
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
  last_run_at: string | null;
  ran_against: string;
};

function suiteTone(s: Suite): Tone {
  if (s.cases === 0) return "neutral";
  if (s.fail > 0) return "brick";
  if (s.pending > 0) return "mustard";
  return "sage";
}

export default function EvalsPage() {
  const params = useParams<{ org: string }>();
  const [suites, setSuites] = useState<Suite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch(`/api/${params.org}/evals`)
      .then((r) => r.json())
      .then((j: { suites: Suite[] }) => {
        setSuites(j.suites ?? []);
        setLoading(false);
      });
  }, [params.org]);

  const totals = suites.reduce(
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
            href={`/${params.org}/evals/new`}
            className="inline-flex items-center gap-1 text-sm rounded-md bg-ink text-paper px-3 py-1.5 hover:opacity-90"
          >
            <Plus className="size-3.5" /> New suite
          </Link>
        </header>

        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Suites" value={String(suites.length)} />
          <StatCard label="Cases" value={String(totals.cases)} />
          <StatCard
            label="Pass rate"
            value={totals.cases ? `${passRate}%` : "—"}
            tone={totals.cases === 0 ? "neutral" : passRate >= 95 ? "sage" : passRate >= 85 ? "mustard" : "brick"}
          />
          <StatCard label="Failing" value={String(totals.fail)} tone={totals.fail > 0 ? "brick" : "neutral"} />
        </div>

        <Card>
          <CardBody className="p-0">
            {loading ? (
              <div className="px-4 py-6 text-sm text-ink-muted text-center">Loading…</div>
            ) : suites.length === 0 ? (
              <div className="px-4 py-6 text-sm text-ink-muted text-center">
                No eval suites yet.{" "}
                <Link href={`/${params.org}/evals/new`} className="underline hover:text-ink">
                  Create one
                </Link>{" "}
                to track agent quality over time.
              </div>
            ) : (
              <ul className="divide-y divide-line/60">
                {suites.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/${params.org}/evals/${s.id}`}
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
                        {s.last_run_at ? s.last_run_at.slice(0, 16).replace("T", " ") : "—"}
                      </div>
                      <div className="col-span-1 text-right">
                        <Pill tone={suiteTone(s)}>
                          {s.fail === 0 && s.pending === 0 && s.cases > 0
                            ? "green"
                            : s.fail > 0
                              ? "regressed"
                              : s.cases === 0
                                ? "empty"
                                : "running"}
                        </Pill>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
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
