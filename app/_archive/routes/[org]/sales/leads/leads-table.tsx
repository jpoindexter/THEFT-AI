"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Lead } from "./page";

type Tier = 1 | 2 | 3;
type FilterTab = "all" | Tier;

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: 1,     label: "Tier 1" },
  { key: 2,     label: "Tier 2" },
  { key: 3,     label: "Tier 3" },
];

const TIER_BADGE: Record<Tier, string> = {
  1: "bg-sage/30 text-sage-ink",
  2: "bg-mustard/30 text-mustard-ink",
  3: "bg-cream text-ink-muted",
};

function ScoreDot({ score }: { score: number }) {
  const cls =
    score >= 80
      ? "text-sage-ink"
      : score >= 60
        ? "text-mustard-ink"
        : "text-ink-muted";
  return <span className={cn("font-mono text-xs tabular-nums", cls)}>{score}</span>;
}

export default function LeadsTable({ leads }: { leads: Lead[] }) {
  const [active, setActive] = useState<FilterTab>("all");

  const visible = active === "all" ? leads : leads.filter((l) => l.tier === active);

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex items-center gap-1 border-b border-line/70 pb-0">
        {TABS.map((tab) => (
          <button
            key={String(tab.key)}
            type="button"
            onClick={() => setActive(tab.key)}
            className={cn(
              "px-3 py-1.5 text-xs rounded-t-md -mb-px border-b-2 transition-colors",
              active === tab.key
                ? "border-ink text-ink font-medium"
                : "border-transparent text-ink-muted hover:text-ink",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line/50 text-2xs uppercase tracking-wider text-ink-soft">
              <th className="text-left px-4 py-2 font-medium">Company</th>
              <th className="text-left px-4 py-2 font-medium">Contact</th>
              <th className="text-left px-4 py-2 font-medium">ICP fit</th>
              <th className="text-left px-4 py-2 font-medium">Tier</th>
              <th className="text-left px-4 py-2 font-medium">Trigger</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-left px-4 py-2 font-medium">Last action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/40">
            {visible.map((lead) => (
              <tr key={lead.id} className="hover:bg-canvas/50 transition-colors">
                <td className="px-4 py-2.5 font-medium text-ink">{lead.company}</td>
                <td className="px-4 py-2.5">
                  <div className="text-ink">{lead.contact}</div>
                  <div className="text-2xs text-ink-muted">{lead.role}</div>
                </td>
                <td className="px-4 py-2.5">
                  <ScoreDot score={lead.icpScore} />
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={cn(
                      "inline-flex items-center text-2xs uppercase tracking-wider rounded px-1.5 py-0.5",
                      TIER_BADGE[lead.tier],
                    )}
                  >
                    Tier {lead.tier}
                  </span>
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
        {visible.length === 0 && (
          <div className="py-10 text-center text-xs text-ink-muted">
            No leads in this tier.
          </div>
        )}
      </div>
    </div>
  );
}
