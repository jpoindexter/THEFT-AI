import { notFound } from "next/navigation";
import { db } from "@/lib/db/store";
import { LayoutGrid } from "lucide-react";
import AgentRunConsole from "@/components/agent-run-console";
import TaskCloseControls from "@/components/task-close-controls";
import TaskHandoff from "@/components/task-handoff";
import SubtaskTree from "@/components/task/subtask-tree";
import TaskContextBar from "@/components/task/task-context-bar";
import TaskStopButton from "@/components/task/task-stop-button";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ org: string; task: string }>;
}) {
  const { org: orgSlug, task: taskId } = await params;
  const organization = await db.getOrgBySlug(orgSlug);
  if (!organization) notFound();
  const [tasks, agents, departments] = await Promise.all([
    db.listTasks(organization.id),
    db.listAgents(organization.id),
    db.listDepartments(organization.id),
  ]);
  const task = tasks.find((t) => t.id === taskId);
  if (!task) notFound();
  const agent = task.agent_id ? agents.find((a) => a.id === task.agent_id) : null;
  const dept = task.department_id ? departments.find((d) => d.id === task.department_id) : null;
  const children = tasks
    .filter((t) => t.parent_task_id === taskId)
    .map((c) => ({
      id: c.id,
      title: c.title,
      status:
        c.status === "done"
          ? ("done" as const)
          : c.status === "in_progress"
            ? ("in_progress" as const)
            : c.status === "blocked"
              ? ("blocked" as const)
              : ("todo" as const),
      agent: agents.find((a) => a.id === c.agent_id)?.name ?? null,
    }));

  const statusText = computeStatusText(task.status, task.created_at, task.started_at);

  return (
    <div className="absolute inset-0">
      {/* Floating context bar — overlaid at top center */}
      <div className="absolute top-4 inset-x-0 flex justify-center z-10 pointer-events-none">
        <TaskContextBar
          organization={{ id: organization.id, slug: organization.slug }}
          agentName={agent?.name ?? null}
          taskTitle={task.title}
          deptSlug={dept?.slug ?? null}
        />
      </div>

      {/* Scrollable content */}
      <div className="absolute inset-0 overflow-y-auto">
        <div className="pt-16 pb-10 px-6">
          <div className="max-w-2xl mx-auto space-y-3">
            {/* Primary workflow card */}
            <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
              <div className="px-5 py-4 border-b border-line/70 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-base font-medium tracking-tight truncate">
                    {task.title}
                  </h1>
                  <div className="text-xs text-ink-muted mt-0.5">
                    {agent?.name ?? "Auto-assign"}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-ink-muted shrink-0 bg-canvas rounded-md px-2 py-1">
                  <LayoutGrid className="size-3" />
                  <span>{statusText}</span>
                  <TaskStopButton taskId={task.id} orgSlug={organization.slug} status={task.status} />
                </div>
              </div>
              <div className="p-5">
                <AgentRunConsole taskId={taskId} orgSlug={orgSlug} noCard />
              </div>
            </div>

            {/* Plan approval (only for plan mode) */}
            {task.mode === "plan" && (
              <section className="rounded-xl border border-line/70 bg-paper p-4 space-y-3">
                <div className="text-2xs uppercase tracking-wider text-ink-soft">Plan</div>
                <ol className="space-y-2">
                  {(
                    [
                      "Read related artifacts",
                      "Draft outline",
                      "Confirm with you",
                      "Execute outline",
                    ] as const
                  ).map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-base">
                      <span className="size-5 rounded-full border border-line-strong inline-flex items-center justify-center text-2xs text-ink-muted mt-0.5 shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-ink">{step}</span>
                    </li>
                  ))}
                </ol>
                <div className="flex justify-end gap-2 pt-1">
                  <button className="text-xs rounded-md border border-line px-2 py-1 hover:border-line-strong">
                    Reject
                  </button>
                  <button className="text-xs rounded-md bg-ink text-paper px-2 py-1">
                    Approve & execute
                  </button>
                </div>
              </section>
            )}

            <SubtaskTree org={orgSlug} parentId={task.id} subtasks={children} />

            {/* Meta row: handoff + timestamps */}
            <div className="rounded-xl border border-line/70 bg-paper p-4 space-y-3">
              <div className="flex items-center justify-between text-2xs text-ink-muted">
                <span>
                  Created {new Date(task.created_at).toLocaleString()}
                </span>
                <span>
                  Updated {new Date(task.updated_at).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 pt-1 border-t border-line/50">
                <TaskCloseControls taskId={task.id} status={task.status} />
                <TaskHandoff
                  org={orgSlug}
                  taskId={task.id}
                  currentAgentId={task.agent_id}
                  agents={agents.map((a) => ({ id: a.id, name: a.name }))}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function computeStatusText(status: string, createdAt: string, startedAt?: string | null): string {
  const baseline = (status === "in_progress" && startedAt) ? startedAt : createdAt;
  const elapsed = Date.now() - new Date(baseline).getTime();
  const totalSecs = Math.floor(elapsed / 1000);
  const mins = Math.floor(totalSecs / 60);
  const hrs = Math.floor(mins / 60);

  let timeStr: string;
  if (hrs >= 1) {
    const remMins = mins % 60;
    timeStr = remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
  } else if (mins >= 1) {
    timeStr = `${mins}m ${totalSecs % 60}s`;
  } else {
    timeStr = `${totalSecs}s`;
  }

  if (status === "in_progress") return `Running ${timeStr}`;
  if (status === "todo" || status === "backlog") return `Queued ${timeStr}`;
  if (status === "done") return "Finished turn";
  if (status === "in_review") return "In review";
  if (status === "blocked") return "Blocked";
  return status.replace(/_/g, " ");
}
