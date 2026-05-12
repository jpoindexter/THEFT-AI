import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/store";
import { PageTitle, Hint, Pill } from "@/components/ui/primitives";
import { ArrowLeft, Plus } from "lucide-react";

type ContractStatus = "active" | "expiring" | "expired" | "draft" | "unsigned";
type ContractType   = "MSA" | "NDA" | "SOW" | "Contractor" | "DPA";

type Contract = {
  id: string;
  counterparty: string;
  type: ContractType;
  status: ContractStatus;
  signed: string | null;
  expires: string | null;
  owner: string;
  notes: string | null;
};

const CONTRACTS: Contract[] = [
  { id: "1",  counterparty: "Blueridge Capital",    type: "MSA",        status: "expiring",  signed: "May 1, 2024",  expires: "May 19, 2025", owner: "Jason",  notes: "Annual renewal. Send new version 2 weeks before expiry." },
  { id: "2",  counterparty: "Meridian Health",       type: "MSA",        status: "active",    signed: "Mar 14, 2025", expires: "Mar 14, 2026", owner: "Jason",  notes: null },
  { id: "3",  counterparty: "Forge Logistics",       type: "MSA",        status: "active",    signed: "Feb 3, 2025",  expires: "Feb 3, 2026",  owner: "Jason",  notes: null },
  { id: "4",  counterparty: "Veritas Legal",         type: "MSA",        status: "active",    signed: "Jan 12, 2025", expires: "Jan 12, 2026", owner: "Jason",  notes: null },
  { id: "5",  counterparty: "Design Agency (TBD)",   type: "NDA",        status: "expiring",  signed: "Jun 1, 2024",  expires: "Jun 1, 2025",  owner: "Jason",  notes: "Renew or let lapse depending on engagement status." },
  { id: "6",  counterparty: "CloudHosting Co.",      type: "NDA",        status: "active",    signed: "Nov 20, 2024", expires: "Nov 20, 2025", owner: "Jason",  notes: null },
  { id: "7",  counterparty: "Nucleus Labs",          type: "DPA",        status: "draft",     signed: null,           expires: null,           owner: "Jason",  notes: "EU expansion. GDPR DPA requested. Draft in progress." },
  { id: "8",  counterparty: "Freelancer — Backend",  type: "Contractor", status: "active",    signed: "Jan 5, 2025",  expires: "Dec 31, 2025", owner: "Jason",  notes: "IP assignment clause included." },
  { id: "9",  counterparty: "Freelancer — Design",   type: "Contractor", status: "unsigned",  signed: null,           expires: null,           owner: "Jason",  notes: "Added Mar 2025. IP assignment not yet collected." },
  { id: "10", counterparty: "Apex Solutions",        type: "SOW",        status: "active",    signed: "Apr 1, 2025",  expires: "Jun 30, 2025", owner: "Jason",  notes: "3-month implementation scope." },
  { id: "11", counterparty: "Clearpath Tech",        type: "SOW",        status: "draft",     signed: null,           expires: null,           owner: "Jason",  notes: "Proposal accepted verbally. Awaiting countersign." },
];

const STATUS_TONE: Record<ContractStatus, "sage" | "mustard" | "brick" | "neutral"> = {
  active:   "sage",
  expiring: "mustard",
  expired:  "brick",
  draft:    "neutral",
  unsigned: "mustard",
};

const TYPE_ORDER: ContractType[] = ["MSA", "NDA", "DPA", "SOW", "Contractor"];

export default async function ContractsPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) notFound();

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="p-6 space-y-6">
        <header className="flex items-start justify-between">
          <div>
            <Link
              href={`/${org}/legal`}
              className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink mb-2"
            >
              <ArrowLeft className="size-3" /> Legal
            </Link>
            <PageTitle>Contracts</PageTitle>
            <Hint>
              MSAs, NDAs, DPAs, SOWs, and contractor agreements. Watch for
              expiring and unsigned — those are the risk items.
            </Hint>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm rounded-md bg-ink text-paper px-3 py-1.5 hover:opacity-90"
          >
            <Plus className="size-3.5" /> Add contract
          </button>
        </header>

        {/* Summary counts */}
        <div className="flex flex-wrap gap-2">
          {TYPE_ORDER.map((type) => {
            const count = CONTRACTS.filter((c) => c.type === type).length;
            return (
              <div key={type} className="rounded-lg border border-line/70 bg-paper px-3 py-2 min-w-[80px] text-center">
                <div className="text-lg font-medium text-ink">{count}</div>
                <div className="text-2xs text-ink-muted">{type}</div>
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line/50 text-2xs uppercase tracking-wider text-ink-soft">
                <th className="text-left px-4 py-2 font-medium">Counterparty</th>
                <th className="text-left px-4 py-2 font-medium">Type</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-left px-4 py-2 font-medium">Signed</th>
                <th className="text-left px-4 py-2 font-medium">Expires</th>
                <th className="text-left px-4 py-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {CONTRACTS.map((c) => (
                <tr key={c.id} className="hover:bg-canvas/50">
                  <td className="px-4 py-2.5 text-xs font-medium text-ink">{c.counterparty}</td>
                  <td className="px-4 py-2.5 text-xs text-ink-muted">{c.type}</td>
                  <td className="px-4 py-2.5">
                    <Pill tone={STATUS_TONE[c.status]}>{c.status}</Pill>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-ink-soft">{c.signed ?? "—"}</td>
                  <td className={`px-4 py-2.5 text-xs ${c.status === "expiring" ? "text-mustard-ink font-medium" : "text-ink-soft"}`}>
                    {c.expires ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-ink-soft max-w-xs truncate">
                    {c.notes ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
