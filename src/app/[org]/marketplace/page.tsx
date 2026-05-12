import Link from "next/link";
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
  Cable,
  Cpu,
  Megaphone,
  ShoppingBag,
  Search,
} from "lucide-react";

const SKILLS = [
  {
    slug: "icp-brief-author",
    name: "ICP brief author",
    by: "THEFT",
    body: "Generates a one-page ICP brief from your business plan + recent customer-development notes.",
    tone: "sage" as const,
    cat: "Marketing",
  },
  {
    slug: "test-flake-triager",
    name: "Test flake triager",
    by: "Engineering",
    body: "Detects flakes in CI history, opens a labeled issue with reproducer steps.",
    tone: "neutral" as const,
    cat: "Engineering",
  },
  {
    slug: "burn-watcher",
    name: "Burn watcher",
    by: "Finance",
    body: "Reads month-over-month spend, posts a one-bullet variance note when burn deviates from forecast.",
    tone: "mustard" as const,
    cat: "Finance",
  },
];

const INTEGRATIONS = [
  {
    slug: "linear",
    name: "Linear",
    body: "Issues, projects, cycles. Read + write.",
    cat: "PM",
    Icon: Cable,
  },
  {
    slug: "notion",
    name: "Notion",
    body: "Pages, databases, search.",
    cat: "Docs",
    Icon: Cable,
  },
  {
    slug: "stripe",
    name: "Stripe",
    body: "Checkout, subscriptions, billing.",
    cat: "Billing",
    Icon: Cable,
  },
];

const AGENTS = [
  {
    slug: "researcher",
    name: "Researcher",
    body: "Customer development interviews + qualitative synthesis. Produces JTBD briefs.",
    Icon: Cpu,
    cat: "Discovery",
  },
  {
    slug: "fundraiser",
    name: "Fundraiser",
    body: "Investor pipeline, outreach, narrative drafts. Pulls from Memory + Cap table.",
    Icon: Megaphone,
    cat: "Sales",
  },
];

export default async function MarketplacePage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-5">
        <header>
          <Eyebrow>Workspace</Eyebrow>
          <PageTitle className="inline-flex items-center gap-2">
            <ShoppingBag className="size-5 text-ink-muted" /> Marketplace
          </PageTitle>
          <Hint>
            Browse pre-built skills, ready-to-attach integrations, and
            community agents. One-click install into your workspace.
          </Hint>
        </header>

        <div className="flex items-center gap-2 rounded-md border border-line bg-paper px-3 py-1.5">
          <Search className="size-3.5 text-ink-soft" />
          <input
            placeholder="Search marketplace…"
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-ink-soft"
          />
        </div>

        <Section
          title="Skills"
          Icon={Sparkles}
          empty="None featured this week."
          items={SKILLS.map((s) => ({
            ...s,
            href: `/${org}/skills/${s.slug}`,
            Icon: Sparkles,
          }))}
        />

        <Section
          title="Integrations"
          Icon={Cable}
          empty="No new integrations."
          items={INTEGRATIONS.map((i) => ({
            slug: i.slug,
            name: i.name,
            body: i.body,
            cat: i.cat,
            tone: "neutral" as const,
            by: "Built-in",
            href: `/${org}/integrations/${i.slug}`,
            Icon: i.Icon,
          }))}
        />

        <Section
          title="Agents"
          Icon={Cpu}
          empty="None right now."
          items={AGENTS.map((a) => ({
            slug: a.slug,
            name: a.name,
            body: a.body,
            cat: a.cat,
            tone: "neutral" as const,
            by: "Community",
            href: `/${org}/agents/new`,
            Icon: a.Icon,
          }))}
        />
      </div>
    </div>
  );
}

type Item = {
  slug: string;
  name: string;
  body: string;
  cat: string;
  tone: "neutral" | "sage" | "mustard";
  by: string;
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
};

function Section({
  title,
  Icon,
  items,
  empty,
}: {
  title: string;
  Icon: React.ComponentType<{ className?: string }>;
  items: Item[];
  empty: string;
}) {
  return (
    <section className="space-y-2">
      <Eyebrow className="inline-flex items-center gap-1.5">
        <Icon className="size-3" /> {title}
      </Eyebrow>
      {items.length === 0 ? (
        <Hint>{empty}</Hint>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {items.map((i) => (
            <ItemCard key={i.slug} item={i} />
          ))}
        </div>
      )}
    </section>
  );
}

function ItemCard({ item }: { item: Item }) {
  const Icon = item.Icon;
  return (
    <Link href={item.href}>
      <Card className="hover:border-line-strong h-full">
        <CardBody className="!p-3 space-y-1.5">
          <div className="flex items-center gap-2">
            <Icon className="size-4 text-ink-muted" />
            <Pill tone={item.tone}>{item.cat}</Pill>
          </div>
          <div className="text-sm font-medium tracking-tight">{item.name}</div>
          <Hint>{item.body}</Hint>
          <div className="text-2xs text-ink-soft">by {item.by}</div>
        </CardBody>
      </Card>
    </Link>
  );
}
