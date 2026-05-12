import {
  Card,
  CardBody,
  Eyebrow,
  Hint,
  PageTitle,
  Pill,
} from "@/components/ui/primitives";
import {
  Stethoscope,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
} from "lucide-react";

type Status = "ok" | "warn" | "fail";

type Check = {
  group: string;
  label: string;
  status: Status;
  detail: string;
};

const CHECKS: Check[] = [
  {
    group: "Auth",
    label: "Anthropic API key reachable",
    status: "ok",
    detail: "200 in 142ms",
  },
  {
    group: "Auth",
    label: "Claude CLI fallback available",
    status: "ok",
    detail: "OAuth subprocess responding",
  },
  {
    group: "Database",
    label: "Schema in sync with migrations",
    status: "warn",
    detail: "1 pending migration: 0014_add_subscriptions",
  },
  {
    group: "Database",
    label: "Row-level security policies",
    status: "ok",
    detail: "All public tables have RLS enabled",
  },
  {
    group: "Hosting",
    label: "Vercel project resolves",
    status: "ok",
    detail: "Last deploy 12m ago",
  },
  {
    group: "Hosting",
    label: "app.theft.ai DNS propagation",
    status: "warn",
    detail: "CNAME not visible from 2/3 resolvers",
  },
  {
    group: "Email",
    label: "Postmark sender domain verified",
    status: "ok",
    detail: "DKIM + Return-Path green",
  },
  {
    group: "Email",
    label: "Inbound parsing webhook reachable",
    status: "fail",
    detail: "503 from inbound.postmarkapp.com (last 4m)",
  },
  {
    group: "Agent runtime",
    label: "Tool registry loaded",
    status: "ok",
    detail: "27 tools across 6 integrations",
  },
  {
    group: "Agent runtime",
    label: "Daily token budget",
    status: "ok",
    detail: "$28.40 of $30 today",
  },
];

const TONE: Record<Status, "sage" | "mustard" | "brick"> = {
  ok: "sage",
  warn: "mustard",
  fail: "brick",
};

export default async function DiagnosticsPage() {
  const groups = Array.from(new Set(CHECKS.map((c) => c.group)));
  const failing = CHECKS.filter((c) => c.status === "fail").length;
  const warning = CHECKS.filter((c) => c.status === "warn").length;
  const total = CHECKS.length;

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <header className="flex items-start justify-between gap-3">
          <div>
            <Eyebrow>Workspace</Eyebrow>
            <PageTitle className="inline-flex items-center gap-2">
              <Stethoscope className="size-5 text-ink-muted" /> Diagnostics
            </PageTitle>
            <Hint>
              Pre-flight check across auth, database, hosting, email, and the
              agent runtime. Run this when something feels wrong before paging
              the Engineer agent.
            </Hint>
          </div>
          <button className="text-xs inline-flex items-center gap-1 rounded-md bg-ink text-paper px-3 py-1.5 hover:opacity-90">
            <Activity className="size-3" /> Re-run checks
          </button>
        </header>

        <div className="grid grid-cols-3 gap-3">
          <Score label="Total" value={total} tone="neutral" />
          <Score
            label="Warning"
            value={warning}
            tone={warning > 0 ? "mustard" : "neutral"}
          />
          <Score
            label="Failing"
            value={failing}
            tone={failing > 0 ? "brick" : "sage"}
          />
        </div>

        {groups.map((g) => (
          <Card key={g}>
            <CardBody>
              <Eyebrow>{g}</Eyebrow>
              <ul className="divide-y divide-line/60 mt-2">
                {CHECKS.filter((c) => c.group === g).map((c, i) => (
                  <CheckRow key={i} c={c} />
                ))}
              </ul>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Score({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "sage" | "mustard" | "brick";
}) {
  return (
    <Card>
      <CardBody className="!p-3">
        <Eyebrow>{label}</Eyebrow>
        <div className="flex items-center justify-between mt-1">
          <span className="text-2xl tracking-tight font-medium">{value}</span>
          <Pill tone={tone}>{tone}</Pill>
        </div>
      </CardBody>
    </Card>
  );
}

function CheckRow({ c }: { c: Check }) {
  const Icon =
    c.status === "ok"
      ? CheckCircle2
      : c.status === "warn"
        ? AlertTriangle
        : XCircle;
  const iconClass =
    c.status === "ok"
      ? "text-sage-ink"
      : c.status === "warn"
        ? "text-mustard-ink"
        : "text-brick-ink";
  return (
    <li className="py-2 flex items-start gap-3 text-sm">
      <Icon className={`size-4 mt-0.5 shrink-0 ${iconClass}`} />
      <div className="flex-1 min-w-0">
        <div className="text-ink">{c.label}</div>
        <div className="text-xs text-ink-muted">{c.detail}</div>
      </div>
      <Pill tone={TONE[c.status]}>{c.status}</Pill>
    </li>
  );
}
