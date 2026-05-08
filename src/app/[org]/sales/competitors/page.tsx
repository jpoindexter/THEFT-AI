import { notFound } from "next/navigation";
import { db } from "@/lib/db/store";
import { PageTitle, Hint } from "@/components/ui/primitives";
import { ExternalLink, Plus } from "lucide-react";

const MOCK_COMPETITORS = [
  {
    id: "1",
    name: "Runway AI",
    url: "https://runway.com",
    segment: "SMB founders, solo operators",
    painFocus: "Automate repetitive back-office work",
    pricing: "$49–$199/mo",
    highlights: ["No-code workflows", "Pre-built templates", "Slack integration"],
    weaknesses: "Generic workflows — not department-native. No agent autonomy.",
    opening: "We go deeper per department with purpose-built agents that can actually execute, not just route.",
  },
  {
    id: "2",
    name: "Relevance AI",
    url: "https://relevanceai.com",
    segment: "Technical teams, RevOps",
    painFocus: "Build custom AI agents for sales and support",
    pricing: "$19–$599/mo",
    highlights: ["Agent builder", "Tool chaining", "API integrations"],
    weaknesses: "Requires technical setup. No opinionated structure for running a company. Steep learning curve.",
    opening: "We're opinionated about company structure — you get a working org with agents, not a blank canvas.",
  },
  {
    id: "3",
    name: "Lindy AI",
    url: "https://lindy.ai",
    segment: "SMBs, agencies",
    painFocus: "Personal AI assistant for tasks and emails",
    pricing: "$49–$299/mo",
    highlights: ["Email drafting", "Meeting scheduling", "CRM sync"],
    weaknesses: "Personal assistant model — not company-wide. Doesn't cover build/deploy/sell/scale as a system.",
    opening: "Full company operating system vs. individual productivity tool.",
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

        <div className="space-y-4">
          {MOCK_COMPETITORS.map((c) => (
            <div key={c.id} className="rounded-xl border border-line/70 bg-paper p-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-ink">{c.name}</span>
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink-soft hover:text-ink"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  </div>
                  <div className="text-xs text-ink-muted mt-0.5">{c.segment}</div>
                </div>
                <span className="text-sm font-medium text-ink shrink-0">{c.pricing}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="text-2xs uppercase tracking-wider text-ink-soft font-medium">Pain they lead with</div>
                  <div className="text-xs text-ink">{c.painFocus}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xs uppercase tracking-wider text-ink-soft font-medium">Feature highlights</div>
                  <ul className="text-xs text-ink space-y-0.5">
                    {c.highlights.map((h) => <li key={h}>· {h}</li>)}
                  </ul>
                </div>
              </div>

              <div className="rounded-lg bg-canvas/60 px-3 py-2.5 border border-line/50 space-y-1">
                <div className="text-2xs uppercase tracking-wider text-ink-soft font-medium">What&apos;s missing</div>
                <div className="text-xs text-ink-muted">{c.weaknesses}</div>
              </div>

              <div className="rounded-lg bg-sage/10 border border-sage/30 px-3 py-2.5 space-y-1">
                <div className="text-2xs uppercase tracking-wider text-sage-ink font-medium">Our opening</div>
                <div className="text-xs text-ink">{c.opening}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
