import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/store";
import { Eyebrow, PageTitle, Hint } from "@/components/ui/primitives";
import { TrendingUp, ChevronRight } from "lucide-react";

const STAGES = [
  { key: "open",              label: "Open" },
  { key: "trying_contact",    label: "Trying to Contact" },
  { key: "contacted",         label: "Contacted" },
  { key: "consult",           label: "Consult" },
  { key: "pitch",             label: "Pitch" },
  { key: "verbal_commit",     label: "Verbal Commit" },
  { key: "won",               label: "Closed Won" },
  { key: "lost",              label: "Closed Lost" },
] as const;

type StageKey = (typeof STAGES)[number]["key"];

const MOCK_DEALS: {
  id: string; company: string; contact: string; role: string;
  value: number; stage: StageKey; lastTouch: string;
}[] = [
  { id: "1", company: "Meridian Health",  contact: "Sarah Chen",    role: "VP Operations",  value: 12000, stage: "consult",        lastTouch: "2d ago" },
  { id: "2", company: "Forge Logistics",  contact: "James Okafor",  role: "CEO",            value: 8500,  stage: "pitch",          lastTouch: "1d ago" },
  { id: "3", company: "Blueridge Capital",contact: "Priya Nair",    role: "CFO",            value: 24000, stage: "verbal_commit",  lastTouch: "4h ago" },
  { id: "4", company: "Draftline Media",  contact: "Tom Walsh",     role: "Head of Growth", value: 4200,  stage: "contacted",      lastTouch: "3d ago" },
  { id: "5", company: "Nucleus Labs",     contact: "Emma Sato",     role: "COO",            value: 6800,  stage: "trying_contact", lastTouch: "5d ago" },
  { id: "6", company: "Clearpath Tech",   contact: "Marcus Hill",   role: "CTO",            value: 9100,  stage: "open",           lastTouch: "1w ago" },
  { id: "7", company: "Veritas Legal",    contact: "Dana Osei",     role: "Managing Partner",value: 18000,stage: "won",            lastTouch: "2d ago" },
  { id: "8", company: "Lumina Studio",    contact: "Chris Park",    role: "Founder",        value: 3600,  stage: "lost",           lastTouch: "1w ago" },
  { id: "9", company: "Apex Solutions",   contact: "Lia Ferreira",  role: "Dir. Ops",       value: 7400,  stage: "consult",        lastTouch: "Today" },
  { id: "10",company: "Ironside Data",    contact: "Nick Russo",    role: "VP Sales",       value: 11200, stage: "pitch",          lastTouch: "3h ago" },
];

const FUNNEL: { from: string; to: string; rate: number }[] = [
  { from: "Open",      to: "Contacted",     rate: 68 },
  { from: "Contacted", to: "Consult",       rate: 54 },
  { from: "Consult",   to: "Pitch",         rate: 71 },
  { from: "Pitch",     to: "Verbal Commit", rate: 44 },
  { from: "Verbal",    to: "Won",           rate: 82 },
];

function fmtUsd(n: number) {
  return `$${n.toLocaleString()}`;
}

export default async function SalesPipelinePage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) notFound();

  const dealsByStage = new Map<StageKey, typeof MOCK_DEALS>(
    STAGES.map((s) => [s.key, MOCK_DEALS.filter((d) => d.stage === s.key)])
  );

  const activeDeals = MOCK_DEALS.filter((d) => d.stage !== "won" && d.stage !== "lost");
  const pipeline = activeDeals.reduce((s, d) => s + d.value, 0);
  const wonDeals = MOCK_DEALS.filter((d) => d.stage === "won");
  const wonValue = wonDeals.reduce((s, d) => s + d.value, 0);

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="p-6 space-y-6 min-h-full">
        <header className="flex items-start justify-between">
          <div>
            <PageTitle>Sales Pipeline</PageTitle>
            <Hint>Track deals from first contact to close.</Hint>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-right">
              <div className="text-xs text-ink-muted">Pipeline value</div>
              <div className="font-semibold text-ink">{fmtUsd(pipeline)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-ink-muted">Won this month</div>
              <div className="font-semibold text-sage-ink">{fmtUsd(wonValue)}</div>
            </div>
          </div>
        </header>

        {/* Conversion funnel */}
        <div className="rounded-xl border border-line/70 bg-paper p-4 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-3.5 text-ink-muted" />
            <Eyebrow>Conversion funnel</Eyebrow>
          </div>
          <div className="flex items-center gap-0">
            {FUNNEL.map((step, i) => (
              <div key={i} className="flex items-center gap-0 flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                  <div className="text-2xs text-ink-muted truncate">{step.from}</div>
                  <div
                    className="mt-1 rounded h-1.5 bg-sage/40"
                    style={{ width: `${step.rate}%` }}
                  />
                  <div className="text-2xs font-medium text-ink mt-0.5">{step.rate}%</div>
                </div>
                {i < FUNNEL.length - 1 && (
                  <ChevronRight className="size-3 text-line-strong shrink-0 mx-1" />
                )}
              </div>
            ))}
            <div className="flex-1 min-w-0 ml-2">
              <div className="text-2xs text-ink-muted">Won</div>
              <div className="mt-1 rounded h-1.5 bg-sage/70" style={{ width: "82%" }} />
              <div className="text-2xs font-medium text-sage-ink mt-0.5">82%</div>
            </div>
          </div>
        </div>

        {/* Stage columns */}
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const deals = dealsByStage.get(stage.key) ?? [];
            const stageValue = deals.reduce((s, d) => s + d.value, 0);
            const isTerminal = stage.key === "won" || stage.key === "lost";
            return (
              <div key={stage.key} className="w-52 shrink-0 space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-2xs uppercase tracking-wider text-ink-soft font-medium">
                    {stage.label}
                  </span>
                  <span className="text-2xs text-ink-muted">
                    {deals.length > 0 ? fmtUsd(stageValue) : "—"}
                  </span>
                </div>
                {deals.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-line/50 h-16 flex items-center justify-center">
                    <span className="text-2xs text-ink-soft">Empty</span>
                  </div>
                ) : (
                  deals.map((deal) => (
                    <div
                      key={deal.id}
                      className={`rounded-lg border bg-paper p-3 space-y-1.5 ${
                        isTerminal ? "border-line/40 opacity-70" : "border-line/70 hover:border-line-strong cursor-pointer"
                      }`}
                    >
                      <div className="text-xs font-medium text-ink leading-snug">{deal.company}</div>
                      <div className="text-2xs text-ink-muted">{deal.contact} · {deal.role}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xs font-medium text-ink">{fmtUsd(deal.value)}</span>
                        <span className="text-2xs text-ink-soft">{deal.lastTouch}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>

        <p className="text-xs text-ink-soft text-center pb-2">
          Review pipeline weekly — move deals only when something objective has happened.
        </p>
      </div>
    </div>
  );
}
