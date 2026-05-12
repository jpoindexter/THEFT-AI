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
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Flag,
} from "lucide-react";
import { db } from "@/lib/db/store";

type Tone = "sage" | "mustard" | "brick" | "neutral";
type InsightData = {
  title: string;
  body: string;
  tone: Tone;
  icon: "trending-up" | "trending-down" | "alert" | "check" | "flag";
  evidence: string[];
};

export default async function InsightsPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) notFound();

  const [tasks, webhooks, usage] = await Promise.all([
    db.listTasks(o.id),
    db.listWebhooks(o.id),
    db.listUsage(o.id),
  ]);

  const insights: InsightData[] = [];

  const blocked = tasks.filter((t) => t.status === "blocked");
  if (blocked.length > 0) {
    insights.push({
      title: `${blocked.length} task${blocked.length > 1 ? "s" : ""} blocked`,
      body: "These tasks are waiting on input or a dependency. Each day blocked is a day delayed.",
      tone: "brick",
      icon: "alert",
      evidence: blocked.slice(0, 3).map((t) => t.title),
    });
  }

  const failingWebhooks = webhooks.filter((w) => w.status === "failing");
  if (failingWebhooks.length > 0) {
    insights.push({
      title: `${failingWebhooks.length} webhook${failingWebhooks.length > 1 ? "s" : ""} failing`,
      body: "Failing webhooks mean agents aren't receiving events. Check the endpoint URLs and reachability.",
      tone: "brick",
      icon: "alert",
      evidence: failingWebhooks.map((w) => `${w.name} (${w.failure_count} failures)`),
    });
  }

  const inReview = tasks.filter((t) => t.status === "in_review");
  if (inReview.length > 0) {
    insights.push({
      title: `${inReview.length} task${inReview.length > 1 ? "s" : ""} waiting for review`,
      body: "Agent work is staged and ready for your approval. The sooner you review, the faster the loop runs.",
      tone: "mustard",
      icon: "flag",
      evidence: inReview.slice(0, 3).map((t) => t.title),
    });
  }

  const recentlyDone = tasks.filter((t) => {
    if (t.status !== "done") return false;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    return t.updated_at >= sevenDaysAgo;
  });
  if (recentlyDone.length > 0) {
    insights.push({
      title: `${recentlyDone.length} task${recentlyDone.length > 1 ? "s" : ""} completed this week`,
      body: "Good velocity. Keep a backlog of small tasks so agents stay active.",
      tone: "sage",
      icon: "check",
      evidence: recentlyDone.slice(0, 3).map((t) => t.title),
    });
  }

  const totalCost = usage.reduce((s, u) => s + u.cost_usd, 0);
  if (totalCost > 0) {
    insights.push({
      title: `$${totalCost.toFixed(2)} agent spend this month`,
      body: "Usage is being tracked. Review the Costs page for a per-agent breakdown.",
      tone: "neutral",
      icon: "trending-up",
      evidence: [`${usage.length} runs logged`],
    });
  }

  if (insights.length === 0) {
    insights.push({
      title: "No signals yet",
      body: "Once agents start running tasks, insights will appear here automatically.",
      tone: "neutral",
      icon: "flag",
      evidence: ["Create your first task to get started"],
    });
  }

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-5">
        <header>
          <Eyebrow>Workspace</Eyebrow>
          <PageTitle className="inline-flex items-center gap-2">
            <Sparkles className="size-5 text-ink-muted" /> Insights
          </PageTitle>
          <Hint>
            Live signals from your workspace — blocked work, review queue,
            recent completions, and spend.
          </Hint>
        </header>

        <ul className="space-y-3">
          {insights.map((i, idx) => (
            <InsightCard key={idx} i={i} />
          ))}
        </ul>
      </div>
    </div>
  );
}

const ICONS = {
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
  "alert": AlertTriangle,
  "check": CheckCircle2,
  "flag": Flag,
};

function InsightCard({ i }: { i: InsightData }) {
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
  const Icon = ICONS[i.icon];
  return (
    <Card className={cls}>
      <CardBody>
        <div className="flex items-start gap-3">
          <span className={`size-8 rounded-md inline-flex items-center justify-center shrink-0 ${inkCls}`}>
            <Icon className="size-4" />
          </span>
          <div className="min-w-0">
            <div className={`text-base font-medium tracking-tight ${inkCls}`}>
              {i.title}
            </div>
            <p className="text-sm text-ink mt-1 leading-relaxed">{i.body}</p>
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
