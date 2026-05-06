"use client";

import { useEffect, useState } from "react";
import { ChevronRight, ChevronDown, Plus, Info } from "lucide-react";

type Org = { id: string; slug: string; name: string };
type Department = {
  id: string;
  slug: string;
  name: string;
  context: string | null;
};
type Agent = {
  id: string;
  name: string;
  title: string | null;
  status: string;
};
type Task = { id: string; title: string; status: string };
type Artifact = { id: string; name: string; kind: string };

const COVER: Record<string, string> = {
  engineering:
    "linear-gradient(135deg,#1d2438,#3a2c1f 35%,#7a4f29 70%,#9a8b6e)",
  design: "linear-gradient(135deg,#fdf2e0,#e9d8be)",
  marketing: "linear-gradient(135deg,#ffd9b5,#f3a26a)",
  sales: "linear-gradient(135deg,#d8e8d4,#a3c69a)",
  operations: "linear-gradient(135deg,#dbe1c9,#b6c2a3)",
  finance: "linear-gradient(135deg,#dfe2c2,#aab48a)",
  legal: "linear-gradient(135deg,#cfd2bd,#9ea08e)",
  support: "linear-gradient(135deg,#d5cfc1,#a89f8f)",
};

const DESCRIPTION: Record<string, string> = {
  engineering:
    "Engineering agents build, ship, and maintain your product — from code reviews to deployment pipelines.",
  design:
    "Design agents own the brand kit, decks, components, and visual quality of every surface.",
  marketing:
    "Marketing agents run campaigns, write copy, manage social, and grow inbound demand.",
  sales: "Sales agents qualify leads, run outbound, and move opportunities to close.",
  operations:
    "Operations agents track status, coordinate handoffs, and keep the company moving.",
  finance:
    "Finance agents manage bookkeeping, runway, billing, and financial reporting.",
  legal:
    "Legal agents draft contracts, review terms, and handle compliance tasks.",
  support:
    "Support agents triage user reports, answer common questions, and escalate when needed.",
};

export default function DepartmentPanel({
  organization,
  department,
}: {
  organization: Org;
  department: Department;
}) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [open, setOpen] = useState({
    agents: true,
    tasks: true,
    files: true,
    context: true,
  });

  useEffect(() => {
    void fetch(`/api/${organization.slug}/agents`)
      .then((r) => r.json())
      .then((j) =>
        setAgents(
          (j.agents ?? []).filter(
            (a: { department_id: string | null }) =>
              a.department_id === department.id,
          ),
        ),
      );
    void fetch(`/api/${organization.slug}/tasks`)
      .then((r) => r.json())
      .then((j) =>
        setTasks(
          (j.tasks ?? []).filter(
            (t: { department_id: string | null }) =>
              t.department_id === department.id,
          ),
        ),
      );
    void fetch(`/api/${organization.slug}/artifacts`)
      .then((r) => r.json())
      .then((j) =>
        setArtifacts(
          (j.artifacts ?? []).filter(
            (a: { department_id: string | null }) =>
              a.department_id === department.id,
          ),
        ),
      );
  }, [organization.slug, department.id]);

  const cover = COVER[department.slug] ?? "linear-gradient(135deg,#e7e5e4,#d6d3d1)";
  const description = DESCRIPTION[department.slug] ?? "";

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div>
        <div className="inline-flex items-center gap-1.5 text-[13px] mb-3">
          <DeptIcon slug={department.slug} />
          <span className="font-medium">{department.name}</span>
        </div>
        <div
          className="rounded-lg aspect-[16/9] mb-2"
          style={{ background: cover }}
        />
        <p className="text-[12px] text-stone-600 leading-snug">{description}</p>
      </div>

      <Card
        title="Agents"
        count={agents.length}
        open={open.agents}
        toggle={() => setOpen((o) => ({ ...o, agents: !o.agents }))}
      >
        {agents.map((a) => (
          <div
            key={a.id}
            className="rounded-md border border-stone-200/70 bg-white px-3 py-1.5 flex items-center justify-between text-[12px]"
          >
            <div>
              <span className="font-medium mr-1">{a.name}</span>
              <span className="text-stone-500">Default</span>
            </div>
            <span className="text-[10px] text-stone-500">2 schedules</span>
          </div>
        ))}
        <button className="mt-2 w-full inline-flex items-center justify-center gap-1 rounded-md bg-stone-50 border border-dashed border-stone-300 px-3 py-1.5 text-[12px] text-stone-600 hover:border-stone-400">
          <Plus className="size-3" /> New Agent
        </button>
      </Card>

      <Card
        title="Tasks"
        count={tasks.length}
        open={open.tasks}
        toggle={() => setOpen((o) => ({ ...o, tasks: !o.tasks }))}
      >
        {tasks.length === 0 ? (
          <Empty title="No active tasks" body="Tasks assigned to agents will appear here." />
        ) : (
          <ul className="space-y-1">
            {tasks.map((t) => (
              <li
                key={t.id}
                className="rounded-md border border-stone-200/70 bg-white px-2 py-1 text-[12px] flex items-center justify-between"
              >
                <span className="truncate">{t.title}</span>
                <span className="text-[10px] uppercase text-stone-500">
                  {t.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card
        title="Files"
        count={artifacts.length}
        open={open.files}
        toggle={() => setOpen((o) => ({ ...o, files: !o.files }))}
      >
        {artifacts.length === 0 ? (
          <Empty title="No files yet" body="Files created by agents will appear here." />
        ) : (
          <ul className="space-y-1">
            {artifacts.map((a) => (
              <li
                key={a.id}
                className="rounded-md border border-stone-200/70 bg-white px-2 py-1 text-[12px] flex items-center justify-between"
              >
                <span className="truncate">{a.name}</span>
                <span className="text-[10px] uppercase text-stone-500">
                  {a.kind}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card
        title="Context"
        open={open.context}
        toggle={() => setOpen((o) => ({ ...o, context: !o.context }))}
      >
        <pre className="text-[10px] font-mono text-stone-700 bg-stone-50 rounded-md p-2 leading-snug whitespace-pre-wrap">
          {JSON.stringify(
            {
              summary:
                department.context ??
                `This department handles ${department.name.toLowerCase()} work.`,
            },
            null,
            2,
          )}
        </pre>
      </Card>
    </div>
  );
}

function Card({
  title,
  count,
  open,
  toggle,
  children,
}: {
  title: string;
  count?: number;
  open: boolean;
  toggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-stone-200/70 bg-white">
      <button
        type="button"
        onClick={toggle}
        className="w-full px-3 py-2 flex items-center justify-between text-[13px]"
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="font-medium">{title}</span>
          <Info className="size-3 text-stone-400" />
        </span>
        <span className="inline-flex items-center gap-2 text-stone-400 text-[11px]">
          {count !== undefined && <span>{count}</span>}
          {open ? (
            <ChevronDown className="size-3" />
          ) : (
            <ChevronRight className="size-3" />
          )}
        </span>
      </button>
      {open && <div className="px-3 pb-3 space-y-1.5">{children}</div>}
    </section>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-stone-200/70 bg-stone-50 px-3 py-3 text-[12px]">
      <div className="font-medium text-stone-700">{title}</div>
      <div className="text-stone-500">{body}</div>
    </div>
  );
}

function DeptIcon({ slug }: { slug: string }) {
  const colors: Record<string, string> = {
    engineering: "from-orange-300 to-amber-400",
    design: "from-stone-300 to-stone-400",
    marketing: "from-pink-300 to-rose-400",
    sales: "from-lime-300 to-emerald-400",
    operations: "from-emerald-300 to-teal-400",
    finance: "from-sky-300 to-indigo-400",
    legal: "from-slate-300 to-slate-500",
    support: "from-violet-300 to-purple-400",
  };
  return (
    <span
      className={`size-3.5 rounded-sm bg-gradient-to-br ${colors[slug] ?? "from-stone-200 to-stone-400"}`}
    />
  );
}
