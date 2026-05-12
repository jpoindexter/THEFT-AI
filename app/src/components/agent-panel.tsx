"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import NewTaskDialog from "@/components/new-task-dialog";

type Org = { id: string; slug: string };

type SuggestedItem = {
  id: string;
  title: string;
  description: string | null;
};

type AgentTask = {
  id: string;
  title: string;
  status: string;
};

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

export default function AgentPanel({
  organization,
  deptSlug,
}: {
  organization: Org;
  deptSlug: string;
}) {
  const agentName = `${deptSlug.charAt(0).toUpperCase()}${deptSlug.slice(1)} Agent`;
  const dotClass = DEPT_DOT[deptSlug] ?? "bg-mustard";

  const [suggested, setSuggested] = useState<SuggestedItem[]>([]);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [tasksOpen, setTasksOpen] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    void Promise.all([
      fetch(`/api/${organization.slug}/roadmap`).then((r) => r.json()),
      fetch(`/api/${organization.slug}/tasks`).then((r) => r.json()),
    ]).then(([rr, tr]) => {
      const nodes: {
        id: string;
        title: string;
        what_becomes_true: string | null;
        status: string;
        department: string | null;
      }[] = rr.nodes ?? [];
      const available = nodes.filter(
        (n) => n.status === "available" && n.department === deptSlug,
      );
      setSuggested(
        available.slice(0, 4).map((n) => ({
          id: n.id,
          title: n.title,
          description: n.what_becomes_true,
        })),
      );

      const allTasks: AgentTask[] = tr.tasks ?? [];
      setTasks(allTasks.filter((t) => t.status !== "done" && t.status !== "cancelled"));
    });
  }, [organization.slug, deptSlug]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Agent header */}
      <div className="px-4 py-3 border-b border-line/70 flex items-center gap-2">
        <span className={`size-2 rounded-full shrink-0 ${dotClass}`} />
        <span className="text-sm font-medium text-ink flex-1">{agentName}</span>
        <span className="text-2xs text-ink-soft border border-line/70 rounded px-1.5 py-0.5">
          Default
        </span>
        {tasks.length > 0 && (
          <span className="text-2xs text-ink-soft border border-line/70 rounded px-1.5 py-0.5">
            {tasks.length} schedule{tasks.length === 1 ? "" : "s"}
          </span>
        )}
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="text-xs rounded-md bg-ink text-paper px-2.5 py-1 hover:opacity-90 transition-opacity"
        >
          New task
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Suggested Next */}
        {suggested.length > 0 && (
          <div>
            <div className="text-2xs uppercase tracking-[0.14em] text-ink-soft mb-2">
              Suggested Next
            </div>
            <ul className="space-y-2">
              {suggested.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setDialogOpen(true)}
                    className="w-full text-left rounded-lg border border-line/70 bg-canvas px-3 py-2.5 hover:border-line-strong transition-colors flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-sm text-ink leading-snug">{item.title}</div>
                      {item.description && (
                        <div className="text-xs text-ink-muted mt-0.5 leading-snug line-clamp-2">
                          {item.description}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="size-3.5 text-ink-soft shrink-0 mt-0.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tasks */}
        <div>
          <button
            type="button"
            onClick={() => setTasksOpen((o) => !o)}
            className="flex items-center gap-1.5 text-2xs uppercase tracking-[0.14em] text-ink-soft mb-2 hover:text-ink transition-colors"
          >
            {tasksOpen ? (
              <ChevronDown className="size-3" />
            ) : (
              <ChevronRight className="size-3" />
            )}
            Tasks
            {tasks.length > 0 && (
              <span className="ml-1 text-ink-soft">{tasks.length}</span>
            )}
          </button>
          {tasksOpen && tasks.length === 0 && (
            <p className="text-xs text-ink-muted pl-4">No scheduled tasks</p>
          )}
          {tasksOpen && tasks.length > 0 && (
            <ul className="space-y-1 pl-4">
              {tasks.map((t) => (
                <li key={t.id} className="text-xs text-ink-muted truncate">
                  {t.title}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Operator composer */}
        <div className="mt-auto pt-2">
          <div className="rounded-lg border border-line/70 bg-paper">
            <div className="px-3 py-2 border-b border-line/70 inline-flex items-center gap-1.5 text-xs">
              <span className="size-3 rounded-full bg-mustard/30 inline-block" />
              <span className="text-ink-muted">Operator</span>
            </div>
            <textarea
              placeholder="Ask Operator anything about your company…"
              rows={2}
              className="w-full resize-none bg-transparent px-3 py-2 text-sm focus:outline-none placeholder:text-ink-soft"
            />
          </div>
        </div>
      </div>

      <NewTaskDialog
        organization={organization}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
