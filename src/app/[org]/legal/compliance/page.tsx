import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/store";
import { PageTitle, Hint, Eyebrow, Pill } from "@/components/ui/primitives";
import { ArrowLeft, CheckCircle2, Circle, AlertTriangle, XCircle } from "lucide-react";

type ItemStatus = "done" | "in-progress" | "not-started" | "blocked";

type ComplianceItem = {
  label: string;
  status: ItemStatus;
  notes: string | null;
};

type Framework = {
  id: string;
  name: string;
  description: string;
  overallStatus: "on-track" | "at-risk" | "not-started";
  targetDate: string;
  items: ComplianceItem[];
};

const FRAMEWORKS: Framework[] = [
  {
    id: "gdpr",
    name: "GDPR",
    description: "EU General Data Protection Regulation — required for any EU customer data.",
    overallStatus: "at-risk",
    targetDate: "Ongoing",
    items: [
      { label: "Privacy policy published",                  status: "done",        notes: null },
      { label: "Cookie consent banner live",                status: "done",        notes: null },
      { label: "Data processing register (ROPA)",           status: "in-progress", notes: "Nucleus Labs EU expansion accelerates this." },
      { label: "Data Processing Agreement (DPA) template",  status: "in-progress", notes: "Draft in legal/contracts." },
      { label: "Right to erasure workflow",                 status: "not-started", notes: "Need API endpoint and support runbook." },
      { label: "Data breach notification procedure",        status: "not-started", notes: "Required — <72h notify to supervisory authority." },
      { label: "Vendor DPA for Stripe, Supabase, Postmark", status: "done",        notes: "All three have signed DPAs on file." },
    ],
  },
  {
    id: "soc2",
    name: "SOC 2 Type II",
    description: "Security, availability, and confidentiality controls audit. Enterprise customers require this.",
    overallStatus: "at-risk",
    targetDate: "Q3 2025",
    items: [
      { label: "Security policy documented",                status: "done",        notes: null },
      { label: "Access control policy + MFA enforced",      status: "done",        notes: "All engineers on YubiKey." },
      { label: "Access log review procedure",               status: "not-started", notes: "Need to document quarterly review cadence." },
      { label: "Incident response runbook",                 status: "not-started", notes: "Draft exists but not approved or tested." },
      { label: "Vendor security review process",            status: "not-started", notes: "Annual review of all third-party services needed." },
      { label: "Change management policy",                  status: "in-progress", notes: "PR review process documented; deploy gates pending." },
      { label: "Encryption at rest + in transit",           status: "done",        notes: "Supabase AES-256 + Vercel TLS." },
      { label: "Audit logging enabled",                     status: "done",        notes: "Supabase audit logs + Vercel function logs retained." },
      { label: "Penetration test completed",                status: "not-started", notes: "Schedule before Q3 audit window." },
    ],
  },
  {
    id: "terms",
    name: "ToS & Legal Docs",
    description: "Customer-facing legal documents — terms of service, privacy policy, acceptable use.",
    overallStatus: "on-track",
    targetDate: "Done",
    items: [
      { label: "Terms of service published",                status: "done",        notes: "Last reviewed Jan 2025." },
      { label: "Privacy policy published",                  status: "done",        notes: "GDPR + CCPA language included." },
      { label: "Acceptable use policy",                     status: "done",        notes: null },
      { label: "DPA template for enterprise customers",     status: "in-progress", notes: "In legal/contracts. Triggered by Nucleus Labs." },
      { label: "IP ownership clauses in contractor NDAs",   status: "blocked",     notes: "March contractor has no signed IP assignment." },
    ],
  },
];

const STATUS_ICON: Record<ItemStatus, React.FC<{ className?: string }>> = {
  "done":        CheckCircle2,
  "in-progress": Circle,
  "not-started": Circle,
  "blocked":     XCircle,
};

const STATUS_CLS: Record<ItemStatus, string> = {
  "done":        "text-sage-ink",
  "in-progress": "text-mustard-ink",
  "not-started": "text-ink-soft",
  "blocked":     "text-brick-ink",
};

const OVERALL_TONE: Record<Framework["overallStatus"], "sage" | "mustard" | "neutral"> = {
  "on-track":   "sage",
  "at-risk":    "mustard",
  "not-started":"neutral",
};

export default async function CompliancePage({
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
        <header>
          <Link
            href={`/${org}/legal`}
            className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink mb-2"
          >
            <ArrowLeft className="size-3" /> Legal
          </Link>
          <PageTitle>Compliance</PageTitle>
          <Hint>
            GDPR, SOC 2, and legal doc status. At-risk = has open gaps that block
            enterprise sales or create regulatory exposure.
          </Hint>
        </header>

        <div className="space-y-5">
          {FRAMEWORKS.map((fw) => {
            const doneCount = fw.items.filter((i) => i.status === "done").length;
            const total = fw.items.length;
            return (
              <div key={fw.id} className="rounded-xl border border-line/70 bg-paper overflow-hidden">
                {/* Framework header */}
                <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-line/40">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink">{fw.name}</span>
                      <Pill tone={OVERALL_TONE[fw.overallStatus]}>{fw.overallStatus}</Pill>
                    </div>
                    <div className="text-xs text-ink-muted mt-0.5 leading-snug">
                      {fw.description}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-medium text-ink">{doneCount}/{total}</div>
                    <div className="text-2xs text-ink-muted">complete</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="px-5 py-2 border-b border-line/40">
                  <div className="h-1 rounded-full bg-canvas overflow-hidden">
                    <div
                      className="h-full rounded-full bg-sage/60"
                      style={{ width: `${(doneCount / total) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Items */}
                <div className="divide-y divide-line/40">
                  {fw.items.map((item, i) => {
                    const Icon = STATUS_ICON[item.status];
                    return (
                      <div key={i} className="px-5 py-2.5 space-y-1">
                        <div className="flex items-start gap-2.5">
                          <Icon className={`size-3.5 mt-0.5 shrink-0 ${STATUS_CLS[item.status]}`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-ink">{item.label}</div>
                            {item.status !== "done" && (
                              <div className="text-2xs text-ink-muted mt-0.5 capitalize">
                                {item.status.replace("-", " ")}
                              </div>
                            )}
                          </div>
                        </div>
                        {item.notes && (
                          <div className="ml-6 text-2xs text-ink-muted bg-canvas/60 rounded px-2 py-1 border border-line/40 leading-snug">
                            {item.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
