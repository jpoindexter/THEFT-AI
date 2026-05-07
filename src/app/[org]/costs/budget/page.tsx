"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "@/components/toast-host";

type Agent = { id: string; name: string };

export default function BudgetPage() {
  const params = useParams<{ org: string }>();
  const [monthly, setMonthly] = useState(800);
  const [hardLimit, setHardLimit] = useState(true);
  const [warnPct, setWarnPct] = useState(80);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [perAgent, setPerAgent] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetch(`/api/${params.org}`)
      .then((r) => r.json())
      .catch(() => null);

    void fetch(`/api/${params.org}/agents`)
      .then((r) => r.json())
      .then((j: { agents: Agent[] }) => {
        const agentList = j.agents ?? [];
        setAgents(agentList);
        setPerAgent(Object.fromEntries(agentList.map((a) => [a.id, 0])));
      });

    void fetch(`/api/${params.org}`)
      .then((r) => r.json())
      .then((j: { org?: { budget_monthly_usd?: number | null; budget_hard_limit?: boolean | null; budget_warn_pct?: number | null; budget_per_agent?: Record<string, number> | null } }) => {
        if (!j.org) return;
        if (j.org.budget_monthly_usd != null) setMonthly(j.org.budget_monthly_usd);
        if (j.org.budget_hard_limit != null) setHardLimit(j.org.budget_hard_limit);
        if (j.org.budget_warn_pct != null) setWarnPct(j.org.budget_warn_pct);
        if (j.org.budget_per_agent) setPerAgent(j.org.budget_per_agent);
      });
  }, [params.org]);

  async function save() {
    setSaving(true);
    await fetch(`/api/${params.org}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        budget_monthly_usd: monthly,
        budget_hard_limit: hardLimit,
        budget_warn_pct: warnPct,
        budget_per_agent: perAgent,
      }),
    });
    setSaving(false);
    toast("Budget saved", "ok");
  }

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-5">
        <Link
          href={`/${params.org}/costs`}
          className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-3" /> Back to costs
        </Link>

        <header>
          <h1 className="text-xl tracking-tight">Budget & limits</h1>
          <p className="text-sm text-ink-muted">
            Cap workspace spend. When the hard limit is on, agents stop running
            until you raise the cap.
          </p>
        </header>

        <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-3">
          <div className="text-md font-medium tracking-tight">Workspace</div>
          <Field label="Monthly budget (USD)">
            <input
              type="number"
              value={monthly}
              onChange={(e) => setMonthly(Number(e.target.value))}
              className="w-32 h-9 rounded-md border border-line bg-paper px-3 text-base focus:outline-none focus:border-line-strong"
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
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
              className="w-24 h-9 rounded-md border border-line bg-paper px-3 text-base focus:outline-none focus:border-line-strong"
            />
          </Field>
        </section>

        {agents.length > 0 && (
          <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-2">
            <div className="text-md font-medium tracking-tight">Per-agent caps</div>
            <p className="text-xs text-ink-muted">
              Per-agent caps sum to{" "}
              <span className="font-mono">
                ${Object.values(perAgent).reduce((a, b) => a + b, 0)}
              </span>{" "}
              of ${monthly}.
            </p>
            <ul className="divide-y divide-line/60">
              {agents.map((a) => (
                <li
                  key={a.id}
                  className="py-2 flex items-center justify-between text-sm"
                >
                  <span>{a.name}</span>
                  <input
                    type="number"
                    value={perAgent[a.id] ?? 0}
                    onChange={(e) =>
                      setPerAgent({ ...perAgent, [a.id]: Number(e.target.value) })
                    }
                    className="w-24 h-8 rounded-md border border-line bg-paper px-2 text-sm font-mono focus:outline-none focus:border-line-strong"
                  />
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="flex justify-end gap-2">
          <Link
            href={`/${params.org}/costs`}
            className="text-sm rounded-md border border-line bg-paper px-3 py-1.5 hover:border-line-strong"
          >
            Cancel
          </Link>
          <button
            onClick={save}
            disabled={saving}
            className="text-sm rounded-md bg-ink text-paper px-3 py-1.5 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save budget"}
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
      <div className="text-sm text-ink">{label}</div>
      {children}
      {hint && <p className="text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}
