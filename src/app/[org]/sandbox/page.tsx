import {
  Card,
  CardBody,
  Eyebrow,
  Hint,
  PageTitle,
  Pill,
  ButtonPrimary,
  ButtonGhost,
} from "@/components/ui/primitives";
import { Cpu, Database, Globe, Square, Play, RefreshCw } from "lucide-react";

const SERVICES = [
  {
    name: "Local Supabase",
    Icon: Database,
    state: "running" as const,
    note: "Postgres on :54322 · Studio on :54323",
  },
  {
    name: "Dev server",
    Icon: Globe,
    state: "running" as const,
    note: "next dev on :3000 · auto-reload on save",
  },
  {
    name: "Engineer agent",
    Icon: Cpu,
    state: "idle" as const,
    note: "Last test pass: 2m ago · all green",
  },
];

export default async function SandboxPage() {
  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-5">
        <header className="flex items-start justify-between gap-3">
          <div>
            <Eyebrow>Workspace</Eyebrow>
            <PageTitle>Sandbox</PageTitle>
            <Hint>
              The Engineer's local environment. Use it to verify behaviour
              against a fresh Supabase before opening a PR.
            </Hint>
          </div>
          <div className="flex items-center gap-1">
            <ButtonGhost className="inline-flex items-center gap-1 text-xs px-2 py-1">
              <RefreshCw className="size-3" /> Reset DB
            </ButtonGhost>
            <ButtonPrimary className="inline-flex items-center gap-1 text-xs px-2 py-1">
              <Play className="size-3" /> Run smoke test
            </ButtonPrimary>
          </div>
        </header>

        <Card>
          <CardBody>
            <Eyebrow>Services</Eyebrow>
            <ul className="divide-y divide-line/60 mt-2">
              {SERVICES.map((s) => (
                <ServiceRow key={s.name} s={s} />
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Eyebrow>Last run output</Eyebrow>
            <pre className="mt-2 text-2xs font-mono whitespace-pre-wrap leading-relaxed bg-canvas border border-line/70 rounded-md p-3 text-ink max-h-64 overflow-y-auto">
{`▶ supabase start
   ↳ Postgres listening on :54322
   ↳ Auth, Storage, Realtime up
▶ pnpm dev
   ↳ ready in 1.4s
▶ pnpm test --filter app
   ↳ 142 passed, 0 failed (6.3s)
▶ engineer · run smoke ./scripts/smoke.ts
   ↳ signup → checkout → webhook · OK`}
            </pre>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Eyebrow>Stop sandbox</Eyebrow>
            <Hint>
              Frees the local Postgres and dev server. Engineer pauses any
              running task that depended on the sandbox.
            </Hint>
            <button className="mt-2 inline-flex items-center gap-1 text-xs rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong">
              <Square className="size-3" /> Stop everything
            </button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function ServiceRow({
  s,
}: {
  s: {
    name: string;
    Icon: React.ComponentType<{ className?: string }>;
    state: "running" | "idle" | "stopped" | "failed";
    note: string;
  };
}) {
  const Icon = s.Icon;
  const tone =
    s.state === "running"
      ? "sage"
      : s.state === "idle"
        ? "mustard"
        : s.state === "failed"
          ? "brick"
          : "neutral";
  return (
    <li className="py-2 flex items-center gap-3">
      <span className="size-7 rounded-md bg-cream inline-flex items-center justify-center text-ink-muted shrink-0">
        <Icon className="size-3.5" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-base font-medium tracking-tight">{s.name}</div>
        <div className="text-xs text-ink-muted">{s.note}</div>
      </div>
      <Pill tone={tone}>{s.state}</Pill>
    </li>
  );
}
