"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

const AGENTS = [
  { id: "engineer", name: "Engineer", default: 200 },
  { id: "marketing", name: "Marketing", default: 60 },
  { id: "design", name: "Design", default: 100 },
  { id: "sales", name: "Sales", default: 40 },
  { id: "operations", name: "Operations", default: 40 },
  { id: "finance", name: "Finance", default: 40 },
  { id: "legal", name: "Legal", default: 20 },
  { id: "support", name: "Support", default: 20 },
];

export default function BudgetPage() {
  const params = useParams<{ org: string }>();
  const [monthly, setMonthly] = useState(800);
  const [hardLimit, setHardLimit] = useState(true);
  const [warnPct, setWarnPct] = useState(80);
  const [perAgent, setPerAgent] = useState<Record<string, number>>(
    Object.fromEntries(AGENTS.map((a) => [a.id, a.default])),
  );

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-5">
        <Link
          href={`/${params.org}/costs`}
          className="inline-flex items-center gap-1 text-[12px] text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-3" /> Back to costs
        </Link>

        <header>
          <h1 className="text-xl tracking-tight">Budget & limits</h1>
          <p className="text-[12px] text-ink-muted">
            Cap workspace spend. When the hard limit is on, agents stop running
            until you raise the cap.
          </p>
        </header>

        <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-3">
          <div className="text-[14px] font-medium tracking-tight">
            Workspace
          </div>
          <Field label="Monthly budget (USD)">
            <input
              type="number"
              value={monthly}
              onChange={(e) => setMonthly(Number(e.target.value))}
              className="w-32 h-9 rounded-md border border-line bg-paper px-3 text-[13px] focus:outline-none focus:border-line-strong"
            />
          </Field>
          <label className="flex items-center gap-2 text-[12px]">
            <input
              type="checkbox"
              checked={hardLimit}
              onChange={(e) => setHardLimit(e.target.checked)}
            />
            Hard cap (agents pause at 100%)
          </label>
          <Field label="Warn at" hint="% of monthly budget">
            <input
              type="number"
              value={warnPct}
              onChange={(e) => setWarnPct(Number(e.target.value))}
              className="w-24 h-9 rounded-md border border-line bg-paper px-3 text-[13px] focus:outline-none focus:border-line-strong"
            />
          </Field>
        </section>

        <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-2">
          <div className="text-[14px] font-medium tracking-tight">
            Per-agent caps
          </div>
          <p className="text-[11px] text-ink-muted">
            Per-agent caps sum to{" "}
            <span className="font-mono">
              ${Object.values(perAgent).reduce((a, b) => a + b, 0)}
            </span>{" "}
            of ${monthly}.
          </p>
          <ul className="divide-y divide-line/60">
            {AGENTS.map((a) => (
              <li
                key={a.id}
                className="py-2 flex items-center justify-between text-[12px]"
              >
                <span>{a.name}</span>
                <input
                  type="number"
                  value={perAgent[a.id]}
                  onChange={(e) =>
                    setPerAgent({
                      ...perAgent,
                      [a.id]: Number(e.target.value),
                    })
                  }
                  className="w-24 h-8 rounded-md border border-line bg-paper px-2 text-[12px] font-mono focus:outline-none focus:border-line-strong"
                />
              </li>
            ))}
          </ul>
        </section>

        <div className="flex justify-end gap-2">
          <Link
            href={`/${params.org}/costs`}
            className="text-[12px] rounded-md border border-line bg-paper px-3 py-1.5 hover:border-line-strong"
          >
            Cancel
          </Link>
          <button className="text-[12px] rounded-md bg-ink text-paper px-3 py-1.5">
            Save budget
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="text-[12px] text-ink">{label}</div>
      {children}
      {hint && <p className="text-[11px] text-ink-muted">{hint}</p>}
    </div>
  );
}
