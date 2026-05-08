import { notFound } from "next/navigation";
import { db } from "@/lib/db/store";
import { PageTitle, Hint, Pill } from "@/components/ui/primitives";
import { Plus } from "lucide-react";

type Tier = 1 | 2 | 3;

const MOCK_LEADS: {
  id: string; company: string; contact: string; role: string;
  tier: Tier; trigger: string; status: string; lastAction: string;
}[] = [
  { id: "1",  company: "Meridian Health",    contact: "Sarah Chen",   role: "VP Operations",  tier: 1, trigger: "Hired 3 ops leads",       status: "Trying to contact", lastAction: "Email sent 2d ago" },
  { id: "2",  company: "Forge Logistics",    contact: "James Okafor", role: "CEO",             tier: 1, trigger: "Series A announced",       status: "Contacted",         lastAction: "Replied yesterday" },
  { id: "3",  company: "Blueridge Capital",  contact: "Priya Nair",   role: "CFO",             tier: 1, trigger: "New compliance mandate",   status: "Consult booked",    lastAction: "Call tomorrow" },
  { id: "4",  company: "Draftline Media",    contact: "Tom Walsh",    role: "Head of Growth",  tier: 2, trigger: "Rebranding campaign",      status: "Trying to contact", lastAction: "Email sent 5d ago" },
  { id: "5",  company: "Nucleus Labs",       contact: "Emma Sato",    role: "COO",             tier: 2, trigger: "Expanded to EU",           status: "Open",              lastAction: "Added 1w ago" },
  { id: "6",  company: "Clearpath Tech",     contact: "Marcus Hill",  role: "CTO",             tier: 2, trigger: "Job post: Head of Rev Ops", status: "Open",             lastAction: "Added 3d ago" },
  { id: "7",  company: "Lumina Studio",      contact: "Chris Park",   role: "Founder",         tier: 2, trigger: "Product launch upcoming",  status: "Trying to contact", lastAction: "DM sent 3d ago" },
  { id: "8",  company: "Ironside Data",      contact: "Nick Russo",   role: "VP Sales",        tier: 3, trigger: "Conference attendee",      status: "Open",              lastAction: "Added today" },
  { id: "9",  company: "Apex Solutions",     contact: "Lia Ferreira", role: "Dir. Operations", tier: 3, trigger: "New website launched",     status: "Open",              lastAction: "Added 2d ago" },
  { id: "10", company: "Veritas Legal",      contact: "Dana Osei",    role: "Managing Partner",tier: 1, trigger: "Regulatory change",        status: "Pitched",           lastAction: "Proposal sent" },
];

const TIER_COLOR: Record<Tier, string> = {
  1: "sage",
  2: "mustard",
  3: "neutral",
} as const;

const TIER_LABEL: Record<Tier, string> = {
  1: "Tier 1 — Strong fit",
  2: "Tier 2 — Good fit",
  3: "Tier 3 — Possible fit",
};

export default async function LeadsPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) notFound();

  const t1 = MOCK_LEADS.filter((l) => l.tier === 1);
  const t2 = MOCK_LEADS.filter((l) => l.tier === 2);
  const t3 = MOCK_LEADS.filter((l) => l.tier === 3);

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="p-6 space-y-6">
        <header className="flex items-start justify-between">
          <div>
            <PageTitle>Lead List</PageTitle>
            <Hint>ICP-scored prospects with trigger events.</Hint>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm rounded-md bg-ink text-paper px-3 py-1.5 hover:opacity-90"
          >
            <Plus className="size-3.5" />
            Add lead
          </button>
        </header>

        <div className="text-xs text-ink-muted bg-canvas/60 rounded-lg p-3 border border-line/50">
          Spend most time on <strong>Tier 1</strong> — strong ICP fit + clear trigger event. Tier 2 when T1 list is worked. Tier 3 only when bandwidth allows.
        </div>

        {[{ tier: 1 as Tier, leads: t1 }, { tier: 2 as Tier, leads: t2 }, { tier: 3 as Tier, leads: t3 }].map(({ tier, leads }) => (
          <div key={tier} className="space-y-2">
            <div className="flex items-center gap-2">
              <Pill tone={TIER_COLOR[tier] as "sage" | "mustard" | "neutral"}>Tier {tier}</Pill>
              <span className="text-xs text-ink-muted">{TIER_LABEL[tier]} · {leads.length} leads</span>
            </div>
            <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line/50 text-2xs uppercase tracking-wider text-ink-soft">
                    <th className="text-left px-4 py-2 font-medium">Company</th>
                    <th className="text-left px-4 py-2 font-medium">Contact</th>
                    <th className="text-left px-4 py-2 font-medium">Trigger</th>
                    <th className="text-left px-4 py-2 font-medium">Status</th>
                    <th className="text-left px-4 py-2 font-medium">Last action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/40">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-canvas/50 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-ink">{lead.company}</div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="text-ink">{lead.contact}</div>
                        <div className="text-2xs text-ink-muted">{lead.role}</div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-ink-muted">{lead.trigger}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs rounded-full border border-line/70 px-2 py-0.5 text-ink-muted">
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-ink-soft">{lead.lastAction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
