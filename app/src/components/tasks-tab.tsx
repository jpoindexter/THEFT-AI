"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Archive, Calendar, CheckCircle2, ChevronLeft, ChevronRight, Circle, HelpCircle, MoreHorizontal, RefreshCw, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NewTaskDialog from "./new-task-dialog";
import AgentRunConsole from "./agent-run-console";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  agent_id: string | null;
  department_id: string | null;
  created_at: string;
};

type Agent = { id: string; name: string };
type Department = { id: string; slug: string };
type SuggestedNode = { id: string; slug: string; title: string; stage?: string | null; department?: string | null };

function shortTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function AgentPixelAvatar({ size = 18 }: { size?: number }) {
  const px = [
    [0,0,1,1,0,0],[0,1,1,1,1,0],[1,1,0,0,1,1],
    [1,1,1,1,1,1],[0,1,0,0,1,0],[0,1,1,1,1,0],
  ];
  const cell = Math.floor(size / 6);
  return (
    <div style={{ display:"grid", gridTemplateColumns:`repeat(6,${cell}px)`, gap:"0.5px", width:size, height:size, flexShrink:0 }}>
      {px.flat().map((v, i) => (
        <div key={i} style={{ background: v ? "#4f6ef7" : "transparent", borderRadius:"0.5px" }} />
      ))}
    </div>
  );
}

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

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `about ${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  return `${Math.floor(hrs / 24)} day${Math.floor(hrs / 24) > 1 ? "s" : ""} ago`;
}

export default function TasksTab({
  organization,
  taskId,
  onSelectSuggested,
}: {
  organization: { id: string; slug: string };
  taskId?: string;
  onSelectSuggested?: (n: SuggestedNode) => void;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [suggested, setSuggested] = useState<SuggestedNode[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Task | null>(null);
  const [composerText, setComposerText] = useState("");
  const [taskComposerText, setTaskComposerText] = useState("");
  const [focusTask, setFocusTask] = useState<Task | null>(null);

  async function refresh() {
    const [tr, rr, ar, dr] = await Promise.all([
      fetch(`/api/${organization.slug}/tasks`).then((r) => r.json()),
      fetch(`/api/${organization.slug}/roadmap`).then((r) => r.json()),
      fetch(`/api/${organization.slug}/agents`).then((r) => r.json()),
      fetch(`/api/${organization.slug}/departments`).then((r) => r.json()),
    ]);
    setTasks(tr.tasks ?? []);
    setAgents(ar.agents ?? []);
    setDepartments(dr.departments ?? []);
    const nodes: { id: string; slug: string; title: string; status: string; stage?: string | null; department?: string | null }[] = rr.nodes ?? [];
    setSuggested(nodes.filter((n) => n.status === "available").slice(0, 5).map((n) => ({ id: n.id, slug: n.slug, title: n.title, stage: n.stage, department: n.department })));
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization.slug]);

  useEffect(() => {
    if (!taskId) { setFocusTask(null); return; }
    void fetch(`/api/${organization.slug}/tasks`)
      .then((r) => r.json())
      .then((d: { tasks: Task[] }) => {
        const t = d.tasks.find((x) => x.id === taskId);
        if (t) setFocusTask(t);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, organization.slug]);

  const router = useRouter();
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [statusSubmenuOpen, setStatusSubmenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [reportWhat, setReportWhat] = useState("");
  const [reportNotes, setReportNotes] = useState("");
  const [reportReplay, setReportReplay] = useState(true);
  const overflowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!overflowOpen) return;
    function handleClick(e: MouseEvent) {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setOverflowOpen(false);
        setStatusSubmenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [overflowOpen]);

  const deptById = new Map(departments.map((d) => [d.id, d.slug]));
  const agentById = new Map(agents.map((a) => [a.id, a.name]));

  if (taskId && focusTask) {
    return (
      <>
        {reportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="w-[440px] rounded-xl bg-paper border border-line/70 shadow-xl p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-base">Send a report to the team</div>
                  <div className="text-xs text-ink-muted mt-0.5">
                    We&apos;ll include the current context so the team can see what happened.
                  </div>
                </div>
                <button type="button" onClick={() => setReportOpen(false)} className="text-ink-muted hover:text-ink">
                  <X className="size-4" />
                </button>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">What happened?</label>
                <input
                  value={reportWhat}
                  onChange={(e) => setReportWhat(e.target.value)}
                  placeholder="Agent seems stuck"
                  className="w-full h-9 rounded-md border border-line bg-paper px-3 text-sm focus:outline-none focus:border-line-strong"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  placeholder="What felt wrong?"
                  rows={3}
                  className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm focus:outline-none focus:border-line-strong resize-none"
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs text-ink-muted font-medium">Included context</div>
                <ul className="text-xs text-ink-muted space-y-0.5">
                  <li>Source: Task agents panel</li>
                  <li>Current page attached</li>
                  <li>Session attached</li>
                  <li>Task attached</li>
                  <li>Replay attached if available</li>
                </ul>
              </div>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={reportReplay} onChange={(e) => setReportReplay(e.target.checked)} />
                Include the current replay if available
              </label>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setReportOpen(false)}
                  className="text-sm rounded-md border border-line px-3 py-1.5 hover:border-line-strong">
                  Cancel
                </button>
                <button type="button" onClick={() => { setReportOpen(false); setReportWhat(""); setReportNotes(""); }}
                  className="text-sm rounded-md bg-ink text-paper px-3 py-1.5 flex items-center gap-1.5 hover:opacity-90">
                  ↑ Send to team
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-line/70 flex items-center gap-2 shrink-0">
            <button
              type="button"
              aria-label="Back"
              onClick={() => router.back()}
              className="text-ink-muted hover:text-ink shrink-0"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-base font-medium truncate flex-1">{focusTask.title}</span>
            <button
              type="button"
              aria-label="Report an issue"
              onClick={() => setReportOpen(true)}
              className="text-ink-muted hover:text-ink shrink-0"
            >
              <HelpCircle className="size-3.5" />
            </button>
            <div className="relative shrink-0" ref={overflowRef}>
              <button
                type="button"
                aria-label="More options"
                onClick={() => { setOverflowOpen((v) => !v); setStatusSubmenuOpen(false); }}
                className="text-ink-muted hover:text-ink"
              >
                <MoreHorizontal className="size-4" />
              </button>
              {overflowOpen && (
                <div className="absolute right-0 top-6 z-50 w-44 rounded-lg border border-line/70 bg-paper shadow-md py-1 text-sm">
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-canvas text-red-600"
                    onClick={() => { setOverflowOpen(false); router.back(); }}
                  >
                    Archive task
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-canvas"
                    onClick={() => { setOverflowOpen(false); }}
                  >
                    Copy debug info
                  </button>
                  <div className="relative">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-canvas"
                      onClick={() => setStatusSubmenuOpen((v) => !v)}
                    >
                      Change status
                      <ChevronRight className="size-3.5 text-ink-muted" />
                    </button>
                    {statusSubmenuOpen && (
                      <div className="absolute right-full top-0 mr-1 w-44 rounded-lg border border-line/70 bg-paper shadow-md py-1">
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-canvas"
                          onClick={() => { setOverflowOpen(false); setStatusSubmenuOpen(false); }}
                        >
                          Mark complete
                        </button>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-canvas"
                          onClick={() => { setOverflowOpen(false); setStatusSubmenuOpen(false); }}
                        >
                          Mark requires attention
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {focusTask.description && (
            <p className="text-xs text-ink-muted leading-relaxed">{focusTask.description}</p>
          )}
          {focusTask.status === "blocked" && (
            <BlockerPanel orgSlug={organization.slug} />
          )}
          <AgentRunConsole taskId={taskId} orgSlug={organization.slug} noCard />
        </div>
        <div className="px-3 pb-3 pt-2 shrink-0 border-t border-line/70 flex items-center gap-2">
          <button
            type="button"
            aria-label="Add"
            className="size-6 rounded-md hover:bg-canvas inline-flex items-center justify-center text-ink-soft shrink-0"
          >
            +
          </button>
          <input
            value={taskComposerText}
            onChange={(e) => setTaskComposerText(e.target.value)}
            placeholder="Message this task and @ departments for context"
            className="flex-1 text-xs bg-transparent focus:outline-none placeholder:text-ink-soft min-w-0"
          />
          <button
            type="button"
            disabled={!taskComposerText.trim()}
            className="size-6 rounded-md bg-ink text-paper inline-flex items-center justify-center disabled:opacity-50 shrink-0"
            aria-label="Send"
          >
            ■
          </button>
        </div>
      </div>
    </>
  );
}

  return (
    <>
      <div className="flex-1 overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-base">
        {archiveOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20" onClick={() => setArchiveOpen(false)}>
            <div className="w-[480px] space-y-3" onClick={(e) => e.stopPropagation()}>
              <div className="text-base font-medium px-1">Archive</div>
              <div className="rounded-xl border border-line/70 bg-paper px-6 py-8 text-center text-sm text-ink-muted">
                You have no archived tasks
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-base tracking-tight text-ink">Tasks</span>
          <Calendar className="size-3.5 text-ink-muted" />
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setArchiveOpen(true)}
            className="text-ink-soft hover:text-ink"
            aria-label="View archive"
          >
            <Archive className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-xs rounded-md bg-ink text-paper px-2.5 py-1 hover:opacity-90"
          >
            + New task
          </button>
        </div>

        {tasks.filter((t) => t.status !== "done" && t.status !== "cancelled").length > 0 && (
          <div>
            <div className="text-2xs uppercase tracking-[0.12em] text-ink-soft mb-2">Active Tasks</div>
            <ul className="space-y-0.5">
              {tasks.filter((t) => t.status !== "done" && t.status !== "cancelled").map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  agentName={agentById.get(t.agent_id ?? "") ?? null}
                  deptSlug={deptById.get(t.department_id ?? "") ?? null}
                  selected={selected?.id === t.id}
                  onSelect={() => setSelected(selected?.id === t.id ? null : t)}
                />
              ))}
            </ul>
          </div>
        )}

        {tasks.filter((t) => t.status === "done" || t.status === "cancelled").length > 0 && (
          <div>
            <div className="text-2xs uppercase tracking-[0.12em] text-ink-soft mb-2">Completed Tasks</div>
            <ul className="space-y-0.5">
              {tasks.filter((t) => t.status === "done" || t.status === "cancelled").map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  agentName={agentById.get(t.agent_id ?? "") ?? null}
                  deptSlug={deptById.get(t.department_id ?? "") ?? null}
                  selected={selected?.id === t.id}
                  onSelect={() => setSelected(selected?.id === t.id ? null : t)}
                />
              ))}
            </ul>
          </div>
        )}

        {suggested.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xs uppercase tracking-[0.12em] text-ink-soft">Suggested Next</div>
              <button type="button" onClick={() => void refresh()} className="text-ink-soft hover:text-ink" aria-label="Refresh">
                <RefreshCw className="size-3" />
              </button>
            </div>
            <ul className="space-y-1.5">
              {suggested.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => onSelectSuggested?.(n)}
                    className="flex items-center gap-2 text-base text-ink w-full text-left hover:text-ink-strong"
                  >
                    <Circle className="size-3 text-line-strong shrink-0" />
                    <span>{n.title}</span>
                  </button>
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

      {/* Operator inline composer */}
      <div className="px-4 pb-4 pt-2 shrink-0 border-t border-line/70">
        <div className="rounded-lg border border-line/70 bg-paper">
          <div className="px-3 py-2 border-b border-line/70 inline-flex items-center gap-1.5 text-xs">
            <span className="size-3 rounded-full bg-mustard/30 inline-block" />
            <span className="text-ink-muted">Operator</span>
          </div>
          <textarea
            value={composerText}
            onChange={(e) => setComposerText(e.target.value)}
            placeholder="Ask Operator anything about your company…"
            rows={2}
            className="w-full resize-none bg-transparent px-3 py-2 text-sm focus:outline-none placeholder:text-ink-soft"
          />
          <div className="flex items-center justify-between px-2 pb-2">
            <button type="button" aria-label="Add" className="size-6 rounded-md hover:bg-cream inline-flex items-center justify-center text-ink-soft">+</button>
            <button
              type="button"
              disabled={!composerText.trim()}
              onClick={async () => {
                if (!composerText.trim()) return;
                await fetch(`/api/${organization.slug}/cofounder`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ text: composerText }),
                });
                setComposerText("");
              }}
              className="size-6 rounded-md bg-line text-ink-muted inline-flex items-center justify-center disabled:opacity-50"
              aria-label="Send"
            >↑</button>
          </div>
        </div>
      </div>
      </div>

      {selected && (
        <TaskPopup
          task={selected}
          orgSlug={organization.slug}
          agentName={agentById.get(selected.agent_id ?? "") ?? null}
          deptSlug={deptById.get(selected.department_id ?? "") ?? null}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

const MOCK_BLOCKERS = [
  { required: 2, available: 1, balance: 1 },
  { required: 3, available: 1, balance: 1 },
  { required: 2, available: 1, balance: 1 },
];

function BlockerPanel({ orgSlug }: { orgSlug: string }) {
  return (
    <div className="space-y-2">
      {MOCK_BLOCKERS.map((b, i) => (
        <div key={i} className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-500 shrink-0" />
            <span className="text-sm font-semibold text-amber-900">Credits Exhausted</span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            Insufficient credits. Required: {b.required} credits.<br />
            Available: {b.available} credits.<br />
            Your current balance: {b.balance} credits.
          </p>
          <Link
            href={`/${orgSlug}/billing`}
            className="inline-flex items-center justify-center text-xs rounded-lg bg-ink text-paper px-3 py-1.5 hover:opacity-90"
          >
            Add Credits
          </Link>
        </div>
      ))}
    </div>
  );
}

function TaskRow({
  task,
  agentName,
  deptSlug,
  selected,
  onSelect,
}: {
  task: Task;
  agentName: string | null;
  deptSlug: string | null;
  selected: boolean;
  onSelect: () => void;
}) {
  const isDone = task.status === "done" || task.status === "cancelled";
  const isActive = task.status === "in_progress";
  const isBlocked = task.status === "blocked";
  const [hovered, setHovered] = useState(false);
  const rowRef = useRef<HTMLLIElement>(null);
  const [popupY, setPopupY] = useState(0);

  return (
    <li
      ref={rowRef}
      className={`flex items-center gap-2 rounded-md px-1 py-1.5 text-base text-ink cursor-pointer ${selected || hovered ? "bg-canvas" : ""}`}
      onClick={onSelect}
      onMouseEnter={() => {
        if (rowRef.current) setPopupY(rowRef.current.getBoundingClientRect().top);
        setHovered(true);
      }}
      onMouseLeave={() => setHovered(false)}
    >
      {isDone ? (
        <CheckCircle2 className="size-3 text-sage-ink shrink-0" />
      ) : isBlocked ? (
        <AlertTriangle className="size-3 text-amber-500 shrink-0" />
      ) : isActive ? (
        <span className="size-2.5 rounded-full bg-blue-500 shrink-0" />
      ) : (
        <Circle className="size-3 text-line-strong shrink-0" strokeWidth={1.5} />
      )}
      <AgentPixelAvatar size={16} />
      <span className="truncate flex-1">{task.title}</span>
      <MoreHorizontal className="size-3.5 text-ink-soft shrink-0 opacity-0 group-hover:opacity-100" />
      {isBlocked ? (
        <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-amber-100 text-amber-700 text-2xs font-medium px-2 py-0.5 border border-amber-200">
          Blocked <ChevronRight className="size-2.5" />
        </span>
      ) : (
        <span className="text-xs text-ink-muted shrink-0 tabular-nums">{shortTime(task.created_at)}</span>
      )}

      {hovered && (
        <div
          className="fixed right-[296px] z-50 w-72 rounded-xl border border-line/70 bg-paper shadow-lg p-4 space-y-3 pointer-events-none"
          style={{ top: Math.max(popupY - 20, 60) }}
        >
          <div className="text-2xs uppercase tracking-wider text-ink-soft font-medium">Instruction</div>
          {task.description && (
            <p className="text-xs text-ink leading-snug line-clamp-5">{task.description}</p>
          )}
          <div className="pt-2 border-t border-line/50 space-y-1.5">
            <div className="font-medium text-sm">{task.title}</div>
            <div className="flex items-center justify-between text-2xs">
              <span className="text-ink-soft">Agent</span>
              <span className="flex items-center gap-1.5 text-ink">
                <AgentPixelAvatar size={12} />
                {agentName ?? "Auto-assign"}
              </span>
            </div>
            <div className="flex items-center justify-between text-2xs">
              <span className="text-ink-soft">Status</span>
              <span className="text-ink capitalize">{task.status.replace(/_/g, " ")}</span>
            </div>
            <div className="flex items-center justify-between text-2xs">
              <span className="text-ink-soft">Created</span>
              <span className="text-ink">{relativeTime(task.created_at)}</span>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

function TaskPopup({
  task,
  orgSlug,
  agentName,
  deptSlug,
  onClose,
}: {
  task: Task;
  orgSlug: string;
  agentName: string | null;
  deptSlug: string | null;
  onClose: () => void;
}) {
  const dotColor = DEPT_DOT[deptSlug ?? ""] ?? "bg-mustard";
  return (
    <div className="fixed right-[296px] top-[100px] z-50 w-64 rounded-xl border border-line/70 bg-paper shadow-lg">
      <div className="px-4 pt-4 pb-3 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <span className="text-2xs uppercase tracking-wider text-ink-soft font-medium">
            Instruction
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-soft hover:text-ink -mt-0.5"
            aria-label="Close"
          >
            <X className="size-3.5" />
          </button>
        </div>

        {task.description && (
          <p className="text-xs text-ink leading-snug line-clamp-4">{task.description}</p>
        )}

        <Link
          href={`/${orgSlug}/tasks/${task.id}`}
          onClick={onClose}
          className="text-xs font-medium text-ink leading-snug truncate block hover:underline"
        >
          {task.title}
        </Link>

        <div className="space-y-1.5 pt-1 border-t border-line/50">
          <div className="flex items-center justify-between text-2xs">
            <span className="text-ink-soft">Agent</span>
            <span className="flex items-center gap-1.5 text-ink">
              <span className={`size-2 rounded-full ${dotColor}`} />
              {agentName ?? "Auto-assign"}
            </span>
          </div>
          <div className="flex items-center justify-between text-2xs">
            <span className="text-ink-soft">Status</span>
            <span className="text-ink capitalize">{task.status.replace(/_/g, " ")}</span>
          </div>
          <div className="flex items-center justify-between text-2xs">
            <span className="text-ink-soft">Created</span>
            <span className="text-ink">{relativeTime(task.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
