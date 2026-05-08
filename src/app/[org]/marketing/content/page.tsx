import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/store";
import { PageTitle, Hint, Eyebrow, Pill, StatCard } from "@/components/ui/primitives";
import { ArrowLeft, Plus } from "lucide-react";

type ContentStatus = "draft" | "in_review" | "published" | "queued";
type ContentType = "blog" | "case_study" | "guide" | "social" | "email";

type ContentPiece = {
  title: string;
  type: ContentType;
  status: ContentStatus;
  views: number | null;
  leads: number | null;
  channel: string;
  date: string;
};

const CONTENT: ContentPiece[] = [
  { title: "How we replaced 3 hires with AI agents",        type: "blog",       status: "published", views: 8200, leads: 48, channel: "Organic/SEO", date: "Apr 12" },
  { title: "The 7-day outreach cadence",                    type: "blog",       status: "published", views: 5100, leads: 31, channel: "LinkedIn",    date: "Apr 5"  },
  { title: "Unit economics for early-stage SaaS",           type: "blog",       status: "published", views: 3800, leads: 19, channel: "Organic/SEO", date: "Mar 28" },
  { title: "AI agents for Series A companies — guide",      type: "guide",      status: "in_review", views: null, leads: null, channel: "—",         date: "May 6"  },
  { title: "THEFT AI customer story: Nucleus Labs",         type: "case_study", status: "draft",     views: null, leads: null, channel: "—",         date: "May 8"  },
  { title: "Automate your ops stack in 30 days",            type: "email",      status: "queued",    views: null, leads: null, channel: "Email",      date: "May 12" },
  { title: "Why no-code tools fail at scale",               type: "blog",       status: "draft",     views: null, leads: null, channel: "—",         date: "May 9"  },
  { title: "How to build a sales outreach machine",         type: "guide",      status: "queued",    views: null, leads: null, channel: "Email",      date: "May 15" },
];

const STATUS_TONE: Record<ContentStatus, "sage" | "mustard" | "neutral"> = {
  published: "sage",
  in_review: "mustard",
  queued:    "mustard",
  draft:     "neutral",
};

const STATUS_LABEL: Record<ContentStatus, string> = {
  published: "Published",
  in_review: "In review",
  queued:    "Queued",
  draft:     "Draft",
};

const TYPE_LABEL: Record<ContentType, string> = {
  blog:       "Blog",
  case_study: "Case study",
  guide:      "Guide",
  social:     "Social",
  email:      "Email",
};

export default async function ContentPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) notFound();

  const published    = CONTENT.filter((c) => c.status === "published").length;
  const inReviewOrQ  = CONTENT.filter((c) => c.status === "in_review" || c.status === "queued").length;
  const totalViews   = CONTENT.reduce((s, c) => s + (c.views ?? 0), 0);

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="p-6 space-y-6">
        <header className="flex items-start justify-between">
          <div>
            <Link
              href={`/${org}/marketing`}
              className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink mb-2"
            >
              <ArrowLeft className="size-3" /> Marketing
            </Link>
            <PageTitle>Content</PageTitle>
            <Hint>Blog posts, guides, case studies, and email content. Published and in-progress.</Hint>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm rounded-md bg-ink text-paper px-3 py-1.5 hover:opacity-90"
          >
            <Plus className="size-3.5" />
            New piece
          </button>
        </header>

        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Published"          value={String(published)}                   tone="sage"    />
          <StatCard label="In review / queued" value={String(inReviewOrQ)}                 tone="mustard" />
          <StatCard label="Total views"        value={totalViews.toLocaleString()}          tone="neutral" />
        </div>

        <div className="space-y-2">
          <Eyebrow>All content — {CONTENT.length} pieces</Eyebrow>
          <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line/50 text-2xs uppercase tracking-wider text-ink-soft">
                  <th className="text-left px-4 py-2 font-medium">Title</th>
                  <th className="text-left px-4 py-2 font-medium">Type</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                  <th className="text-right px-4 py-2 font-medium">Views</th>
                  <th className="text-right px-4 py-2 font-medium">Leads</th>
                  <th className="text-left px-4 py-2 font-medium">Channel</th>
                  <th className="text-left px-4 py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {CONTENT.map((piece) => (
                  <tr key={piece.title} className="hover:bg-canvas/50 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-medium text-ink max-w-xs">
                      {piece.title}
                    </td>
                    <td className="px-4 py-2.5">
                      <Pill tone="neutral">{TYPE_LABEL[piece.type]}</Pill>
                    </td>
                    <td className="px-4 py-2.5">
                      <Pill tone={STATUS_TONE[piece.status]}>{STATUS_LABEL[piece.status]}</Pill>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-ink-muted text-right">
                      {piece.views !== null ? piece.views.toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-ink-muted text-right">
                      {piece.leads !== null ? String(piece.leads) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-ink-muted">{piece.channel}</td>
                    <td className="px-4 py-2.5 text-xs text-ink-soft">{piece.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
