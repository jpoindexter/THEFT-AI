"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "@/components/toast-host";

type Decision = "approve" | "decline" | "discuss";

export default function ApprovalActions({
  org,
  id,
}: {
  org: string;
  id: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<Decision | null>(null);

  async function decide(decision: Decision) {
    setBusy(decision);
    try {
      const res = await fetch(`/api/${org}/approvals/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) {
        toast(`Couldn't ${decision} this approval`, "warn");
        return;
      }
      toast(
        decision === "approve"
          ? "Approved — agent resuming"
          : decision === "decline"
            ? "Declined"
            : "Discussion thread opened",
        decision === "decline" ? "warn" : "ok",
      );
      router.replace(`/${org}/approvals`);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex justify-end gap-2 pt-1">
      <button
        type="button"
        onClick={() => decide("discuss")}
        disabled={!!busy}
        className="inline-flex items-center gap-1 text-[12px] rounded-md border border-line bg-paper px-3 py-1.5 hover:border-line-strong disabled:opacity-40"
      >
        <AlertCircle className="size-3" />
        {busy === "discuss" ? "…" : "Discuss"}
      </button>
      <button
        type="button"
        onClick={() => decide("decline")}
        disabled={!!busy}
        className="inline-flex items-center gap-1 text-[12px] rounded-md border border-brick/40 bg-brick/10 text-brick-ink px-3 py-1.5 hover:bg-brick/20 disabled:opacity-40"
      >
        <XCircle className="size-3" />
        {busy === "decline" ? "…" : "Decline"}
      </button>
      <button
        type="button"
        onClick={() => decide("approve")}
        disabled={!!busy}
        className="inline-flex items-center gap-1 text-[12px] rounded-md bg-ink text-paper px-3 py-1.5 hover:opacity-90 disabled:opacity-40"
      >
        <CheckCircle2 className="size-3" />
        {busy === "approve" ? "…" : "Approve"}
      </button>
    </div>
  );
}
