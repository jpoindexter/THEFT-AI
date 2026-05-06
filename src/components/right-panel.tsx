"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import CofounderChat from "./cofounder-chat";
import AgentChat from "./agent-chat";
import TasksTab from "./tasks-tab";
import LibraryTab from "./library-tab";
import CompanyTab from "./company-tab";
import DepartmentPanel from "./department-panel";
import { ChevronRight, RefreshCw, Circle } from "lucide-react";

type Org = { id: string; slug: string; name: string };
type Tab = "home" | "cofounder" | "company" | "tasks" | "library";

const TABS: { key: Tab; label: string }[] = [
  { key: "home", label: "Home" },
  { key: "cofounder", label: "Cofounder" },
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

export default function RightPanel({
  organization,
  hasPlan,
  founderName,
  department: serverDepartment,
}: {
  organization: Org;
  hasPlan: boolean;
  founderName: string;
  department?: DepartmentInfo;
}) {
  const pathname = usePathname();
  const [tab, setTab] = useState<Tab>("home");
  const [department, setDepartment] = useState<DepartmentInfo | undefined>(
    serverDepartment,
  );

  // detect dept slug from URL: /[org]/[deptSlug] (excluding well-known sections)
  const RESERVED = new Set([
    "roadmap",
    "settings",
    "skills",
    "integrations",
    "referrals",
    "database",
    "design",
  ]);
  const segments = pathname.replace(/^\/+|\/+$/g, "").split("/");
  const sub = segments[1];
  const deptSlug = sub && !RESERVED.has(sub) ? sub : null;

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

  // When in onboarding (no plan yet), the panel becomes a single
  // task-style header with the cofounder chat + inline brief beneath.
  if (!hasPlan) {
    return (
      <aside className="rounded-lg bg-white border border-stone-200/70 flex flex-col overflow-hidden">
        <header className="px-4 py-3 border-b border-stone-200/70 flex items-start gap-3">
          <div className="size-7 rounded-md bg-stone-100 inline-flex items-center justify-center mt-0.5">
            <DocIcon />
          </div>
          <div className="leading-tight">
            <div className="text-[15px] tracking-tight font-medium">
              Onboarding
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">
              {organization.name} · {founderName}
            </div>
          </div>
        </header>
        <AgentChat
          organization={organization}
          onboarding
          emptyHeader={
            <div className="flex flex-col items-center text-center gap-3 pt-4 pb-2">
              <p className="text-[14px] text-stone-900 tracking-tight">
                Tell me more about your company
              </p>
              <p className="text-[12px] text-stone-500 max-w-[260px] leading-snug">
                Share what you&apos;re building and Cofounder will start a brief.
              </p>
            </div>
          }
        />
      </aside>
    );
  }

  return (
    <aside className="rounded-lg bg-white border border-stone-200/70 flex flex-col overflow-hidden">
      <nav className="h-10 flex items-center gap-3 px-4 border-b border-stone-200/70 text-[13px]">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`tracking-tight transition-colors ${
                active
                  ? "text-stone-900 font-medium"
                  : "text-stone-400 hover:text-stone-900"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </nav>
      <div className="flex-1 overflow-hidden flex flex-col">
        {tab === "home" &&
          (department ? (
            <DepartmentPanel
              organization={organization}
              department={department}
            />
          ) : (
            <HomeTab organization={organization} founderName={founderName} />
          ))}
        {tab === "cofounder" && <AgentChat organization={organization} />}
        {tab === "company" && <CompanyTab organization={organization} />}
        {tab === "tasks" && <TasksTab organization={organization} />}
        {tab === "library" && <LibraryTab organization={organization} />}
      </div>
    </aside>
  );
}

function HomeTab({
  organization,
  founderName,
}: {
  organization: Org;
  founderName: string;
}) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const SUGGESTED = [
    "App is built",
    "Build marketing website",
    "Sales positioning is ready",
    "Brand identity",
    "Setup social presence",
  ];
  const ACTIVE_TASKS = [
    {
      icon: <span className="size-3 rounded-full bg-orange-300 inline-block" />,
      title: "Marketing: Score generated-artifact-…",
    },
  ];
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5">
      <h2 className="text-[18px] tracking-tight">
        {greeting}, <span className="text-stone-400">{founderName}</span>
      </h2>

      <Link
        href={`/${organization.slug}/roadmap`}
        className="block rounded-lg overflow-hidden border border-stone-200/70 relative aspect-[16/8]"
      >
        <div
          className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-100 to-sky-50"
          aria-hidden
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 78% 22%, rgba(255,255,255,0.85) 0%, transparent 22%), radial-gradient(circle at 30% 70%, rgba(255,210,170,0.55) 0%, transparent 28%)",
          }}
          aria-hidden
        />
        <div className="absolute inset-0 flex items-end justify-between p-3">
          <div className="text-[12px] tracking-tight text-stone-700 backdrop-blur-sm bg-white/40 px-2 py-0.5 rounded">
            {organization.name} Roadmap
          </div>
          <div className="absolute top-3 right-3 text-[10px] text-stone-700 bg-white/60 backdrop-blur-sm rounded px-1.5 py-0.5">
            9%
          </div>
        </div>
      </Link>

      <Section label="Active tasks">
        <ul className="space-y-1">
          {ACTIVE_TASKS.map((t, i) => (
            <li
              key={i}
              className="flex items-center gap-2 rounded-md hover:bg-stone-50 px-1 py-1.5 text-[13px] text-stone-700 cursor-pointer"
            >
              {t.icon}
              <span className="truncate flex-1">{t.title}</span>
              <ChevronRight className="size-3.5 text-stone-400" />
            </li>
          ))}
        </ul>
      </Section>

      <Section
        label="Suggested next"
        right={
          <button
            type="button"
            className="text-stone-400 hover:text-stone-700"
            aria-label="Refresh"
          >
            <RefreshCw className="size-3" />
          </button>
        }
      >
        <ul className="space-y-1.5">
          {SUGGESTED.map((s) => (
            <li
              key={s}
              className="flex items-center gap-2 text-[13px] text-stone-700"
            >
              <Circle className="size-3 text-stone-300" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </Section>

      <CofounderInlineComposer organization={organization} />
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
        <div className="text-[10px] uppercase tracking-[0.14em] text-stone-400">
          {label}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function CofounderInlineComposer({
  organization,
}: {
  organization: { slug: string };
}) {
  const [text, setText] = useState("");
  return (
    <div className="mt-auto pt-4">
      <div className="rounded-lg border border-stone-200/70 bg-white">
        <div className="px-3 py-2 border-b border-stone-200/70 inline-flex items-center gap-1.5 text-[11px]">
          <span className="size-3 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 inline-block" />
          <span className="text-stone-600">Cofounder</span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Ask Cofounder anything about your company…`}
          rows={2}
          className="w-full resize-none bg-transparent px-3 py-2 text-[12px] focus:outline-none placeholder:text-stone-400"
        />
        <div className="flex items-center justify-between px-2 pb-2">
          <button
            type="button"
            aria-label="Add"
            className="size-6 rounded-md hover:bg-stone-100 inline-flex items-center justify-center text-stone-400"
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
            className="size-6 rounded-md bg-stone-200 text-stone-500 inline-flex items-center justify-center disabled:opacity-50"
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
      className="size-4 text-stone-500"
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
