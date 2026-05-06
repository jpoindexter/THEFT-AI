import { Database, Table2, FileText, HardDrive, Lock, Users, KeyRound, ScrollText, Lightbulb } from "lucide-react";
import Link from "next/link";

const NAV = [
  { slug: "database", label: "Database", Icon: Database },
  { slug: "migrations", label: "Migrations", Icon: FileText },
  { slug: "storage", label: "Storage", Icon: HardDrive },
  { slug: "auth", label: "Authentication", Icon: Lock },
  { slug: "users", label: "Users", Icon: Users },
  { slug: "secrets", label: "Secrets", Icon: KeyRound },
  { slug: "logs", label: "Logs", Icon: ScrollText },
  { slug: "suggestions", label: "Suggestions", Icon: Lightbulb },
];

export default function DatabasePage() {
  return (
    <div className="absolute inset-0 grid grid-cols-[200px_1fr]">
      <aside className="border-r border-stone-200/70 p-3 text-[13px] flex flex-col gap-0.5 bg-stone-50/50">
        <div className="px-2 py-1 text-[11px] text-stone-500">
          theft-ai
          <div className="text-[9px] text-stone-400 mt-0.5">Managed Supabase</div>
        </div>
        <div className="my-2 border-t border-stone-200/70" />
        {NAV.map(({ slug, label, Icon }) => (
          <button
            key={slug}
            className={`rounded-md px-2 py-1.5 inline-flex items-center gap-2 text-left ${
              slug === "database"
                ? "bg-stone-200/60 text-stone-900"
                : "hover:bg-stone-200/40 text-stone-600"
            }`}
          >
            <Icon className="size-3.5 text-stone-400" />
            {label}
          </button>
        ))}
      </aside>
      <div className="overflow-y-auto p-6">
        <div className="space-y-4">
          <header>
            <h1 className="text-lg font-medium tracking-tight inline-flex items-center gap-2">
              <Table2 className="size-4 text-stone-500" />
              Table Editor
            </h1>
            <p className="text-[12px] text-stone-500">
              View and manage the data stored in your app.
            </p>
          </header>
          <div className="grid grid-cols-[260px_1fr] gap-3">
            <aside className="rounded-lg border border-stone-200/70 bg-white p-3 space-y-1.5 text-[12px]">
              <div className="space-y-1.5">
                <select className="w-full rounded-md border border-stone-200 bg-white px-2 py-1 text-[12px]">
                  <option>prod</option>
                  <option>staging</option>
                </select>
                <select className="w-full rounded-md border border-stone-200 bg-white px-2 py-1 text-[12px]">
                  <option>All schemas</option>
                  <option>public</option>
                  <option>auth</option>
                </select>
              </div>
              <div className="border-t border-stone-200/70 my-2" />
              <div className="text-[10px] uppercase tracking-wider text-stone-400 mb-1">
                Tables
              </div>
              <p className="text-[11px] text-stone-500">
                36 tables across 5 schemas
              </p>
              {[
                "audit_log_entries",
                "custom_oauth_providers",
                "flow_state",
                "identities",
                "instances",
                "mfa_amr_claims",
                "mfa_challenges",
                "mfa_factors",
                "oauth_authorizations",
                "oauth_client_states",
              ].map((t) => (
                <button
                  key={t}
                  className="w-full rounded-md px-2 py-1 text-left hover:bg-stone-100 inline-flex items-center justify-between"
                >
                  <span className="font-mono">{t}</span>
                  <span className="text-[9px] uppercase text-stone-400">auth</span>
                </button>
              ))}
            </aside>
            <main className="rounded-lg border border-stone-200/70 bg-white p-6 flex flex-col items-center justify-center text-center min-h-[400px]">
              <Table2 className="size-6 text-stone-300 mb-2" />
              <div className="text-[13px] text-stone-700 font-medium">
                Select a table
              </div>
              <p className="text-[11px] text-stone-500 mt-1 max-w-sm">
                Choose a table from the sidebar to browse rows, filter records, edit cells, or upload CSV data.
              </p>
            </main>
          </div>
        </div>
      </div>
      <Link
        href="../"
        className="absolute top-3 right-3 size-7 rounded-md hover:bg-stone-200/60 inline-flex items-center justify-center text-stone-400"
        aria-label="Close"
      >
        ×
      </Link>
    </div>
  );
}
