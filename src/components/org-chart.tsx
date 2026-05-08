"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  ChevronRight,
  ClipboardList,
  Code2,
  LifeBuoy,
  Loader2,
  Megaphone,
  Palette,
  Scale,
  Sparkles,
  Wallet,
} from "lucide-react";
import { DEPT_PREVIEWS, PreviewScene } from "@/components/org-chart-preview";

const DEPT_COLOR: Record<string, string> = {
  engineering: "bg-[#c8a87a] text-white",
  design:      "bg-[#7ab4c8] text-white",
  marketing:   "bg-[#e0907a] text-white",
  sales:       "bg-[#7ac87a] text-white",
  operations:  "bg-[#7ac8b4] text-white",
  finance:     "bg-[#9a7ac8] text-white",
  legal:       "bg-[#4a5a6a] text-white",
  support:     "bg-[#e0a050] text-white",
};

const DEPT_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  engineering: Code2,
  design: Palette,
  marketing: Megaphone,
  sales: Briefcase,
  operations: ClipboardList,
  finance: Wallet,
  legal: Scale,
  support: LifeBuoy,
};

type Department = { id: string; slug: string; name: string };
type TaskRow = {
  id: string;
  title: string;
  status: string;
  agent_id: string | null;
  department_id: string | null;
  created_at: string;
};

const RING_R = 30;
const LABEL_R = 30;
const MOCKUP_R = 42;

export default function OrgChart({
  orgSlug,
  orgName,
  departments,
}: {
  orgSlug: string;
  orgName: string;
  departments: Department[];
}) {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [agentMap, setAgentMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    void Promise.all([
      fetch(`/api/${orgSlug}/tasks`).then((r) => r.json()),
      fetch(`/api/${orgSlug}/agents`).then((r) => r.json()),
    ]).then(([tr, ar]) => {
      setTasks((tr.tasks ?? []) as TaskRow[]);
      setAgentMap(new Map(((ar.agents ?? []) as { id: string; name: string }[]).map((a) => [a.id, a.name])));
    }).catch(() => {});
  }, [orgSlug]);

  const ordered = departments.slice(0, 8);
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6">
      <div className="relative aspect-square w-full max-w-[860px] max-h-full">
        <Ring />
        <Center orgName={orgName} />
        {ordered.map((d, i) => {
          const angle = (i / ordered.length) * 2 * Math.PI - Math.PI / 2;
          const lx = 50 + Math.cos(angle) * LABEL_R;
          const ly = 50 + Math.sin(angle) * LABEL_R;
          const mx = 50 + Math.cos(angle) * MOCKUP_R;
          const my = 50 + Math.sin(angle) * MOCKUP_R;
          const deptTasks = tasks.filter((t) => t.department_id === d.id);
          return (
            <DeptNode
              key={d.id}
              dept={d}
              orgSlug={orgSlug}
              labelPos={{ x: lx, y: ly }}
              mockPos={{ x: mx, y: my }}
              tasks={deptTasks}
              agentMap={agentMap}
            />
          );
        })}
      </div>
    </div>
  );
}

function Ring() {
  return (
    <svg
      className="absolute inset-0 size-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
    >
      <circle
        cx="50" cy="50" r={RING_R}
        fill="none" stroke="currentColor"
        className="text-line-strong"
        strokeWidth="0.18" strokeDasharray="0.4 1.2"
      />
    </svg>
  );
}

function Center({ orgName: _ }: { orgName: string }) {
  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
      <div className="rounded-full bg-paper border border-line/70 px-3 py-1 inline-flex items-center gap-1.5 shadow-sm">
        <SeedlingIcon />
        <span className="text-sm tracking-tight text-ink">Cofounder</span>
      </div>
    </div>
  );
}

function SeedlingIcon() {
  return (
    <svg width="14" height="16" viewBox="0 0 14 16" fill="none" aria-hidden className="shrink-0">
      <line x1="7" y1="15" x2="7" y2="6" stroke="#6b7d44" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M7 10 Q3 8 4 5 Q6 7 7 8" fill="none" stroke="#9aaa5d" strokeWidth="1" strokeLinecap="round" />
      <path d="M7 9 Q11 7 10 4 Q8 6 7 7" fill="none" stroke="#9aaa5d" strokeWidth="1" strokeLinecap="round" />
      <circle cx="7" cy="4.5" r="1.8" fill="none" stroke="#c89a4d" strokeWidth="1" />
      <line x1="5.8" y1="3.3" x2="8.2" y2="5.7" stroke="#c89a4d" strokeWidth="0.7" strokeLinecap="round" />
      <line x1="8.2" y1="3.3" x2="5.8" y2="5.7" stroke="#c89a4d" strokeWidth="0.7" strokeLinecap="round" />
    </svg>
  );
}

function DeptNode({
  dept,
  orgSlug,
  labelPos,
  mockPos,
  tasks,
  agentMap,
}: {
  dept: Department;
  orgSlug: string;
  labelPos: { x: number; y: number };
  mockPos: { x: number; y: number };
  tasks: TaskRow[];
  agentMap: Map<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const blockedTasks = tasks.filter((t) => t.status === "blocked");
  const runningTasks = tasks.filter((t) => t.status === "in_progress");
  const recentTasks = tasks
    .filter((t) => t.status !== "blocked" && t.status !== "in_progress")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4);
  const blockedCount = blockedTasks.length;
  const activeCount = tasks.filter((t) => t.status !== "done" && t.status !== "cancelled").length;

  const Icon = DEPT_ICON[dept.slug] ?? Sparkles;
  const color = DEPT_COLOR[dept.slug] ?? "bg-ink text-paper";

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div
        className="absolute pointer-events-auto flex gap-1"
        style={{ left: `${mockPos.x}%`, top: `${mockPos.y}%`, transform: "translate(-50%, -50%)" }}
      >
        <Mockup scene={dept.slug as keyof typeof DEPT_PREVIEWS} />
        <Mockup scene={dept.slug as keyof typeof DEPT_PREVIEWS} />
      </div>

      <div
        ref={ref}
        className="absolute pointer-events-auto flex flex-col items-center"
        style={{ left: `${labelPos.x}%`, top: `${labelPos.y}%`, transform: "translate(-50%, -50%)" }}
      >
        {/* Badge */}
        {(blockedCount > 0 || activeCount > 0) && (
          <div className="flex items-center gap-2 mb-1">
            {blockedCount > 0 && (
              <span className="flex items-center gap-1 text-2xs text-red-500 font-medium">
                <span className="size-1.5 rounded-full bg-red-500 shrink-0" />
                {blockedCount}
              </span>
            )}
            {activeCount > 0 && (
              <span className="flex items-center gap-1 text-2xs text-ink-muted">
                <span className="size-1.5 rounded-full bg-ink-muted/60 shrink-0" />
                {activeCount}
              </span>
            )}
          </div>
        )}

        {/* Pill */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-full bg-paper border border-line/70 pl-1 pr-2.5 py-0.5 text-xs tracking-tight inline-flex items-center gap-1.5 hover:border-line-strong"
        >
          <span className={`size-4 rounded-full inline-flex items-center justify-center shrink-0 ${color}`}>
            <Icon className="size-2.5" />
          </span>
          {dept.name}
        </button>

        {/* Popup */}
        {open && (
          <DeptPopup
            dept={dept}
            orgSlug={orgSlug}
            blockedTasks={blockedTasks}
            runningTasks={runningTasks}
            recentTasks={recentTasks}
            agentMap={agentMap}
          />
        )}
      </div>
    </div>
  );
}

function DeptPopup({
  dept,
  orgSlug,
  blockedTasks,
  runningTasks,
  recentTasks,
  agentMap,
}: {
  dept: Department;
  orgSlug: string;
  blockedTasks: TaskRow[];
  runningTasks: TaskRow[];
  recentTasks: TaskRow[];
  agentMap: Map<string, string>;
}) {
  const hasSections = blockedTasks.length + runningTasks.length + recentTasks.length > 0;
  return (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-[300px] rounded-2xl bg-paper border border-line/70 shadow-xl overflow-hidden z-40">
      {!hasSections && (
        <div className="px-4 py-5 text-sm text-ink-muted text-center">No tasks yet</div>
      )}

      {blockedTasks.length > 0 && (
        <PopupSection
          dotClass="bg-red-500"
          label="Blocked"
          tasks={blockedTasks}
          orgSlug={orgSlug}
          agentMap={agentMap}
        />
      )}

      {runningTasks.length > 0 && (
        <>
          {blockedTasks.length > 0 && <div className="border-t border-line/50" />}
          <div className="px-4 pt-3 pb-1 flex items-center gap-1.5">
            <Loader2 className="size-3 text-blue-500 animate-spin shrink-0" />
            <span className="text-xs text-ink-muted">Running</span>
          </div>
          {runningTasks.map((t) => (
            <TaskItem key={t.id} task={t} orgSlug={orgSlug} agentMap={agentMap} />
          ))}
        </>
      )}

      {recentTasks.length > 0 && (
        <>
          {(blockedTasks.length > 0 || runningTasks.length > 0) && (
            <div className="border-t border-line/50" />
          )}
          <PopupSection
            dotClass="bg-ink-muted/50"
            label="Recents"
            tasks={recentTasks}
            orgSlug={orgSlug}
            agentMap={agentMap}
          />
        </>
      )}

      <div className="border-t border-line/50 px-4 py-2">
        <Link
          href={`/${orgSlug}/${dept.slug}`}
          className="text-xs text-ink-muted hover:text-ink flex items-center justify-between"
        >
          <span>Open {dept.name}</span>
          <ChevronRight className="size-3" />
        </Link>
      </div>
    </div>
  );
}

function PopupSection({
  dotClass,
  label,
  tasks,
  orgSlug,
  agentMap,
}: {
  dotClass: string;
  label: string;
  tasks: TaskRow[];
  orgSlug: string;
  agentMap: Map<string, string>;
}) {
  return (
    <>
      <div className="px-4 pt-3 pb-1 flex items-center gap-1.5">
        <span className={`size-1.5 rounded-full shrink-0 ${dotClass}`} />
        <span className="text-xs text-ink-muted">{label}</span>
      </div>
      {tasks.map((t) => (
        <TaskItem key={t.id} task={t} orgSlug={orgSlug} agentMap={agentMap} />
      ))}
    </>
  );
}

function TaskItem({
  task,
  orgSlug,
  agentMap,
}: {
  task: TaskRow;
  orgSlug: string;
  agentMap: Map<string, string>;
}) {
  const agentName = agentMap.get(task.agent_id ?? "") ?? null;
  return (
    <Link
      href={`/${orgSlug}/tasks/${task.id}`}
      className="group flex items-center justify-between gap-2 px-4 py-2 hover:bg-canvas/60 transition-colors"
    >
      <span className="text-sm font-medium text-ink truncate flex-1 leading-snug">
        {task.title.length > 28 ? task.title.slice(0, 26) + "…" : task.title}
      </span>
      <span className="text-xs text-ink-muted truncate max-w-[80px] shrink-0">
        {agentName ? (agentName.length > 12 ? agentName.slice(0, 10) + "…" : agentName) : ""}
      </span>
      <ChevronRight className="size-3.5 text-ink-muted shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

function Mockup({ scene }: { scene: keyof typeof DEPT_PREVIEWS }) {
  return (
    <div className="w-[64px] h-[40px] rounded-md bg-paper border border-line/70 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <PreviewScene scene={scene} />
    </div>
  );
}
