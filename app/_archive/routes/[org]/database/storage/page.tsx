import { Folder, Globe, Lock, Plus } from "lucide-react";

type Bucket = {
  name: string;
  access: "public" | "private";
  files: number;
  size: string;
  lastModified: string;
};

const BUCKETS: Bucket[] = [];

export default function StoragePage() {
  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-medium tracking-tight">Storage</h1>
          <p className="text-sm text-ink-muted">
            View and manage the files stored in your app.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs rounded-md bg-ink text-paper px-3 py-1.5 hover:opacity-90 shrink-0"
        >
          <Plus className="size-3" /> New bucket
        </button>
      </header>

      <div className="rounded-lg border border-line/70 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line/70 bg-canvas/60">
              <th className="px-4 py-2 text-left text-2xs uppercase tracking-wider text-ink-soft font-medium">
                Name
              </th>
              <th className="px-4 py-2 text-left text-2xs uppercase tracking-wider text-ink-soft font-medium">
                Access
              </th>
              <th className="px-4 py-2 text-right text-2xs uppercase tracking-wider text-ink-soft font-medium">
                Files
              </th>
              <th className="px-4 py-2 text-right text-2xs uppercase tracking-wider text-ink-soft font-medium">
                Size
              </th>
              <th className="px-4 py-2 text-right text-2xs uppercase tracking-wider text-ink-soft font-medium">
                Last modified
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/50 bg-paper">
            {BUCKETS.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-ink-muted">
                  <div className="flex flex-col items-center gap-2">
                    <Folder className="size-5 text-line-strong" />
                    <span>No storage buckets</span>
                    <span className="text-xs text-ink-soft">
                      A bucket is a container used to store and protect files in your app.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              BUCKETS.map((b) => (
                <tr key={b.name} className="hover:bg-canvas/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center gap-2 text-ink font-medium">
                      <Folder className="size-4 text-ink-muted shrink-0" />
                      {b.name}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                      {b.access === "public" ? (
                        <Globe className="size-3.5" />
                      ) : (
                        <Lock className="size-3.5" />
                      )}
                      {b.access}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-ink-muted tabular-nums">
                    {b.files.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-ink-muted tabular-nums">
                    {b.size}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-ink-muted tabular-nums">
                    {b.lastModified}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
