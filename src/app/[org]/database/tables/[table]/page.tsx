import Link from "next/link";
import { Plus, Filter, Download, Upload } from "lucide-react";
import {
  Eyebrow,
  Hint,
  PageTitle,
  Pill,
  ButtonPrimary,
} from "@/components/ui/primitives";

const TABLES: Record<
  string,
  {
    schema: string;
    columns: { name: string; type: string; nullable: boolean }[];
    rows: Record<string, string>[];
  }
> = {
  users: {
    schema: "public",
    columns: [
      { name: "id", type: "uuid", nullable: false },
      { name: "email", type: "text", nullable: false },
      { name: "created_at", type: "timestamptz", nullable: false },
      { name: "last_seen", type: "timestamptz", nullable: true },
    ],
    rows: [
      {
        id: "usr_a93b…",
        email: "ana@partner.io",
        created_at: "2026-04-12 09:14",
        last_seen: "2026-05-06 12:42",
      },
      {
        id: "usr_b71e…",
        email: "kim@encompass.com",
        created_at: "2026-04-30 14:21",
        last_seen: "2026-05-06 11:30",
      },
      {
        id: "usr_c08d…",
        email: "mark@vendor.dev",
        created_at: "2026-05-02 10:10",
        last_seen: "2026-05-03 17:00",
      },
    ],
  },
  subscriptions: {
    schema: "public",
    columns: [
      { name: "id", type: "uuid", nullable: false },
      { name: "user_id", type: "uuid", nullable: false },
      { name: "plan", type: "text", nullable: false },
      { name: "status", type: "text", nullable: false },
    ],
    rows: [],
  },
  identities: {
    schema: "auth",
    columns: [
      { name: "id", type: "uuid", nullable: false },
      { name: "user_id", type: "uuid", nullable: false },
      { name: "provider", type: "text", nullable: false },
    ],
    rows: [
      {
        id: "id_a01…",
        user_id: "usr_a93b…",
        provider: "email",
      },
    ],
  },
};

export default async function TableEditorPage({
  params,
}: {
  params: Promise<{ org: string; table: string }>;
}) {
  const { org, table } = await params;
  const t = TABLES[table];
  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between">
        <div>
          <Eyebrow>
            <Link
              href={`/${org}/database`}
              className="hover:text-ink"
            >
              Database
            </Link>
            {t && ` · ${t.schema}`}
          </Eyebrow>
          <PageTitle>
            <code className="font-mono">{table}</code>
          </PageTitle>
          <Hint>
            {t
              ? `${t.rows.length} row${t.rows.length === 1 ? "" : "s"}, ${t.columns.length} columns. Edits are tracked in audit log.`
              : "Unknown table. Pick one from the sidebar."}
          </Hint>
        </div>
        {t && (
          <div className="flex items-center gap-1 shrink-0">
            <Toolbar />
          </div>
        )}
      </header>

      {t ? (
        <TableView table={t} />
      ) : (
        <div className="rounded-lg border border-line/70 bg-paper p-8 text-center text-sm text-ink-muted">
          Pick a table from the sidebar to browse rows.
        </div>
      )}
    </div>
  );
}

function Toolbar() {
  return (
    <>
      <button
        title="Filter rows"
        className="text-xs inline-flex items-center gap-1 rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
      >
        <Filter className="size-3" /> Filter
      </button>
      <button
        title="Import CSV"
        className="text-xs inline-flex items-center gap-1 rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
      >
        <Upload className="size-3" /> Import
      </button>
      <button
        title="Export CSV"
        className="text-xs inline-flex items-center gap-1 rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
      >
        <Download className="size-3" /> Export
      </button>
      <ButtonPrimary className="text-xs px-2 py-1 inline-flex items-center gap-1">
        <Plus className="size-3" /> New row
      </ButtonPrimary>
    </>
  );
}

function TableView({
  table,
}: {
  table: NonNullable<(typeof TABLES)[keyof typeof TABLES]>;
}) {
  return (
    <div className="rounded-lg border border-line/70 bg-paper overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-canvas border-b border-line/70">
            <tr className="text-left">
              {table.columns.map((c) => (
                <th
                  key={c.name}
                  className="px-3 py-2 text-2xs uppercase tracking-wider text-ink-soft font-medium"
                >
                  <div className="font-mono">{c.name}</div>
                  <div className="font-mono normal-case tracking-normal text-ink-muted">
                    {c.type}
                    {!c.nullable && (
                      <span className="ml-1">
                        <Pill>NOT NULL</Pill>
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {table.rows.length === 0 ? (
              <tr>
                <td
                  colSpan={table.columns.length}
                  className="px-3 py-6 text-center text-sm text-ink-muted"
                >
                  No rows yet.
                </td>
              </tr>
            ) : (
              table.rows.map((r, i) => (
                <tr key={i} className="hover:bg-canvas">
                  {table.columns.map((c) => (
                    <td key={c.name} className="px-3 py-2 font-mono text-xs">
                      {r[c.name] ?? <span className="text-ink-soft">null</span>}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
