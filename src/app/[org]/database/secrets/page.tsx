import { KeyRound, Plus, EyeOff } from "lucide-react";
import {
  Card,
  Hint,
  PageTitle,
  Pill,
  ButtonPrimary,
} from "@/components/ui/primitives";

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
          <PageTitle className="text-md font-medium inline-flex items-center gap-2">
            <KeyRound className="size-4 text-ink-muted" /> Secrets
          </PageTitle>
          <Hint>
            Encrypted values surfaced to runtime via environment variables.
            Agents read but never echo them.
          </Hint>
        </div>
        <ButtonPrimary className="inline-flex items-center gap-1">
          <Plus className="size-3.5" /> Add secret
        </ButtonPrimary>
      </header>

      <Card>
        <ul className="divide-y divide-line/60">
          {SECRETS.map((s, i) => (
            <li
              key={i}
              className="px-4 py-2.5 flex items-center justify-between text-sm"
            >
              <code className="font-mono text-ink">{s.key}</code>
              <div className="flex items-center gap-3">
                <Pill>{s.env}</Pill>
                <code className="font-mono text-ink-muted">{s.masked}</code>
                <EyeOff className="size-3 text-ink-soft" />
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Hint>
        Secret access goes through a request-time gate. If the agent tries to
        log a secret, the call fails with a redacted error. See{" "}
        <code className="font-mono">Settings &gt; Env Files & Secrets</code>.
      </Hint>
    </div>
  );
}
