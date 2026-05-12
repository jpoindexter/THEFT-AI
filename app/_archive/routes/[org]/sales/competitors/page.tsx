import { notFound } from "next/navigation";
import { db } from "@/lib/db/store";
import { Hint, PageTitle } from "@/components/ui/primitives";
import { ExternalLink, Plus } from "lucide-react";

const OUR_OPENING =
  "Every competitor is either a point tool (email, tasks, chatbot) or a blank-canvas builder. None give you a functioning company out of the box. That gap — a pre-structured org with autonomous, department-native agents that can build, market, sell, and support — is exactly where THEFT AI sits. The pitch is simple: stop configuring tools, start running a company.";

const MOCK_COMPETITORS = [
  {
    id: "1",
    name: "Runway AI",
    url: "https://runway.com",
    homepageAngle: "Automate repetitive back-office work",
    pricingModel: "Subscription — $49–$199/mo",
    targetSegment: "SMB founders, solo operators",
    keyFeatures: ["No-code workflows", "Pre-built templates", "Slack integration"],
    gap: "Generic workflows — not department-native. No agent autonomy or memory. You build the logic; it just routes.",
  },
  {
    id: "2",
    name: "Relevance AI",
    url: "https://relevanceai.com",
    homepageAngle: "Build custom AI agents for sales and support",
    pricingModel: "Usage + seats — $19–$599/mo",
    targetSegment: "Technical teams, RevOps",
    keyFeatures: ["Agent builder", "Tool chaining", "API integrations"],
    gap: "Requires significant technical setup. No opinionated structure for running a company. Steep learning curve — you need an engineer to get value.",
  },
  {
    id: "3",
    name: "Lindy AI",
    url: "https://lindy.ai",
    homepageAngle: "Personal AI assistant for tasks and emails",
    pricingModel: "Credits — $49–$299/mo",
    targetSegment: "SMBs, agencies",
    keyFeatures: ["Email drafting", "Meeting scheduling", "CRM sync"],
    gap: "Personal assistant model — not company-wide. Covers individual productivity, not build/deploy/sell/scale as a coordinated system.",
  },
];

export default async function CompetitorsPage({
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
            <PageTitle>Competitor Analysis</PageTitle>
            <Hint>What they&apos;re missing is where you position.</Hint>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm rounded-md bg-ink text-paper px-3 py-1.5 hover:opacity-90"
          >
            <Plus className="size-3.5" />
            Add competitor
          </button>
        </header>

        {/* Our Opening — top-level summary */}
        <div className="rounded-xl border border-sage/40 bg-sage/10 px-4 py-4 space-y-1">
          <div className="text-2xs uppercase tracking-[0.14em] text-sage-ink font-medium">
            Our Opening
          </div>
          <p className="text-sm text-ink leading-relaxed">{OUR_OPENING}</p>
        </div>

        {/* 3-column competitor cards */}
        <div className="grid grid-cols-3 gap-4">
          {MOCK_COMPETITORS.map((c) => (
            <div key={c.id} className="rounded-xl border border-line/70 bg-paper p-5 space-y-4 flex flex-col">
              {/* Header */}
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-semibold text-ink">{c.name}</span>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Visit ${c.name}`}
                    className="text-ink-soft hover:text-ink transition-colors"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
                <div className="text-xs text-ink-muted">{c.targetSegment}</div>
              </div>

              {/* Pain angle */}
              <div className="space-y-0.5">
                <div className="text-2xs uppercase tracking-wider text-ink-soft font-medium">
                  Homepage angle
                </div>
                <div className="text-xs text-ink">{c.homepageAngle}</div>
              </div>

              {/* Pricing */}
              <div className="space-y-0.5">
                <div className="text-2xs uppercase tracking-wider text-ink-soft font-medium">
                  Pricing model
                </div>
                <div className="text-xs text-ink">{c.pricingModel}</div>
              </div>

              {/* Key features */}
              <div className="space-y-0.5">
                <div className="text-2xs uppercase tracking-wider text-ink-soft font-medium">
                  Key features
                </div>
                <ul className="text-xs text-ink space-y-0.5">
                  {c.keyFeatures.map((f) => (
                    <li key={f}>· {f}</li>
                  ))}
                </ul>
              </div>

              {/* Gap */}
              <div className="rounded-lg bg-canvas/60 border border-line/50 px-3 py-2.5 space-y-0.5 mt-auto">
                <div className="text-2xs uppercase tracking-wider text-ink-soft font-medium">
                  What&apos;s missing
                </div>
                <div className="text-xs text-ink-muted">{c.gap}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
