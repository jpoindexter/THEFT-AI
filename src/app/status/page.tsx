import {
  Card,
  CardBody,
  Eyebrow,
  Hint,
  PageTitle,
  Pill,
} from "@/components/ui/primitives";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import Link from "next/link";

type State = "ok" | "degraded" | "outage";

type Component = {
  name: string;
  state: State;
  detail: string;
};

const COMPONENTS: Component[] = [
  { name: "Workspace app", state: "ok", detail: "p99 132ms · 0 errors / 5m" },
  { name: "Agent runtime (SDK)", state: "ok", detail: "p99 940ms · queue depth 2" },
  { name: "Agent runtime (Claude CLI)", state: "ok", detail: "OAuth subprocess healthy" },
  { name: "Anthropic Gateway", state: "ok", detail: "All providers reachable" },
  { name: "Supabase Postgres", state: "ok", detail: "Read/write OK · replication lag <100ms" },
  { name: "Vercel deploys", state: "ok", detail: "Last deploy 12m ago" },
  { name: "Postmark inbound", state: "degraded", detail: "Webhook 503s in last 4m" },
  { name: "Search index", state: "ok", detail: "Crawl current as of 1m ago" },
];

const INCIDENTS = [
  {
    title: "Inbound parsing webhook degraded",
    started: "2026-05-06 12:34 UTC",
    body:
      "Postmark inbound webhook returning intermittent 503s. Inbound emails to *@theft.ai may be delayed up to 5 minutes. Investigating with Postmark.",
    state: "investigating" as const,
  },
];

const TONE: Record<State, "sage" | "mustard" | "brick"> = {
  ok: "sage",
  degraded: "mustard",
  outage: "brick",
};

export default function StatusPage() {
  const overall =
    COMPONENTS.find((c) => c.state === "outage")
      ? "outage"
      : COMPONENTS.find((c) => c.state === "degraded")
        ? "degraded"
        : "ok";

  return (
    <div className="min-h-screen bg-cream text-ink">
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-10 space-y-5">
        <Banner state={overall} />
        <Card>
          <CardBody>
            <Eyebrow>Components</Eyebrow>
            <ul className="divide-y divide-line/60 mt-2">
              {COMPONENTS.map((c) => (
                <ComponentRow key={c.name} c={c} />
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Eyebrow>Active incidents ({INCIDENTS.length})</Eyebrow>
            {INCIDENTS.length === 0 ? (
              <Hint>No active incidents.</Hint>
            ) : (
              <ul className="space-y-2 mt-2">
                {INCIDENTS.map((i) => (
                  <li
                    key={i.title}
                    className="rounded-md border border-mustard/40 bg-mustard/15 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="size-3 text-mustard-ink" />
                      <span className="text-sm font-medium tracking-tight text-mustard-ink">
                        {i.title}
                      </span>
                      <Pill tone="mustard">{i.state}</Pill>
                    </div>
                    <div className="text-xs text-mustard-ink/80 mt-1 font-mono">
                      started {i.started}
                    </div>
                    <p className="text-sm text-ink mt-1">{i.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <p className="text-2xs text-ink-soft text-center">
          Public status. Subscribe to{" "}
          <a className="underline" href="mailto:status@theft.ai">
            status@theft.ai
          </a>{" "}
          for incident notifications.
        </p>
      </main>
    </div>
  );
}

function Header() {
  return (
    <div className="border-b border-line/70 bg-paper">
      <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between text-sm">
        <Link href="/" className="inline-flex items-center gap-2 tracking-tight">
          <span className="size-3 rounded-sm bg-mustard" /> THEFT
        </Link>
        <span className="text-xs text-ink-muted">status.theft.ai</span>
      </div>
    </div>
  );
}

function Banner({ state }: { state: State }) {
  if (state === "ok") {
    return (
      <Card className="bg-sage/15 border-sage/40">
        <CardBody className="flex items-center gap-3">
          <CheckCircle2 className="size-5 text-sage-ink" />
          <div>
            <PageTitle className="text-md text-sage-ink">
              All systems operational
            </PageTitle>
            <Hint className="text-sage-ink/80">
              Updated {new Date().toLocaleTimeString()}
            </Hint>
          </div>
        </CardBody>
      </Card>
    );
  }
  if (state === "degraded") {
    return (
      <Card className="bg-mustard/15 border-mustard/40">
        <CardBody className="flex items-center gap-3">
          <AlertTriangle className="size-5 text-mustard-ink" />
          <div>
            <PageTitle className="text-md text-mustard-ink">
              Some components degraded
            </PageTitle>
            <Hint className="text-mustard-ink/80">
              Investigating; updates below.
            </Hint>
          </div>
        </CardBody>
      </Card>
    );
  }
  return (
    <Card className="bg-brick/10 border-brick/40">
      <CardBody className="flex items-center gap-3">
        <XCircle className="size-5 text-brick-ink" />
        <div>
          <PageTitle className="text-md text-brick-ink">
            Major outage
          </PageTitle>
          <Hint className="text-brick-ink/80">
            We're working on it.
          </Hint>
        </div>
      </CardBody>
    </Card>
  );
}

function ComponentRow({ c }: { c: Component }) {
  const Icon =
    c.state === "ok"
      ? CheckCircle2
      : c.state === "degraded"
        ? AlertTriangle
        : XCircle;
  const iconClass =
    c.state === "ok"
      ? "text-sage-ink"
      : c.state === "degraded"
        ? "text-mustard-ink"
        : "text-brick-ink";
  return (
    <li className="py-2 flex items-start gap-3 text-sm">
      <Icon className={`size-4 mt-0.5 shrink-0 ${iconClass}`} />
      <div className="flex-1 min-w-0">
        <div className="text-ink">{c.name}</div>
        <div className="text-xs text-ink-muted">{c.detail}</div>
      </div>
      <Pill tone={TONE[c.state]}>{c.state}</Pill>
    </li>
  );
}
