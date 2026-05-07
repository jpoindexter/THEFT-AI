"use client";

import { useEffect, useState } from "react";
import { Inbox, ChevronRight, Circle, RefreshCw } from "lucide-react";
import NewTaskDialog from "./new-task-dialog";

type Task = {
  id: string;
  title: string;
  status: string;
  agent_id: string | null;
  department_id: string | null;
};

type SuggestedNode = { id: string; title: string };

const DEPT_DOT: Record<string, string> = {
  engineering: "bg-[#c8a87a]",
  design: "bg-[#7ab4c8]",
  marketing: "bg-[#e0907a]",
  sales: "bg-[#7ac87a]",
  operations: "bg-[#7ac8b4]",
  finance: "bg-[#9a7ac8]",
  legal: "bg-[#4a5a6a]",
  support: "bg-[#e0a050]",
};

export default function TasksTab({
  organization,
}: {
  organization: { id: string; slug: string };
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [suggested, setSuggested] = useState<SuggestedNode[]>([]);
  const [open, setOpen] = useState(false);

  async function refresh() {
    const [tr, rr] = await Promise.all([
      fetch(`/api/${organization.slug}/tasks`).then((r) => r.json()),
      fetch(`/api/${organization.slug}/roadmap`).then((r) => r.json()),
    ]);
    setTasks(tr.tasks ?? []);
    const nodes: { id: string; title: string; status: string }[] = rr.nodes ?? [];
    setSuggested(nodes.filter((n) => n.status === "available").slice(0, 5));
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization.slug]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5 text-base">
      <div className="flex items-center gap-2">
        <span className="text-base tracking-tight text-ink">Tasks</span>
        <Inbox className="size-3.5 text-ink-muted" />
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs rounded-md bg-ink text-paper px-2.5 py-1 hover:opacity-90"
        >
          + New task
        </button>
      </div>

      {tasks.length > 0 && (
        <div>
          <div className="text-2xs uppercase tracking-[0.12em] text-ink-soft mb-2">
            Active Tasks
          </div>
          <ul className="space-y-1">
            {tasks.map((t) => (
              <TaskRow key={t.id} task={t} orgSlug={organization.slug} />
            ))}
          </ul>
        </div>
      )}

      {suggested.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xs uppercase tracking-[0.12em] text-ink-soft">
              Suggested Next
            </div>
            <button
              type="button"
              onClick={() => void refresh()}
              className="text-ink-soft hover:text-ink"
              aria-label="Refresh"
            >
              <RefreshCw className="size-3" />
            </button>
          </div>
          <ul className="space-y-1.5">
            {suggested.map((n) => (
              <li key={n.id} className="flex items-center gap-2 text-base text-ink">
                <Circle className="size-3 text-line-strong shrink-0" />
                <span>{n.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <NewTaskDialog
        organization={organization}
        open={open}
        onOpenChange={setOpen}
        onCreated={() => void refresh()}
      />
    </div>
  );
}

function TaskRow({
  task,
  orgSlug: _orgSlug,
}: {
  task: Task;
  orgSlug: string;
}) {
  const dotColor = DEPT_DOT[task.department_id ?? ""] ?? "bg-mustard";
  return (
    <li className="flex items-center gap-2 rounded-md hover:bg-canvas px-1 py-1.5 text-base text-ink cursor-pointer">
      <span className={`size-3 rounded-full shrink-0 ${dotColor}`} />
      <span className="truncate flex-1">{task.title}</span>
      <ChevronRight className="size-3.5 text-ink-soft shrink-0" />
    </li>
  );
}
