import { Table2 } from "lucide-react";
import Link from "next/link";

const STORE_TABLES = [
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
      <header>
        <h1 className="text-lg font-medium tracking-tight inline-flex items-center gap-2">
          <Table2 className="size-4 text-ink-muted" />
          Table Editor
        </h1>
        <p className="text-sm text-ink-muted">
          View and manage the data stored in your workspace.
        </p>
      </header>
      <div className="grid grid-cols-[260px_1fr] gap-3">
        <aside className="rounded-lg border border-line/70 bg-paper p-3 space-y-1.5 text-sm">
          <div className="text-2xs uppercase tracking-wider text-ink-soft mb-1">
            Tables ({STORE_TABLES.length})
          </div>
          {STORE_TABLES.map((t) => (
            <Link
              key={t.name}
              href={`/${org}/database/tables/${t.name}`}
              className="w-full rounded-md px-2 py-1 text-left hover:bg-cream inline-flex items-center justify-between"
            >
              <span className="font-mono text-xs">{t.name}</span>
              <span className="text-2xs uppercase text-ink-soft">
                {t.schema}
              </span>
            </Link>
          ))}
        </aside>
        <main className="rounded-lg border border-line/70 bg-paper p-6 flex flex-col items-center justify-center text-center min-h-[400px]">
          <Table2 className="size-6 text-line-strong mb-2" />
          <div className="text-base text-ink font-medium">
            Select a table
          </div>
          <p className="text-xs text-ink-muted mt-1 max-w-sm">
            Choose a table from the sidebar to browse rows.
          </p>
        </main>
      </div>
    </div>
  );
}
