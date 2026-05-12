import Link from "next/link";
import {
  Card,
  CardBody,
  Eyebrow,
  Hint,
  PageTitle,
  Pill,
} from "@/components/ui/primitives";
import { Plus, FileText, ArrowRight } from "lucide-react";

const GROUPS = [
  {
    title: "Engineering",
    items: [
      {
        slug: "fix-bug",
        name: "Fix a bug",
        body: "Reproduce, root-cause, fix, write a regression test, open PR.",
      },
      {
        slug: "add-stripe-checkout",
        name: "Add Stripe checkout",
        body: "Wire Stripe Checkout for one-off + subscriptions, with webhooks.",
      },
      {
        slug: "schema-migration",
        name: "Add schema column",
        body: "Reversible Postgres migration + backfill plan + types update.",
      },
    ],
  },
  {
    title: "Marketing",
    items: [
      {
        slug: "launch-broadcast",
        name: "Launch broadcast email",
        body: "Three subject variants, body draft, send-time decision.",
      },
      {
        slug: "weekly-digest",
        name: "Weekly digest",
        body: "Pull shipped work + open PRs + customer notes into a digest.",
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        slug: "monthly-close",
        name: "Monthly finance close",
        body: "Reconcile Stripe + AWS + invoices, post variance vs forecast.",
      },
      {
        slug: "user-research",
        name: "Run a user-research interview",
        body: "Recruit, interview, transcribe, synthesise, file the JTBD.",
      },
    ],
  },
];

export default async function TemplatesPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-5">
        <header className="flex items-start justify-between gap-3">
          <div>
            <Eyebrow>Workspace</Eyebrow>
            <PageTitle className="inline-flex items-center gap-2">
              <FileText className="size-5 text-ink-muted" /> Task templates
            </PageTitle>
            <Hint>
              Pre-written briefs for common work. Each template lands as a
              draft task with the right agent + plan/execute mode.
            </Hint>
          </div>
          <Link
            href={`/${org}/tasks/new`}
            className="inline-flex items-center gap-1 rounded-md border border-line bg-paper px-3 py-1.5 text-sm hover:border-line-strong"
          >
            <Plus className="size-3.5" /> Blank task
          </Link>
        </header>

        {GROUPS.map((g) => (
          <section key={g.title} className="space-y-2">
            <Eyebrow>{g.title}</Eyebrow>
            <div className="grid grid-cols-3 gap-3">
              {g.items.map((t) => (
                <TemplateCard
                  key={t.slug}
                  org={org}
                  group={g.title}
                  slug={t.slug}
                  name={t.name}
                  body={t.body}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function TemplateCard({
  org,
  group,
  slug,
  name,
  body,
}: {
  org: string;
  group: string;
  slug: string;
  name: string;
  body: string;
}) {
  return (
    <Link href={`/${org}/templates/${slug}`}>
      <Card className="hover:border-line-strong h-full">
        <CardBody className="!p-3 space-y-1.5">
          <Pill>{group}</Pill>
          <div className="text-sm font-medium tracking-tight">{name}</div>
          <Hint>{body}</Hint>
          <div className="text-xs text-ink-muted inline-flex items-center gap-1 mt-1">
            Use template <ArrowRight className="size-3" />
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
