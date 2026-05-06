import { notFound } from "next/navigation";
import { db } from "@/lib/db/store";
import Link from "next/link";
import { ArrowLeft, MoreHorizontal } from "lucide-react";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ org: string; task: string }>;
}) {
  const { org: orgSlug, task: taskId } = await params;
  const organization = await db.getOrgBySlug(orgSlug);
  if (!organization) notFound();
  const tasks = await db.listTasks(organization.id);
  const task = tasks.find((t) => t.id === taskId);
  if (!task) notFound();
  const agents = await db.listAgents(organization.id);
  const agent = task.agent_id
    ? agents.find((a) => a.id === task.agent_id)
    : null;

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between text-[12px] text-stone-500">
          <Link
            href={`/${orgSlug}`}
            className="inline-flex items-center gap-1 hover:text-stone-900"
          >
            <ArrowLeft className="size-3" /> Back to canvas
          </Link>
          <button
            type="button"
            className="size-7 rounded-md hover:bg-stone-200/60 inline-flex items-center justify-center"
            aria-label="More"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </div>

        <header className="space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-stone-400">
            Task · {task.status}
          </div>
          <h1 className="text-xl tracking-tight">{task.title}</h1>
          {task.description && (
            <p className="text-[13px] text-stone-600 leading-relaxed pt-1 max-w-2xl">
              {task.description}
            </p>
          )}
        </header>

        <div className="grid grid-cols-3 gap-3 text-[12px]">
          <Stat label="Agent" value={agent?.name ?? "Auto-assign"} />
          <Stat label="Mode" value={task.mode} />
          <Stat label="Priority" value={task.priority} />
        </div>

        {task.mode === "plan" && (
          <section className="rounded-lg border border-stone-200/70 bg-white p-4 space-y-3">
            <div className="text-[10px] uppercase tracking-wider text-stone-400">
              Plan
            </div>
            <ol className="space-y-2">
              {(["Read related artifacts", "Draft outline", "Confirm with you", "Execute outline"] as const).map(
                (step, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-[13px]"
                  >
                    <span className="size-5 rounded-full border border-stone-300 inline-flex items-center justify-center text-[10px] text-stone-500 mt-0.5 shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-stone-700">{step}</span>
                  </li>
                ),
              )}
            </ol>
            <div className="flex justify-end gap-2 pt-1">
              <button className="text-[11px] rounded-md border border-stone-200 px-2 py-1 hover:border-stone-400">
                Reject
              </button>
              <button className="text-[11px] rounded-md bg-stone-900 text-white px-2 py-1">
                Approve & execute
              </button>
            </div>
          </section>
        )}

        <section className="rounded-lg border border-stone-200/70 bg-white p-4 space-y-3">
          <div className="text-[10px] uppercase tracking-wider text-stone-400">
            Conversation
          </div>
          <div className="text-[12px] text-stone-500">
            Conversation appears here once the agent runs the task.
          </div>
        </section>

        <section className="rounded-lg border border-stone-200/70 bg-white p-4 space-y-3">
          <div className="text-[10px] uppercase tracking-wider text-stone-400">
            Workflow
          </div>
          <div className="text-[12px] text-stone-500">
            Generated artifacts, approvals, and review items appear here.
          </div>
        </section>

        <section className="rounded-lg border border-stone-200/70 bg-white p-4 flex items-center justify-between">
          <div className="text-[12px]">
            <div className="font-medium">Created</div>
            <div className="text-stone-500">
              {new Date(task.created_at).toLocaleString()}
            </div>
          </div>
          <div className="flex gap-1">
            <button className="text-[11px] rounded-md border border-stone-200 px-2 py-1 hover:border-stone-400">
              Report issue
            </button>
            <button className="text-[11px] rounded-md bg-stone-900 text-white px-2 py-1">
              Mark complete
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-stone-200/70 bg-white p-3">
      <div className="text-[10px] uppercase tracking-wider text-stone-400">
        {label}
      </div>
      <div className="text-[13px] mt-0.5">{value}</div>
    </div>
  );
}
