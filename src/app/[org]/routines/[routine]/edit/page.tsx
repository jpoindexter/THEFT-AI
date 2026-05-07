"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import {
  Card,
  CardBody,
  Eyebrow,
  Hint,
  PageTitle,
  ButtonPrimary,
  ButtonGhost,
} from "@/components/ui/primitives";
import { toast } from "@/components/toast-host";

type Routine = {
  id: string;
  name: string;
  description: string | null;
  agent: string;
  cron: string;
  enabled: boolean;
};

export default function EditRoutinePage() {
  const params = useParams<{ org: string; routine: string }>();
  const router = useRouter();
  const [draft, setDraft] = useState<Routine | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch(`/api/${params.org}/routines`)
      .then((r) => r.json())
      .then((j: { routines: Routine[] }) => {
        const r = j.routines.find((x) => x.id === params.routine);
        if (r) setDraft(r);
      });
  }, [params.org, params.routine]);

  async function save() {
    if (!draft || !draft.name || !draft.cron || busy) return;
    setBusy(true);
    await fetch(`/api/${params.org}/routines/${params.routine}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: draft.name,
        description: draft.description,
        agent: draft.agent,
        cron: draft.cron,
        enabled: draft.enabled,
      }),
    });
    setBusy(false);
    toast(`${draft.name} saved`, "ok");
    router.replace(`/${params.org}/routines/${params.routine}`);
  }

  async function destroy() {
    if (!draft || busy) return;
    setBusy(true);
    await fetch(`/api/${params.org}/routines/${params.routine}`, { method: "DELETE" });
    setBusy(false);
    toast(`${draft.name} deleted`, "warn");
    router.replace(`/${params.org}/routines`);
  }

  if (!draft) {
    return (
      <div className="absolute inset-0 grid place-items-center text-sm text-ink-muted">
        Loading…
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-5">
        <Link
          href={`/${params.org}/routines/${params.routine}`}
          className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-3" /> Back to routine
        </Link>

        <header>
          <Eyebrow>Routine</Eyebrow>
          <PageTitle>Edit routine</PageTitle>
          <Hint>
            Schedule, description, and which agent runs it. Pause if you
            don&apos;t want it to fire while you change things.
          </Hint>
        </header>

        <Card>
          <CardBody>
            <Field label="Name">
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="w-full h-9 rounded-md border border-line bg-paper px-3 text-sm focus:outline-none focus:border-line-strong"
              />
            </Field>
            <Field label="Run as agent">
              <input
                value={draft.agent}
                onChange={(e) => setDraft({ ...draft, agent: e.target.value })}
                placeholder="e.g. Marketing"
                className="w-full h-9 rounded-md border border-line bg-paper px-3 text-sm focus:outline-none focus:border-line-strong"
              />
            </Field>
            <Field label="Schedule (cron)" hint="UTC. Use crontab.guru if unsure.">
              <input
                value={draft.cron}
                onChange={(e) => setDraft({ ...draft, cron: e.target.value })}
                className="w-full h-9 rounded-md border border-line bg-paper px-3 text-sm font-mono focus:outline-none focus:border-line-strong"
              />
            </Field>
            <Field label="Description">
              <textarea
                value={draft.description ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value || null })
                }
                rows={4}
                className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm focus:outline-none focus:border-line-strong"
              />
            </Field>
            <label className="inline-flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={draft.enabled}
                onChange={(e) =>
                  setDraft({ ...draft, enabled: e.target.checked })
                }
              />
              Enabled
            </label>
          </CardBody>
        </Card>

        <div className="flex justify-between gap-2">
          <ButtonGhost
            onClick={destroy}
            disabled={busy}
            className="inline-flex items-center gap-1 border-brick/40 text-brick-ink hover:border-brick/60"
          >
            <Trash2 className="size-3" /> Delete routine
          </ButtonGhost>
          <div className="flex gap-2">
            <Link
              href={`/${params.org}/routines/${params.routine}`}
              className="text-sm rounded-md border border-line bg-paper px-3 py-1.5 hover:border-line-strong"
            >
              Cancel
            </Link>
            <ButtonPrimary
              onClick={save}
              disabled={!draft.name || !draft.cron || busy}
            >
              {busy ? "Saving…" : "Save changes"}
            </ButtonPrimary>
          </div>
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
      {hint && <Hint>{hint}</Hint>}
    </div>
  );
}
