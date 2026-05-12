import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/store";
import { PageTitle, Hint, Eyebrow } from "@/components/ui/primitives";
import { ArrowLeft, Plus, GitBranch, ChevronRight } from "lucide-react";

type TreeStep = {
  label: string;
  options: string[];
};

type DecisionTree = {
  id: string;
  title: string;
  description: string;
  nodes: number;
  terminals: number;
  updated: string;
  steps: TreeStep[];
};

const DECISION_TREES: DecisionTree[] = [
  {
    id: "1",
    title: "Login Problems",
    description:
      "Can't log in → wrong password → reset link sent. Or: SSO error → check Okta config.",
    nodes: 8,
    terminals: 3,
    updated: "1w ago",
    steps: [
      { label: "Can you reach the login page?", options: ["Yes", "No — site down"] },
      { label: "Do you have an account?", options: ["Yes", "No — create account"] },
      { label: "Password or SSO login?", options: ["Password", "SSO / Google"] },
    ],
  },
  {
    id: "2",
    title: "Billing Questions",
    description:
      "What is my current plan → show plan page link. Downgrade → confirm intent + warn data loss. Cancel → retention offer first.",
    nodes: 11,
    terminals: 4,
    updated: "3d ago",
    steps: [
      { label: "What's the billing question?", options: ["View invoice", "Change plan", "Cancel"] },
      { label: "Changing to which direction?", options: ["Downgrade", "Upgrade"] },
      { label: "Reviewed what changes?", options: ["Yes, proceed", "No, show diff"] },
    ],
  },
];

export default async function DecisionTreesPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) notFound();

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="p-6 space-y-6">
        <header className="flex items-start justify-between">
          <div>
            <Link
              href={`/${org}/support`}
              className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink mb-2"
            >
              <ArrowLeft className="size-3" /> Support
            </Link>
            <PageTitle>Decision Trees</PageTitle>
            <Hint>
              Structured flows for Fin to follow. Each tree handles one support
              category end-to-end.
            </Hint>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm rounded-md bg-ink text-paper px-3 py-1.5 hover:opacity-90"
          >
            <Plus className="size-3.5" /> New tree
          </button>
        </header>

        <div className="space-y-4">
          {DECISION_TREES.map((tree) => (
            <div
              key={tree.id}
              className="rounded-xl border border-line/70 bg-paper p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="size-9 rounded-lg bg-canvas border border-line/70 flex items-center justify-center shrink-0">
                    <GitBranch className="size-4 text-ink-muted" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-ink">{tree.title}</div>
                    <div className="text-xs text-ink-muted mt-0.5 leading-snug">
                      {tree.description}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-xs text-ink-muted">
                  <span>{tree.nodes} nodes</span>
                  <span>{tree.terminals} exits</span>
                  <span>Updated {tree.updated}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Eyebrow>Node preview</Eyebrow>
                <div className="space-y-2">
                  {tree.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-2xs text-ink-soft mt-0.5 w-4 shrink-0">
                        {i + 1}.
                      </span>
                      <div className="flex-1">
                        <div className="text-xs text-ink">{step.label}</div>
                        <div className="flex items-center flex-wrap gap-1 mt-1">
                          {step.options.map((opt) => (
                            <span
                              key={opt}
                              className="inline-flex items-center gap-0.5 text-2xs bg-canvas border border-line/60 rounded px-1.5 py-0.5 text-ink-muted"
                            >
                              <ChevronRight className="size-2.5" /> {opt}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="text-xs text-ink-muted hover:text-ink"
              >
                Edit full tree →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
