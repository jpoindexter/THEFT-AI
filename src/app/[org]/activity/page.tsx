const EVENTS = [
  {
    when: "2m ago",
    actor: "Engineer",
    action: "opened PR",
    target: "feat/subscriptions-table",
    detail: "12 files changed · +320/-12",
  },
  {
    when: "6m ago",
    actor: "Cofounder",
    action: "set business plan",
    target: "Business Plan",
    detail: "Product, ICP, pricing thesis saved",
  },
  {
    when: "21m ago",
    actor: "Marketing",
    action: "drafted launch email",
    target: "Launch broadcast — May",
    detail: "Awaiting approval",
  },
  {
    when: "1h ago",
    actor: "Sales",
    action: "exported prospect list",
    target: "lenders-mortgage-2026.csv",
    detail: "240 rows",
  },
  {
    when: "2h ago",
    actor: "Operations",
    action: "kicked routine",
    target: "Weekly status brief",
    detail: "Scheduled · Mondays 9am",
  },
];

export default function ActivityPage() {
  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <header>
          <h1 className="text-xl tracking-tight">Activity</h1>
          <p className="text-[12px] text-stone-500">
            Audit trail of every meaningful action agents take in this workspace.
          </p>
        </header>
        <ul className="rounded-lg border border-stone-200/70 bg-white divide-y divide-stone-100">
          {EVENTS.map((e, i) => (
            <li key={i} className="px-4 py-3 flex items-center gap-3">
              <span className="size-7 rounded-full bg-stone-100 inline-flex items-center justify-center text-[10px] font-medium text-stone-600 flex-shrink-0">
                {e.actor[0]}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px]">
                  <span className="font-medium">{e.actor}</span>{" "}
                  <span className="text-stone-500">{e.action}</span>{" "}
                  <span className="font-mono text-[11px] text-stone-700">
                    {e.target}
                  </span>
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  {e.detail}
                </div>
              </div>
              <span className="text-[10px] text-stone-400 shrink-0">
                {e.when}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
