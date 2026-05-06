"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
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

const SEED: Record<
  string,
  {
    name: string;
    agent: string;
    cron: string;
    prompt: string;
    enabled: boolean;
  }
> = {
  weekly_status: {
    name: "Weekly status brief",
    agent: "operations",
    cron: "0 9 * * 1",
    prompt:
      "Write a 5-bullet status brief covering shipped work, in-progress, blockers, decisions needed, and next focus.",
    enabled: true,
  },
  social_pack: {
    name: "Daily social pack",
    agent: "marketing",
    cron: "0 7 * * 1-5",
    prompt:
      "Draft 3 LinkedIn posts and 3 X posts riffing on yesterday's engineering changes and product launches.",
    enabled: false,
  },
  month_close: {
    name: "Month-end finance close",
    agent: "finance",
    cron: "0 17 L * *",
    prompt:
      "Reconcile Stripe payouts, AWS bill, and outstanding invoices. Post a close note to #finance with variance vs forecast.",
    enabled: true,
  },
};

const AGENTS = [
  "operations",
  "engineering",
  "design",
  "marketing",
  "sales",
  "finance",
  "legal",
  "support",
];

export default function EditRoutinePage() {
  const params = useParams<{ org: string; routine: string }>();
  const router = useRouter();
  const seed = SEED[params.routine] ?? {
    name: "",
    agent: "operations",
    cron: "",
    prompt: "",
    enabled: false,
  };
  const [draft, setDraft] = useState(seed);
  const [busy, setBusy] = useState(false);

  function save() {
    if (!draft.name || !draft.cron) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      toast(`${draft.name} saved`, "ok");
      router.replace(`/${params.org}/routines/${params.routine}`);
    }, 400);
  }

  function destroy() {
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      toast(`${draft.name} deleted`, "warn");
      router.replace(`/${params.org}/routines`);
    }, 300);
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
            Schedule, prompt, and which agent runs it. Pause if you don't want
            it to fire while you change things.
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
              <select
                value={draft.agent}
                onChange={(e) => setDraft({ ...draft, agent: e.target.value })}
                className="w-full h-9 rounded-md border border-line bg-paper px-2 text-sm"
              >
                {AGENTS.map((a) => (
                  <option key={a} value={a}>
                    {a[0].toUpperCase() + a.slice(1)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Schedule (cron)" hint="UTC. Use crontab.guru if unsure.">
              <input
                value={draft.cron}
                onChange={(e) => setDraft({ ...draft, cron: e.target.value })}
                className="w-full h-9 rounded-md border border-line bg-paper px-3 text-sm font-mono focus:outline-none focus:border-line-strong"
              />
            </Field>
            <Field label="Prompt">
              <textarea
                value={draft.prompt}
                onChange={(e) => setDraft({ ...draft, prompt: e.target.value })}
                rows={5}
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
