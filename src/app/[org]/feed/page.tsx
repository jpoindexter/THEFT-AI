import Link from "next/link";
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
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
} from "lucide-react";
import { db } from "@/lib/db/store";

export default async function FeedPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) notFound();

  const [tasks, artifacts, agents] = await Promise.all([
    db.listTasks(o.id),
    db.listArtifacts(o.id),
    db.listAgents(o.id),
  ]);
  const agentName = new Map(agents.map((a) => [a.id, a.name]));

  type FeedEntry = {
    id: string;
    icon: "check" | "alert" | "clock" | "file" | "spark";
    actor: string;
    body: string;
    href: string;
    time: string;
    tone: "neutral" | "sage" | "mustard" | "brick";
  };

  const relTime = (iso: string) => {
    const ms = Date.now() - new Date(iso).getTime();
    if (ms < 60_000) return "just now";
    if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
    if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
    return `${Math.floor(ms / 86_400_000)}d ago`;
  };

  const feed: FeedEntry[] = [];

  for (const t of tasks.slice(-40)) {
    const actor = t.agent_id ? (agentName.get(t.agent_id) ?? "Agent") : "You";
    if (t.status === "done") {
      feed.push({ id: `t-done-${t.id}`, icon: "check", actor, body: `completed "${t.title}"`, href: `tasks/${t.id}`, time: t.updated_at, tone: "sage" });
    } else if (t.status === "blocked") {
      feed.push({ id: `t-blocked-${t.id}`, icon: "alert", actor, body: `blocked on "${t.title}"`, href: `tasks/${t.id}`, time: t.updated_at, tone: "brick" });
    } else if (t.status === "in_review") {
      feed.push({ id: `t-review-${t.id}`, icon: "clock", actor, body: `submitted "${t.title}" for review`, href: `tasks/${t.id}`, time: t.updated_at, tone: "mustard" });
    } else if (t.status === "in_progress") {
      feed.push({ id: `t-prog-${t.id}`, icon: "spark", actor, body: `started "${t.title}"`, href: `tasks/${t.id}`, time: t.updated_at, tone: "neutral" });
    } else {
      feed.push({ id: `t-new-${t.id}`, icon: "clock", actor: "You", body: `created task "${t.title}"`, href: `tasks/${t.id}`, time: t.created_at, tone: "neutral" });
    }
  }

  for (const a of artifacts.slice(-20)) {
    feed.push({ id: `a-${a.id}`, icon: "file", actor: "Agent", body: `added "${a.name}" to Library`, href: `library`, time: a.created_at, tone: "neutral" });
  }

  feed.sort((a, b) => b.time.localeCompare(a.time));
  const items = feed.slice(0, 30);

  const ICONS = {
    check: CheckCircle2,
    alert: AlertTriangle,
    clock: Clock,
    file: FileText,
    spark: Sparkles,
  };

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <header>
          <Eyebrow>Workspace</Eyebrow>
          <PageTitle>Feed</PageTitle>
          <Hint>
            Task completions, reviews, artifacts, and blockers — newest first.
          </Hint>
        </header>

        {items.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-sm text-ink-muted text-center py-4">
                No activity yet. Create a task to get started.
              </p>
            </CardBody>
          </Card>
        ) : (
          <section className="space-y-2">
            <Eyebrow>Recent</Eyebrow>
            <div className="space-y-2">
              {items.map((f) => {
                const Icon = ICONS[f.icon];
                return (
                  <Link key={f.id} href={`/${org}/${f.href}`}>
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
                            {relTime(f.time)}
                            {f.tone !== "neutral" && (
                              <Pill tone={f.tone}>{f.tone}</Pill>
                            )}
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
