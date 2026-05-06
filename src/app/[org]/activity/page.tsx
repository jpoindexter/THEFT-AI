const EVENTS = [
  {
    id: "evt_001",
    when: "2m ago",
    actor: "Engineer",
    action: "opened PR",
    target: "feat/subscriptions-table",
    detail: "12 files changed · +320/-12",
  },
  {
    id: "evt_002",
    when: "6m ago",
    actor: "Cofounder",
    action: "set business plan",
    target: "Business Plan",
    detail: "Product, ICP, pricing thesis saved",
  },
  {
    id: "evt_003",
    when: "21m ago",
    actor: "Marketing",
    action: "drafted launch email",
    target: "Launch broadcast — May",
    detail: "Awaiting approval",
  },
  {
    id: "evt_004",
    when: "1h ago",
    actor: "Sales",
    action: "exported prospect list",
    target: "lenders-mortgage-2026.csv",
    detail: "240 rows",
  },
  {
    id: "evt_005",
    when: "2h ago",
    actor: "Operations",
    action: "kicked routine",
    target: "Weekly status brief",
    detail: "Scheduled · Mondays 9am",
  },
];

import Link from "next/link";

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <header>
          <h1 className="text-xl tracking-tight">Activity</h1>
          <p className="text-[12px] text-ink-muted">
            Audit trail of every meaningful action agents take in this workspace.
          </p>
        </header>
        <ul className="rounded-lg border border-line/70 bg-paper divide-y divide-line/60">
          {EVENTS.map((e) => (
            <li key={e.id}>
              <Link
                href={`/${org}/activity/${e.id}`}
                className="px-4 py-3 flex items-center gap-3 hover:bg-canvas"
              >
                <span className="size-7 rounded-full bg-cream inline-flex items-center justify-center text-[10px] font-medium text-ink-muted flex-shrink-0">
                  {e.actor[0]}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px]">
                    <span className="font-medium">{e.actor}</span>{" "}
                    <span className="text-ink-muted">{e.action}</span>{" "}
                    <span className="font-mono text-[11px] text-ink">
                      {e.target}
                    </span>
                  </div>
                  <div className="text-[11px] text-ink-muted mt-0.5">
                    {e.detail}
                  </div>
                </div>
                <span className="text-[10px] text-ink-soft shrink-0">
                  {e.when}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
