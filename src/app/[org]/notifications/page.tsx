import Link from "next/link";
import {
  Card,
  Eyebrow,
  Hint,
  PageTitle,
  Pill,
} from "@/components/ui/primitives";
import { Bell, AtSign, GitPullRequest, AlertCircle } from "lucide-react";

const FEED = [
  {
    id: "n1",
    Icon: GitPullRequest,
    actor: "Engineer",
    body: "opened PR #42 (feat/subscriptions-table)",
    time: "12m",
    href: "publishing",
    unread: true,
  },
  {
    id: "n2",
    Icon: AtSign,
    actor: "Marketing",
    body: "@you on Launch broadcast — May (subject options ready)",
    time: "23m",
    href: "library",
    unread: true,
  },
  {
    id: "n3",
    Icon: AlertCircle,
    actor: "System",
    body: "Domain app.theft.ai still pending DNS propagation",
    time: "1h",
    href: "settings/domains",
    unread: false,
  },
  {
    id: "n4",
    Icon: Bell,
    actor: "Operations",
    body: "Weekly status brief delivered to #standup",
    time: "2h",
    href: "routines",
    unread: false,
  },
];

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <Eyebrow>Activity</Eyebrow>
            <PageTitle className="inline-flex items-center gap-2">
              <Bell className="size-5 text-ink-muted" /> Notifications
            </PageTitle>
            <Hint>
              Mentions, finished agent runs, build status, and items waiting on
              you.
            </Hint>
          </div>
          <button className="text-xs rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong">
            Mark all read
          </button>
        </header>

        <Card>
          <ul className="divide-y divide-line/60">
            {FEED.map((n) => {
              const I = n.Icon;
              return (
                <li key={n.id}>
                  <Link
                    href={`/${org}/${n.href}`}
                    className="px-4 py-3 flex items-start gap-3 hover:bg-canvas"
                  >
                    <span className="size-7 rounded-md bg-cream inline-flex items-center justify-center text-ink-muted shrink-0">
                      <I className="size-3.5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">
                        <span className="font-medium text-ink">
                          {n.actor}
                        </span>{" "}
                        <span className="text-ink-muted">{n.body}</span>
                      </div>
                      <div className="text-xs text-ink-soft mt-0.5">
                        {n.time} ago
                      </div>
                    </div>
                    {n.unread && <Pill tone="mustard">New</Pill>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}
