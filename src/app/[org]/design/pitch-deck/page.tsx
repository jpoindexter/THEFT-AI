import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/store";
import { PageTitle, Hint, Eyebrow, Pill } from "@/components/ui/primitives";
import { ArrowLeft, ChevronRight, Presentation, Download, Eye } from "lucide-react";

type SlideStatus = "done" | "draft" | "todo";

type Slide = {
  number: number;
  title: string;
  purpose: string;
  status: SlideStatus;
  notes: string | null;
};

const SLIDES: Slide[] = [
  { number: 1,  title: "Cover",             purpose: "Company name, tagline, date",                                        status: "done",  notes: null },
  { number: 2,  title: "Problem",           purpose: "Who has the pain? How bad? What's the cost of doing nothing?",       status: "done",  notes: "Use the 3-ops-hire trigger story." },
  { number: 3,  title: "Solution",          purpose: "What changes with your product. Outcome-first, not feature-first.",  status: "done",  notes: null },
  { number: 4,  title: "Product demo",      purpose: "One 90-second flow. Show the thing, don't describe it.",             status: "draft", notes: "Record screen demo — focus on task → done flow." },
  { number: 5,  title: "Market size",       purpose: "TAM / SAM / SOM. Primary source or audited secondary only.",         status: "draft", notes: "B2B SaaS ops automation — cite source." },
  { number: 6,  title: "Business model",    purpose: "How you make money. Price points. ACV range.",                       status: "done",  notes: "$248 ARPU, $500–$3k/mo range." },
  { number: 7,  title: "Traction",          purpose: "MRR, customers, growth rate, retention — with a chart.",             status: "draft", notes: "$12.4k MRR · 50 customers · 3.2% churn." },
  { number: 8,  title: "Go-to-market",      purpose: "How you get customers. Motion + channels + cost.",                   status: "todo",  notes: null },
  { number: 9,  title: "Competition",       purpose: "Positioning matrix. Why we win. What they're missing.",              status: "draft", notes: "Use competitor analysis data from Sales." },
  { number: 10, title: "Team",              purpose: "Founder backgrounds, relevant experience, why you.",                 status: "todo",  notes: null },
  { number: 11, title: "Financials",        purpose: "12-month forecast, burn rate, runway, ask.",                         status: "todo",  notes: null },
  { number: 12, title: "The ask",           purpose: "Raise amount, use of funds, timeline.",                              status: "todo",  notes: null },
];

const DECK_VERSIONS = [
  { id: "1", name: "Seed deck v3",         created: "Apr 28, 2025", slides: 12, status: "current" },
  { id: "2", name: "Seed deck v2",         created: "Mar 14, 2025", slides: 10, status: "archived" },
  { id: "3", name: "Customer pitch short", created: "Feb 5, 2025",  slides: 6,  status: "archived" },
];

const STATUS_TONE: Record<SlideStatus, "sage" | "mustard" | "neutral"> = {
  done:  "sage",
  draft: "mustard",
  todo:  "neutral",
};

const STATUS_BG: Record<SlideStatus, string> = {
  done:  "bg-sage/15 border-sage/30",
  draft: "bg-mustard/10 border-mustard/20",
  todo:  "bg-canvas/60 border-line/40",
};

export default async function PitchDeckPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) notFound();

  const done  = SLIDES.filter((s) => s.status === "done").length;
  const draft = SLIDES.filter((s) => s.status === "draft").length;
  const todo  = SLIDES.filter((s) => s.status === "todo").length;

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="p-6 space-y-6">
        <header className="flex items-start justify-between">
          <div>
            <Link
              href={`/${org}/design`}
              className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink mb-2"
            >
              <ArrowLeft className="size-3" /> Design
            </Link>
            <PageTitle>Pitch Deck</PageTitle>
            <Hint>
              Seed deck structure. Each slide has a purpose — lock the narrative
              before polishing the visuals.
            </Hint>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
            >
              <Eye className="size-3" /> Preview
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-sm rounded-md bg-ink text-paper px-3 py-1.5 hover:opacity-90"
            >
              <Download className="size-3.5" /> Export PDF
            </button>
          </div>
        </header>

        {/* Progress */}
        <div className="rounded-xl border border-line/70 bg-paper p-4 space-y-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-sage-ink" />
              <span className="text-xs text-ink-muted">{done} done</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-mustard-ink" />
              <span className="text-xs text-ink-muted">{draft} draft</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-line-strong" />
              <span className="text-xs text-ink-muted">{todo} todo</span>
            </div>
          </div>
          <div className="flex gap-0.5 h-2 rounded-full overflow-hidden bg-canvas">
            <div className="bg-sage/60 rounded-l-full" style={{ width: `${(done / SLIDES.length) * 100}%` }} />
            <div className="bg-mustard/50" style={{ width: `${(draft / SLIDES.length) * 100}%` }} />
            <div className="bg-line flex-1 rounded-r-full" />
          </div>
        </div>

        {/* Slide list */}
        <div className="space-y-2">
          <Eyebrow>Slides — seed deck v3</Eyebrow>
          <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
            {SLIDES.map((slide, i) => (
              <div
                key={slide.number}
                className={`flex items-start gap-3 px-4 py-3 ${i < SLIDES.length - 1 ? "border-b border-line/40" : ""} hover:bg-canvas/50 cursor-pointer`}
              >
                <span className="text-2xs text-ink-soft w-5 shrink-0 mt-0.5">
                  {slide.number}
                </span>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-ink">{slide.title}</span>
                    <Pill tone={STATUS_TONE[slide.status]}>{slide.status}</Pill>
                  </div>
                  <div className="text-2xs text-ink-muted leading-snug">{slide.purpose}</div>
                  {slide.notes && (
                    <div className={`text-2xs rounded px-2 py-1 border mt-1 ${STATUS_BG[slide.status]}`}>
                      {slide.notes}
                    </div>
                  )}
                </div>
                <ChevronRight className="size-3.5 text-ink-soft shrink-0 mt-0.5 opacity-0 group-hover:opacity-100" />
              </div>
            ))}
          </div>
        </div>

        {/* Version history */}
        <div className="space-y-2">
          <Eyebrow>Version history</Eyebrow>
          <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
            {DECK_VERSIONS.map((v, i) => (
              <div
                key={v.id}
                className={`flex items-center gap-3 px-4 py-2.5 ${i < DECK_VERSIONS.length - 1 ? "border-b border-line/40" : ""}`}
              >
                <Presentation className="size-3.5 text-ink-muted shrink-0" />
                <span className="flex-1 text-xs font-medium text-ink">{v.name}</span>
                <span className="text-2xs text-ink-soft">{v.slides} slides</span>
                <span className="text-2xs text-ink-soft">{v.created}</span>
                <Pill tone={v.status === "current" ? "sage" : "neutral"}>{v.status}</Pill>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
