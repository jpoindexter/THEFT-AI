import { Lock, Mail, Code2, Globe } from "lucide-react";

const PROVIDERS = [
  { id: "email", name: "Email & password", Icon: Mail, on: true },
  { id: "magic", name: "Magic link", Icon: Mail, on: true },
  { id: "github", name: "GitHub", Icon: Code2, on: true },
  { id: "google", name: "Google", Icon: Globe, on: false },
];

export default function AuthPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-lg font-medium tracking-tight inline-flex items-center gap-2">
          <Lock className="size-4 text-ink-muted" /> Authentication
        </h1>
        <p className="text-sm text-ink-muted">
          Configure how users sign in. Powered by Supabase Auth.
        </p>
      </header>

      <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-2">
        <div className="text-md font-medium tracking-tight">Providers</div>
        <ul className="divide-y divide-line/60">
          {PROVIDERS.map((p) => {
            const Icon = p.Icon;
            return (
              <li
                key={p.id}
                className="py-2 flex items-center justify-between"
              >
                <span className="inline-flex items-center gap-2 text-base">
                  <Icon className="size-4 text-ink-muted" />
                  {p.name}
                </span>
                <span
                  className={`text-2xs uppercase rounded px-1.5 py-0.5 ${
                    p.on
                      ? "bg-sage/30 text-sage-ink"
                      : "bg-cream text-ink-muted"
                  }`}
                >
                  {p.on ? "On" : "Off"}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-2">
        <div className="text-md font-medium tracking-tight">
          Session settings
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <div className="text-ink-muted">Session length</div>
            <div className="font-mono">7 days</div>
          </div>
          <div>
            <div className="text-ink-muted">Refresh window</div>
            <div className="font-mono">14 days</div>
          </div>
          <div>
            <div className="text-ink-muted">JWT expiry</div>
            <div className="font-mono">3600s</div>
          </div>
        </div>
      </section>
    </div>
  );
}
