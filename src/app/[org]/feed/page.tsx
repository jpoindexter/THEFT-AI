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
  GitPullRequest,
  Sparkles,
  Mail,
  Calendar,
  Bell,
  CheckCircle2,
  AlertTriangle,
  MessageCircle,
} from "lucide-react";

type Item = {
  id: string;
  Icon: React.ComponentType<{ className?: string }>;
  actor: string;
  body: string;
  href: string;
  time: string;
  tone: "neutral" | "sage" | "mustard" | "brick";
  pinned?: boolean;
};

const FEED: Item[] = [
  {
    id: "f1",
    Icon: GitPullRequest,
    actor: "Engineer",
    body: "opened PR #42 — feat/subscriptions-table (12 files, +320/-12)",
    href: "publishing",
    time: "2m",
    tone: "sage",
    pinned: true,
  },
  {
    id: "f2",
    Icon: AlertTriangle,
    actor: "System",
    body: "Inbound parsing webhook returning 503 — see Diagnostics",
    href: "diagnostics",
    time: "8m",
    tone: "brick",
    pinned: true,
  },
  {
    id: "f3",
    Icon: Mail,
    actor: "Marketing",
    body: "drafted Launch broadcast — May (1,240 subscribers, awaits approval)",
    href: "library",
    time: "23m",
    tone: "mustard",
  },
  {
    id: "f4",
    Icon: MessageCircle,
    actor: "Sales",
    body: "received demo request from kim@encompass.com",
    href: "inbox/sales",
    time: "1h",
    tone: "neutral",
  },
  {
    id: "f5",
    Icon: CheckCircle2,
    actor: "Engineer",
    body: "merged PR #38 — fix/canvas-pan",
    href: "publishing",
    time: "3h",
    tone: "sage",
  },
  {
    id: "f6",
    Icon: Calendar,
    actor: "Operations",
    body: "queued routine: Weekly status brief, Monday 9am",
    href: "routines/weekly_status",
    time: "5h",
    tone: "neutral",
  },
  {
    id: "f7",
    Icon: Bell,
    actor: "Cofounder",
    body: "@you flagged pricing thesis as durable memory",
    href: "memory",
    time: "1d",
    tone: "mustard",
  },
  {
    id: "f8",
    Icon: Sparkles,
    actor: "System",
    body: "What's new: command palette + dark mode shipped",
    href: "whats-new",
    time: "1d",
    tone: "neutral",
  },
];

export default async function FeedPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const pinned = FEED.filter((f) => f.pinned);
  const rest = FEED.filter((f) => !f.pinned);
  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <header>
          <Eyebrow>Workspace</Eyebrow>
          <PageTitle>Feed</PageTitle>
          <Hint>
            One place for everything that happened. Pinned items stay until you
            dismiss them.
          </Hint>
        </header>

        {pinned.length > 0 && (
          <section className="space-y-2">
            <Eyebrow>Pinned</Eyebrow>
            <div className="space-y-2">
              {pinned.map((f) => (
                <FeedCard key={f.id} f={f} org={org} />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-2">
          <Eyebrow>Recent</Eyebrow>
          <div className="space-y-2">
            {rest.map((f) => (
              <FeedCard key={f.id} f={f} org={org} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function FeedCard({ f, org }: { f: Item; org: string }) {
  const Icon = f.Icon;
  return (
    <Link href={`/${org}/${f.href}`}>
      <Card className="hover:border-line-strong">
        <CardBody className="flex items-start gap-3 !p-3">
          <span className="size-7 rounded-md bg-cream inline-flex items-center justify-center text-ink-muted shrink-0">
            <Icon className="size-3.5" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm">
              <span className="font-medium text-ink">{f.actor}</span>{" "}
              <span className="text-ink-muted">{f.body}</span>
            </div>
            <div className="text-xs text-ink-soft mt-0.5 inline-flex items-center gap-1.5">
              {f.time} ago
              {f.pinned && <Pill tone="mustard">Pinned</Pill>}
              {!f.pinned && f.tone !== "neutral" && (
                <Pill tone={f.tone}>{f.tone === "sage" ? "good" : f.tone === "mustard" ? "watch" : "issue"}</Pill>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
