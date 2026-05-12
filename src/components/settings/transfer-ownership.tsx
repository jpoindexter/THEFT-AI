"use client";

import { useState } from "react";
import { Crown, AlertTriangle } from "lucide-react";
import { SettingsCard } from "@/components/settings/section";
import { toast } from "@/components/toast-host";

const SEED_MEMBERS = [
  { email: "ana@partner.io", role: "editor" },
  { email: "kim@encompass.com", role: "viewer" },
  { email: "ops@example.io", role: "admin" },
];

export default function TransferOwnership({ orgName }: { orgName: string }) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState(SEED_MEMBERS[0]?.email ?? "");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const matches = confirm.trim() === orgName;

  async function transfer() {
    if (!matches || !target) return;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 600));
    toast(`Ownership of ${orgName} transferred to ${target}`, "ok");
    setOpen(false);
    setConfirm("");
    setBusy(false);
  }

  return (
    <SettingsCard
      title="Transfer ownership"
      description="Hand the founder seat to another member. The current owner becomes an admin and loses billing rights."
    >
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 text-xs rounded-md border border-mustard/40 bg-paper text-mustard-ink px-3 py-1.5 hover:bg-mustard/15"
        >
          <Crown className="size-3" /> Transfer ownership
        </button>
      ) : (
        <div className="rounded-md border border-mustard/40 bg-mustard/15 p-3 space-y-2 text-xs">
          <p className="text-ink inline-flex items-center gap-1">
            <AlertTriangle className="size-3 text-mustard-ink" />
            The new owner controls billing, plan changes, and workspace
            deletion. You will lose all of that.
          </p>

          <label className="block space-y-1">
            <span className="text-ink-muted">New owner</span>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full h-9 rounded-md border border-line bg-paper px-2 text-xs"
            >
              {SEED_MEMBERS.map((m) => (
                <option key={m.email} value={m.email}>
                  {m.email} · {m.role}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-ink-muted">
              Type <code className="font-mono">{orgName}</code> to confirm
            </span>
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={orgName}
              className="w-full h-9 rounded-md border border-mustard/40 bg-paper px-3 text-xs font-mono focus:outline-none focus:border-mustard"
            />
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setConfirm("");
              }}
              className="text-2xs rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!matches || busy}
              onClick={transfer}
              className="text-2xs rounded-md bg-ink text-paper px-3 py-1 hover:opacity-90 disabled:opacity-40"
            >
              {busy ? "Transferring…" : "Transfer ownership"}
            </button>
          </div>
        </div>
      )}
    </SettingsCard>
  );
}
