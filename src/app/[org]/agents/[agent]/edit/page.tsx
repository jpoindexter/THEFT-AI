"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const MODELS = ["claude-sonnet-4-6", "claude-opus-4-7", "claude-haiku-4-5"];

type Agent = {
  id: string;
  slug: string;
  name: string;
  role: string;
  title: string | null;
  capabilities: string | null;
  model: string;
  attached_skills: string[];
  instructions: string | null;
};

type Skill = { slug: string; name: string };

export default function AgentEditPage() {
  const params = useParams<{ org: string; agent: string }>();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [draft, setDraft] = useState<Partial<Agent>>({});

  useEffect(() => {
    void fetch(`/api/${params.org}/agents`)
      .then((r) => r.json())
      .then((j: { agents: Agent[] }) => {
        const a = j.agents.find(
          (x) => x.slug === params.agent || x.id === params.agent,
        );
        if (a) {
          setAgent(a);
          setDraft(a);
        }
      });
    void fetch(`/api/${params.org}/skills`)
      .then((r) => r.json())
      .then((j: { skills: Skill[] }) => setSkills(j.skills ?? []));
  }, [params.org, params.agent]);

  function toggleSkill(slug: string) {
    setDraft((d) => {
      const cur = d.attached_skills ?? [];
      return {
        ...d,
        attached_skills: cur.includes(slug)
          ? cur.filter((s) => s !== slug)
          : [...cur, slug],
      };
    });
  }

  if (!agent) {
    return (
      <div className="absolute inset-0 grid place-items-center text-[12px] text-ink-muted">
        Loading…
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-5">
        <Link
          href={`/${params.org}/agents/${params.agent}`}
          className="inline-flex items-center gap-1 text-[12px] text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-3" /> Back to {agent.name}
        </Link>

        <header>
          <h1 className="text-xl tracking-tight">Edit agent</h1>
          <p className="text-[12px] text-ink-muted">
            Update instructions, model, and attached skills.
          </p>
        </header>

        <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-3">
          <Field label="Name">
            <input
              value={draft.name ?? ""}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="w-full h-9 rounded-md border border-line bg-paper px-3 text-[13px] focus:outline-none focus:border-line-strong"
            />
          </Field>
          <Field label="Title" hint="Short role line shown on the agent card.">
            <input
              value={draft.title ?? ""}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="e.g. Senior research agent"
              className="w-full h-9 rounded-md border border-line bg-paper px-3 text-[13px] focus:outline-none focus:border-line-strong"
            />
          </Field>
          <Field label="Capabilities">
            <textarea
              value={draft.capabilities ?? ""}
              onChange={(e) =>
                setDraft({ ...draft, capabilities: e.target.value })
              }
              rows={3}
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-[13px] focus:outline-none focus:border-line-strong"
            />
          </Field>
          <Field label="Model">
            <select
              value={draft.model ?? agent.model}
              onChange={(e) => setDraft({ ...draft, model: e.target.value })}
              className="w-full h-9 rounded-md border border-line bg-paper px-2 text-[13px]"
            >
              {MODELS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Instructions" hint="System prompt prepended on every turn.">
            <textarea
              value={draft.instructions ?? ""}
              onChange={(e) =>
                setDraft({ ...draft, instructions: e.target.value })
              }
              rows={6}
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-[13px] focus:outline-none focus:border-line-strong"
            />
          </Field>
        </section>

        <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-2">
          <div className="text-[14px] font-medium tracking-tight">Skills</div>
          <div className="grid grid-cols-2 gap-1.5">
            {skills.map((s) => {
              const on = (draft.attached_skills ?? []).includes(s.slug);
              return (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => toggleSkill(s.slug)}
                  className={`text-left rounded-md border px-2 py-1.5 text-[12px] transition-colors ${
                    on
                      ? "border-ink bg-cream"
                      : "border-line hover:border-line-strong"
                  }`}
                >
                  <div className="font-medium">{s.name}</div>
                  <div className="font-mono text-[10px] text-ink-muted">
                    {s.slug}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <div className="flex justify-end gap-2 pt-1">
          <Link
            href={`/${params.org}/agents/${params.agent}`}
            className="text-[12px] rounded-md border border-line bg-paper px-3 py-1.5 hover:border-line-strong"
          >
            Cancel
          </Link>
          <button
            type="button"
            className="text-[12px] rounded-md bg-ink text-paper px-3 py-1.5"
          >
            Save changes
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
