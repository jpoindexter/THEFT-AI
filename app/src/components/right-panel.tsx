"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AgentChat from "./agent-chat";
import TasksTab from "./tasks-tab";
import LibraryTab from "./library-tab";
import CompanyTab from "./company-tab";
import DepartmentPanel from "./department-panel";
import AgentPanel from "./agent-panel";
import { ChevronRight, RefreshCw, Circle, X, Sparkles } from "lucide-react";

type Org = { id: string; slug: string; name: string };
type Tab = "home" | "cofounder" | "company" | "tasks" | "library";

const TABS: { key: Tab; label: string }[] = [
  { key: "home", label: "Home" },
  { key: "cofounder", label: "Operator" },
  { key: "company", label: "Company" },
  { key: "tasks", label: "Tasks" },
  { key: "library", label: "Library" },
];

type DepartmentInfo = {
  id: string;
  slug: string;
  name: string;
  context: string | null;
};

export function RightPanelTabs({
  tab,
  onTabChange,
}: {
  tab: Tab;
  onTabChange: (t: Tab) => void;
}) {
  return (
    <nav className="flex items-center gap-3 text-base" aria-label="Right panel tabs">
      {TABS.map((t) => {
        const active = tab === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onTabChange(t.key)}
            className={`tracking-tight transition-colors text-sm ${
              active
                ? "text-ink font-medium"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}

export default function RightPanel({
  organization,
  hasPlan,
  founderName,
  activeTab,
  onTabChange,
  department: serverDepartment,
}: {
  organization: Org;
  hasPlan: boolean;
  founderName: string;
  activeTab: Tab;
  onTabChange: (t: Tab) => void;
  department?: DepartmentInfo;
}) {
  const pathname = usePathname();
  const [department, setDepartment] = useState<DepartmentInfo | undefined>(
    serverDepartment,
  );
  const tab = activeTab;
  const setTab = onTabChange;
  const [onboardingStarted, setOnboardingStarted] = useState(false);
  const [selectedSuggested, setSelectedSuggested] = useState<SuggestedNode | null>(null);

  // detect dept slug from URL: /[org]/[deptSlug] (excluding well-known sections)
  const RESERVED = new Set([
    "roadmap",
    "settings",
    "skills",
    "integrations",
    "referrals",
    "database",
    "tasks",
  ]);
  const segments = pathname.replace(/^\/+|\/+$/g, "").split("/");
  const sub = segments[1];
  const deptSlug = sub && !RESERVED.has(sub) ? sub : null;

  // Named dept sub-routes that are NOT agent routes
  const DEPT_SUBROUTES = new Set([
    "campaigns","content","social","logo","components","pitch-deck",
    "agents","settings","activity","brand-kit","insights","feed",
  ]);
  const agentSlug = segments[2] && !DEPT_SUBROUTES.has(segments[2]) ? segments[2] : null;

  useEffect(() => {
    if (!deptSlug) {
      if (department) setDepartment(undefined);
      return;
    }
    if (department?.slug === deptSlug) return;
    void fetch(`/api/${organization.slug}/departments`)
      .then((r) => r.json())
      .then((j: { departments: DepartmentInfo[] }) => {
        const d = j.departments.find((x) => x.slug === deptSlug);
        if (d) setDepartment(d);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deptSlug, organization.slug]);

  const allSegs = pathname.replace(/^\/+|\/+$/g, "").split("/");
  const activeTaskId = allSegs[1] === "tasks" && allSegs[2] ? allSegs[2] : null;

  // When in onboarding (no plan yet), the panel becomes a single
  // task-style header with the Operator chat + inline brief beneath.
  if (!hasPlan) {
    return (
      <aside className="rounded-lg bg-paper border border-line/70 flex flex-col overflow-hidden">
        {onboardingStarted && (
          <header className="px-4 py-3 border-b border-line/70 flex items-start gap-3">
            <div className="size-7 rounded-md bg-cream inline-flex items-center justify-center mt-0.5">
              <DocIcon />
            </div>
            <div className="leading-tight">
              <div className="text-md tracking-tight font-medium">
                Workspace setup
              </div>
              <div className="text-xs text-ink-muted mt-0.5">
                {organization.name} · {founderName}
              </div>
            </div>
          </header>
        )}
        <AgentChat
          organization={organization}
          onboarding
          onFirstTurn={() => setOnboardingStarted(true)}
          emptyHeader={
            <div className="flex flex-col items-center text-center gap-2 pt-6 pb-2">
              <div className="size-16 rounded-lg border border-line/70 bg-canvas inline-flex items-center justify-center">
                <Sparkles className="size-7 text-ink-muted" />
              </div>
              <p className="text-md text-ink tracking-tight mt-1">
                Tell me more about your company
              </p>
            </div>
          }
        />
      </aside>
    );
  }

  return (
    <aside className="rounded-lg bg-paper border border-line/70 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-hidden flex flex-col">
        {tab === "home" &&
          (agentSlug && deptSlug ? (
            <AgentPanel organization={organization} deptSlug={deptSlug} />
          ) : department ? (
            <DepartmentPanel
              organization={organization}
              department={department}
            />
          ) : (
            <HomeTab
              organization={organization}
              founderName={founderName}
              selectedSuggested={selectedSuggested}
              onSelectSuggested={setSelectedSuggested}
              onClearSuggested={() => setSelectedSuggested(null)}
            />
          ))}
        {tab === "cofounder" && <AgentChat organization={organization} />}
        {tab === "company" && <CompanyTab organization={organization} />}
        {tab === "tasks" && (
          <TasksTab
            organization={organization}
            taskId={activeTaskId ?? undefined}
            onSelectSuggested={(n) => { setSelectedSuggested(n); setTab("home"); }}
          />
        )}
        {tab === "library" && <LibraryTab organization={organization} />}
      </div>
    </aside>
  );
}

type ActiveTask = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  agent_id: string | null;
  department_id: string | null;
  created_at: string;
};
type SuggestedNode = { id: string; title: string; slug: string; stage?: string | null; department?: string | null };
type Agent = { id: string; name: string };
type Department = { id: string; slug: string };

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

function HomeTab({
  organization,
  founderName,
  selectedSuggested,
  onSelectSuggested,
  onClearSuggested,
}: {
  organization: Org;
  founderName: string;
  selectedSuggested?: SuggestedNode | null;
  onSelectSuggested?: (n: SuggestedNode) => void;
  onClearSuggested?: () => void;
}) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const [activeTasks, setActiveTasks] = useState<ActiveTask[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [suggested, setSuggested] = useState<SuggestedNode[]>([]);
  const [completePct, setCompletePct] = useState<number>(0);
  const [selected, setSelected] = useState<ActiveTask | null>(null);

  useEffect(() => {
    void Promise.all([
      fetch(`/api/${organization.slug}/tasks`).then((r) => r.json()),
      fetch(`/api/${organization.slug}/roadmap`).then((r) => r.json()),
      fetch(`/api/${organization.slug}/agents`).then((r) => r.json()),
      fetch(`/api/${organization.slug}/departments`).then((r) => r.json()),
    ]).then(([tr, rr, ar, dr]) => {
      setActiveTasks(tr.tasks ?? []);
      setAgents(ar.agents ?? []);
      setDepartments(dr.departments ?? []);
      const nodes: { id: string; slug: string; title: string; status: string; stage?: string | null; department?: string | null }[] = rr.nodes ?? [];
      const available = nodes.filter((n) => n.status === "available");
      const complete = nodes.filter((n) => n.status === "complete");
      setSuggested(available.slice(0, 5).map((n) => ({ id: n.id, slug: n.slug, title: n.title, stage: n.stage, department: n.department })));
      if (nodes.length > 0) {
        setCompletePct(Math.round((complete.length / nodes.length) * 100));
      }
    });
  }, [organization.slug]);

  const deptById = new Map(departments.map((d) => [d.id, d.slug]));
  const agentById = new Map(agents.map((a) => [a.id, a.name]));

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <h2 className="text-lg tracking-tight">
          {greeting}, <span className="text-ink-soft">{founderName}</span>
        </h2>

        <Link
          href={`/${organization.slug}/roadmap`}
          className="block rounded-lg overflow-hidden border border-line/70 relative aspect-[16/8]"
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, #87CEEB 0%, #b8dff0 35%, #d4ecf7 55%, #e8f4f0 70%, #c8dbb5 85%, #a8c490 100%)",
            }}
            aria-hidden
          />
          {/* clouds */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
            <div style={{ position:"absolute", top:"18%", left:"12%", width:60, height:16, borderRadius:999, background:"rgba(255,255,255,0.82)", filter:"blur(4px)" }} />
            <div style={{ position:"absolute", top:"12%", left:"22%", width:36, height:10, borderRadius:999, background:"rgba(255,255,255,0.7)", filter:"blur(3px)" }} />
            <div style={{ position:"absolute", top:"22%", right:"18%", width:50, height:14, borderRadius:999, background:"rgba(255,255,255,0.75)", filter:"blur(4px)" }} />
            <div style={{ position:"absolute", top:"8%", right:"30%", width:28, height:8, borderRadius:999, background:"rgba(255,255,255,0.6)", filter:"blur(2px)" }} />
          </div>
          <div className="absolute inset-0 flex items-end justify-between p-3">
            <div className="text-sm tracking-tight text-ink backdrop-blur-sm bg-paper/60 px-2 py-0.5 rounded">
              {organization.name} Roadmap
            </div>
            <div className="absolute top-3 right-3 text-2xs text-ink bg-paper/80 backdrop-blur-sm rounded px-1.5 py-0.5">
              {completePct}%
            </div>
          </div>
        </Link>

        {activeTasks.length > 0 && (
          <Section label="Active tasks">
            <ul className="space-y-1">
              {activeTasks.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(selected?.id === t.id ? null : t)}
                    className={`w-full flex items-center gap-2 rounded-md hover:bg-canvas px-1 py-1.5 text-base text-ink ${selected?.id === t.id ? "bg-canvas" : ""}`}
                  >
                    <span className={`size-3 rounded-full shrink-0 ${DEPT_DOT[deptById.get(t.department_id ?? "") ?? ""] ?? "bg-mustard"}`} />
                    <span className="truncate flex-1 text-left">{t.title}</span>
                    <ChevronRight className="size-3.5 text-ink-soft shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {suggested.length > 0 && (
          <Section
            label="Suggested next"
            right={
              <button type="button" className="text-ink-soft hover:text-ink" aria-label="Refresh">
                <RefreshCw className="size-3" />
              </button>
            }
          >
            <ul className="space-y-1.5">
              {suggested.map((n) => (
                <li key={n.id} className="flex items-center gap-2 text-base text-ink">
                  <Circle className="size-3 text-line-strong shrink-0" />
                  <span>{n.title}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <OperatorInlineComposer organization={organization} />
      </div>

      {selected && (
        <HomeTaskPopup
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

function HomeTaskPopup({
  task,
  orgSlug,
  agentName,
  deptSlug,
  onClose,
}: {
  task: ActiveTask;
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

function Section({
  label,
  right,
  children,
}: {
  label: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-2xs uppercase tracking-[0.14em] text-ink-soft">
          {label}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function OperatorInlineComposer({
  organization,
}: {
  organization: { slug: string };
}) {
  const [text, setText] = useState("");
  return (
    <div className="mt-auto pt-4">
      <div className="rounded-lg border border-line/70 bg-paper">
        <div className="px-3 py-2 border-b border-line/70 inline-flex items-center gap-1.5 text-xs">
          <span className="size-3 rounded-full  bg-mustard/30 inline-block" />
          <span className="text-ink-muted">Operator</span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Ask Operator anything about your company…`}
          rows={2}
          className="w-full resize-none bg-transparent px-3 py-2 text-sm focus:outline-none placeholder:text-ink-soft"
        />
        <div className="flex items-center justify-between px-2 pb-2">
          <button
            type="button"
            aria-label="Add"
            className="size-6 rounded-md hover:bg-cream inline-flex items-center justify-center text-ink-soft"
          >
            +
          </button>
          <button
            type="button"
            disabled={!text.trim()}
            onClick={async () => {
              if (!text.trim()) return;
              await fetch(`/api/${organization.slug}/cofounder`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
              });
              setText("");
            }}
            className="size-6 rounded-md bg-line text-ink-muted inline-flex items-center justify-center disabled:opacity-50"
            aria-label="Send"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}

function DocIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-4 text-ink-muted"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 2h7l3 3v9H3z" />
      <path d="M10 2v3h3" />
      <path d="M5.5 8h5M5.5 10.5h5M5.5 13h3" />
    </svg>
  );
}
