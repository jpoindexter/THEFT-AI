import {
  Card,
  CardBody,
  Eyebrow,
  Hint,
  PageTitle,
  Pill,
} from "@/components/ui/primitives";
import { Sparkles, Cpu, Bell, GitPullRequest } from "lucide-react";

const ENTRIES = [
  {
    date: "2026-05-06",
    Icon: Cpu,
    tone: "sage" as const,
    tag: "Improvement",
    title: "Engineer model bumped to Opus 4.7",
    body: "PRs that touch migrations and auth flows now default to Opus 4.7. Operator stays on Sonnet 4.6.",
  },
  {
    date: "2026-05-05",
    Icon: Sparkles,
    tone: "mustard" as const,
    tag: "New",
    title: "Command palette + ⌘K",
    body: "Press ⌘K anywhere in the workspace to navigate, create, or toggle. Search queries hit the same index as /search.",
  },
  {
    date: "2026-05-04",
    Icon: GitPullRequest,
    tone: "neutral" as const,
    tag: "Polish",
    title: "Publishing PR composer",
    body: "Each publish target now has a dedicated diff page with the changes since prod and a PR draft pre-filled.",
  },
  {
    date: "2026-04-28",
    Icon: Bell,
    tone: "sage" as const,
    tag: "Improvement",
    title: "Per-agent inboxes with routing rules",
    body: "Add foo+billing@yourdomain.com → Finance, foo+legal@ → Legal in Settings → Inbox.",
  },
];

export default async function WhatsNewPage() {
  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <header>
          <Eyebrow>Workspace</Eyebrow>
          <PageTitle className="inline-flex items-center gap-2">
            <Sparkles className="size-5 text-ink-muted" /> What's new
          </PageTitle>
          <Hint>Recent changes the agents and we shipped to your workspace.</Hint>
        </header>

        <ul className="space-y-3">
          {ENTRIES.map((e, i) => (
            <li key={i}>
              <Card>
                <CardBody>
                  <div className="flex items-center gap-2">
                    <span className="size-7 rounded-md bg-cream inline-flex items-center justify-center text-ink-muted">
                      <e.Icon className="size-3.5" />
                    </span>
                    <Pill tone={e.tone}>{e.tag}</Pill>
                    <span className="text-xs text-ink-soft">{e.date}</span>
                  </div>
                  <div className="text-base font-medium tracking-tight mt-2">
                    {e.title}
                  </div>
                  <p className="text-sm text-ink-muted mt-1">{e.body}</p>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
