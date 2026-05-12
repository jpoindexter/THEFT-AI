"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, Briefcase, Code2, FileText, LifeBuoy, Maximize2, Megaphone, Palette, Plus, Scale, Sparkles, Wallet, ClipboardList } from "lucide-react";
import Sunflower from "@/components/sunflower";
import BrandKitFlow, { type BrandKitPhase } from "@/components/brand-kit-flow";
import { buildPlan, type Phase, type Question } from "@/components/org-onboarding-flow";

type Org = { id: string; slug: string; name: string };
type Plan = ReturnType<typeof buildPlan>;

const DEPT_COLOR: Record<string, string> = {
  engineering: "bg-[#c8a87a] text-white", design:    "bg-[#7ab4c8] text-white",
  marketing:   "bg-[#e0907a] text-white", sales:     "bg-[#7ac87a] text-white",
  operations:  "bg-[#7ac8b4] text-white", finance:   "bg-[#9a7ac8] text-white",
  legal:       "bg-[#4a5a6a] text-white", support:   "bg-[#e0a050] text-white",
};
const DEPT_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  engineering: Code2, design: Palette, marketing: Megaphone, sales: Briefcase,
  operations: ClipboardList, finance: Wallet, legal: Scale, support: LifeBuoy,
};
const DEPTS = [
  { slug: "marketing",  name: "Marketing"   },
  { slug: "finance",    name: "Finance"     },
  { slug: "operations", name: "Operations"  },
  { slug: "sales",      name: "Sales"       },
  { slug: "engineering",name: "Engineering" },
  { slug: "legal",      name: "Legal"       },
  { slug: "design",     name: "Design"      },
  { slug: "support",    name: "Support"     },
];
const COMPANY_VALUES = [
  "Clarity over decoration — good design solves problems, not aesthetics",
  "Async by default — respect time; deliver without meetings",
  "Depth over breadth — vertical expertise over generalist coverage",
  "Predictability — flat pricing, no surprises, no scope creep",
];

type Props = {
  side: "canvas" | "panel";
  phase: Phase;
  orgSlug: string;
  organization?: Org;
  description?: string;
  answers?: (string | null)[];
  questions?: Question[];
  onPhaseChange?: (p: Phase) => void;
  onSkip: () => void;
};

export function OrgOnboardingPlanPhases({ side, phase, orgSlug, organization, description, answers, questions, onPhaseChange, onSkip }: Props) {
  if (side === "canvas") {
    if (phase === "activated") return <ActivatedCanvas orgSlug={orgSlug} />;
    if (phase === "brand-design") return <BrandDesignCanvas orgSlug={orgSlug} onSkip={onSkip} />;
    return null;
  }
  const plan = description && answers && questions ? buildPlan(description, answers, questions) : null;
  return (
    <PlanPanel phase={phase} plan={plan} orgName={organization?.name ?? ""} orgSlug={orgSlug} onPhaseChange={onPhaseChange} />
  );
}

function PlanPanel({ phase, plan, orgName, orgSlug, onPhaseChange }: {
  phase: Phase; plan: Plan | null; orgName: string; orgSlug: string; onPhaseChange?: (p: Phase) => void;
}) {
  const [feedback, setFeedback] = useState("");
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (phase !== "activated") return;
    const id = setTimeout(() => onPhaseChange?.("brand-design"), 2200);
    return () => clearTimeout(id);
  }, [phase, onPhaseChange]);

  async function acceptPlan() {
    if (!plan || accepting) return;
    setAccepting(true);
    try {
      await fetch(`/api/${orgSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_plan: plan }),
      });
      onPhaseChange?.("activated");
    } finally {
      setAccepting(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-line/70 flex items-center gap-3 shrink-0">
        <div className="size-9 rounded-md bg-canvas border border-line/70 flex items-center justify-center shrink-0">
          <FileText className="size-4 text-ink-muted" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-ink">Onboarding</div>
          <div className="text-xs text-ink-muted truncate">{orgName} · jpoindexter</div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {plan && <PlanCard plan={plan} />}

        {phase === "plan" && (
          <button type="button" onClick={() => void acceptPlan()} disabled={accepting}
            className="w-full py-2 text-sm font-medium bg-ink text-paper rounded-md hover:opacity-90 transition-opacity disabled:opacity-50">
            {accepting ? "Saving plan…" : "Accept & activate departments"}
          </button>
        )}
        {phase === "activated" && (
          <>
            <button type="button" disabled
              className="w-full py-2 text-sm text-ink-muted border border-line/50 rounded-md opacity-50 cursor-not-allowed">
              Activating departments…
            </button>
            <div className="rounded-lg border border-line/70 bg-canvas p-3 flex items-start gap-2.5">
              <div className="w-5 h-5 shrink-0 mt-0.5"><Sunflower size={20} /></div>
              <div>
                <div className="text-2xs font-medium text-ink uppercase tracking-wide">
                  Next: Brand Design <span className="text-ink-soft font-normal normal-case">· business content saved</span>
                </div>
                <p className="text-xs text-ink-muted mt-0.5 leading-snug">We&apos;ll use your answers for the look and feel.</p>
              </div>
            </div>
          </>
        )}
        {phase === "brand-design" && (
          <>
            <button type="button" disabled
              className="w-full py-2 text-sm text-ink-muted bg-ink/10 rounded-md opacity-50 cursor-not-allowed">
              Accept &amp; activate departments
            </button>
            <div className="rounded-lg border border-line/70 bg-canvas p-3 flex items-start gap-2.5">
              <div className="w-5 h-5 shrink-0 mt-0.5"><Sunflower size={20} /></div>
              <div>
                <div className="text-2xs font-medium text-ink uppercase tracking-wide">
                  Brand Design is Ready <span className="text-ink-soft font-normal normal-case">· business context saved</span>
                </div>
                <p className="text-xs text-ink-muted mt-0.5 leading-snug">Start shaping the look and feel.</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Persistent bottom input */}
      <div className="border-t border-line/70 px-3 py-3 shrink-0">
        <div className="relative rounded-lg border border-line/70 focus-within:border-line-strong bg-paper">
          <input type="text" value={feedback} onChange={(e) => setFeedback(e.target.value)}
            placeholder="Ask for follow up changes..."
            className="w-full bg-transparent px-3 py-2.5 pr-16 text-sm focus:outline-none placeholder:text-ink-soft" />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button type="button" className="size-6 flex items-center justify-center text-ink-muted hover:text-ink">
              <Plus className="size-3.5" />
            </button>
            <button type="button" disabled={!feedback.trim()}
              className="size-7 rounded-full bg-ink text-paper flex items-center justify-center disabled:opacity-30 hover:opacity-90">
              <ArrowUp className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const mission = String(plan.mission ?? "");
  const briefEntries = Object.entries(plan).filter(([k]) => k !== "mission");
  return (
    <div className="rounded-lg border border-line/70 bg-paper overflow-hidden">
      <div className="px-3 py-2.5 border-b border-line/70 flex items-center gap-2">
        <div className="size-7 rounded bg-canvas border border-line/70 flex items-center justify-center shrink-0">
          <FileText className="size-3.5 text-ink-muted" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-ink leading-tight">Business Plan</div>
          <div className="text-2xs text-ink-muted leading-tight">jpoindexter</div>
        </div>
        <button type="button" className="text-2xs text-ink border border-line/70 rounded px-1.5 py-0.5 hover:border-line-strong shrink-0">Edit</button>
        <button type="button" className="text-ink-muted hover:text-ink shrink-0"><Maximize2 className="size-3" /></button>
      </div>
      <div className="px-3 py-3 space-y-3">
        <div>
          <SChip label="Mission" />
          <p className="text-xs text-ink leading-snug mt-1.5">{mission}</p>
        </div>
        {briefEntries.length > 0 && (
          <div>
            <SChip label="Brief" />
            <ul className="mt-1.5 space-y-0.5">
              {briefEntries.map(([k, v]) => (
                <BItem key={k} text={`${humanize(k)}: ${String(v)}`} />
              ))}
            </ul>
          </div>
        )}
        <div>
          <SChip label="Company Values" />
          <ul className="mt-1.5 space-y-0.5">
            {COMPANY_VALUES.map((v) => <BItem key={v} text={v} />)}
          </ul>
        </div>
      </div>
    </div>
  );
}

function humanize(key: string): string {
  return key.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function SChip({ label }: { label: string }) {
  return <span className="inline-block text-2xs font-medium px-1.5 py-0.5 rounded" style={{ background: "#eaeaf8", color: "#5050b8" }}>{label}</span>;
}

function BItem({ text }: { text: string }) {
  return (
    <li className="text-xs text-ink leading-snug list-none flex items-start gap-1.5">
      <span className="text-ink-muted shrink-0 mt-0.5">•</span>
      <span>{text}</span>
    </li>
  );
}

function ActivatedCanvas({ orgSlug }: { orgSlug: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative" style={{ width: 480, height: 480 }}>
        <svg className="absolute inset-0 size-full pointer-events-none" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" className="text-line-strong" strokeWidth="0.18" strokeDasharray="0.4 1.2" />
          {DEPTS.map((d, i) => {
            const angle = (i / DEPTS.length) * 2 * Math.PI - Math.PI / 2;
            const lx = 50 + Math.cos(angle) * 30;
            const ly = 50 + Math.sin(angle) * 30;
            return (
              <g key={d.slug}>
                <line x1="50" y1="50" x2={lx} y2={ly} stroke="currentColor" className="text-line" strokeWidth="0.15" strokeDasharray="0.5 1" />
                <circle cx={lx} cy={ly} r="0.6" fill="currentColor" className="text-line-strong" />
              </g>
            );
          })}
        </svg>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="rounded-full bg-paper border border-line/70 px-3 py-1 inline-flex items-center gap-1.5 shadow-sm">
            <div className="w-4 h-4 shrink-0"><Sunflower size={16} /></div>
            <span className="text-sm tracking-tight text-ink">Cofounder</span>
          </div>
        </div>
        {DEPTS.map((d, i) => {
          const angle = (i / DEPTS.length) * 2 * Math.PI - Math.PI / 2;
          const lx = 50 + Math.cos(angle) * 30;
          const ly = 50 + Math.sin(angle) * 30;
          const Icon = DEPT_ICON[d.slug] ?? Sparkles;
          const color = DEPT_COLOR[d.slug] ?? "bg-ink text-paper";
          return (
            <div key={d.slug} className="absolute inset-0 pointer-events-none">
              <div className="absolute pointer-events-auto" style={{ left: `${lx}%`, top: `${ly}%`, transform: "translate(-50%,-50%)" }}>
                <a href={`/${orgSlug}/${d.slug}`} className="rounded-full bg-paper border border-line/70 pl-1 pr-2.5 py-0.5 text-xs tracking-tight inline-flex items-center gap-1.5 hover:border-line-strong shadow-sm">
                  <span className={`size-4 rounded-full inline-flex items-center justify-center shrink-0 ${color}`}>
                    <Icon className="size-2.5" />
                  </span>
                  {d.name}
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const KIT_PHASE_STEP: Record<BrandKitPhase, number> = {
  intro: 1, vibes: 2, generating: 4, complete: 5, locked: 5,
};
const TOTAL_STEPS = 5;

function BrandDesignCanvas({ orgSlug, onSkip }: { orgSlug: string; onSkip: () => void }) {
  const router = useRouter();
  const [kitPhase, setKitPhase] = useState<BrandKitPhase>("vibes");
  const step = KIT_PHASE_STEP[kitPhase] ?? 2;

  useEffect(() => {
    if (kitPhase !== "locked") return;
    const id = setTimeout(() => router.replace(`/${orgSlug}`), 1800);
    return () => clearTimeout(id);
  }, [kitPhase, orgSlug, router]);

  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: "radial-gradient(circle, rgba(0,0,0,0.055) 1px, transparent 1px)", backgroundSize: "18px 18px", backgroundColor: "#f3f1ec" }}>
      <div className="absolute inset-x-4 top-4 bottom-12 rounded-2xl overflow-hidden border border-line/60 shadow-sm bg-paper">
        <button type="button" onClick={onSkip}
          className="absolute top-3 right-3 z-10 text-xs text-ink-muted hover:text-ink border border-line/70 rounded-md px-2.5 py-1.5 bg-paper/90">
          Skip onboarding →
        </button>
        <BrandKitFlow orgSlug={orgSlug} vibes={[]} initialPhase="vibes" onPhaseChange={setKitPhase} />
      </div>
      <div className="absolute bottom-0 inset-x-0 h-12 flex items-center justify-center gap-3">
        <span className="text-xs text-ink-muted">{step}/{TOTAL_STEPS}</span>
        <div className="flex gap-1.5">
          {[...Array(TOTAL_STEPS)].map((_, i) => (
            <div key={i} className={`h-0.5 rounded-full transition-all ${i + 1 === step ? "w-6 bg-ink/60" : "w-4 bg-ink/20"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
