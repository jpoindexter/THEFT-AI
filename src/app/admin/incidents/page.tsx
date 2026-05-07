import { Card, CardBody, Eyebrow, Hint, PageTitle, Pill } from "@/components/ui/primitives";
import { AlertTriangle } from "lucide-react";

type Tone = "sage" | "mustard" | "brick";
type Incident = {
  id: string;
  title: string;
  status: "open" | "monitoring" | "resolved";
  tone: Tone;
  body: string;
  opened: string;
};

const INCIDENTS: Incident[] = [
  {
    id: "INC-2026-0044",
    title: "Postmark inbound flapping",
    status: "open",
    tone: "brick",
    body: "503 rate ~80% on inbound webhook. 4 of 5 in last 5 min failed. Diagnostics is auto-pinging.",
    opened: "12m ago",
  },
  {
    id: "INC-2026-0043",
    title: "Anthropic key rotation",
    status: "monitoring",
    tone: "mustard",
    body: "Rotated cold key. Watching error rate for next 30m.",
    opened: "1h ago",
  },
  {
    id: "INC-2026-0042",
    title: "Stripe webhook signature drift",
    status: "resolved",
    tone: "sage",
    body: "Old endpoint had a stale secret. Updated and replayed 3 missed events.",
    opened: "yesterday",
  },
];

export default function AdminIncidentsPage() {
  return (
    <div className="space-y-5">
      <header>
        <Eyebrow>Internal</Eyebrow>
        <PageTitle className="inline-flex items-center gap-2">
          <AlertTriangle className="size-5 text-ink-muted" /> Incidents
        </PageTitle>
        <Hint>
          Live operational issues. Each gets an INC-ID and a postmortem when
          resolved.
        </Hint>
      </header>

      <ul className="space-y-3">
        {INCIDENTS.map((i) => (
          <li key={i.id}>
            <Card>
              <CardBody>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-2xs uppercase tracking-wider text-ink-soft">
                      {i.id}
                    </div>
                    <div className="text-base font-medium tracking-tight mt-0.5">
                      {i.title}
                    </div>
                    <p className="text-sm text-ink-muted mt-1">{i.body}</p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <Pill tone={i.tone}>{i.status}</Pill>
                    <span className="text-2xs text-ink-soft">{i.opened}</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
