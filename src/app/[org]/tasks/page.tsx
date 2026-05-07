import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/store";
import { ChevronRight, Plus } from "lucide-react";
import EmptyState from "@/components/empty-state";

const SECTIONS: {
  key: "needs_action" | "ongoing" | "done" | "todo";
  label: string;
  description: string;
}[] = [
  {
    key: "needs_action",
    label: "Needs Action",
    description: "Work waiting on you — questions, approvals, reviewable output.",
  },
  {
    key: "ongoing",
    label: "Ongoing",
    description: "Tasks queued or actively running.",
  },
  {
    key: "done",
    label: "Done",
    description: "Tasks that finished and no longer need action.",
  },
  {
    key: "todo",
    label: "Todo",
    description: "Task rows that exist but are not currently running.",
  },
];

export default async function TasksPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org: orgSlug } = await params;
  const organization = await db.getOrgBySlug(orgSlug);
  if (!organization) notFound();
  const tasks = await db.listTasks(organization.id);

  const buckets: Record<string, typeof tasks> = {
    needs_action: tasks.filter(
      (t) => t.status === "in_review" || t.status === "blocked",
    ),
    ongoing: tasks.filter(
      (t) => t.status === "in_progress" || t.status === "todo",
    ),
    done: tasks.filter(
      (t) => t.status === "done" || t.status === "cancelled",
    ),
    todo: tasks.filter((t) => t.status === "backlog"),
  };

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl tracking-tight">Tasks</h1>
            <p className="text-sm text-ink-muted">
              Track running work, review completed work, and open task details.
            </p>
          </div>
          <Link
            href={`/${orgSlug}/tasks/new`}
            className="inline-flex items-center gap-1 rounded-md bg-ink text-paper px-3 py-1.5 text-sm"
          >
            <Plus className="size-3.5" /> New task
          </Link>
        </header>

        {tasks.length === 0 && (
          <EmptyState
            Icon={Plus}
            title="No tasks yet"
            body="Tasks are how you give an agent work. Either type one, or kick one off from a tech-tree node."
            actions={[
              { label: "New task", href: `/${orgSlug}/tasks/new`, primary: true },
              { label: "Open roadmap", href: `/${orgSlug}/roadmap` },
            ]}
          />
        )}

        {tasks.length > 0 && SECTIONS.map((s) => {
          const bucket = buckets[s.key];
          return (
            <section key={s.key} className="space-y-2">
              <div>
                <h2 className="text-base font-medium tracking-tight">
                  {s.label}
                  <span className="ml-2 text-2xs text-ink-soft">
                    {bucket.length}
                  </span>
                </h2>
                <p className="text-xs text-ink-muted">{s.description}</p>
              </div>
              {bucket.length > 0 ? (
                <ul className="rounded-lg border border-line/70 bg-paper divide-y divide-line/60">
                  {bucket.map((t) => (
                    <li key={t.id}>
                      <Link
                        href={`/${orgSlug}/tasks/${t.id}`}
                        className="flex items-center justify-between gap-3 px-3 py-2 text-base hover:bg-canvas transition-colors"
                      >
                        <span className="truncate">{t.title}</span>
                        <span className="inline-flex items-center gap-2 text-2xs text-ink-muted shrink-0">
                          <span className="uppercase">{t.status}</span>
                          <ChevronRight className="size-3 text-ink-soft" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-lg border border-line/70 bg-paper px-3 py-4 text-sm text-ink-muted">
                  Nothing here yet.
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
