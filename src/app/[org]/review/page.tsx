import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye, CheckCircle2 } from "lucide-react";
import { db } from "@/lib/db/store";
import EmptyState from "@/components/empty-state";

const STATUS_LABEL: Record<string, string> = {
  in_review: "Review",
  blocked: "Blocked",
};

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) notFound();

  const tasks = await db.listTasks(o.id);
  const agents = await db.listAgents(o.id);
  const agentName = new Map(agents.map((a) => [a.id, a.name]));

  const queue = tasks
    .filter((t) => t.status === "in_review" || t.status === "blocked")
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));

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
        <header>
          <h1 className="text-xl tracking-tight inline-flex items-center gap-2">
            <Eye className="size-5 text-ink-muted" /> Review
          </h1>
          <p className="text-sm text-ink-muted">
            Things agents prepared that need a human decision before they ship, send, or merge.
          </p>
        </header>

        {queue.length === 0 ? (
          <EmptyState
            Icon={CheckCircle2}
            title="Queue is clear"
            body="No tasks waiting for review or blocked. Agent work in progress will surface here."
          />
        ) : (
          <>
            <ul className="rounded-lg border border-line/70 bg-paper divide-y divide-line/60">
              {queue.map((t) => {
                const label = STATUS_LABEL[t.status] ?? t.status;
                const agent = t.agent_id ? agentName.get(t.agent_id) : null;
                return (
                  <li key={t.id}>
                    <Link
                      href={`/${org}/tasks/${t.id}`}
                      className="px-4 py-3 flex items-start gap-3 hover:bg-canvas"
                    >
                      <span className="size-7 rounded-md bg-cream inline-flex items-center justify-center text-ink-muted shrink-0">
                        <Eye className="size-3.5" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-2xs uppercase tracking-wider text-ink-muted">
                            Task
                          </span>
                          {agent && (
                            <span className="text-2xs text-ink-soft">
                              · by {agent} · {relTime(t.updated_at)}
                            </span>
                          )}
                        </div>
                        <div className="text-base font-medium tracking-tight mt-0.5">
                          {t.title}
                        </div>
                        {t.description && (
                          <div className="text-sm text-ink-muted mt-0.5 truncate">
                            {t.description}
                          </div>
                        )}
                      </div>
                      <span
                        className={`text-2xs uppercase rounded px-1.5 py-0.5 shrink-0 self-center ${
                          t.status === "blocked"
                            ? "bg-brick/20 text-brick-ink"
                            : "bg-mustard/30 text-mustard-ink"
                        }`}
                      >
                        {label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <p className="text-xs text-ink-muted text-center">
              {queue.length} item{queue.length !== 1 ? "s" : ""} waiting.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
