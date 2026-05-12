import Link from "next/link";
import { Plus, Filter, Download } from "lucide-react";
import {
  Eyebrow,
  Hint,
  PageTitle,
  Pill,
  ButtonPrimary,
} from "@/components/ui/primitives";
import { db } from "@/lib/db/store";

export default async function TableEditorPage({
  params,
}: {
  params: Promise<{ org: string; table: string }>;
}) {
  const { org, table } = await params;
  let data: { columns: { name: string; type: string }[]; rows: Record<string, unknown>[] } | null = null;
  try {
    data = await db.readRaw(table);
  } catch {
    data = null;
  }

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between">
        <div>
          <Eyebrow>
            <Link href={`/${org}/database`} className="hover:text-ink">
              Database
            </Link>
            {" · public"}
          </Eyebrow>
          <PageTitle>
            <code className="font-mono">{table}</code>
          </PageTitle>
          <Hint>
            {data
              ? `${data.rows.length} row${data.rows.length === 1 ? "" : "s"}, ${data.columns.length} columns.`
              : "Table not found or empty."}
          </Hint>
        </div>
        {data && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              title="Filter rows"
              className="text-xs inline-flex items-center gap-1 rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
            >
              <Filter className="size-3" /> Filter
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
          </div>
        )}
      </header>

      {data ? (
        <div className="rounded-lg border border-line/70 bg-paper overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-canvas border-b border-line/70">
                <tr className="text-left">
                  {data.columns.map((c) => (
                    <th
                      key={c.name}
                      className="px-3 py-2 text-2xs uppercase tracking-wider text-ink-soft font-medium"
                    >
                      <div className="font-mono">{c.name}</div>
                      <div className="font-mono normal-case tracking-normal text-ink-muted">
                        {c.type}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {data.rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={data.columns.length}
                      className="px-3 py-6 text-center text-sm text-ink-muted"
                    >
                      No rows yet.
                    </td>
                  </tr>
                ) : (
                  data.rows.slice(0, 100).map((r, i) => (
                    <tr key={i} className="hover:bg-canvas">
                      {data!.columns.map((c) => {
                        const val = r[c.name];
                        const display =
                          val === null || val === undefined
                            ? null
                            : Array.isArray(val)
                            ? JSON.stringify(val)
                            : typeof val === "object"
                            ? JSON.stringify(val).slice(0, 60)
                            : String(val);
                        return (
                          <td key={c.name} className="px-3 py-2 font-mono text-xs max-w-[200px] truncate">
                            {display === null ? (
                              <span className="text-ink-soft">null</span>
                            ) : (
                              display
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {data.rows.length > 100 && (
            <div className="px-3 py-2 border-t border-line/60 text-xs text-ink-muted">
              Showing 100 of {data.rows.length} rows.
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-line/70 bg-paper p-8 text-center text-sm text-ink-muted">
          <Pill>Unknown table</Pill>
          <p className="mt-2">Pick a table from the sidebar to browse rows.</p>
        </div>
      )}
    </div>
  );
}
