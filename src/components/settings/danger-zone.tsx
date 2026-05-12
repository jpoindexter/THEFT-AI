"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { SettingsCard } from "@/components/settings/section";
import { toast } from "@/components/toast-host";

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
      toast("Workspace delete failed", "warn");
      setBusy(false);
      return;
    }
    toast(`${orgName} deleted`, "ok");
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
          className="inline-flex items-center gap-1 text-xs rounded-md border border-brick/40 bg-paper text-brick-ink px-3 py-1.5 hover:bg-brick/10"
        >
          <AlertTriangle className="size-3" /> Delete workspace
        </button>
      ) : (
        <div className="rounded-md border border-brick/40 bg-brick/10 p-3 space-y-2 text-xs">
          <p className="text-ink">
            This will permanently delete <strong>{orgName}</strong> and every
            artifact, task, and agent inside it. This cannot be undone.
          </p>
          <p className="text-ink">
            Type <code className="font-mono">{orgName}</code> to confirm.
          </p>
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={orgName}
            className="w-full h-9 rounded-md border border-brick/40 bg-paper px-3 text-xs font-mono focus:outline-none focus:border-brick"
          />
          {error && (
            <p className="text-2xs text-brick-ink font-mono">{error}</p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setConfirm("");
                setError(null);
              }}
              className="text-2xs rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!matches || busy}
              onClick={destroy}
              className="text-2xs rounded-md bg-brick text-paper px-3 py-1 hover:opacity-90 disabled:opacity-40"
            >
              {busy ? "Deleting…" : "Delete forever"}
            </button>
          </div>
        </div>
      )}
    </SettingsCard>
  );
}
