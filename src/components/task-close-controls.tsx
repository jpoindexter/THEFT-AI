"use client";

import { useState } from "react";
import { Pill } from "@/components/ui/primitives";
import { CheckCircle2, X, AlertCircle } from "lucide-react";
import { toast } from "@/components/toast-host";

type Outcome = "shipped" | "rejected" | "duplicate";

const OUTCOMES: { id: Outcome; label: string; tone: "sage" | "brick" | "mustard" }[] = [
  { id: "shipped", label: "Shipped", tone: "sage" },
  { id: "rejected", label: "Rejected", tone: "brick" },
  { id: "duplicate", label: "Duplicate", tone: "mustard" },
];

export default function TaskCloseControls({
  taskId,
  status,
}: {
  taskId: string;
  status: string;
}) {
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>("shipped");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const closed = status === "done" || status === "cancelled";

  async function close() {
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setOpen(false);
      toast(`Task closed as ${outcome}`, "ok");
      void taskId;
    }, 400);
  }

  if (closed) {
    return (
      <div className="rounded-lg border border-line/70 bg-paper p-4 flex items-center justify-between text-sm">
        <span className="inline-flex items-center gap-2">
          <CheckCircle2 className="size-4 text-sage-ink" />
          Task closed
        </span>
        <button className="text-[11px] rounded-md border border-line px-2 py-1 hover:border-line-strong">
          Reopen
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="rounded-lg border border-line/70 bg-paper p-4 flex items-center justify-between">
        <div className="text-xs text-ink-muted inline-flex items-center gap-1.5">
          <AlertCircle className="size-3" />
          Close this task once the work is shipped or rejected.
        </div>
        <div className="flex gap-1">
          <button className="text-[11px] rounded-md border border-line px-2 py-1 hover:border-line-strong">
            Report issue
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-[11px] rounded-md bg-ink text-paper px-3 py-1"
          >
            Close task
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-line/70 bg-paper p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[14px] font-medium tracking-tight">
          Close task
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Cancel close"
          title="Cancel"
          className="size-7 rounded-md inline-flex items-center justify-center text-ink-soft hover:text-ink"
        >
          <X className="size-3" />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {OUTCOMES.map((o) => {
          const on = outcome === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => setOutcome(o.id)}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs ${
                on
                  ? "border-ink bg-cream"
                  : "border-line bg-paper hover:border-line-strong"
              }`}
            >
              <Pill tone={o.tone}>{o.label}</Pill>
            </button>
          );
        })}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        placeholder="Note for the audit log (optional)…"
        className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm focus:outline-none focus:border-line-strong"
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs rounded-md border border-line bg-paper px-3 py-1.5 hover:border-line-strong"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={close}
          disabled={busy}
          className="text-xs rounded-md bg-ink text-paper px-3 py-1.5 disabled:opacity-40"
        >
          {busy ? "Closing…" : "Confirm close"}
        </button>
      </div>
    </div>
  );
}
