import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/store";
import { PageTitle, Hint, Eyebrow, StatCard } from "@/components/ui/primitives";
import { ArrowLeft } from "lucide-react";

const CHANNELS = [
  { name: "Organic / SEO",  visitors: 1840, leads: 92, meetings: 18, customers: 6, mrr: 1480 },
  { name: "Content / Blog", visitors: 620,  leads: 31, meetings: 8,  customers: 3, mrr: 740  },
  { name: "Paid (Google)",  visitors: 940,  leads: 47, meetings: 11, customers: 2, mrr: 490  },
  { name: "Referral",       visitors: 310,  leads: 62, meetings: 21, customers: 9, mrr: 2220 },
  { name: "LinkedIn",       visitors: 480,  leads: 38, meetings: 14, customers: 4, mrr: 980  },
];

const TOP_CONTENT = [
  { title: "How we replaced 3 hires with AI agents",      views: 8200, leads: 48, channel: "Organic"  },
  { title: "The 7-day sales outreach cadence that works", views: 5100, leads: 31, channel: "LinkedIn" },
  { title: "Unit economics for early-stage SaaS",         views: 3800, leads: 19, channel: "Organic"  },
  { title: "Why we chose Supabase over PlanetScale",      views: 3200, leads: 12, channel: "Referral" },
  { title: "AI agents vs. no-code automation tools",      views: 2900, leads: 22, channel: "Organic"  },
];

function pct(n: number, d: number) {
  return d === 0 ? "—" : `${((n / d) * 100).toFixed(1)}%`;
}

export default async function MarketingAnalyticsPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) notFound();

  const totalVisitors = CHANNELS.reduce((s, c) => s + c.visitors, 0);
  const totalLeads = CHANNELS.reduce((s, c) => s + c.leads, 0);
  const totalMeetings = CHANNELS.reduce((s, c) => s + c.meetings, 0);
  const totalCustomers = CHANNELS.reduce((s, c) => s + c.customers, 0);
  const totalMrr = CHANNELS.reduce((s, c) => s + c.mrr, 0);

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="p-6 space-y-6">
        <header>
          <Link
            href={`/${org}/analytics`}
            className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink mb-2"
          >
            <ArrowLeft className="size-3" /> Analytics
          </Link>
          <PageTitle>Marketing Channels</PageTitle>
          <Hint>
            Which content brings qualified visitors, which visitors become leads,
            which leads become customers.
          </Hint>
        </header>

        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Visitors / mo" value={totalVisitors.toLocaleString()} />
          <StatCard label="Leads" value={totalLeads.toLocaleString()} />
          <StatCard label="Meetings" value={String(totalMeetings)} />
          <StatCard label="Customers" value={String(totalCustomers)} />
        </div>

        {/* Channel table */}
        <div className="space-y-2">
          <Eyebrow>Channel attribution — last 30 days</Eyebrow>
          <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line/50 text-2xs uppercase tracking-wider text-ink-soft">
                  <th className="text-left px-4 py-2 font-medium">Channel</th>
                  <th className="text-right px-4 py-2 font-medium">Visitors</th>
                  <th className="text-right px-4 py-2 font-medium">Leads</th>
                  <th className="text-right px-4 py-2 font-medium">V→L</th>
                  <th className="text-right px-4 py-2 font-medium">Meetings</th>
                  <th className="text-right px-4 py-2 font-medium">Customers</th>
                  <th className="text-right px-4 py-2 font-medium">MRR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {CHANNELS.map((c) => (
                  <tr key={c.name} className="hover:bg-canvas/50">
                    <td className="px-4 py-2.5 text-xs font-medium text-ink">{c.name}</td>
                    <td className="px-4 py-2.5 text-xs text-ink-muted text-right">
                      {c.visitors.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-ink text-right">{c.leads}</td>
                    <td className="px-4 py-2.5 text-xs text-ink-muted text-right">
                      {pct(c.leads, c.visitors)}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-ink text-right">{c.meetings}</td>
                    <td className="px-4 py-2.5 text-xs text-ink text-right">{c.customers}</td>
                    <td className="px-4 py-2.5 text-xs font-medium text-ink text-right">
                      ${c.mrr.toLocaleString()}
                    </td>
                  </tr>
                ))}
                <tr className="bg-canvas/40 border-t border-line/50">
                  <td className="px-4 py-2.5 text-xs font-semibold text-ink">Total</td>
                  <td className="px-4 py-2.5 text-xs font-medium text-ink text-right">
                    {totalVisitors.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-xs font-medium text-ink text-right">
                    {totalLeads}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-ink-muted text-right">
                    {pct(totalLeads, totalVisitors)}
                  </td>
                  <td className="px-4 py-2.5 text-xs font-medium text-ink text-right">
                    {totalMeetings}
                  </td>
                  <td className="px-4 py-2.5 text-xs font-medium text-ink text-right">
                    {totalCustomers}
                  </td>
                  <td className="px-4 py-2.5 text-xs font-semibold text-ink text-right">
                    ${totalMrr.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Top content */}
        <div className="space-y-2">
          <Eyebrow>Top performing content</Eyebrow>
          <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line/50 text-2xs uppercase tracking-wider text-ink-soft">
                  <th className="text-left px-4 py-2 font-medium">Title</th>
                  <th className="text-left px-4 py-2 font-medium">Channel</th>
                  <th className="text-right px-4 py-2 font-medium">Views</th>
                  <th className="text-right px-4 py-2 font-medium">Leads</th>
                  <th className="text-right px-4 py-2 font-medium">V→L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {TOP_CONTENT.map((c) => (
                  <tr key={c.title} className="hover:bg-canvas/50">
                    <td className="px-4 py-2.5 text-xs text-ink">{c.title}</td>
                    <td className="px-4 py-2.5 text-xs text-ink-muted">{c.channel}</td>
                    <td className="px-4 py-2.5 text-xs text-ink-muted text-right">
                      {c.views.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-ink text-right">{c.leads}</td>
                    <td className="px-4 py-2.5 text-xs text-ink-muted text-right">
                      {pct(c.leads, c.views)}
                    </td>
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
