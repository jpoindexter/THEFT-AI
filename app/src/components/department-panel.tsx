"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Info, Loader2, Wrench } from "lucide-react";
import Link from "next/link";
import NewAgentDialog from "@/components/new-agent-dialog";
import NewTaskDialog from "@/components/new-task-dialog";

type Org = { id: string; slug: string; name: string };
type Department = { id: string; slug: string; name: string; context: string | null };
type Agent = { id: string; name: string; slug: string; department_id: string | null };
type Task = { id: string; title: string; status: string; department_id: string | null; agent_id: string | null };
type RunTurn = { kind: string; text?: string; name?: string; output?: unknown };

const DEPT_DESC: Record<string, string> = {
  engineering: "Engineering agents build, ship, and maintain your product — from code reviews to deployment pipelines.",
  design: "Design agents produce wireframes, prototypes and assets — keeping your product polished and on-brand.",
  marketing: "Marketing agent runs campaign strategy, copy, and content production from your business plan.",
  sales: "Sales agents find, pursue, follow up on leads, and help close deals faster.",
  operations: "Operations agent owns recurring routines, weekly briefs, and the audit log.",
  finance: "Finance agent reconciles Stripe, bills, invoices, and surfaces variance vs forecast.",
  legal: "Legal agent handles contract support, policy review, compliance artifacts, and legal-ops workflows.",
  support: "Support agent handles customer support, issue resolution, and customer success operations.",
};

const DEPT_SUMMARY: Record<string, string> = {
  engineering: "This department handles software engineering, infrastructure, and technical operations.",
  design: "This department owns brand identity, visual systems, decks, email templates, and UI kits.",
  marketing: "This department handles campaign strategy, content production, and growth.",
  sales: "This department handles go-to-market strategy, customer relationships, and revenue operations.",
  operations: "This department handles recurring routines, reporting, and the audit log.",
  finance: "This department handles revenue reconciliation, invoicing, and financial reporting.",
  legal: "This department handles contracts, compliance, and legal review.",
  support: "This department handles customer support, issue triage, and user feedback.",
};

const DEPT_BANNER: Record<string, { bg: string; accent: string }> = {
  engineering: {
    bg: "linear-gradient(135deg, #1e2a3a 0%, #2d3f55 40%, #1a2535 100%)",
    accent: "rgba(100,160,220,0.15)",
  },
  design: {
    bg: "linear-gradient(160deg, #87ceeb 0%, #b8dff0 35%, #d4ecf7 55%, #e8f4f0 70%, #c8dbb5 85%, #a8c490 100%)",
    accent: "rgba(255,255,255,0.25)",
  },
  marketing: {
    bg: "linear-gradient(135deg, #f5e6d0 0%, #f0d4b0 50%, #e8c090 100%)",
    accent: "rgba(200,120,60,0.12)",
  },
  sales: {
    bg: "linear-gradient(135deg, #d4f0e4 0%, #b8e8d0 50%, #90d4b8 100%)",
    accent: "rgba(40,140,90,0.15)",
  },
  operations: {
    bg: "linear-gradient(135deg, #e8f4f0 0%, #d0e8e0 50%, #b8dcd4 100%)",
    accent: "rgba(40,120,100,0.12)",
  },
  finance: {
    bg: "linear-gradient(135deg, #f5f0e0 0%, #ede0c0 50%, #e0cc98 100%)",
    accent: "rgba(160,120,40,0.15)",
  },
  legal: {
    bg: "linear-gradient(135deg, #eeeae4 0%, #e0dbd2 50%, #cdc8be 100%)",
    accent: "rgba(80,70,60,0.12)",
  },
  support: {
    bg: "linear-gradient(135deg, #fdf0e8 0%, #f8e0cc 50%, #f0caaa 100%)",
    accent: "rgba(200,100,40,0.12)",
  },
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

const DEPT_DISPLAY: Record<string, string> = {
  engineering: "Engineering",
  design: "Design",
  marketing: "Marketing",
  sales: "Sales",
  operations: "Operations",
  finance: "Finance",
  legal: "Legal",
  support: "Support",
};

function Badge({ count }: { count: number }) {
  return (
    <span className="text-2xs text-ink-muted bg-canvas border border-line/70 px-1.5 py-0.5 rounded min-w-[1.25rem] text-center">
      {count}
    </span>
  );
}

function SectionHeader({
  label,
  count,
  open,
  onToggle,
}: {
  label: string;
  count: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-2 py-2 text-base text-ink hover:text-ink-strong"
    >
      <span className="flex-1 text-left font-medium">{label}</span>
      <Info className="size-3 text-ink-soft shrink-0" />
      <Badge count={count} />
      {open ? (
        <ChevronDown className="size-3.5 text-ink-soft shrink-0" />
      ) : (
        <ChevronRight className="size-3.5 text-ink-soft shrink-0" />
      )}
    </button>
  );
}

export default function DepartmentPanel({
  organization,
  department,
}: {
  organization: Org;
  department: Department;
}) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskInput, setTaskInput] = useState("");
  const [runState, setRunState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [runTurns, setRunTurns] = useState<RunTurn[]>([]);
  const resultRef = useRef<HTMLDivElement>(null);

  const [agentsOpen, setAgentsOpen] = useState(true);
  const [tasksOpen, setTasksOpen] = useState(true);
  const [filesOpen, setFilesOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(true);

  async function runTask() {
    if (!taskInput.trim() || runState === "running") return;
    setRunState("running");
    setRunTurns([]);
    try {
      const res = await fetch(
        `/api/${organization.slug}/departments/${department.slug}/run`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: taskInput.trim() }),
        },
      );
      const json = await res.json() as { turns?: RunTurn[] };
      setRunTurns(json.turns ?? []);
      setRunState("done");
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch {
      setRunState("error");
    }
  }

  async function refreshAgents() {
    const ar = await fetch(`/api/${organization.slug}/agents`).then((r) => r.json());
    setAgents((ar.agents ?? []).filter((a: Agent) => a.department_id === department.id));
  }

  useEffect(() => {
    void Promise.all([
      fetch(`/api/${organization.slug}/agents`).then((r) => r.json()),
      fetch(`/api/${organization.slug}/tasks`).then((r) => r.json()),
    ]).then(([ar, tr]) => {
      setAgents(
        (ar.agents ?? []).filter(
          (a: Agent) => a.department_id === department.id,
        ),
      );
      setTasks(
        (tr.tasks ?? []).filter(
          (t: Task) => t.department_id === department.id,
        ),
      );
    });
  }, [organization.slug, department.id]);

  const deptSlug = department.slug;
  const displayName = DEPT_DISPLAY[deptSlug] ?? department.name;
  const description = DEPT_DESC[deptSlug] ?? department.context ?? "";
  const dotClass = DEPT_DOT[deptSlug] ?? "bg-mustard";

  // Count scheduled tasks per agent
  const scheduledByAgent = new Map<string, number>();
  for (const t of tasks) {
    if (t.agent_id) {
      scheduledByAgent.set(t.agent_id, (scheduledByAgent.get(t.agent_id) ?? 0) + 1);
    }
  }

  const deptSummary = DEPT_SUMMARY[deptSlug] ?? `This department handles ${description}`;
  const contextJson = JSON.stringify({ summary: deptSummary }, null, 2);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
      {/* Department heading */}
      <h2 className="text-lg font-semibold tracking-tight text-ink pb-1">
        {displayName}
      </h2>

      {/* Banner */}
      {(() => {
        const banner = DEPT_BANNER[deptSlug] ?? DEPT_BANNER.operations;
        return (
          <div
            className="rounded-lg overflow-hidden h-24 border border-line/70 relative"
            style={{ background: banner.bg }}
          >
            <div
              className="absolute inset-0 rounded-lg"
              style={{ background: banner.accent }}
            />
            <div className="absolute bottom-3 left-3">
              <span className={`size-6 rounded-md inline-flex items-center justify-center ${dotClass}`}>
                <span className="text-paper text-xs font-semibold">{displayName.charAt(0)}</span>
              </span>
            </div>
          </div>
        );
      })()}

      {/* Description */}
      <p className="text-sm text-ink-muted leading-snug pt-1">{description}</p>

      {deptSlug === "engineering" && (
        <EngineeringShowcase orgSlug={organization.slug} />
      )}

      {/* Divider */}
      <div className="border-t border-line/70 pt-2 space-y-0">

        {/* Agents section */}
        <div className="border-b border-line/70">
          <SectionHeader
            label="Agents"
            count={agents.length}
            open={agentsOpen}
            onToggle={() => setAgentsOpen((v) => !v)}
          />
          {agentsOpen && (
            <div className="pb-3 space-y-1">
              {agents.length === 0 ? (
                <p className="text-xs text-ink-soft px-1">No agents yet</p>
              ) : (
                agents.map((a) => (
                  <Link
                    key={a.id}
                    href={`/${organization.slug}/${department.slug}/${a.slug}`}
                    className="flex items-center gap-2 px-1 py-1 rounded-md hover:bg-canvas"
                  >
                    <span className={`size-5 rounded-full shrink-0 flex items-center justify-center text-2xs font-semibold text-ink ${dotClass}`}>
                      {a.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="flex-1 text-sm text-ink truncate">{a.name}</span>
                    <span className="text-2xs text-ink-muted bg-canvas border border-line/70 px-1.5 py-0.5 rounded">
                      Default
                    </span>
                    <span className="text-2xs text-ink-soft shrink-0">
                      {scheduledByAgent.get(a.id) ?? 0} scheduled
                    </span>
                  </Link>
                ))
              )}
              <button
                type="button"
                onClick={() => setAgentDialogOpen(true)}
                className="mt-1 w-full text-left text-xs text-ink-muted hover:text-ink px-1 py-1"
              >
                + New Agent
              </button>
            </div>
          )}
        </div>

        {/* Tasks section */}
        <div className="border-b border-line/70">
          <SectionHeader
            label="Tasks"
            count={tasks.length}
            open={tasksOpen}
            onToggle={() => setTasksOpen((v) => !v)}
          />
          {tasksOpen && (
            <div className="pb-3 px-1 space-y-0.5">
              {tasks.length === 0 ? (
                <>
                  <p className="text-xs text-ink-soft">No active tasks</p>
                  <p className="text-xs text-ink-soft/70">Tasks assigned to agents will appear here.</p>
                </>
              ) : (
                tasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 py-1">
                    <span className="flex-1 text-sm text-ink truncate">{t.title}</span>
                    <span className="text-2xs text-ink-muted">{t.status}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Files section */}
        <div className="border-b border-line/70">
          <SectionHeader
            label="Files"
            count={0}
            open={filesOpen}
            onToggle={() => setFilesOpen((v) => !v)}
          />
          {filesOpen && (
            <div className="pb-3 px-1 space-y-0.5">
              <p className="text-xs text-ink-soft">No files yet</p>
              <p className="text-xs text-ink-soft/70">Files created by agents will appear here.</p>
            </div>
          )}
        </div>

        {/* Context section */}
        <div>
          <SectionHeader
            label="Context"
            count={1}
            open={contextOpen}
            onToggle={() => setContextOpen((v) => !v)}
          />
          {contextOpen && (
            <div className="pb-3">
              <div className="rounded-md bg-canvas border border-line/70 px-3 py-2 font-mono text-xs text-ink-muted whitespace-pre leading-relaxed overflow-x-auto">
                {contextJson}
              </div>
            </div>
          )}
        </div>
      </div>

      <NewAgentDialog
        organization={{ id: organization.id, slug: organization.slug }}
        defaultDepartment={department.slug}
        open={agentDialogOpen}
        onOpenChange={setAgentDialogOpen}
        onCreated={() => void refreshAgents()}
      />
      </div>

      {/* Run result */}
      {(runState === "running" || runState === "done" || runState === "error") && (
        <div ref={resultRef} className="shrink-0 border-t border-line/70 max-h-52 overflow-y-auto p-3 space-y-1.5">
          {runState === "running" && (
            <div className="flex items-center gap-2 text-xs text-ink-muted">
              <Loader2 className="size-3 animate-spin" />
              Agent is working…
            </div>
          )}
          {runState === "error" && (
            <p className="text-xs text-brick">Run failed — check console.</p>
          )}
          {runTurns.map((t, i) => {
            if (t.kind === "text" && t.text) {
              return (
                <p key={i} className="text-xs text-ink leading-snug whitespace-pre-wrap">
                  {t.text}
                </p>
              );
            }
            if (t.kind === "tool_call") {
              return (
                <div key={i} className="flex items-center gap-1.5 text-2xs text-ink-muted">
                  <Wrench className="size-2.5 shrink-0" />
                  <span>{t.name}</span>
                </div>
              );
            }
            if (t.kind === "tool_result" && t.name === "write_artifact") {
              return (
                <div key={i} className="text-2xs text-sage font-medium">
                  ✓ Artifact saved to Library
                </div>
              );
            }
            return null;
          })}
        </div>
      )}

      {/* Task composer */}
      <div className="shrink-0 border-t border-line/70 p-3">
        <div className="rounded-lg border border-line/70 bg-canvas">
          <div className="px-3 pt-2 pb-1 flex items-center gap-1.5 text-2xs text-ink-muted border-b border-line/70">
            <span className={`size-2 rounded-full shrink-0 ${dotClass}`} />
            <span>{displayName} agent</span>
          </div>
          <textarea
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void runTask(); }}
            placeholder={`Give ${displayName} agent a task…`}
            rows={2}
            disabled={runState === "running"}
            className="w-full resize-none bg-transparent px-3 py-2 text-sm focus:outline-none placeholder:text-ink-soft disabled:opacity-50"
          />
          <div className="flex items-center justify-between px-2 pb-2">
            <button
              type="button"
              onClick={() => { setRunState("idle"); setRunTurns([]); setTaskInput(""); }}
              className="text-2xs text-ink-soft hover:text-ink"
            >
              {runState === "done" || runState === "error" ? "Clear" : ""}
            </button>
            <button
              type="button"
              disabled={!taskInput.trim() || runState === "running"}
              onClick={() => void runTask()}
              className="size-6 rounded-md bg-ink text-paper inline-flex items-center justify-center disabled:opacity-40 text-xs"
              aria-label="Run"
            >
              {runState === "running" ? <Loader2 className="size-3 animate-spin" /> : "↑"}
            </button>
          </div>
        </div>
      </div>

      <NewTaskDialog
        organization={{ id: organization.id, slug: organization.slug }}
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
      />
    </div>
  );
}

function EngineeringShowcase({ orgSlug }: { orgSlug: string }) {
  return (
    <section className="mt-3 rounded-lg border border-line/70 bg-paper p-4 space-y-4">
      <h3 className="text-[32px] leading-tight tracking-tight text-ink text-center mt-1">
        Let&apos;s build <Link href={`/${orgSlug}/roadmap`} className="text-[#3b82f6] hover:underline">your app</Link> from the ground up
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <MockupCard title="Landing Page" />
        <MockupCard title="Application" />
      </div>
      <div className="pt-1">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-ink-muted">Engineering Roadmap</div>
          <div className="text-sm text-ink-muted">0/7 Setup</div>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[560px] flex items-stretch gap-2 pb-1">
            <RoadmapCard title="App is built" subtitle="Complete task" active />
            <RoadmapCard title="Build marketing website" subtitle="Complete task" />
            <RoadmapCard title="Production product deployment exists" subtitle="Needs earlier steps first" />
            <RoadmapCard title="Buy domain" subtitle="Provision resource" />
          </div>
        </div>
      </div>
    </section>
  );
}

function MockupCard({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-line/70 bg-canvas p-3">
      <div className="h-28 rounded-lg border border-line/60 bg-paper relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-5 bg-[#dbe7f8]" />
        <div className="absolute top-2 left-2 flex gap-1">
          <span className="size-1.5 rounded-full bg-[#e0907a]" />
          <span className="size-1.5 rounded-full bg-[#e0a050]" />
          <span className="size-1.5 rounded-full bg-[#7ac87a]" />
        </div>
        <div className="absolute left-3 right-3 top-8 space-y-2">
          <div className="h-1.5 rounded bg-line" />
          <div className="h-1.5 w-4/5 rounded bg-line" />
          <div className="h-1.5 w-2/3 rounded bg-line" />
        </div>
      </div>
      <div className="mt-2 flex justify-center">
        <span className="text-xs text-ink-muted rounded border border-line/70 px-2 py-0.5 bg-paper">{title}</span>
      </div>
    </div>
  );
}

function RoadmapCard({
  title,
  subtitle,
  active = false,
}: {
  title: string;
  subtitle: string;
  active?: boolean;
}) {
  return (
    <div className={`w-44 rounded-lg border ${active ? "border-[#9bb7dd]" : "border-line/70"} bg-paper p-2.5 shrink-0`}>
      <div className="text-sm leading-tight text-ink">{title}</div>
      <div className="text-xs text-ink-soft mt-1">{subtitle}</div>
    </div>
  );
}
