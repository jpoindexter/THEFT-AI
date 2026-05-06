import { KeyRound, Plus, EyeOff } from "lucide-react";

const SECRETS = [
  { key: "STRIPE_SECRET_KEY", env: "prod", masked: "sk_live_…7c2a" },
  { key: "STRIPE_SECRET_KEY", env: "staging", masked: "sk_test_…0f10" },
  { key: "POSTMARK_API_TOKEN", env: "shared", masked: "pm_…a01b" },
  { key: "ANTHROPIC_API_KEY", env: "shared", masked: "sk-ant-…3344" },
];

export default function SecretsPage() {
  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium tracking-tight inline-flex items-center gap-2">
            <KeyRound className="size-4 text-stone-500" /> Secrets
          </h1>
          <p className="text-[12px] text-stone-500">
            Encrypted values surfaced to runtime via environment variables.
            Agents read but never echo them.
          </p>
        </div>
        <button className="inline-flex items-center gap-1 rounded-md bg-stone-900 text-white px-3 py-1.5 text-[12px]">
          <Plus className="size-3.5" /> Add secret
        </button>
      </header>

      <ul className="rounded-lg border border-stone-200/70 bg-white divide-y divide-stone-100">
        {SECRETS.map((s, i) => (
          <li
            key={i}
            className="px-4 py-2.5 flex items-center justify-between text-[12px]"
          >
            <code className="font-mono text-stone-900">{s.key}</code>
            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase tracking-wider rounded bg-stone-100 text-stone-700 px-1.5 py-0.5">
                {s.env}
              </span>
              <code className="font-mono text-stone-500">{s.masked}</code>
              <EyeOff className="size-3 text-stone-400" />
            </div>
          </li>
        ))}
      </ul>

      <p className="text-[11px] text-stone-500">
        Secret access goes through a request-time gate. If the agent tries to
        log a secret, the call fails with a redacted error. See{" "}
        <code className="font-mono">Settings &gt; Env Files & Secrets</code>.
      </p>
    </div>
  );
}
