import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/store";
import { ChevronRight, Plus } from "lucide-react";

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
            <p className="text-[12px] text-ink-muted">
              Track running work, review completed work, and open task details.
            </p>
          </div>
          <button className="inline-flex items-center gap-1 rounded-md bg-ink text-paper px-3 py-1.5 text-[12px]">
            <Plus className="size-3.5" /> New task
          </button>
        </header>

        {SECTIONS.map((s) => {
          const bucket = buckets[s.key];
          return (
            <section key={s.key} className="space-y-2">
              <div>
                <h2 className="text-[13px] font-medium tracking-tight">
                  {s.label}
                  <span className="ml-2 text-[10px] text-ink-soft">
                    {bucket.length}
                  </span>
                </h2>
                <p className="text-[11px] text-ink-muted">{s.description}</p>
              </div>
              {bucket.length > 0 ? (
                <ul className="rounded-lg border border-line/70 bg-paper divide-y divide-line/60">
                  {bucket.map((t) => (
                    <li key={t.id}>
                      <Link
                        href={`/${orgSlug}/tasks/${t.id}`}
                        className="flex items-center justify-between gap-3 px-3 py-2 text-[13px] hover:bg-canvas transition-colors"
                      >
                        <span className="truncate">{t.title}</span>
                        <span className="inline-flex items-center gap-2 text-[10px] text-ink-muted shrink-0">
                          <span className="uppercase">{t.status}</span>
                          <ChevronRight className="size-3 text-ink-soft" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-lg border border-line/70 bg-paper px-3 py-4 text-[12px] text-ink-muted">
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
