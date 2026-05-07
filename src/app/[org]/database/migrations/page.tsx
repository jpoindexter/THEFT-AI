export default function MigrationsPage() {
  const ROWS = [
    { version: "20260506073651", name: "remote_schema" },
  ];

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-lg font-medium tracking-tight">Migrations</h1>
        <p className="text-sm text-ink-muted">
          Applied migration history for this managed Supabase project.
        </p>
      </header>

      <div className="rounded-lg border border-line/70 bg-paper overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr] border-b border-line/70">
          <div className="px-4 py-2 text-xs font-medium text-ink">Version</div>
          <div className="px-4 py-2 text-xs font-medium text-ink border-l border-line/70">Name</div>
        </div>
        {ROWS.map((r) => (
          <div key={r.version} className="grid grid-cols-[1fr_1fr]">
            <div className="px-4 py-2 text-sm font-mono text-ink-muted">{r.version}</div>
            <div className="px-4 py-2 text-sm text-ink border-l border-line/70">{r.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
