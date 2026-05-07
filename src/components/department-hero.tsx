"use client";

import { useState } from "react";
import { Sparkles, Plus, MoreHorizontal } from "lucide-react";
import NewTaskDialog from "./new-task-dialog";

type Department = { slug: string; name: string };

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
  department,
  hasActiveTasks,
}: {
  orgName: string;
  department: Department;
  hasActiveTasks: boolean;
}) {
  const cfg = HERO_BY_DEPT[department.slug] ?? HERO_BY_DEPT.engineering;
  const [taskOpen, setTaskOpen] = useState(false);

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center gap-2 text-base">
          <DeptIcon slug={department.slug} />
          <span className="font-medium">{department.name} Department</span>
          <button
            type="button"
            className="ml-auto size-7 rounded-md hover:bg-line/60 inline-flex items-center justify-center"
            aria-label="More" title="More actions"
          >
            <MoreHorizontal className="size-4 text-ink-soft" />
          </button>
        </div>

        <div className="rounded-2xl bg-canvas/80 border border-line/70 px-8 py-12 flex flex-col items-center text-center gap-6">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-line/70 bg-paper px-3 py-1 text-xs text-ink">
            <Sparkles className="size-3 text-mustard-ink" />
            {cfg.cta}
          </div>
          <h1 className="text-3xl tracking-tight max-w-2xl font-medium leading-tight">
            {cfg.headline(orgName)}
          </h1>
          <div className="flex items-end gap-4 pt-4">
            {cfg.mockups.map((m, i) => (
              <DeviceMock key={i} url={m.url} label={m.label} />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-line/70 bg-paper p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-ink-muted">
              {department.name} Roadmap
            </span>
            <span className="text-2xs uppercase tracking-wider text-ink-soft">
              {cfg.progress}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {cfg.roadmap.map((node, i) => (
              <button
                key={i}
                type="button"
                className="text-left rounded-md border border-line/70 bg-canvas px-3 py-2 hover:border-line-strong transition-colors"
              >
                <div className="size-5 rounded-sm bg-line mb-1.5" />
                <div className="text-sm font-medium text-ink leading-tight">
                  {node.title}
                </div>
                <div className="text-2xs text-ink-muted mt-0.5">
                  {node.subtitle}
                </div>
              </button>
            ))}
          </div>
        </div>

        {hasActiveTasks ? (
          <div className="text-sm text-ink-muted text-center">
            Active tasks shown in the right panel.
          </div>
        ) : (
          <div className="rounded-lg border border-mustard/40 bg-mustard/15 p-3 text-center max-w-md mx-auto">
            <div className="text-sm text-mustard-ink font-medium">
              First task here?
            </div>
            <p className="text-xs text-mustard-ink/80 leading-snug mt-1">
              Kick off the {department.name} agent with the recommended
              onboarding task — it gathers context first, then proposes work.
            </p>
            <button
              type="button"
              onClick={() => setTaskOpen(true)}
              className="mt-2 inline-flex items-center gap-1 rounded-md bg-ink text-paper px-3 py-1 text-xs hover:opacity-90"
            >
              Start onboarding task
            </button>
          </div>
        )}

        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={() => setTaskOpen(true)}
            className="inline-flex items-center gap-1 rounded-md bg-ink text-paper px-3 py-1.5 text-sm"
          >
            <Plus className="size-3.5" />
            New task
          </button>
        </div>
      </div>

      <NewTaskDialog
        organization={{ id: "", slug: orgName.toLowerCase().replace(/\s+/g, "-") }}
        open={taskOpen}
        onOpenChange={setTaskOpen}
      />
    </div>
  );
}

function DeviceMock({ url, label }: { url: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="rounded-xl border border-line/80 bg-paper shadow-[0_4px_24px_-12px_rgba(0,0,0,0.15)] overflow-hidden w-56">
        <div className="bg-cream border-b border-line/70 px-2 py-1 flex items-center gap-1.5">
          <div className="flex gap-1">
            <span className="size-1.5 rounded-full bg-mustard" />
            <span className="size-1.5 rounded-full bg-mustard" />
            <span className="size-1.5 rounded-full bg-sage" />
          </div>
          <div className="flex-1 text-[8px] text-ink-muted text-center font-mono">
            {url}
          </div>
        </div>
        <div className="aspect-[4/3] p-3 space-y-1.5">
          <div className="h-1.5 w-12 rounded bg-line" />
          <div className="h-1.5 w-20 rounded bg-cream" />
          <div className="h-1.5 w-16 rounded bg-cream" />
          <div className="h-12 mt-2 rounded bg-cream" />
          <div className="h-3 mt-1 rounded bg-cream w-16" />
        </div>
      </div>
      <span className="text-2xs text-ink-muted">{label}</span>
    </div>
  );
}

function DeptIcon({ slug }: { slug: string }) {
  const colors: Record<string, string> = {
    engineering: "bg-mustard/40",
    design: "bg-cream",
    marketing: "bg-mustard/30",
    sales: "bg-sage/30",
    operations: "bg-sage/30",
    finance: "bg-cream",
    legal: "bg-cream",
    support: "bg-cream",
  };
  return (
    <span
      className={`size-4 rounded-sm  ${colors[slug] ?? "bg-cream"}`}
    />
  );
}
