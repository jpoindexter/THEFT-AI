import { Card, CardBody, Eyebrow, Hint, PageTitle, Pill } from "@/components/ui/primitives";
import { Activity } from "lucide-react";

type Tone = "sage" | "mustard" | "brick" | "neutral";
type Row = { when: string; actor: string; action: string; target: string; tone: Tone };

const ROWS: Row[] = [
  { when: "now", actor: "jason@theft.studio", action: "impersonate", target: "encompass-design / kim@", tone: "mustard" },
  { when: "2m", actor: "system", action: "deploy", target: "patch-2026.05.06.1", tone: "sage" },
  { when: "12m", actor: "ana@partner.io", action: "create-workspace", target: "ana-co", tone: "neutral" },
  { when: "1h", actor: "system", action: "rotate", target: "anthropic API key", tone: "sage" },
  { when: "3h", actor: "ops@example.io", action: "suspend-user", target: "spam-bot-9001", tone: "brick" },
];

export default function AdminActivityPage() {
  return (
    <div className="space-y-5">
      <header>
        <Eyebrow>Internal</Eyebrow>
        <PageTitle className="inline-flex items-center gap-2">
          <Activity className="size-5 text-ink-muted" /> Activity
        </PageTitle>
        <Hint>
          Append-only audit log of admin actions across the instance.
        </Hint>
      </header>

      <Card>
        <CardBody className="p-0">
          <ul className="divide-y divide-line/60">
            {ROWS.map((r, i) => (
              <li key={i} className="grid grid-cols-12 items-center px-4 py-2.5 text-sm">
                <div className="col-span-1 text-2xs text-ink-soft">{r.when}</div>
                <div className="col-span-3 font-mono text-xs truncate">{r.actor}</div>
                <div className="col-span-2">
                  <Pill tone={r.tone}>{r.action}</Pill>
                </div>
                <div className="col-span-6 text-xs text-ink-muted truncate">
                  {r.target}
                </div>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
