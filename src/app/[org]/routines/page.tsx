"use client";

import { useState, useEffect } from "react";
import { Plus, Calendar } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import EmptyState from "@/components/empty-state";

type Routine = {
  id: string;
  name: string;
  agent: string;
  cron: string;
  enabled: boolean;
  last_run_at: string | null;
  last_run_status: "ok" | "failed" | null;
};

export default function RoutinesPage() {
  const params = useParams<{ org: string }>();
  const org = params.org;
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    void fetch(`/api/${org}/routines`)
      .then((r) => (r.ok ? r.json() : { routines: [] }))
      .then((j: { routines: Routine[] }) => setRoutines(j.routines ?? []));
  }, [org]);

  async function toggle(id: string, enabled: boolean) {
    setBusy(id);
    setRoutines((prev) => prev.map((r) => (r.id === id ? { ...r, enabled } : r)));
    await fetch(`/api/${org}/routines/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    setBusy(null);
  }

  async function remove(id: string) {
    setRoutines((prev) => prev.filter((r) => r.id !== id));
    await fetch(`/api/${org}/routines/${id}`, { method: "DELETE" });
  }

  const fmtDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl tracking-tight">Routines</h1>
            <p className="text-sm text-ink-muted">
              Scheduled, recurring tasks an agent runs without you asking.
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href={`/${org}/timeline`}
              className="inline-flex items-center gap-1 rounded-md border border-line bg-paper px-2 py-1 text-xs hover:border-line-strong"
            >
              Timeline
            </Link>
            <Link
              href={`/${org}/routines/new`}
              className="inline-flex items-center gap-1 rounded-md bg-ink text-paper px-3 py-1.5 text-sm"
            >
              <Plus className="size-3.5" /> New routine
            </Link>
          </div>
        </header>

        {routines.length === 0 ? (
          <EmptyState
            Icon={Calendar}
            title="No routines yet"
            body="Routines run on a schedule — daily digests, weekly closes, social packs."
            actions={[{ label: "New routine", href: `/${org}/routines/new`, primary: true }]}
          />
        ) : (
          <ul className="rounded-lg border border-line/70 bg-paper divide-y divide-line/60">
            {routines.map((r) => (
              <li key={r.id} className="px-4 py-3 flex items-center justify-between hover:bg-canvas">
                <div>
                  <Link href={`/${org}/routines/${r.id}`} className="text-base font-medium tracking-tight hover:underline decoration-line">{r.name}</Link>
                  <div className="text-xs text-ink-muted inline-flex items-center gap-2 mt-0.5">
                    <span>{r.agent}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="size-3" />
                      {r.cron}
                    </span>
                    <span>·</span>
                    <span>last run {fmtDate(r.last_run_at)}</span>
                    {r.last_run_status === "failed" && (
                      <span className="text-brick-ink">· failed</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={busy === r.id}
                    onClick={() => toggle(r.id, !r.enabled)}
                    className={`text-2xs uppercase rounded px-1.5 py-0.5 border transition-colors ${
                      r.enabled
                        ? "border-sage/40 bg-sage/20 text-sage-ink hover:bg-sage/30"
                        : "border-line/70 bg-cream text-ink-muted hover:border-line-strong"
                    }`}
                  >
                    {r.enabled ? "Active" : "Paused"}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(r.id)}
                    className="text-xs rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong text-brick-ink"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
