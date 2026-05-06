import { FileText, CheckCircle2, ArrowRight } from "lucide-react";

const MIGRATIONS = [
  {
    id: "0014",
    name: "0014_add_subscriptions",
    when: "2026-05-06 14:22",
    by: "Engineer",
    status: "pending",
    summary: "Adds subscriptions table with FK to auth.users.",
  },
  {
    id: "0013",
    name: "0013_drop_legacy_session_token",
    when: "2026-05-04 09:11",
    by: "Engineer",
    status: "applied",
    summary: "Drops session_token column after rotation.",
  },
  {
    id: "0012",
    name: "0012_add_org_billing_email",
    when: "2026-05-02 17:48",
    by: "Engineer",
    status: "applied",
    summary: "Adds organizations.billing_email (nullable).",
  },
];

export default function MigrationsPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-lg font-medium tracking-tight inline-flex items-center gap-2">
          <FileText className="size-4 text-stone-500" /> Migrations
        </h1>
        <p className="text-[12px] text-stone-500">
          Each migration is reversible and tracked in source control. The
          Engineer applies them via PRs.
        </p>
      </header>
      <ul className="rounded-lg border border-stone-200/70 bg-white divide-y divide-stone-100">
        {MIGRATIONS.map((m) => (
          <li
            key={m.id}
            className="px-4 py-3 flex items-start justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <code className="text-[12px] font-mono text-stone-900">
                  {m.name}
                </code>
                {m.status === "applied" && (
                  <CheckCircle2 className="size-3 text-emerald-600" />
                )}
              </div>
              <div className="text-[11px] text-stone-500">
                {m.when} · {m.by}
              </div>
              <p className="text-[12px] text-stone-700 mt-1">{m.summary}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`text-[10px] uppercase rounded px-1.5 py-0.5 ${
                  m.status === "applied"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {m.status}
              </span>
              <button className="text-[11px] rounded-md border border-stone-200 px-2 py-1 hover:border-stone-400 inline-flex items-center gap-1">
                Open <ArrowRight className="size-3" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
