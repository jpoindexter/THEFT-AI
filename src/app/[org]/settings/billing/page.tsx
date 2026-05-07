import Link from "next/link";
import {
  SectionHeader,
  SettingsCard,
} from "@/components/settings/section";
import { Pill } from "@/components/ui/primitives";

const INVOICES = [
  { id: "inv_2026_05", date: "2026-05-01", amount: 60, status: "paid" as const },
  { id: "inv_2026_04", date: "2026-04-01", amount: 60, status: "paid" as const },
  { id: "inv_2026_03", date: "2026-03-01", amount: 60, status: "paid" as const },
];

const USAGE = [
  { line: "Cofounder turns", count: 412, cost: 18.4 },
  { line: "Engineer turns", count: 84, cost: 28.1 },
  { line: "Marketing turns", count: 55, cost: 6.3 },
  { line: "Storage", count: 1, cost: 0.8 },
];

export default async function Billing({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const total = USAGE.reduce((a, b) => a + b.cost, 0);
  return (
    <>
      <SectionHeader
        title="Billing"
        description="Plan, balance, current cycle usage, and invoice history."
      />

      <SettingsCard>
        <div className="space-y-2 text-base">
          <div className="flex items-baseline justify-between">
            <span>Plan</span>
            <span className="inline-flex items-center gap-2">
              <Pill tone="mustard">Team</Pill>
              <Link
                href={`/${org}/billing/upgrade`}
                className="text-xs underline text-ink-muted hover:text-ink"
              >
                Change plan
              </Link>
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span>Available balance</span>
            <span className="text-2xl font-semibold tracking-tight">$14.53</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span>Renews</span>
            <span className="text-ink-muted">2026-06-01</span>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="This cycle"
        description="Per-line breakdown for the current billing month."
      >
        <table className="w-full text-base">
          <thead>
            <tr className="text-left text-2xs uppercase tracking-wider text-ink-soft border-b border-line/60">
              <th className="py-2">Line</th>
              <th className="py-2 text-right">Count</th>
              <th className="py-2 text-right">Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {USAGE.map((u) => (
              <tr key={u.line}>
                <td className="py-1.5">{u.line}</td>
                <td className="py-1.5 text-right font-mono">{u.count.toLocaleString()}</td>
                <td className="py-1.5 text-right font-mono">${u.cost.toFixed(2)}</td>
              </tr>
            ))}
            <tr className="font-medium">
              <td className="py-1.5">Total</td>
              <td className="py-1.5"></td>
              <td className="py-1.5 text-right font-mono">${total.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </SettingsCard>

      <SettingsCard
        title="Invoices"
        description="Last 12 months. Click to download PDF."
      >
        <ul className="divide-y divide-line/60">
          {INVOICES.map((i) => (
            <li
              key={i.id}
              className="py-2 flex items-center justify-between text-base"
            >
              <span className="font-mono">{i.id}</span>
              <span className="text-ink-muted">{i.date}</span>
              <span className="font-mono">${i.amount.toFixed(2)}</span>
              <Pill tone={i.status === "paid" ? "sage" : "mustard"}>
                {i.status}
              </Pill>
              <a
                href={`/api/${org}/invoices/${i.id}`}
                className="text-xs underline text-ink-muted hover:text-ink"
              >
                Download
              </a>
            </li>
          ))}
        </ul>
      </SettingsCard>

      <SettingsCard
        title="Payment method"
        description="The card we charge each cycle."
      >
        <div className="rounded-md border border-line/70 px-3 py-2 text-base flex items-center justify-between">
          <div>
            <div className="font-medium">Visa •••• 4242</div>
            <div className="text-xs text-ink-muted">Expires 09/29</div>
          </div>
          <button className="text-xs rounded-md border border-line px-2 py-0.5 hover:border-line-strong">
            Update
          </button>
        </div>
      </SettingsCard>
    </>
  );
}
