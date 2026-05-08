import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/store";
import { PageTitle, Hint, Eyebrow, StatCard } from "@/components/ui/primitives";
import { Megaphone, FileText, Share2 } from "lucide-react";

const DAILY_BRIEF = [
  { priority: 1, action: "Content queue has 3 drafts pending review — unblocks scheduled publish for this week" },
  { priority: 2, action: "LinkedIn engagement down 12% this week — agent flagged 3 underperforming posts" },
  { priority: 3, action: "Blog post on AI agents due Friday — draft is 60% complete, needs final section" },
  { priority: 4, action: "2 campaign emails created but not scheduled — confirm send time or reassign" },
  { priority: 5, action: "Product Hunt launch needs prep post — draft and schedule at least 5d before launch" },
];

const NAV_SECTIONS = [
  {
    href: "marketing/campaigns",
    label: "Campaigns",
    description: "Active and scheduled marketing campaigns with lead and conversion tracking.",
    icon: Megaphone,
    stat: "3 active",
    tone: "neutral",
  },
  {
    href: "marketing/content",
    label: "Content",
    description: "Blog posts, case studies, and long-form content. Drafts, published, and queued.",
    icon: FileText,
    stat: "3 pending",
    tone: "mustard",
  },
  {
    href: "marketing/social",
    label: "Social",
    description: "Posts scheduled across LinkedIn, Twitter, and Instagram.",
    icon: Share2,
    stat: "8 scheduled",
    tone: "neutral",
  },
];

type ChannelStatus = "ok" | "warn" | "neutral";

const CHANNEL_HEALTH: {
  channel: string;
  status: ChannelStatus;
  detail: string;
}[] = [
  { channel: "LinkedIn",      status: "warn",    detail: "12% engagement drop this week" },
  { channel: "Blog / SEO",    status: "ok",      detail: "1.8k organic visits/mo"        },
  { channel: "Email",         status: "ok",      detail: "42% open rate"                 },
  { channel: "Paid Google",   status: "warn",    detail: "$84 CPA above $70 target"      },
  { channel: "Product Hunt",  status: "neutral", detail: "Launch prep in progress"       },
];

const STATUS_DOT_CLS: Record<ChannelStatus, string> = {
  ok:      "bg-sage-ink",
  warn:    "bg-mustard-ink",
  neutral: "bg-ink-soft",
};
const STATUS_LABEL_CLS: Record<ChannelStatus, string> = {
  ok:      "text-sage-ink",
  warn:    "text-mustard-ink",
  neutral: "text-ink-muted",
};

export default async function MarketingPage({
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
          <PageTitle>Marketing</PageTitle>
          <Hint>
            Content, campaigns, and social. The Marketing Agent writes, schedules, and measures.
          </Hint>
        </header>

        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Active campaigns" value="3" tone="mustard" />
          <StatCard label="Content pieces"   value="14" />
          <StatCard label="Scheduled posts"  value="8" />
          <StatCard label="MQL this month"   value="31" />
        </div>

        {/* Daily brief */}
        <div className="space-y-2">
          <Eyebrow>Daily brief — Marketing Agent</Eyebrow>
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
        <div className="grid grid-cols-3 gap-3">
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
                      s.tone === "mustard"
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

        {/* Channel health */}
        <div className="space-y-2">
          <Eyebrow>Channel health</Eyebrow>
          <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
            {CHANNEL_HEALTH.map((row, i) => (
              <div
                key={row.channel}
                className={`flex items-center gap-3 px-4 py-2.5 ${i < CHANNEL_HEALTH.length - 1 ? "border-b border-line/40" : ""}`}
              >
                <div className={`size-1.5 rounded-full shrink-0 ${STATUS_DOT_CLS[row.status]}`} />
                <span className="flex-1 text-xs text-ink">{row.channel}</span>
                <span className={`text-xs ${STATUS_LABEL_CLS[row.status]}`}>
                  {row.detail}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
