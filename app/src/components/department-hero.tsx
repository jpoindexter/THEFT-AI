"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Plus,
  MoreHorizontal,
  CheckCircle2,
  Circle,
  Globe,
  Hammer,
  PenLine,
  Megaphone,
  Target,
  Mail,
  CreditCard,
  Receipt,
  Scale,
  FileSignature,
  Inbox as InboxIcon,
  Building2,
  Layout,
  Palette,
  Box,
  Server,
  ClipboardList,
  UserRound,
} from "lucide-react";
import NewTaskDialog from "./new-task-dialog";
import NewAgentDialog from "./new-agent-dialog";

type Department = { slug: string; name: string };

const ROADMAP_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  // engineering
  "App is built": Layout,
  "Build marketing website": Globe,
  "Production product deployment exists": Server,
  "Buy domain": Globe,
  // design
  "Brand kit": Palette,
  "Design logo": PenLine,
  "Create pitch deck": Layout,
  "Build components": Box,
  // marketing
  "Positioning": Target,
  "Launch plan": Megaphone,
  "Marketing site": Globe,
  "Outbound": Mail,
  // sales
  "Define ICP": Target,
  "Gather prospects": ClipboardList,
  "Outbound emails": Mail,
  "Close deals": Hammer,
  // operations
  "Setup bookkeeping": Receipt,
  "Recurring brief": ClipboardList,
  "Cleanup tasks": Hammer,
  // finance
  "Stripe connected": CreditCard,
  "Bookkeeping live": Receipt,
  "Recurring close": Receipt,
  // legal
  "Incorporate LLC": Building2,
  "Terms & Privacy": Scale,
  "Customer agreements": FileSignature,
  // support
  "Inbox connected": InboxIcon,
  "Macros set": ClipboardList,
  "Escalation tree": Hammer,
};

const HERO_BY_DEPT: Record<
  string,
  {
    headline: (org: string) => React.ReactNode;
    cta: string;
    mockups: { url: string; tone: string; label: string }[];
    roadmap: { title: string; subtitle: string; status: "todo" | "done" }[];
    progress: string;
  }
> = {
  engineering: {
    headline: (org) => (
      <>
        Let&apos;s build <span className="text-ink">your app</span> from
        the ground up.
      </>
    ),
    cta: "Engineering agent ready",
    mockups: [
      { url: `theft.com`, tone: "browser", label: "Landing Page" },
      { url: `app.theft.com`, tone: "browser", label: "Application" },
    ],
    roadmap: [
      { title: "App is built", subtitle: "Complete task", status: "todo" },
      { title: "Build marketing website", subtitle: "Complete task", status: "todo" },
      {
        title: "Production product deployment exists",
        subtitle: "Needs earlier steps first",
        status: "todo",
      },
      { title: "Buy domain", subtitle: "Provision resource", status: "todo" },
    ],
    progress: "0/7 Setup",
  },
  design: {
    headline: () => (
      <>
        Let&apos;s build <span className="text-ink">your visual identity</span>{" "}
        from the ground up.
      </>
    ),
    cta: "Design agent ready",
    mockups: [
      { url: "brand-kit", tone: "art", label: "Brand kit" },
      { url: "ui-kit", tone: "art", label: "UI kit" },
    ],
    roadmap: [
      { title: "Brand kit", subtitle: "Choose vibe + lay out board", status: "todo" },
      { title: "Design logo", subtitle: "Generate logo set", status: "todo" },
      { title: "Create pitch deck", subtitle: "Outline + design slides", status: "todo" },
      { title: "Build components", subtitle: "Establish UI primitives", status: "todo" },
    ],
    progress: "0/5 Setup",
  },
  marketing: {
    headline: () => (
      <>
        Let&apos;s build <span className="text-ink">your go-to-market</span>{" "}
        from the ground up.
      </>
    ),
    cta: "Marketing agent ready",
    mockups: [
      { url: "campaign", tone: "doc", label: "Campaign brief" },
      { url: "social", tone: "doc", label: "Social pack" },
    ],
    roadmap: [
      { title: "Positioning", subtitle: "Sharpen ICP + value", status: "todo" },
      { title: "Launch plan", subtitle: "Channels + cadence", status: "todo" },
      { title: "Marketing site", subtitle: "Build & ship", status: "todo" },
      { title: "Outbound", subtitle: "Audiences + sequences", status: "todo" },
    ],
    progress: "0/5 Setup",
  },
  sales: {
    headline: () => (
      <>
        Let&apos;s build <span className="text-ink">your pipeline</span>{" "}
        from the ground up.
      </>
    ),
    cta: "Sales agent ready",
    mockups: [
      { url: "icp", tone: "doc", label: "ICP brief" },
      { url: "prospects", tone: "doc", label: "Prospects" },
    ],
    roadmap: [
      { title: "Define ICP", subtitle: "Buyer + pain", status: "todo" },
      { title: "Gather prospects", subtitle: "Build target list", status: "todo" },
      { title: "Outbound emails", subtitle: "Run sequences", status: "todo" },
      { title: "Close deals", subtitle: "Move to revenue", status: "todo" },
    ],
    progress: "0/4 Setup",
  },
  operations: {
    headline: () => (
      <>
        Let&apos;s set up <span className="text-ink">your operations</span>{" "}
        from the ground up.
      </>
    ),
    cta: "Operations agent ready",
    mockups: [
      { url: "report", tone: "doc", label: "Status brief" },
      { url: "exports", tone: "doc", label: "Exports" },
    ],
    roadmap: [
      { title: "Setup bookkeeping", subtitle: "Connect accounts", status: "todo" },
      { title: "Recurring brief", subtitle: "Weekly status", status: "todo" },
      { title: "Cleanup tasks", subtitle: "Cross-system tidy", status: "todo" },
    ],
    progress: "0/3 Setup",
  },
  finance: {
    headline: () => (
      <>
        Let&apos;s set up <span className="text-ink">your finance stack</span>{" "}
        from the ground up.
      </>
    ),
    cta: "Finance agent ready",
    mockups: [
      { url: "stripe", tone: "doc", label: "Stripe" },
      { url: "ledger", tone: "doc", label: "Ledger" },
    ],
    roadmap: [
      { title: "Stripe connected", subtitle: "Test + live keys", status: "todo" },
      { title: "Bookkeeping live", subtitle: "Reconcile + close", status: "todo" },
      { title: "Recurring close", subtitle: "Monthly handoff", status: "todo" },
    ],
    progress: "0/3 Setup",
  },
  legal: {
    headline: () => (
      <>
        Let&apos;s set up <span className="text-ink">your legal foundation</span>.
      </>
    ),
    cta: "Legal agent ready",
    mockups: [
      { url: "tos", tone: "doc", label: "Terms" },
      { url: "privacy", tone: "doc", label: "Privacy" },
    ],
    roadmap: [
      { title: "Incorporate LLC", subtitle: "File + bank", status: "todo" },
      { title: "Terms & Privacy", subtitle: "Draft + publish", status: "todo" },
      { title: "Customer agreements", subtitle: "MSA / DPA", status: "todo" },
    ],
    progress: "0/3 Setup",
  },
  support: {
    headline: () => (
      <>
        Let&apos;s set up <span className="text-ink">your customer support</span>.
      </>
    ),
    cta: "Support agent ready",
    mockups: [
      { url: "inbox", tone: "doc", label: "Inbox" },
      { url: "macros", tone: "doc", label: "Macros" },
    ],
    roadmap: [
      { title: "Inbox connected", subtitle: "Domain + routing", status: "todo" },
      { title: "Macros set", subtitle: "Common replies", status: "todo" },
      { title: "Escalation tree", subtitle: "When to ping", status: "todo" },
    ],
    progress: "0/3 Setup",
  },
};

export default function DepartmentHero({
  orgName,
  orgSlug,
  department,
  hasActiveTasks: _hasActiveTasks,
}: {
  orgName: string;
  orgSlug: string;
  department: Department;
  hasActiveTasks: boolean;
}) {
  const cfg = HERO_BY_DEPT[department.slug] ?? HERO_BY_DEPT.engineering;
  const [taskOpen, setTaskOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 overflow-y-auto p-6 pb-20">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex items-center gap-2 text-base">
            <DeptIcon slug={department.slug} />
            <span className="font-medium">{department.name} Department</span>
            <button
              type="button"
              className="ml-auto size-7 rounded-md hover:bg-line/60 inline-flex items-center justify-center"
              aria-label="More"
            >
              <MoreHorizontal className="size-4 text-ink-soft" />
            </button>
          </div>

          <div className="rounded-2xl bg-canvas/80 border border-line/70 px-8 py-16 flex flex-col items-center text-center gap-6">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-line/70 bg-paper px-3 py-1 text-xs text-ink">
              <Sparkles className="size-3 text-ink-muted" />
              {cfg.cta}
            </div>
            <h1 className="text-3xl tracking-tight max-w-2xl font-medium leading-tight">
              {cfg.headline(orgName)}
            </h1>
          </div>

          <div className="rounded-2xl border border-line/70 bg-paper p-4">
            <div className="flex items-center justify-between mb-3">
              <Link
                href={`/${orgSlug}/roadmap`}
                className="text-xs text-ink-muted hover:text-ink hover:underline transition-colors"
              >
                {department.name} Roadmap ↗
              </Link>
              <span className="text-2xs uppercase tracking-wider text-ink-soft">
                {cfg.progress}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {cfg.roadmap.map((node, i) => {
                const Icon = ROADMAP_ICON[node.title] ?? Layout;
                const Status = node.status === "done" ? CheckCircle2 : Circle;
                return (
                  <button
                    key={i}
                    type="button"
                    className="text-left rounded-md border border-line/70 bg-canvas px-3 py-2 hover:border-line-strong transition-colors flex items-start gap-2"
                  >
                    <span className="size-7 rounded-md bg-paper border border-line/70 inline-flex items-center justify-center shrink-0">
                      <Icon className="size-3.5 text-ink-muted" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-ink leading-tight inline-flex items-center gap-1">
                        <span className="truncate">{node.title}</span>
                        <Status
                          className={`size-3 shrink-0 ${
                            node.status === "done" ? "text-ink-muted" : "text-ink-soft"
                          }`}
                        />
                      </div>
                      <div className="text-2xs text-ink-muted mt-0.5">{node.subtitle}</div>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Floating action button */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
        {fabOpen && (
          <div className="mb-2 rounded-2xl bg-ink/95 backdrop-blur-sm shadow-xl overflow-hidden w-72">
            <button
              type="button"
              onClick={() => { setFabOpen(false); setAgentOpen(true); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-paper/5 transition-colors text-left"
            >
              <span className="size-9 rounded-md bg-paper/10 inline-flex items-center justify-center shrink-0">
                <UserRound className="size-4 text-paper" />
              </span>
              <span className="flex-1 min-w-0">
                <div className="text-sm font-medium text-paper">New Agent</div>
                <div className="text-xs text-paper/60 mt-0.5">Employee you can give tasks to</div>
              </span>
            </button>
            <div className="h-px bg-paper/10" />
            <button
              type="button"
              onClick={() => { setFabOpen(false); setTaskOpen(true); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-paper/5 transition-colors text-left"
            >
              <span className="size-9 rounded-md bg-paper/10 inline-flex items-center justify-center shrink-0">
                <ClipboardList className="size-4 text-paper" />
              </span>
              <span className="flex-1 min-w-0">
                <div className="text-sm font-medium text-paper">New Task</div>
                <div className="text-xs text-paper/60 mt-0.5">Work to assign your agents</div>
              </span>
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => setFabOpen((o) => !o)}
          className="size-10 rounded-full bg-ink text-paper inline-flex items-center justify-center shadow-md hover:opacity-90 transition-opacity"
          aria-label="New"
        >
          <Plus className="size-5" />
        </button>
      </div>

      <NewTaskDialog
        organization={{ id: "", slug: orgSlug }}
        open={taskOpen}
        onOpenChange={(o) => { setTaskOpen(o); if (!o) setFabOpen(false); }}
      />
      <NewAgentDialog
        organization={{ id: "", slug: orgSlug }}
        defaultDepartment={department.slug}
        open={agentOpen}
        onOpenChange={(o) => { setAgentOpen(o); if (!o) setFabOpen(false); }}
      />
    </div>
  );
}


function DeptIcon({ slug }: { slug: string }) {
  return (
    <span
      className="size-4 rounded-sm bg-canvas border border-line"
    />
  );
}
