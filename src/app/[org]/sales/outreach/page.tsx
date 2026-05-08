import { notFound } from "next/navigation";
import { db } from "@/lib/db/store";
import { PageTitle, Hint, Eyebrow } from "@/components/ui/primitives";
import { Mail, MessageCircle, Users } from "lucide-react";

const SEQUENCE_STEPS = [
  { day: 1,  type: "email",  purpose: "Context, problem, solve",        icon: "email" },
  { day: 2,  type: "social", purpose: "Become familiar",                 icon: "social" },
  { day: 3,  type: "email",  purpose: "Answer the likely objection",     icon: "email" },
  { day: 4,  type: "social", purpose: "Show real engagement",            icon: "social" },
  { day: 5,  type: "email",  purpose: "Share the differentiator",        icon: "email" },
  { day: 6,  type: "dm",     purpose: "Make it relevant",                icon: "dm" },
  { day: 7,  type: "email",  purpose: "Soft walkaway",                   icon: "email" },
];

const ACTIVE_SEQUENCES = [
  { id: "1", lead: "Sarah Chen — Meridian Health",    step: 3, lastSent: "3d ago",  nextAction: "Email Day 3 — answer objection",   status: "active" },
  { id: "2", lead: "James Okafor — Forge Logistics",  step: 5, lastSent: "1d ago",  nextAction: "Email Day 5 — differentiator",     status: "active" },
  { id: "3", lead: "Tom Walsh — Draftline Media",     step: 2, lastSent: "2d ago",  nextAction: "Social touch Day 2",               status: "active" },
  { id: "4", lead: "Nick Russo — Ironside Data",      step: 1, lastSent: "Today",   nextAction: "Social touch Day 2 tomorrow",      status: "active" },
  { id: "5", lead: "Chris Park — Lumina Studio",      step: 7, lastSent: "1w ago",  nextAction: "Restart with new decision maker",  status: "restart" },
];

function TouchIcon({ type }: { type: string }) {
  if (type === "email") return <Mail className="size-3.5 text-ink-muted" />;
  if (type === "dm") return <MessageCircle className="size-3.5 text-ink-muted" />;
  return <Users className="size-3.5 text-ink-muted" />;
}

export default async function OutreachPage({
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
          <PageTitle>Outreach Cadence</PageTitle>
          <Hint>7-day multi-touch sequence. Run up to 3× with different decision makers.</Hint>
        </header>

        {/* Sequence template */}
        <div className="space-y-2">
          <Eyebrow>Sequence template</Eyebrow>
          <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
            {SEQUENCE_STEPS.map((step, i) => (
              <div
                key={step.day}
                className={`flex items-center gap-4 px-4 py-3 ${i < SEQUENCE_STEPS.length - 1 ? "border-b border-line/40" : ""}`}
              >
                <span className="w-12 text-xs text-ink-muted shrink-0">Day {step.day}</span>
                <div className="size-7 rounded-md border border-line/70 bg-canvas inline-flex items-center justify-center shrink-0">
                  <TouchIcon type={step.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-ink capitalize">{step.type}</span>
                  <span className="text-xs text-ink-muted ml-2">— {step.purpose}</span>
                </div>
              </div>
            ))}
            <div className="px-4 py-3 bg-canvas/40 border-t border-line/40 space-y-1">
              <div className="text-xs text-ink-muted font-medium">Repeat rule</div>
              <div className="text-xs text-ink-soft">Run the sequence up to 3× with different decision makers. After a month, use their news. After two, restart the cadence.</div>
            </div>
          </div>
        </div>

        {/* Active sequences */}
        <div className="space-y-2">
          <Eyebrow>Active sequences — {ACTIVE_SEQUENCES.length} running</Eyebrow>
          <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line/50 text-2xs uppercase tracking-wider text-ink-soft">
                  <th className="text-left px-4 py-2 font-medium">Lead</th>
                  <th className="text-left px-4 py-2 font-medium">Step</th>
                  <th className="text-left px-4 py-2 font-medium">Last sent</th>
                  <th className="text-left px-4 py-2 font-medium">Next action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {ACTIVE_SEQUENCES.map((seq) => (
                  <tr key={seq.id} className="hover:bg-canvas/50">
                    <td className="px-4 py-2.5 text-xs font-medium text-ink">{seq.lead}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {SEQUENCE_STEPS.map((s) => (
                          <div
                            key={s.day}
                            className={`size-1.5 rounded-full ${s.day <= seq.step ? "bg-ink" : "bg-line"}`}
                          />
                        ))}
                        <span className="text-2xs text-ink-muted ml-1">{seq.step}/7</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-ink-soft">{seq.lastSent}</td>
                    <td className="px-4 py-2.5 text-xs text-ink-muted">{seq.nextAction}</td>
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
