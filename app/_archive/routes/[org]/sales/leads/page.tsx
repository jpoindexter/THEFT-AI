import { notFound } from "next/navigation";
import { db } from "@/lib/db/store";
import { Hint, PageTitle } from "@/components/ui/primitives";
import { Plus } from "lucide-react";
import LeadsTable from "./leads-table";

type Tier = 1 | 2 | 3;

export type Lead = {
  id: string;
  company: string;
  contact: string;
  role: string;
  icpScore: number;
  tier: Tier;
  trigger: string;
  status: string;
  lastAction: string;
};

const MOCK_LEADS: Lead[] = [
  { id: "1", company: "Meridian Health",   contact: "Sarah Chen",   role: "VP Operations",   icpScore: 94, tier: 1, trigger: "Hired 3 ops leads",        status: "Trying to contact", lastAction: "Email sent 2d ago" },
  { id: "2", company: "Forge Logistics",   contact: "James Okafor", role: "CEO",              icpScore: 91, tier: 1, trigger: "Series A announced",        status: "Contacted",         lastAction: "Replied yesterday" },
  { id: "3", company: "Blueridge Capital", contact: "Priya Nair",   role: "CFO",              icpScore: 88, tier: 1, trigger: "New compliance mandate",    status: "Consult booked",    lastAction: "Call tomorrow" },
  { id: "4", company: "Draftline Media",   contact: "Tom Walsh",    role: "Head of Growth",   icpScore: 72, tier: 2, trigger: "Rebranding campaign",       status: "Trying to contact", lastAction: "Email sent 5d ago" },
  { id: "5", company: "Nucleus Labs",      contact: "Emma Sato",    role: "COO",              icpScore: 68, tier: 2, trigger: "Expanded to EU",            status: "Open",              lastAction: "Added 1w ago" },
  { id: "6", company: "Clearpath Tech",    contact: "Marcus Hill",  role: "CTO",              icpScore: 65, tier: 2, trigger: "Job post: Head of Rev Ops", status: "Open",              lastAction: "Added 3d ago" },
  { id: "7", company: "Ironside Data",     contact: "Nick Russo",   role: "VP Sales",         icpScore: 41, tier: 3, trigger: "Conference attendee",       status: "Open",              lastAction: "Added today" },
  { id: "8", company: "Apex Solutions",    contact: "Lia Ferreira", role: "Dir. Operations",  icpScore: 38, tier: 3, trigger: "New website launched",      status: "Open",              lastAction: "Added 2d ago" },
];

export default async function LeadsPage({
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

        <LeadsTable leads={MOCK_LEADS} />
      </div>
    </div>
  );
}
