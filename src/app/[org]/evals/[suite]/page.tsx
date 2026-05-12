import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Card,
  CardBody,
  Eyebrow,
  Hint,
  PageTitle,
  Pill,
  StatCard,
} from "@/components/ui/primitives";
import { ArrowLeft, CheckCircle2, XCircle, Clock, Play, Plus, FlaskConical } from "lucide-react";
import { db } from "@/lib/db/store";

export default async function EvalSuitePage({
  params,
}: {
  params: Promise<{ org: string; suite: string }>;
}) {
  const { org, suite } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) notFound();

  const suites = await db.listEvalSuites(o.id);
  const s = suites.find((x) => x.id === suite);
  if (!s) notFound();

  const passRate = s.cases ? Math.round((s.pass / s.cases) * 100) : 0;

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
            <Eyebrow>{s.agent}</Eyebrow>
            <PageTitle className="inline-flex items-center gap-2">
              <FlaskConical className="size-5 text-ink-muted" /> {s.name}
            </PageTitle>
            <Hint>
              {s.cases} cases · last run{" "}
              {s.last_run_at
                ? s.last_run_at.slice(0, 16).replace("T", " ")
                : "never"}{" "}
              · model {s.ran_against}
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

        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Cases" value={String(s.cases)} />
          <StatCard
            label="Pass rate"
            value={s.cases ? `${passRate}%` : "—"}
            tone={s.cases === 0 ? "neutral" : passRate >= 95 ? "sage" : passRate >= 85 ? "mustard" : "brick"}
          />
          <StatCard
            label="Failing"
            value={String(s.fail)}
            tone={s.fail > 0 ? "brick" : "neutral"}
          />
          <StatCard
            label="Pending"
            value={String(s.pending)}
            tone={s.pending > 0 ? "mustard" : "neutral"}
          />
        </div>

        <Card>
          <CardBody className="p-0">
            {s.cases === 0 ? (
              <div className="px-4 py-6 text-sm text-ink-muted text-center">
                No cases yet. Add the first one to start tracking quality.
              </div>
            ) : (
              <div className="px-4 py-4 space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <span className="inline-flex items-center gap-1 text-sage-ink">
                    <CheckCircle2 className="size-4" /> {s.pass} passed
                  </span>
                  <span className="inline-flex items-center gap-1 text-brick-ink">
                    <XCircle className="size-4" /> {s.fail} failed
                  </span>
                  <span className="inline-flex items-center gap-1 text-ink-muted">
                    <Clock className="size-4" /> {s.pending} pending
                  </span>
                </div>
                <Hint>
                  Individual case results aren&apos;t stored yet. Run the suite to populate them.
                </Hint>
              </div>
            )}
          </CardBody>
        </Card>

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
