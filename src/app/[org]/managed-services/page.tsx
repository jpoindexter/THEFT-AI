import {
  Card,
  CardBody,
  Eyebrow,
  Hint,
  PageTitle,
  Pill,
  SectionTitle,
} from "@/components/ui/primitives";
import { ShieldCheck, Cpu, Database, Mail, Globe } from "lucide-react";

const SERVICES = [
  {
    name: "Vercel",
    Icon: Globe,
    role: "Hosting + preview deployments",
    state: "active" as const,
    note: "Auto-provisioned. Branch previews on every PR.",
  },
  {
    name: "Supabase",
    Icon: Database,
    role: "Postgres, Auth, Storage, Realtime",
    state: "active" as const,
    note: "Local Supabase available for engineer sandbox testing.",
  },
  {
    name: "Postmark",
    Icon: Mail,
    role: "Inbound + transactional email",
    state: "active" as const,
    note: "Sender domains synced from Settings > Domains.",
  },
  {
    name: "Cloudflare",
    Icon: ShieldCheck,
    role: "DNS + edge",
    state: "managed" as const,
    note: "Managed via Vercel domains.",
  },
  {
    name: "Anthropic",
    Icon: Cpu,
    role: "Model inference",
    state: "managed" as const,
    note: "Per-agent budgets enforced at the gateway.",
  },
];

export default async function ManagedServicesPage() {
  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-5">
        <header>
          <Eyebrow>Workspace</Eyebrow>
          <PageTitle>Managed services</PageTitle>
          <Hint>
            Infrastructure THEFT runs on your behalf. You see configuration,
            never the credentials.
          </Hint>
        </header>

        <Card>
          <CardBody className="space-y-2">
            <SectionTitle>What's included</SectionTitle>
            <ul className="divide-y divide-line/60 -mx-1">
              {SERVICES.map((s) => (
                <ServiceRow key={s.name} s={s} />
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <SectionTitle>Bring your own</SectionTitle>
            <Hint>
              On the team plan you can swap any managed service for your own.
              See <code className="font-mono">Settings &gt; Advanced</code>.
            </Hint>
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
    role: string;
    state: "active" | "managed";
    note: string;
  };
}) {
  const Icon = s.Icon;
  return (
    <li className="px-1 py-2.5 flex items-start gap-3">
      <span className="size-7 rounded-md bg-cream inline-flex items-center justify-center text-ink-muted shrink-0">
        <Icon className="size-3.5" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-base font-medium tracking-tight">{s.name}</div>
        <div className="text-xs text-ink-muted">{s.role}</div>
        <div className="text-xs text-ink-soft mt-0.5">{s.note}</div>
      </div>
      <Pill tone={s.state === "active" ? "sage" : "neutral"}>{s.state}</Pill>
    </li>
  );
}
