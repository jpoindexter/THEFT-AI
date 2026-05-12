import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/store";
import { PageTitle, Hint, Eyebrow, StatCard } from "@/components/ui/primitives";
import { FileText, ShieldCheck, AlertTriangle } from "lucide-react";

const DAILY_BRIEF = [
  { priority: 1, action: "MSA with Blueridge Capital expires in 18 days — send renewal 2 weeks before expiry" },
  { priority: 2, action: "SOC 2 Type II audit prep: 3 controls not yet documented (access log review, incident response, vendor review)" },
  { priority: 3, action: "GDPR DPA requested by Nucleus Labs (EU expansion) — draft and send within 5 business days" },
  { priority: 4, action: "Contractor NDA for design agency expires Jun 1 — renew or let lapse" },
  { priority: 5, action: "IP assignment agreement missing for 1 contractor added in March — collect before end of month" },
];

const NAV_SECTIONS = [
  {
    href: "legal/contracts",
    label: "Contracts",
    description: "NDAs, MSAs, contractor agreements, SOWs — active and expiring.",
    icon: FileText,
    stat: "1 expiring",
    tone: "mustard",
  },
  {
    href: "legal/compliance",
    label: "Compliance",
    description: "GDPR, SOC 2, ToS, privacy policy — framework status and action items.",
    icon: ShieldCheck,
    stat: "3 gaps",
    tone: "brick",
  },
];

const RISK_ITEMS = [
  { label: "MSA renewal — Blueridge Capital",     due: "18d",  severity: "medium" },
  { label: "SOC 2 — 3 controls undocumented",     due: "Audit in 6w", severity: "high"   },
  { label: "GDPR DPA — Nucleus Labs request",      due: "5 business days", severity: "high"   },
  { label: "IP assignment — March contractor",     due: "Apr 30", severity: "medium" },
  { label: "Contractor NDA renewal — design agency",due: "Jun 1", severity: "low"    },
];

const SEV_CLS: Record<string, string> = {
  high:   "text-brick-ink bg-brick/5 border-brick/20",
  medium: "text-mustard-ink bg-mustard/5 border-mustard/20",
  low:    "text-ink-muted bg-canvas/60 border-line/40",
};

export default async function LegalPage({
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
          <PageTitle>Legal</PageTitle>
          <Hint>
            Contracts, compliance, and IP tracking. The Legal Agent monitors
            expiry dates, flags gaps, and drafts routine documents.
          </Hint>
        </header>

        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Active contracts" value="11" />
          <StatCard label="Expiring <30d" value="2" tone="mustard" />
          <StatCard label="Compliance gaps" value="3" tone="brick" />
          <StatCard label="Pending reviews" value="2" />
        </div>

        {/* Daily brief */}
        <div className="space-y-2">
          <Eyebrow>Daily brief — Legal Agent</Eyebrow>
          <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
            {DAILY_BRIEF.map((item, i) => (
              <div
                key={item.priority}
                className={`flex items-start gap-3 px-4 py-3 ${i < DAILY_BRIEF.length - 1 ? "border-b border-line/40" : ""}`}
              >
                <span className="size-5 rounded-full bg-canvas border border-line/70 text-2xs text-ink-soft flex items-center justify-center shrink-0 mt-0.5">
                  {item.priority}
                </span>
                <span className="text-xs text-ink leading-snug">{item.action}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Nav sections */}
        <div className="grid grid-cols-2 gap-3">
          {NAV_SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.href}
                href={`/${org}/${s.href}`}
                className="group rounded-xl border border-line/70 bg-paper p-4 hover:border-line-strong transition-colors space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="size-8 rounded-lg bg-canvas border border-line/70 flex items-center justify-center">
                    <Icon className="size-4 text-ink-muted" />
                  </div>
                  <span
                    className={`text-2xs px-2 py-0.5 rounded-full border font-medium ${
                      s.tone === "brick"
                        ? "bg-brick/10 border-brick/30 text-brick-ink"
                        : s.tone === "mustard"
                          ? "bg-mustard/10 border-mustard/30 text-mustard-ink"
                          : "bg-canvas border-line/70 text-ink-muted"
                    }`}
                  >
                    {s.stat}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-medium text-ink">{s.label}</div>
                  <div className="text-xs text-ink-muted mt-0.5 leading-snug">
                    {s.description}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Risk register */}
        <div className="space-y-2">
          <Eyebrow>Legal risk register</Eyebrow>
          <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
            {RISK_ITEMS.map((item, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-2.5 ${i < RISK_ITEMS.length - 1 ? "border-b border-line/40" : ""}`}
              >
                <AlertTriangle
                  className={`size-3.5 shrink-0 ${
                    item.severity === "high"
                      ? "text-brick-ink"
                      : item.severity === "medium"
                        ? "text-mustard-ink"
                        : "text-ink-soft"
                  }`}
                />
                <span className="flex-1 text-xs text-ink">{item.label}</span>
                <span className={`text-2xs px-2 py-0.5 rounded border font-medium ${SEV_CLS[item.severity]}`}>
                  {item.due}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
