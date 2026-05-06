"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { SettingsCard } from "@/components/settings/section";

export default function DangerZone({
  orgSlug,
  orgName,
}: {
  orgSlug: string;
  orgName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matches = confirm.trim() === orgName;

  async function destroy() {
    if (!matches) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/${orgSlug}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Could not delete workspace.");
      setBusy(false);
      return;
    }
    router.replace("/onboarding");
  }

  return (
    <SettingsCard
      title="Danger zone"
      description="Permanent actions. Deleting a workspace removes its agents, tasks, artifacts, and memory."
    >
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 text-[12px] rounded-md border border-red-300 bg-white text-red-700 px-3 py-1.5 hover:bg-red-50"
        >
          <AlertTriangle className="size-3" /> Delete workspace
        </button>
      ) : (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 space-y-2 text-[12px]">
          <p className="text-stone-800">
            This will permanently delete <strong>{orgName}</strong> and every
            artifact, task, and agent inside it. This cannot be undone.
          </p>
          <p className="text-stone-700">
            Type <code className="font-mono">{orgName}</code> to confirm.
          </p>
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={orgName}
            className="w-full h-9 rounded-md border border-red-200 bg-white px-3 text-[12px] font-mono focus:outline-none focus:border-red-400"
          />
          {error && (
            <p className="text-[11px] text-red-700 font-mono">{error}</p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setConfirm("");
                setError(null);
              }}
              className="text-[11px] rounded-md border border-stone-200 bg-white px-2 py-1 hover:border-stone-400"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!matches || busy}
              onClick={destroy}
              className="text-[11px] rounded-md bg-red-600 text-white px-3 py-1 hover:bg-red-700 disabled:opacity-40"
            >
              {busy ? "Deleting…" : "Delete forever"}
            </button>
          </div>
        </div>
      )}
    </SettingsCard>
  );
}
