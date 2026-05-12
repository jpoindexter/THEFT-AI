"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightLeft } from "lucide-react";
import { toast } from "@/components/toast-host";

type Agent = { id: string; name: string };

export default function TaskHandoff({
  org,
  taskId,
  currentAgentId,
  agents,
}: {
  org: string;
  taskId: string;
  currentAgentId: string | null;
  agents: Agent[];
}) {
  const router = useRouter();
  const others = agents.filter((a) => a.id !== currentAgentId);
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState(others[0]?.id ?? "");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!target || reason.trim().length < 4) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/${org}/tasks/${taskId}/handoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toAgentId: target, reason }),
      });
      if (!res.ok) {
        toast("Handoff failed", "warn");
        return;
      }
      const name = agents.find((a) => a.id === target)?.name ?? "agent";
      toast(`Handed off to ${name}`, "ok");
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={others.length === 0}
        className="inline-flex items-center gap-1 text-xs rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong disabled:opacity-40"
      >
        <ArrowRightLeft className="size-3" /> Hand off
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-line/70 bg-paper p-3 space-y-2">
      <div className="text-2xs uppercase tracking-wider text-ink-soft">
        Hand off task
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="text-2xs text-ink-muted">To agent</span>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-full h-8 rounded-md border border-line bg-paper px-2 text-xs"
          >
            {others.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-2xs text-ink-muted">Reason</span>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="needs SQL specialist"
            className="w-full h-8 rounded-md border border-line bg-paper px-2 text-xs focus:outline-none focus:border-line-strong"
          />
        </label>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={busy}
          className="text-xs rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={busy || !target || reason.trim().length < 4}
          className="inline-flex items-center gap-1 text-xs rounded-md bg-ink text-paper px-2 py-1 hover:opacity-90 disabled:opacity-40"
        >
          <ArrowRightLeft className="size-3" />
          {busy ? "…" : "Hand off"}
        </button>
      </div>
    </div>
  );
}
