import { Table2 } from "lucide-react";
import Link from "next/link";

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
  { name: "organizations", schema: "public" },
  { name: "departments", schema: "public" },
  { name: "agents", schema: "public" },
  { name: "tasks", schema: "public" },
  { name: "artifacts", schema: "public" },
  { name: "cofounder_messages", schema: "public" },
  { name: "memory_items", schema: "public" },
  { name: "api_keys", schema: "public" },
  { name: "webhooks", schema: "public" },
  { name: "approval_rules", schema: "public" },
  { name: "tech_tree_status", schema: "public" },
];

export default async function DatabasePage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium tracking-tight">Table Editor</h1>
          <p className="text-sm text-ink-muted">
            View and manage the data stored in your app.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md border border-line bg-paper px-3 py-1.5 text-xs hover:border-line-strong"
        >
          <Table2 className="size-3.5 text-ink-muted" />
          Query your database
        </button>
      </header>

      <div className="grid grid-cols-[260px_1fr] gap-3">
        <aside className="rounded-lg border border-line/70 bg-paper overflow-hidden">
          <div className="p-2 space-y-1 border-b border-line/70">
            <select className="w-full rounded border border-line/70 bg-canvas px-2 py-1 text-xs focus:outline-none">
              <option>prod</option>
              <option>staging</option>
            </select>
            <select className="w-full rounded border border-line/70 bg-canvas px-2 py-1 text-xs focus:outline-none">
              <option>All schemas</option>
              <option>public</option>
              <option>auth</option>
            </select>
          </div>
          <div className="p-1 max-h-[420px] overflow-y-auto">
            {TABLES.map((t) => (
              <Link
                key={`${t.schema}.${t.name}`}
                href={`/${org}/database/tables/${t.name}`}
                className="w-full rounded-md px-2 py-1.5 text-left hover:bg-cream flex items-center justify-between group"
              >
                <span className="font-mono text-xs text-ink">{t.name}</span>
                <span className="text-2xs text-ink-soft ml-1">0</span>
              </Link>
            ))}
          </div>
        </aside>

        <main className="rounded-lg border border-line/70 bg-paper overflow-hidden">
          <div className="px-4 py-2 border-b border-line/70 text-xs text-ink-muted">
            Tables
            <span className="ml-1 text-ink-soft">
              {TABLES.length} tables across 5 schemas
            </span>
          </div>
          <div className="p-12 flex flex-col items-center justify-center text-center min-h-[300px] gap-2">
            <div className="size-8 rounded-md border border-line/70 inline-flex items-center justify-center">
              <Table2 className="size-4 text-ink-soft" />
            </div>
            <div className="text-base font-medium text-ink mt-1">Select a table</div>
            <p className="text-xs text-ink-muted max-w-xs">
              Choose a table from the sidebar to browse rows, filter records, edit cells, or upload CSV data.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
