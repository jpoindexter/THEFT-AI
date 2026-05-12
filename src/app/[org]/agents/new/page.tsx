"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const DEPARTMENTS = [
  "engineering",
  "design",
  "marketing",
  "sales",
  "operations",
  "finance",
  "legal",
  "support",
];

const MODELS = [
  "claude-sonnet-4-6",
  "claude-opus-4-7",
  "claude-haiku-4-5",
];

type Skill = { slug: string; name: string };

export default function NewAgentPage() {
  const params = useParams<{ org: string }>();
  const router = useRouter();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("operations");
  const [model, setModel] = useState("claude-sonnet-4-6");
  const [instructions, setInstructions] = useState("");
  const [budget, setBudget] = useState(50);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [attached, setAttached] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch(`/api/${params.org}/skills`)
      .then((r) => r.ok ? r.json() : { skills: [] })
      .then((j: { skills: Skill[] }) => setSkills(j.skills ?? []))
      .catch(() => undefined);
  }, [params.org]);

  async function create() {
    if (!name || !role) return;
    setBusy(true);
    const res = await fetch(`/api/${params.org}/agents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, role, department, model, instructions, attached_skills: attached }),
    });
    setBusy(false);
    if (res.ok) router.replace(`/${params.org}/agents`);
  }

  function toggle(slug: string) {
    setAttached((cur) =>
      cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug],
    );
  }

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <header>
          <h1 className="text-xl tracking-tight">New agent</h1>
          <p className="text-sm text-ink-muted">
            A custom agent with its own instructions, model, integrations, and
            attached skills.
          </p>
        </header>

        <Section title="Identity">
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Outbound Researcher"
              className="w-full h-9 rounded-md border border-line bg-paper px-3 text-base focus:outline-none focus:border-line-strong"
            />
          </Field>
          <Field label="Role">
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. researcher"
              className="w-full h-9 rounded-md border border-line bg-paper px-3 text-base focus:outline-none focus:border-line-strong"
            />
          </Field>
          <Field label="Department">
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full h-9 rounded-md border border-line bg-paper px-2 text-base"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d[0].toUpperCase() + d.slice(1)}
                </option>
              ))}
            </select>
          </Field>
        </Section>

        <Section title="Reasoning">
          <Field label="Model">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full h-9 rounded-md border border-line bg-paper px-2 text-base"
            >
              {MODELS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Instructions" hint="Tell the agent what it owns and how to behave.">
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={5}
              placeholder="You are a research agent. You ..."
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-base focus:outline-none focus:border-line-strong"
            />
          </Field>
          <Field label="Monthly budget" hint="USD. Hard cap on token spend.">
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-32 h-9 rounded-md border border-line bg-paper px-3 text-base focus:outline-none focus:border-line-strong"
            />
          </Field>
        </Section>

        <Section title="Skills" hint="Reusable guidance attached to this agent.">
          {skills.length === 0 ? (
            <p className="text-sm text-ink-muted">
              No skills found in <code>/skills/</code>.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {skills.map((s) => {
                const on = attached.includes(s.slug);
                return (
                  <button
                    key={s.slug}
                    type="button"
                    onClick={() => toggle(s.slug)}
                    className={`text-left rounded-md border px-2 py-1.5 text-sm transition-colors ${
                      on
                        ? "border-ink bg-cream"
                        : "border-line hover:border-line-strong"
                    }`}
                  >
                    <div className="font-medium">{s.name}</div>
                    <div className="font-mono text-2xs text-ink-muted">
                      {s.slug}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Section>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm rounded-md border border-line bg-paper px-3 py-1.5 hover:border-line-strong"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={create}
            disabled={!name || !role || busy}
            className="text-sm rounded-md bg-ink text-paper px-3 py-1.5 disabled:opacity-40"
          >
            {busy ? "Creating…" : "Create agent"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-3">
      <div>
        <h2 className="text-md font-medium tracking-tight">{title}</h2>
        {hint && <p className="text-xs text-ink-muted">{hint}</p>}
      </div>
      {children}
    </section>
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
