import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Card,
  Eyebrow,
  Hint,
  PageTitle,
} from "@/components/ui/primitives";
import { Bell, AlertTriangle, Clock, CheckCircle2, Flag } from "lucide-react";
import { db } from "@/lib/db/store";

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) notFound();

  const [tasks, agents, webhooks] = await Promise.all([
    db.listTasks(o.id),
    db.listAgents(o.id),
    db.listWebhooks(o.id),
  ]);
  const agentName = new Map(agents.map((a) => [a.id, a.name]));

  type Notif = {
    id: string;
    icon: "alert" | "clock" | "check" | "flag" | "bell";
    actor: string;
    body: string;
    href: string;
    unread: boolean;
  };

  const notifs: Notif[] = [];

  for (const t of tasks.filter((x) => x.status === "in_review")) {
    const by = t.agent_id ? (agentName.get(t.agent_id) ?? "Agent") : "Agent";
    notifs.push({ id: `rev-${t.id}`, icon: "clock", actor: by, body: `submitted "${t.title}" for review`, href: `tasks/${t.id}`, unread: true });
  }
  for (const t of tasks.filter((x) => x.status === "blocked")) {
    const by = t.agent_id ? (agentName.get(t.agent_id) ?? "Agent") : "Agent";
    notifs.push({ id: `blk-${t.id}`, icon: "alert", actor: by, body: `blocked on "${t.title}"`, href: `tasks/${t.id}`, unread: true });
  }
  for (const w of webhooks.filter((x) => x.status === "failing")) {
    notifs.push({ id: `wh-${w.id}`, icon: "alert", actor: "System", body: `Webhook "${w.name}" is failing (${w.failure_count} errors)`, href: `webhooks`, unread: true });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  for (const t of tasks.filter((x) => x.status === "done" && x.updated_at >= sevenDaysAgo).slice(0, 5)) {
    const by = t.agent_id ? (agentName.get(t.agent_id) ?? "Agent") : "Agent";
    notifs.push({ id: `done-${t.id}`, icon: "check", actor: by, body: `completed "${t.title}"`, href: `tasks/${t.id}`, unread: false });
  }

  const ICONS = { alert: AlertTriangle, clock: Clock, check: CheckCircle2, flag: Flag, bell: Bell };
  const relTime = (iso: string) => {
    const ms = Date.now() - new Date(iso).getTime();
    if (ms < 60_000) return "just now";
    if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
    if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
    return `${Math.floor(ms / 86_400_000)}d ago`;
  };

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <Eyebrow>Activity</Eyebrow>
            <PageTitle className="inline-flex items-center gap-2">
              <Bell className="size-5 text-ink-muted" /> Notifications
            </PageTitle>
            <Hint>
              Mentions, finished agent runs, build status, and items waiting on you.
            </Hint>
          </div>
        </header>

        <Card>
          <ul className="divide-y divide-line/60">
            {notifs.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-ink-muted">
                All clear — no pending reviews, blockers, or webhook errors.
              </li>
            ) : (
              notifs.map((n) => {
                const Icon = ICONS[n.icon];
                const task = tasks.find((t) => n.href.includes(t.id));
                return (
                  <li key={n.id} className={n.unread ? "bg-mustard/5" : ""}>
                    <Link
                      href={`/${org}/${n.href}`}
                      className="px-4 py-3 flex items-start gap-3 hover:bg-canvas"
                    >
                      <span className="size-7 rounded-md bg-cream inline-flex items-center justify-center text-ink-muted shrink-0">
                        <Icon className="size-3.5" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm">
                          <span className="font-medium text-ink">{n.actor}</span>{" "}
                          <span className="text-ink-muted">{n.body}</span>
                        </div>
                        <div className="text-xs text-ink-soft mt-0.5">
                          {task ? relTime(task.updated_at) : ""}
                        </div>
                      </div>
                      {n.unread && (
                        <span className="size-1.5 rounded-full bg-mustard-ink shrink-0 mt-1.5" />
                      )}
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
