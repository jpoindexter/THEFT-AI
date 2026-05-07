import { Copy } from "lucide-react";

export default async function SecretsPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium tracking-tight">Secrets</h1>
          <div className="text-sm text-ink-muted">
            API Keys
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Managed Supabase access for{" "}
            <span className="font-medium text-ink">{org}</span>
          </p>
        </div>
        <span className="text-xs rounded-md border border-line/70 px-2 py-1 text-ink-muted">
          Secret missing
        </span>
      </header>

      <div className="rounded-lg border border-line/70 bg-paper p-5 space-y-4">
        <div>
          <div className="text-sm font-medium text-ink uppercase tracking-wider">
            Connection Details
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Use these values in browser and server clients.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xs uppercase tracking-wider text-ink-soft mb-1">
              Project URL
            </div>
            <div className="text-2xs text-ink-muted mb-1.5">
              Use this as the Supabase base URL in browser clients.
            </div>
            <div className="flex items-center gap-1">
              <input
                readOnly
                value={`https://${org}.supabase.co`}
                className="flex-1 rounded-md border border-line/70 bg-canvas px-2 py-1.5 text-xs font-mono focus:outline-none"
              />
              <button type="button" className="shrink-0 text-ink-muted hover:text-ink" aria-label="Copy">
                <Copy className="size-3.5" />
              </button>
            </div>
          </div>
          <div>
            <div className="text-2xs uppercase tracking-wider text-ink-soft mb-1">
              Publishable Key
            </div>
            <div className="text-2xs text-ink-muted mb-1.5">
              Safe for browser use. This stays visible here.
            </div>
            <div className="flex items-center gap-1">
              <div className="flex-1 rounded-md border border-line/70 bg-canvas px-2 py-1.5 text-2xs font-mono text-ink-muted overflow-hidden line-clamp-3 leading-relaxed break-all">
                eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
              </div>
              <button type="button" className="shrink-0 text-ink-muted hover:text-ink self-start mt-1" aria-label="Copy">
                <Copy className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-line/70 bg-paper p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-ink">Secret key</span>
            <span className="text-xs rounded-md border border-line/70 px-2 py-0.5 text-ink-muted">
              Not generated
            </span>
          </div>
          <button
            type="button"
            className="text-xs rounded-md bg-ink text-paper px-3 py-1.5 hover:opacity-90"
          >
            Generate secret key
          </button>
        </div>
        <p className="text-xs text-ink-muted leading-snug">
          This is the server-side key. Generate it once, rotate when you need a new value, or revoke it to remove managed access entirely.
        </p>
        <div className="rounded-md border border-line/70 bg-canvas px-4 py-3">
          <div className="text-sm font-medium text-ink mb-0.5">No secret key yet</div>
          <p className="text-xs text-ink-muted">
            Generate a secret key to reveal it once and start using it in server-side workflows.
          </p>
        </div>
      </div>
    </div>
  );
}
