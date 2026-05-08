"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import NewTaskDialog from "@/components/new-task-dialog";

type Org = { id: string; slug: string; name: string };
type Department = { id: string; slug: string; name: string; context: string | null };
type Agent = { id: string; name: string };
type Task = { id: string; title: string; status: string };

type SuggestedItem = { title: string; desc: string };

const SUGGESTED: Record<string, SuggestedItem[]> = {
  engineering: [
    { title: "Build feature", desc: "Define specs and implement a new user-facing feature end-to-end with tests." },
    { title: "Fix a bug", desc: "Triage a reported issue, identify root cause, and ship a targeted fix." },
    { title: "Set up CI/CD", desc: "Configure automated testing, linting, and deployment pipelines." },
    { title: "Code review", desc: "Review open pull requests, leave comments, and merge clean branches." },
  ],
  design: [
    { title: "Create logo", desc: "Start a design workflow. Ask the Design Agent to create and deliver perfect artwork." },
    { title: "Pitch deck", desc: "Create a pitch deck using the model brand visual system." },
    { title: "Email templates", desc: "Create email templates from the brand visual system." },
    { title: "UI kit", desc: "Create templates of UI guidelines and component libraries." },
  ],
  marketing: [
    { title: "Write blog post", desc: "Research a topic and produce a long-form, SEO-ready article." },
    { title: "Email campaign", desc: "Draft copy, segment audience, and schedule a nurture sequence." },
    { title: "Social content", desc: "Create a week of posts across LinkedIn, X, and Instagram." },
    { title: "SEO audit", desc: "Audit top pages for keyword gaps, missing meta, and link opportunities." },
  ],
  sales: [
    { title: "Prospect outreach", desc: "Identify ICP leads, research each, and draft personalised first-touch emails." },
    { title: "Write proposal", desc: "Build a scoped proposal with pricing, timeline, and acceptance criteria." },
    { title: "Sales deck", desc: "Produce a tailored deck for an upcoming discovery or close call." },
    { title: "CRM update", desc: "Sync deal stages, notes, and next-action dates across all open opportunities." },
  ],
  operations: [
    { title: "Create SOP", desc: "Document a recurring process as a step-by-step standard operating procedure." },
    { title: "Set up automation", desc: "Wire a workflow trigger to reduce manual repetition for the team." },
    { title: "Meeting notes", desc: "Summarise a meeting, extract action items, and distribute to attendees." },
    { title: "Process audit", desc: "Review a workflow end-to-end, flag bottlenecks, and propose fixes." },
  ],
  finance: [
    { title: "Monthly report", desc: "Pull revenue, expenses, and runway into a clean executive summary." },
    { title: "Invoice customer", desc: "Generate and send an invoice tied to a completed milestone." },
    { title: "Expense report", desc: "Categorise recent transactions and flag anomalies for review." },
    { title: "Budget forecast", desc: "Model next-quarter spend against current burn and revenue trajectory." },
  ],
  legal: [
    { title: "Draft contract", desc: "Generate a first-draft agreement from a template for negotiation." },
    { title: "Review terms", desc: "Analyse an incoming contract and flag risky or non-standard clauses." },
    { title: "Compliance audit", desc: "Check product and processes against the relevant regulatory framework." },
    { title: "NDA", desc: "Produce a mutual or one-way NDA ready for counter-party signature." },
  ],
  support: [
    { title: "Respond to tickets", desc: "Triage open support cases and draft accurate, empathetic replies." },
    { title: "Write FAQ", desc: "Identify the top questions from ticket data and publish self-serve answers." },
    { title: "Escalation playbook", desc: "Define tiers, owners, and response SLAs for complex issues." },
    { title: "User guide", desc: "Write step-by-step documentation for a feature or workflow." },
  ],
};

const DEPT_DISPLAY_NAME: Record<string, string> = {
  engineering: "Engineer",
  design: "Design Agent",
  marketing: "Marketing Agent",
  sales: "Sales Agent",
  operations: "Operations Agent",
  finance: "Finance Agent",
  legal: "Legal Agent",
  support: "Support Agent",
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

export default function DepartmentPanel({
  organization,
  department,
}: {
  organization: Org;
  department: Department;
}) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksOpen, setTasksOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [composerText, setComposerText] = useState("");

  useEffect(() => {
    void Promise.all([
      fetch(`/api/${organization.slug}/agents`).then((r) => r.json()),
      fetch(`/api/${organization.slug}/tasks`).then((r) => r.json()),
    ]).then(([ar, tr]) => {
      setAgents(
        (ar.agents ?? []).filter(
          (a: { department_id: string | null }) => a.department_id === department.id,
        ),
      );
      setTasks(
        (tr.tasks ?? []).filter(
          (t: { department_id: string | null }) => t.department_id === department.id,
        ),
      );
    });
  }, [organization.slug, department.id]);

  const primaryAgent = agents[0] ?? null;
  const suggestions = SUGGESTED[department.slug] ?? SUGGESTED.engineering;
  const dotClass = DEPT_DOT[department.slug] ?? "bg-mustard";

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Agent header */}
      <div className="px-4 py-3 border-b border-line/70 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`size-2.5 rounded-full shrink-0 ${dotClass}`} />
          <span className="text-base font-medium truncate">
            {DEPT_DISPLAY_NAME[department.slug] ?? primaryAgent?.name ?? `${department.name} Agent`}
          </span>
          <span className="text-2xs text-ink-muted bg-canvas border border-line/70 px-1.5 py-0.5 rounded shrink-0">
            default
          </span>
        </div>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="shrink-0 text-xs rounded-md bg-ink text-paper px-2.5 py-1 hover:opacity-90"
        >
          + New task
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Suggested Next */}
        <div>
          <div className="text-2xs uppercase tracking-[0.14em] text-ink-soft mb-2">
            Suggested Next
          </div>
          <ul className="space-y-1.5">
            {suggestions.map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setDialogOpen(true)}
                  className="w-full text-left rounded-lg border border-line/70 bg-paper px-3 py-2.5 hover:border-line-strong transition-colors flex items-start gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-medium text-ink">{s.title}</div>
                    <div className="text-xs text-ink-muted mt-0.5 leading-snug line-clamp-2">
                      {s.desc}
                    </div>
                  </div>
                  <ChevronRight className="size-3.5 text-ink-soft shrink-0 mt-0.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Tasks section */}
        <div>
          <button
            type="button"
            onClick={() => setTasksOpen((v) => !v)}
            className="w-full flex items-center justify-between text-2xs uppercase tracking-[0.14em] text-ink-soft mb-2"
          >
            <span>Tasks</span>
            {tasksOpen ? (
              <ChevronDown className="size-3" />
            ) : (
              <ChevronRight className="size-3" />
            )}
          </button>

          <div className="flex items-center gap-1.5 text-base text-ink-muted">
            <span className="text-line-strong select-none">—</span>
            <span>Scheduled tasks</span>
            <span className="ml-auto">{tasks.length}</span>
          </div>

          {tasksOpen && tasks.length > 0 && (
            <ul className="mt-2 space-y-1">
              {tasks.map((t) => (
                <li
                  key={t.id}
                  className="rounded-md border border-line/70 bg-canvas px-2 py-1.5 text-sm flex items-center justify-between"
                >
                  <span className="truncate text-ink">{t.title}</span>
                  <span className="text-2xs text-ink-muted capitalize ml-2 shrink-0">
                    {t.status.replace(/_/g, " ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Cofounder inline composer */}
      <div className="px-4 pb-4 pt-2 shrink-0 border-t border-line/70">
        <div className="rounded-lg border border-line/70 bg-paper">
          <div className="px-3 py-2 border-b border-line/70 inline-flex items-center gap-1.5 text-xs">
            <span className="size-3 rounded-full bg-mustard/30 inline-block" />
            <span className="text-ink-muted">Cofounder</span>
          </div>
          <textarea
            value={composerText}
            onChange={(e) => setComposerText(e.target.value)}
            placeholder="Ask Cofounder anything about your company…"
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
            >
              ↑
            </button>
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
