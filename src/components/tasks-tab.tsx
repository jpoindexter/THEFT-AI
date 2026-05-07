"use client";

import { useEffect, useState } from "react";
import NewTaskDialog from "./new-task-dialog";

type Task = {
  id: string;
  title: string;
  status: string;
  agent_id: string | null;
};

const SUGGESTED = [
  "Build marketing website",
  "Sales positioning is ready",
  "Brand identity",
  "Setup social presence",
];

export default function TasksTab({
  organization,
}: {
  organization: { id: string; slug: string };
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [open, setOpen] = useState(false);

  async function refresh() {
    const r = await fetch(`/api/${organization.slug}/tasks`);
    const j = await r.json();
    setTasks(j.tasks ?? []);
  }

  useEffect(() => {
    void refresh();
  }, [organization.slug]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5 text-base">
      <div className="flex items-center justify-between">
        <div className="text-2xs uppercase tracking-[0.12em] text-ink-soft">
          Tasks
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs rounded-md border border-line bg-paper px-2 py-0.5 hover:border-line-strong"
        >
          + New task
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-md border border-line/80 bg-paper p-3 text-ink-muted text-sm">
          No active tasks. Tasks assigned to agents appear here.
        </div>
      ) : (
        <ul className="space-y-1.5">
          {tasks.map((t) => (
            <li
              key={t.id}
              className="rounded-md border border-line/80 bg-paper px-3 py-1.5 flex items-center justify-between"
            >
              <span className="text-sm">{t.title}</span>
              <span className="text-2xs uppercase text-ink-muted">
                {t.status}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div>
        <div className="text-2xs uppercase tracking-[0.12em] text-ink-soft mb-2">
          Suggested next
        </div>
        <div className="space-y-1">
          {SUGGESTED.map((s) => (
            <button
              key={s}
              className="w-full text-left rounded-md border border-line/80 bg-paper px-3 py-1.5 text-sm hover:border-line-strong transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <NewTaskDialog
        organization={organization}
        open={open}
        onOpenChange={setOpen}
        onCreated={refresh}
      />
    </div>
  );
}
