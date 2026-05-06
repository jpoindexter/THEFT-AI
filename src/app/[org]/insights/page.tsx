import {
  Card,
  CardBody,
  Eyebrow,
  Hint,
  PageTitle,
  Pill,
} from "@/components/ui/primitives";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

type Tone = "sage" | "mustard" | "brick" | "neutral";

type Insight = {
  title: string;
  body: string;
  tone: Tone;
  Icon: React.ComponentType<{ className?: string }>;
  evidence: string[];
};

const INSIGHTS: Insight[] = [
  {
    title: "Engineer is the cost driver this week",
    body: "82% of agent spend goes to one Engineer. Most of it is on the migration PR loop. If you split the migration into a backfill task, you should drop Engineer cost by ~30%.",
    tone: "mustard",
    Icon: TrendingUp,
    evidence: [
      "Engineer ran 18 turns on subscriptions PR",
      "$41.20 of $50.50 weekly spend",
      "Reverse SQL retried 4× before passing",
    ],
  },
  {
    title: "Approval latency cut in half",
    body: "Median time from pending → decided dropped from 24m to 13m. Likely from the ⌘. shortcut and the bottom-right Review pill.",
    tone: "sage",
    Icon: TrendingDown,
    evidence: [
      "13 approvals decided in <10m",
      "Only 1 approval > 1h",
      "Review queue size avg 3.4",
    ],
  },
  {
    title: "Inbound webhook flapping",
    body: "Postmark inbound has returned 503 in 4 of the last 5 minutes. Mail to *@theft.ai may be delayed. Diagnostics is pinging it; you can also flip the agent inboxes to manual for the rest of today.",
    tone: "brick",
    Icon: AlertTriangle,
    evidence: [
      "503 rate ~80% in last 5 min",
      "Last successful webhook 6m ago",
      "Postmark status page shows partial outage",
    ],
  },
  {
    title: "Subscriptions table ready to merge",
    body: "Migration 0014 has been on staging for 2 hours; preview is green; tests pass. Your call.",
    tone: "sage",
    Icon: CheckCircle2,
    evidence: [
      "0 failed tests on preview",
      "Migration runs in 220ms on staging",
      "Reverse migration verified",
    ],
  },
];

export default async function InsightsPage() {
  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-5">
        <header>
          <Eyebrow>Workspace</Eyebrow>
          <PageTitle className="inline-flex items-center gap-2">
            <Sparkles className="size-5 text-ink-muted" /> Insights
          </PageTitle>
          <Hint>
            Agent-generated read of what shifted this week and what to do
            about it. Refreshed each morning.
          </Hint>
        </header>

        <ul className="space-y-3">
          {INSIGHTS.map((i, idx) => (
            <InsightCard key={idx} i={i} />
          ))}
        </ul>

        <Card>
          <CardBody>
            <Eyebrow>How insights are generated</Eyebrow>
            <Hint>
              The Operations agent reads the audit log + cost ledger + diag
              checks each morning and surfaces anything outside its band. You
              can tune what counts as "outside the band" in Settings → AI
              Settings.
            </Hint>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function InsightCard({ i }: { i: Insight }) {
  const cls =
    i.tone === "sage"
      ? "border-sage/40 bg-sage/15"
      : i.tone === "mustard"
        ? "border-mustard/40 bg-mustard/15"
        : i.tone === "brick"
          ? "border-brick/40 bg-brick/10"
          : "";
  const inkCls =
    i.tone === "sage"
      ? "text-sage-ink"
      : i.tone === "mustard"
        ? "text-mustard-ink"
        : i.tone === "brick"
          ? "text-brick-ink"
          : "text-ink";
  const Icon = i.Icon;
  return (
    <Card className={cls}>
      <CardBody>
        <div className="flex items-start gap-3">
          <span
            className={`size-8 rounded-md inline-flex items-center justify-center shrink-0 ${inkCls}`}
          >
            <Icon className="size-4" />
          </span>
          <div className="min-w-0">
            <div
              className={`text-base font-medium tracking-tight ${inkCls}`}
            >
              {i.title}
            </div>
            <p className="text-sm text-ink mt-1 leading-relaxed">
              {i.body}
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {i.evidence.map((e, idx) => (
                <li key={idx}>
                  <Pill tone="neutral">{e}</Pill>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
