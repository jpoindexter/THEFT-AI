import Link from "next/link";
import {
  Card,
  CardBody,
  Eyebrow,
  Hint,
  PageTitle,
  Pill,
} from "@/components/ui/primitives";
import {
  BookOpen,
  MessageCircle,
  Keyboard,
  LifeBuoy,
  ArrowRight,
} from "lucide-react";

const TOPICS = [
  {
    title: "Onboarding & first task",
    body: "How the agent interview works, what counts as a good business plan, and the first 24h.",
    keys: ["onboarding"],
  },
  {
    title: "Plan vs Execute",
    body: "When to ask for a plan first, when to let the agent run.",
    keys: ["plan", "review"],
  },
  {
    title: "Domains & email",
    body: "Connect a domain, route inbound to per-agent inboxes, send via Postmark.",
    keys: ["domains", "inbox"],
  },
  {
    title: "Bring your own repo",
    body: "Switch from the managed scaffold to a GitHub repo you already own.",
    keys: ["advanced", "github"],
  },
  {
    title: "Costs & budgets",
    body: "Per-agent caps, hard-stop behavior, what counts toward token spend.",
    keys: ["costs"],
  },
];

export default async function HelpPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-5">
        <header>
          <Eyebrow>Workspace</Eyebrow>
          <PageTitle className="inline-flex items-center gap-2">
            <LifeBuoy className="size-5 text-ink-muted" /> Help
          </PageTitle>
          <Hint>
            Common questions, keyboard shortcuts, and how to reach a human if
            you get stuck.
          </Hint>
        </header>

        <div className="grid grid-cols-2 gap-3">
          <QuickCard
            href={`/${org}/settings/support`}
            Icon={MessageCircle}
            title="Open a support ticket"
            body="Reply usually inside 4 working hours."
          />
          <QuickCard
            href={`/${org}/diagnostics`}
            Icon={BookOpen}
            title="Run diagnostics"
            body="Pre-flight check across auth, DB, hosting, email."
          />
        </div>

        <Card>
          <CardBody>
            <Eyebrow>Topics</Eyebrow>
            <ul className="divide-y divide-line/60 mt-2">
              {TOPICS.map((t) => (
                <li
                  key={t.title}
                  className="py-2 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-base font-medium tracking-tight">
                      {t.title}
                    </div>
                    <div className="text-xs text-ink-muted">{t.body}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 shrink-0">
                    {t.keys.map((k) => (
                      <Pill key={k}>{k}</Pill>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Eyebrow className="inline-flex items-center gap-1">
              <Keyboard className="size-3" /> Shortcuts
            </Eyebrow>
            <ul className="space-y-1 mt-2 text-sm">
              <Sc keys={["⌘", "K"]} label="Open command palette" />
              <Sc keys={["⌘", "."]} label="Review queue" />
              <Sc keys={["⌘", "/"]} label="Keyboard shortcuts dialog" />
              <Sc keys={["G", "T"]} label="Go to tasks" />
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center justify-between">
            <div>
              <div className="text-base font-medium tracking-tight">
                Still stuck?
              </div>
              <Hint>
                We answer DMs in #support on Discord (link in workspace menu).
              </Hint>
            </div>
            <Link
              href={`/${org}/settings/support`}
              className="text-xs inline-flex items-center gap-1 rounded-md bg-ink text-paper px-3 py-1.5 hover:opacity-90"
            >
              Open ticket <ArrowRight className="size-3" />
            </Link>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function QuickCard({
  href,
  Icon,
  title,
  body,
}: {
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-line/70 bg-paper p-4 hover:border-line-strong"
    >
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-ink-muted" />
        <div className="text-base font-medium tracking-tight">{title}</div>
      </div>
      <Hint className="mt-1">{body}</Hint>
    </Link>
  );
}

function Sc({ keys, label }: { keys: string[]; label: string }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-ink">{label}</span>
      <span className="flex items-center gap-1">
        {keys.map((k) => (
          <kbd
            key={k}
            className="rounded border border-line bg-canvas px-1.5 py-0.5 text-2xs font-mono text-ink min-w-[20px] text-center"
          >
            {k}
          </kbd>
        ))}
      </span>
    </li>
  );
}
