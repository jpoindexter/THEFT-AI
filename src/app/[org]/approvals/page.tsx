"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "@/components/toast-host";

type Approval = {
  id: string;
  agent: string;
  title: string;
  body: string;
  impact: "low" | "medium" | "high";
  status: "pending" | "approved" | "declined" | "discussed";
  created_at: string;
};

function waitingLabel(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
}

export default function ApprovalsPage() {
  const params = useParams<{ org: string }>();
  const [items, setItems] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch(`/api/${params.org}/approvals`)
      .then((r) => r.json())
      .then((j: { approvals: Approval[] }) => {
        setItems((j.approvals ?? []).filter((a) => a.status === "pending"));
        setLoading(false);
      });
  }, [params.org]);

  async function decide(id: string, decision: "approve" | "decline" | "discuss") {
    setItems((cur) => cur.filter((a) => a.id !== id));
    await fetch(`/api/${params.org}/approvals/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    toast(
      decision === "approve" ? "Approved" : decision === "decline" ? "Declined" : "Sent for discussion",
      decision === "approve" ? "ok" : "warn",
    );
  }

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <header>
          <h1 className="text-xl tracking-tight">Approvals</h1>
          <p className="text-sm text-ink-muted">
            Decisions agents need from you before continuing.
          </p>
        </header>

        {loading && (
          <p className="text-sm text-ink-muted">Loading…</p>
        )}

        {!loading && items.length === 0 && (
          <div className="rounded-lg border border-line/70 bg-paper p-6 text-center text-sm text-ink-muted">
            No pending approvals. Agents will surface decisions here when they need your input.
          </div>
        )}

        <ul className="space-y-2">
          {items.map((a) => (
            <li
              key={a.id}
              className="rounded-lg border border-line/70 bg-paper p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wider text-ink-soft">
                    {a.agent} · waiting {waitingLabel(a.created_at)}
                  </div>
                  <h2 className="text-md font-medium tracking-tight">
                    <Link
                      href={`/${params.org}/approvals/${a.id}`}
                      className="hover:underline decoration-stone-300 underline-offset-2"
                    >
                      {a.title}
                    </Link>
                  </h2>
                </div>
                <span
                  className={`text-2xs uppercase rounded px-1.5 py-0.5 ${
                    a.impact === "low"
                      ? "bg-sage/30 text-sage-ink"
                      : a.impact === "medium"
                        ? "bg-mustard/30 text-mustard-ink"
                        : "bg-brick/15 text-brick-ink"
                  }`}
                >
                  {a.impact} impact
                </span>
              </div>
              <p className="text-sm text-ink-muted leading-snug">{a.body}</p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => decide(a.id, "discuss")}
                  className="inline-flex items-center gap-1 text-xs rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
                >
                  <AlertCircle className="size-3" /> Discuss
                </button>
                <button
                  onClick={() => decide(a.id, "decline")}
                  className="inline-flex items-center gap-1 text-xs rounded-md border border-brick/40 bg-paper text-brick-ink px-2 py-1 hover:bg-brick/10"
                >
                  <XCircle className="size-3" /> Decline
                </button>
                <button
                  onClick={() => decide(a.id, "approve")}
                  className="inline-flex items-center gap-1 text-xs rounded-md bg-ink text-paper px-2 py-1"
                >
                  <CheckCircle2 className="size-3" /> Approve
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
