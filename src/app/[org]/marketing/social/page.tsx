import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/store";
import { PageTitle, Hint, Eyebrow, Pill, StatCard } from "@/components/ui/primitives";
import { ArrowLeft } from "lucide-react";

type Platform = "linkedin" | "twitter" | "instagram";
type PostStatus = "scheduled" | "published" | "draft" | "failed";

type SocialPost = {
  platform: Platform;
  content: string;
  status: PostStatus;
  scheduled_for: string;
  impressions: number | null;
  engagement: number | null;
};

const POSTS: SocialPost[] = [
  { platform: "linkedin",  content: "We just shipped AI-powered eval suites...",          status: "scheduled", scheduled_for: "May 9 9:00am",   impressions: null, engagement: null },
  { platform: "twitter",   content: "Hot take: most startups don't need...",              status: "published", scheduled_for: "May 7 10:00am",  impressions: 4200, engagement: 312  },
  { platform: "linkedin",  content: "The cofounder we all wish we had...",                status: "published", scheduled_for: "May 5 9:00am",   impressions: 8100, engagement: 890  },
  { platform: "instagram", content: "Behind the build: how we...",                        status: "published", scheduled_for: "May 3 12:00pm",  impressions: 2100, engagement: 441  },
  { platform: "twitter",   content: "3 things your marketing agent should...",            status: "scheduled", scheduled_for: "May 10 2:00pm",  impressions: null, engagement: null },
  { platform: "linkedin",  content: "Unit economics thread: LTV, CAC, and...",            status: "scheduled", scheduled_for: "May 12 9:00am",  impressions: null, engagement: null },
  { platform: "twitter",   content: "We replaced our spreadsheet with...",                status: "draft",     scheduled_for: "—",              impressions: null, engagement: null },
  { platform: "instagram", content: "Product screenshot series — eval suites",            status: "scheduled", scheduled_for: "May 14 12:00pm", impressions: null, engagement: null },
  { platform: "linkedin",  content: "Case study: how Nucleus Labs...",                    status: "draft",     scheduled_for: "—",              impressions: null, engagement: null },
  { platform: "twitter",   content: "Why we build in public...",                          status: "failed",    scheduled_for: "May 1 9:00am",   impressions: 0,    engagement: 0    },
];

const PLATFORM_LABEL: Record<Platform, string> = {
  linkedin:  "LinkedIn",
  twitter:   "Twitter",
  instagram: "Instagram",
};

const STATUS_TONE: Record<PostStatus, "sage" | "mustard" | "neutral" | "brick"> = {
  scheduled: "mustard",
  published: "sage",
  draft:     "neutral",
  failed:    "brick",
};

const STATUS_LABEL: Record<PostStatus, string> = {
  scheduled: "Scheduled",
  published: "Published",
  draft:     "Draft",
  failed:    "Failed",
};

export default async function SocialPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) notFound();

  const scheduledCount   = POSTS.filter((p) => p.status === "scheduled").length;
  const publishedCount   = POSTS.filter((p) => p.status === "published").length;
  const draftCount       = POSTS.filter((p) => p.status === "draft").length;
  const totalImpressions = POSTS.reduce((s, p) => s + (p.impressions ?? 0), 0);

  const upcoming  = POSTS.filter((p) => p.status === "scheduled");
  const published = POSTS.filter((p) => p.status === "published" || p.status === "failed");

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="p-6 space-y-6">
        <header>
          <Link
            href={`/${org}/marketing`}
            className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink mb-2"
          >
            <ArrowLeft className="size-3" /> Marketing
          </Link>
          <PageTitle>Social</PageTitle>
          <Hint>Posts scheduled across LinkedIn, Twitter, and Instagram. Managed by the Marketing Agent.</Hint>
        </header>

        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Scheduled"         value={String(scheduledCount)}             tone="mustard" />
          <StatCard label="Published"         value={String(publishedCount)}             tone="sage"    />
          <StatCard label="Total impressions" value={totalImpressions.toLocaleString()}  tone="neutral" />
          <StatCard label="Draft"             value={String(draftCount)}                 tone="neutral" />
        </div>

        <div className="space-y-2">
          <Eyebrow>Upcoming posts — {upcoming.length} scheduled</Eyebrow>
          <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
            {upcoming.map((post, i) => (
              <div
                key={`${post.platform}-${post.scheduled_for}`}
                className={`flex items-center gap-4 px-4 py-3 ${i < upcoming.length - 1 ? "border-b border-line/40" : ""}`}
              >
                <Pill tone="mustard">{PLATFORM_LABEL[post.platform]}</Pill>
                <span className="flex-1 min-w-0 text-xs text-ink truncate">{post.content}</span>
                <span className="text-xs text-ink-soft shrink-0">{post.scheduled_for}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Eyebrow>Published — {published.length} posts</Eyebrow>
          <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line/50 text-2xs uppercase tracking-wider text-ink-soft">
                  <th className="text-left px-4 py-2 font-medium">Platform</th>
                  <th className="text-left px-4 py-2 font-medium">Content</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                  <th className="text-right px-4 py-2 font-medium">Impressions</th>
                  <th className="text-right px-4 py-2 font-medium">Engagement</th>
                  <th className="text-left px-4 py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {published.map((post) => (
                  <tr key={`${post.platform}-${post.scheduled_for}`} className="hover:bg-canvas/50 transition-colors">
                    <td className="px-4 py-2.5">
                      <Pill tone="neutral">{PLATFORM_LABEL[post.platform]}</Pill>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-ink max-w-xs truncate">
                      {post.content}
                    </td>
                    <td className="px-4 py-2.5">
                      <Pill tone={STATUS_TONE[post.status]}>{STATUS_LABEL[post.status]}</Pill>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-ink-muted text-right">
                      {post.impressions !== null ? post.impressions.toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-ink-muted text-right">
                      {post.engagement !== null ? post.engagement.toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-ink-soft">{post.scheduled_for}</td>
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
