import Link from "next/link";
import {
  Card,
  CardBody,
  Eyebrow,
  Hint,
  PageTitle,
  Pill,
} from "@/components/ui/primitives";
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown } from "lucide-react";

const AGENTS = [
  "Cofounder",
  "Engineer",
  "Marketing",
  "Sales",
  "Operations",
  "Finance",
  "Support",
];

const MODELS = ["claude-opus-4-7", "claude-sonnet-4-6", "claude-haiku-4-5"];

const ROWS: Record<string, Record<string, number>> = {
  Cofounder: { "claude-opus-4-7": 18.4, "claude-sonnet-4-6": 0, "claude-haiku-4-5": 0 },
  Engineer: { "claude-opus-4-7": 22.6, "claude-sonnet-4-6": 5.5, "claude-haiku-4-5": 0 },
  Marketing: { "claude-opus-4-7": 0, "claude-sonnet-4-6": 6.3, "claude-haiku-4-5": 0 },
  Sales: { "claude-opus-4-7": 0, "claude-sonnet-4-6": 2.4, "claude-haiku-4-5": 1.1 },
  Operations: { "claude-opus-4-7": 0, "claude-sonnet-4-6": 1.2, "claude-haiku-4-5": 2.4 },
  Finance: { "claude-opus-4-7": 0, "claude-sonnet-4-6": 0.6, "claude-haiku-4-5": 0.4 },
  Support: { "claude-opus-4-7": 0, "claude-sonnet-4-6": 0, "claude-haiku-4-5": 1.8 },
};

const PRIOR_TOTAL = 51.4;

export default async function CostBreakdownPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;

  const total = AGENTS.reduce(
    (s, a) => s + MODELS.reduce((sm, m) => sm + (ROWS[a]?.[m] ?? 0), 0),
    0,
  );
  const delta = total - PRIOR_TOTAL;
  const deltaPct = Math.round((delta / PRIOR_TOTAL) * 100);

  const max = Math.max(
    ...AGENTS.flatMap((a) => MODELS.map((m) => ROWS[a]?.[m] ?? 0)),
  );

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <Link
          href={`/${org}/costs`}
          className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-3" /> Back to costs
        </Link>

        <header>
          <Eyebrow>This week</Eyebrow>
          <PageTitle className="inline-flex items-center gap-2">
            <BarChart3 className="size-5 text-ink-muted" /> Spend breakdown
          </PageTitle>
          <Hint>
            Agent × model heatmap of API spend. Use it to spot whether
            Sonnet would do the same job as Opus on a given agent.
          </Hint>
        </header>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-md border border-line/70 bg-paper p-3">
            <div className="text-2xs uppercase tracking-wider text-ink-soft">
              Total
            </div>
            <div className="text-base font-medium tracking-tight mt-0.5 text-ink">
              ${total.toFixed(2)}
            </div>
          </div>
          <div className="rounded-md border border-line/70 bg-paper p-3">
            <div className="text-2xs uppercase tracking-wider text-ink-soft">
              vs last week
            </div>
            <div
              className={`text-base font-medium tracking-tight mt-0.5 inline-flex items-center gap-1 ${
                delta >= 0 ? "text-mustard-ink" : "text-sage-ink"
              }`}
            >
              {delta >= 0 ? (
                <TrendingUp className="size-3.5" />
              ) : (
                <TrendingDown className="size-3.5" />
              )}
              {delta >= 0 ? "+" : ""}
              ${delta.toFixed(2)} ({deltaPct}%)
            </div>
          </div>
          <div className="rounded-md border border-line/70 bg-paper p-3">
            <div className="text-2xs uppercase tracking-wider text-ink-soft">
              Top driver
            </div>
            <div className="text-base font-medium tracking-tight mt-0.5">
              Engineer · Opus
            </div>
          </div>
        </div>

        <Card>
          <CardBody className="p-0">
            <div className="grid grid-cols-[140px_repeat(3,1fr)_80px] border-b border-line/60 text-2xs uppercase tracking-wider text-ink-soft">
              <div className="px-3 py-2">Agent</div>
              {MODELS.map((m) => (
                <div key={m} className="px-3 py-2 font-mono normal-case tracking-normal">
                  {m}
                </div>
              ))}
              <div className="px-3 py-2 text-right">Total</div>
            </div>
            <div className="divide-y divide-line/60">
              {AGENTS.map((a) => {
                const row = ROWS[a] ?? {};
                const rowTotal = MODELS.reduce(
                  (s, m) => s + (row[m] ?? 0),
                  0,
                );
                return (
                  <div
                    key={a}
                    className="grid grid-cols-[140px_repeat(3,1fr)_80px] items-center text-sm"
                  >
                    <div className="px-3 py-2 font-medium tracking-tight">
                      {a}
                    </div>
                    {MODELS.map((m) => {
                      const v = row[m] ?? 0;
                      return <Cell key={m} v={v} max={max} />;
                    })}
                    <div className="px-3 py-2 text-right text-ink-muted">
                      ${rowTotal.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Eyebrow>What this tells you</Eyebrow>
            <Hint>
              Engineer is doing 50% of total spend on Opus alone. If the same
              tasks pass eval on Sonnet, switching saves ~$15/wk. Try the eval
              suite{" "}
              <Link
                href={`/${org}/evals/engineer-bug-fix`}
                className="underline hover:text-ink"
              >
                engineer-bug-fix
              </Link>{" "}
              against Sonnet to test.
            </Hint>
            <div className="mt-2">
              <Pill tone="mustard">cost optimization · low effort</Pill>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Cell({ v, max }: { v: number; max: number }) {
  if (v === 0) {
    return <div className="px-3 py-2 text-2xs text-ink-soft">—</div>;
  }
  const intensity = max ? Math.min(1, v / max) : 0;
  const tone =
    intensity > 0.7 ? "brick" : intensity > 0.4 ? "mustard" : "sage";
  const bg =
    tone === "brick"
      ? "bg-brick/10 text-brick-ink"
      : tone === "mustard"
        ? "bg-mustard/15 text-mustard-ink"
        : "bg-sage/15 text-sage-ink";
  return (
    <div className="px-3 py-2">
      <span
        className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${bg}`}
        title={`${(intensity * 100).toFixed(0)}% of max cell`}
      >
        ${v.toFixed(2)}
      </span>
    </div>
  );
}
