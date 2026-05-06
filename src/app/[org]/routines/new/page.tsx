"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const PRESETS = [
  { id: "weekly_status", label: "Weekly status brief", cron: "0 9 * * 1" },
  { id: "month_close", label: "Month-end close", cron: "0 17 L * *" },
  { id: "social_pack", label: "Daily social pack", cron: "0 7 * * 1-5" },
  { id: "custom", label: "Custom", cron: "" },
];

export default function NewRoutinePage() {
  const params = useParams<{ org: string }>();
  const router = useRouter();
  const [preset, setPreset] = useState("weekly_status");
  const [name, setName] = useState("Weekly status brief");
  const [agent, setAgent] = useState("operations");
  const [cron, setCron] = useState("0 9 * * 1");
  const [prompt, setPrompt] = useState(
    "Write a 5-bullet status brief covering shipped work, in-progress, blockers, decisions needed, and next focus.",
  );
  const [enabled, setEnabled] = useState(true);

  function pickPreset(id: string) {
    setPreset(id);
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    if (p.id !== "custom") {
      setName(p.label);
      setCron(p.cron);
    }
  }

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-5">
        <Link
          href={`/${params.org}/routines`}
          className="inline-flex items-center gap-1 text-[12px] text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-3" /> Back to routines
        </Link>

        <header>
          <h1 className="text-xl tracking-tight">New routine</h1>
          <p className="text-[12px] text-ink-muted">
            A scheduled task an agent runs without you asking.
          </p>
        </header>

        <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-3">
          <div className="text-[14px] font-medium tracking-tight">Preset</div>
          <div className="grid grid-cols-2 gap-1.5">
            {PRESETS.map((p) => {
              const on = preset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => pickPreset(p.id)}
                  className={`text-left rounded-md border px-2 py-1.5 text-[12px] transition-colors ${
                    on
                      ? "border-ink bg-cream"
                      : "border-line hover:border-line-strong"
                  }`}
                >
                  <div className="font-medium">{p.label}</div>
                  {p.cron && (
                    <code className="text-[10px] font-mono text-ink-muted">
                      {p.cron}
                    </code>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-3">
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-9 rounded-md border border-line bg-paper px-3 text-[13px] focus:outline-none focus:border-line-strong"
            />
          </Field>
          <Field label="Run as agent">
            <select
              value={agent}
              onChange={(e) => setAgent(e.target.value)}
              className="w-full h-9 rounded-md border border-line bg-paper px-2 text-[13px]"
            >
              {[
                "operations",
                "engineering",
                "design",
                "marketing",
                "sales",
                "finance",
                "legal",
                "support",
              ].map((d) => (
                <option key={d} value={d}>
                  {d[0].toUpperCase() + d.slice(1)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Schedule (cron)" hint="UTC. Use crontab.guru if unsure.">
            <input
              value={cron}
              onChange={(e) => setCron(e.target.value)}
              placeholder="0 9 * * 1"
              className="w-full h-9 rounded-md border border-line bg-paper px-3 text-[13px] font-mono focus:outline-none focus:border-line-strong"
            />
          </Field>
          <Field label="Prompt">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-[13px] focus:outline-none focus:border-line-strong"
            />
          </Field>
          <label className="inline-flex items-center gap-2 text-[12px]">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            Enabled
          </label>
        </section>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-[12px] rounded-md border border-line bg-paper px-3 py-1.5 hover:border-line-strong"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!name || !cron}
            className="text-[12px] rounded-md bg-ink text-paper px-3 py-1.5 disabled:opacity-40"
          >
            Save routine
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
