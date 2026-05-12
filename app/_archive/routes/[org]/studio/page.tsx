import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db/store";
import {
  Card,
  CardBody,
  Eyebrow,
  Hint,
  PageTitle,
  Pill,
} from "@/components/ui/primitives";
import {
  Cpu,
  Activity,
  Database,
  DollarSign,
  Eye,
  Calendar,
  Wrench,
  ArrowRight,
} from "lucide-react";
import StatusDot from "@/components/status-dot";

const ATTENTION_COUNT = 4;
const SPEND_TODAY = 28.4;
const SPEND_LIMIT = 30;
const RUNS_TODAY = 12;
const ACTIVE_ROUTINES = 3;

export default async function StudioPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const organization = await db.getOrgBySlug(org);
  if (!organization) notFound();
  const [agents, tasks, departments] = await Promise.all([
    db.listAgents(organization.id),
    db.listTasks(organization.id),
    db.listDepartments(organization.id),
  ]);

  const running = agents.filter((a) => a.status === "running").length;
  const paused = agents.filter((a) => a.status === "paused").length;
  const open = tasks.filter(
    (t) => t.status !== "done" && t.status !== "cancelled",
  ).length;

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-5">
        <header>
          <Eyebrow>Workspace</Eyebrow>
          <PageTitle>Studio</PageTitle>
          <Hint>
            Founder overview. Everything that moved today, what's waiting on
            you, and where the spend is going.
          </Hint>
        </header>

        <div className="grid grid-cols-4 gap-3">
          <KPI
            label="Review queue"
            value={String(ATTENTION_COUNT)}
            tone="mustard"
            href={`/${org}/review`}
            Icon={Eye}
          />
          <KPI
            label="Running agents"
            value={`${running} / ${agents.length}`}
            tone={running > 0 ? "sage" : "neutral"}
            href={`/${org}/agents`}
            Icon={Cpu}
          />
          <KPI
            label="Open tasks"
            value={String(open)}
            tone={open > 0 ? "neutral" : "sage"}
            href={`/${org}/tasks`}
            Icon={Activity}
          />
          <KPI
            label="Today's spend"
            value={`$${SPEND_TODAY.toFixed(2)}`}
            tone={SPEND_TODAY > SPEND_LIMIT * 0.8 ? "mustard" : "neutral"}
            href={`/${org}/costs`}
            Icon={DollarSign}
            sub={`of $${SPEND_LIMIT}`}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <DepartmentRoster org={org} departments={departments} />
          <AgentRoster org={org} agents={agents} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <SmallStat
            Icon={Calendar}
            label="Active routines"
            value={String(ACTIVE_ROUTINES)}
            href={`/${org}/routines`}
          />
          <SmallStat
            Icon={Database}
            label="Pending migrations"
            value="1"
            href={`/${org}/database/migrations`}
          />
          <SmallStat
            Icon={Wrench}
            label="Runs today"
            value={String(RUNS_TODAY)}
            href={`/${org}/activity`}
          />
        </div>

        <Card>
          <CardBody className="flex items-center justify-between">
            <div>
              <div className="text-base font-medium tracking-tight">
                Diagnostics
              </div>
              <Hint>
                Last full check passed; one webhook still flapping.
              </Hint>
            </div>
            <Link
              href={`/${org}/diagnostics`}
              className="text-xs inline-flex items-center gap-1 rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
            >
              Open <ArrowRight className="size-3" />
            </Link>
          </CardBody>
        </Card>

        {paused > 0 && (
          <Card className="border-mustard/40 bg-mustard/15">
            <CardBody className="flex items-center justify-between">
              <div>
                <div className="text-base font-medium tracking-tight text-mustard-ink">
                  {paused} agent{paused === 1 ? "" : "s"} paused
                </div>
                <Hint className="text-mustard-ink/80">
                  Either waiting on you, or waiting on a missing credential.
                </Hint>
              </div>
              <Link
                href={`/${org}/review`}
                className="text-xs inline-flex items-center gap-1 rounded-md bg-ink text-paper px-3 py-1.5"
              >
                Resolve
              </Link>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}

function KPI({
  label,
  value,
  tone,
  href,
  Icon,
  sub,
}: {
  label: string;
  value: string;
  tone: "sage" | "mustard" | "brick" | "neutral";
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
  sub?: string;
}) {
  return (
    <Link href={href}>
      <Card className="hover:border-line-strong h-full">
        <CardBody className="!p-3 space-y-1">
          <Eyebrow className="inline-flex items-center gap-1">
            <Icon className="size-3" /> {label}
          </Eyebrow>
          <div className="flex items-baseline justify-between">
            <span className="text-xl tracking-tight font-medium">{value}</span>
            <Pill tone={tone}>{tone}</Pill>
          </div>
          {sub && (
            <div className="text-2xs text-ink-soft font-mono">{sub}</div>
          )}
        </CardBody>
      </Card>
    </Link>
  );
}

function SmallStat({
  Icon,
  label,
  value,
  href,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-line/70 bg-paper p-3 hover:border-line-strong flex items-center gap-3"
    >
      <Icon className="size-4 text-ink-muted shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-ink-muted">{label}</div>
        <div className="text-base font-medium tracking-tight">{value}</div>
      </div>
    </Link>
  );
}

function DepartmentRoster({
  org,
  departments,
}: {
  org: string;
  departments: { id: string; slug: string; name: string }[];
}) {
  return (
    <Card>
      <CardBody>
        <Eyebrow>Departments ({departments.length})</Eyebrow>
        <ul className="space-y-1 mt-2">
          {departments.slice(0, 6).map((d) => (
            <li key={d.id}>
              <Link
                href={`/${org}/${d.slug}`}
                className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-canvas text-sm"
              >
                <span>{d.name}</span>
                <ArrowRight className="size-3 text-ink-soft" />
              </Link>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

function AgentRoster({
  org,
  agents,
}: {
  org: string;
  agents: { id: string; slug: string; name: string; status: string; title: string | null; role: string }[];
}) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between">
          <Eyebrow>Agents ({agents.length})</Eyebrow>
          <Link
            href={`/${org}/agents`}
            className="text-xs text-ink-muted hover:text-ink"
          >
            All
          </Link>
        </div>
        <ul className="divide-y divide-line/60 mt-2">
          {agents.slice(0, 6).map((a) => (
            <li key={a.id}>
              <Link
                href={`/${org}/agents/${a.slug ?? a.id}`}
                className="flex items-center gap-3 py-1.5 hover:bg-canvas px-2 -mx-2 rounded-md"
              >
                <StatusDot
                  tone={
                    a.status === "running"
                      ? "sage"
                      : a.status === "paused"
                        ? "mustard"
                        : a.status === "error"
                          ? "brick"
                          : "neutral"
                  }
                  pulsing={a.status === "running"}
                />
                <span className="text-sm flex-1 truncate">{a.name}</span>
                <span className="text-xs text-ink-muted truncate">
                  {a.title ?? a.role}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
