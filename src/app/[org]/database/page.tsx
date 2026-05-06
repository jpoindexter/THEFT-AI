import { Table2 } from "lucide-react";

const TABLES = [
  { name: "audit_log_entries", schema: "auth" },
  { name: "custom_oauth_providers", schema: "auth" },
  { name: "flow_state", schema: "auth" },
  { name: "identities", schema: "auth" },
  { name: "instances", schema: "auth" },
  { name: "mfa_amr_claims", schema: "auth" },
  { name: "mfa_challenges", schema: "auth" },
  { name: "mfa_factors", schema: "auth" },
  { name: "oauth_authorizations", schema: "auth" },
  { name: "oauth_client_states", schema: "auth" },
];

export default function DatabasePage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-lg font-medium tracking-tight inline-flex items-center gap-2">
          <Table2 className="size-4 text-ink-muted" />
          Table Editor
        </h1>
        <p className="text-[12px] text-ink-muted">
          View and manage the data stored in your app.
        </p>
      </header>
      <div className="grid grid-cols-[260px_1fr] gap-3">
        <aside className="rounded-lg border border-line/70 bg-paper p-3 space-y-1.5 text-[12px]">
          <div className="space-y-1.5">
            <select className="w-full rounded-md border border-line bg-paper px-2 py-1 text-[12px]">
              <option>prod</option>
              <option>staging</option>
            </select>
            <select className="w-full rounded-md border border-line bg-paper px-2 py-1 text-[12px]">
              <option>All schemas</option>
              <option>public</option>
              <option>auth</option>
            </select>
          </div>
          <div className="border-t border-line/70 my-2" />
          <div className="text-[10px] uppercase tracking-wider text-ink-soft mb-1">
            Tables
          </div>
          <p className="text-[11px] text-ink-muted">
            36 tables across 5 schemas
          </p>
          {TABLES.map((t) => (
            <button
              key={t.name}
              className="w-full rounded-md px-2 py-1 text-left hover:bg-cream inline-flex items-center justify-between"
            >
              <span className="font-mono">{t.name}</span>
              <span className="text-[9px] uppercase text-ink-soft">
                {t.schema}
              </span>
            </button>
          ))}
        </aside>
        <main className="rounded-lg border border-line/70 bg-paper p-6 flex flex-col items-center justify-center text-center min-h-[400px]">
          <Table2 className="size-6 text-line-strong mb-2" />
          <div className="text-[13px] text-ink font-medium">
            Select a table
          </div>
          <p className="text-[11px] text-ink-muted mt-1 max-w-sm">
            Choose a table from the sidebar to browse rows, filter records, edit
            cells, or upload CSV data.
          </p>
        </main>
      </div>
    </div>
  );
}
