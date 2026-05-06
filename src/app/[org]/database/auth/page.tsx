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
          <Lock className="size-4 text-stone-500" /> Authentication
        </h1>
        <p className="text-[12px] text-stone-500">
          Configure how users sign in. Powered by Supabase Auth.
        </p>
      </header>

      <section className="rounded-lg border border-stone-200/70 bg-white p-4 space-y-2">
        <div className="text-[14px] font-medium tracking-tight">Providers</div>
        <ul className="divide-y divide-stone-100">
          {PROVIDERS.map((p) => {
            const Icon = p.Icon;
            return (
              <li
                key={p.id}
                className="py-2 flex items-center justify-between"
              >
                <span className="inline-flex items-center gap-2 text-[13px]">
                  <Icon className="size-4 text-stone-500" />
                  {p.name}
                </span>
                <span
                  className={`text-[10px] uppercase rounded px-1.5 py-0.5 ${
                    p.on
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-stone-100 text-stone-500"
                  }`}
                >
                  {p.on ? "On" : "Off"}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-lg border border-stone-200/70 bg-white p-4 space-y-2">
        <div className="text-[14px] font-medium tracking-tight">
          Session settings
        </div>
        <div className="grid grid-cols-3 gap-3 text-[12px]">
          <div>
            <div className="text-stone-500">Session length</div>
            <div className="font-mono">7 days</div>
          </div>
          <div>
            <div className="text-stone-500">Refresh window</div>
            <div className="font-mono">14 days</div>
          </div>
          <div>
            <div className="text-stone-500">JWT expiry</div>
            <div className="font-mono">3600s</div>
          </div>
        </div>
      </section>
    </div>
  );
}
