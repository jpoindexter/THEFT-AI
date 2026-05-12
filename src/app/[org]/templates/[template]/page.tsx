import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import {
  Card,
  CardBody,
  Eyebrow,
  Hint,
  PageTitle,
  Pill,
} from "@/components/ui/primitives";

type Template = {
  name: string;
  group: string;
  agent: string;
  mode: "plan" | "execute";
  prompt: string;
  steps: string[];
  artifacts: string[];
};

const TEMPLATES: Record<string, Template> = {
  "fix-bug": {
    name: "Fix a bug",
    group: "Engineering",
    agent: "Engineer",
    mode: "plan",
    prompt:
      "Reproduce the reported bug locally, root-cause, fix the smallest code path, write a regression test that fails before / passes after, then open a PR.",
    steps: [
      "Reproduce locally",
      "Root-cause (commit + line)",
      "Implement minimal fix",
      "Write regression test",
      "Open PR + verify preview",
    ],
    artifacts: ["PR", "Regression test", "Reproducer notes"],
  },
  "add-stripe-checkout": {
    name: "Add Stripe checkout",
    group: "Engineering",
    agent: "Engineer",
    mode: "plan",
    prompt:
      "Implement Stripe Checkout for the new pricing page. Cover one-off + subscription with webhooks. Verify the happy path locally before opening a PR.",
    steps: [
      "Add Stripe SDK + types",
      "Create /api/stripe/checkout + /api/stripe/webhook routes",
      "Wire pricing page CTA",
      "Verify with stripe-cli locally",
      "Open PR with rollback notes",
    ],
    artifacts: ["PR", "Webhook handler", "Pricing page"],
  },
  "schema-migration": {
    name: "Add schema column",
    group: "Engineering",
    agent: "Engineer",
    mode: "plan",
    prompt:
      "Add a Postgres column. Migration must be reversible. If a backfill is needed, ship it as a separate migration and queue it after the schema change.",
    steps: [
      "Draft forward + reverse migration",
      "Update types + ORM models",
      "Run migration on staging",
      "Backfill if needed",
      "Promote to production",
    ],
    artifacts: ["Migration", "Type updates", "Backfill script"],
  },
  "launch-broadcast": {
    name: "Launch broadcast email",
    group: "Marketing",
    agent: "Marketing",
    mode: "execute",
    prompt:
      "Draft a launch broadcast for the segment in Library. Three subject variants. Tight body. Decide send-time. Postmark, list segment matches segment ID.",
    steps: [
      "Pull launch facts from artifacts",
      "Draft body + 3 subject lines",
      "Pick send time",
      "Run through brand voice review",
      "Send for approval",
    ],
    artifacts: ["Email body", "Subject variants"],
  },
  "weekly-digest": {
    name: "Weekly digest",
    group: "Marketing",
    agent: "Marketing",
    mode: "execute",
    prompt:
      "Pull shipped work, open PRs, and customer notes from the past week. Compress to a 5-bullet digest. Tone: dry + factual.",
    steps: [
      "Fetch shipped work + open PRs",
      "Pull recent customer-development notes",
      "Compress to 5 bullets",
      "Send for approval",
    ],
    artifacts: ["Digest markdown"],
  },
  "monthly-close": {
    name: "Monthly finance close",
    group: "Operations",
    agent: "Finance",
    mode: "execute",
    prompt:
      "Reconcile Stripe payouts, AWS bill, and outstanding invoices. Post a close note to #finance with variance vs forecast.",
    steps: [
      "Pull Stripe payout + AWS bill",
      "Reconcile vs forecast",
      "Flag variance items",
      "Post close note",
    ],
    artifacts: ["Close note", "Variance report"],
  },
  "user-research": {
    name: "Run a user-research interview",
    group: "Operations",
    agent: "Researcher",
    mode: "plan",
    prompt:
      "Schedule a 30-min interview with a target user. Use the JTBD interview template. Transcribe, then synthesise into a JTBD brief in Library.",
    steps: [
      "Identify target user",
      "Schedule + remind 24h prior",
      "Run interview using JTBD template",
      "Transcribe + tag",
      "Synthesise JTBD brief",
    ],
    artifacts: ["Transcript", "JTBD brief"],
  },
};

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ org: string; template: string }>;
}) {
  const { org, template } = await params;
  const t = TEMPLATES[template];
  if (!t) notFound();

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <Link
          href={`/${org}/templates`}
          className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-3" /> Back to templates
        </Link>

        <header>
          <Eyebrow>
            {t.group} · {t.agent} · {t.mode}
          </Eyebrow>
          <PageTitle>{t.name}</PageTitle>
          <Hint>{t.prompt}</Hint>
        </header>

        <Card>
          <CardBody>
            <Eyebrow>Steps</Eyebrow>
            <ol className="space-y-1.5 mt-2">
              {t.steps.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm"
                >
                  <span className="size-5 rounded-full border border-line text-2xs text-ink-muted inline-flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Eyebrow>Artifacts produced</Eyebrow>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {t.artifacts.map((a) => (
                <Pill key={a} tone="sage">
                  {a}
                </Pill>
              ))}
            </div>
          </CardBody>
        </Card>

        <div className="flex justify-end">
          <Link
            href={`/${org}/tasks/new?template=${template}`}
            className="inline-flex items-center gap-1 rounded-md bg-ink text-paper px-3 py-1.5 text-sm hover:opacity-90"
          >
            <Plus className="size-3.5" /> Use template
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
