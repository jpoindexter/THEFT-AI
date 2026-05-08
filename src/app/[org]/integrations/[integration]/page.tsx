import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Tool = { name: string; description: string };

const INTEGRATIONS: Record<
  string,
  {
    name: string;
    desc: string;
    color: string;
    letter: string;
    triggers: Tool[];
    actions: Tool[];
  }
> = {
  linear: {
    name: "Linear",
    desc: "Manage Linear issues and projects",
    color: "#5E6AD2",
    letter: "L",
    triggers: [
      { name: "Issue Created", description: "New issues in Linear" },
      { name: "Issue Updated", description: "Issues updated in Linear" },
      { name: "Issue Deleted", description: "Issues deleted in Linear" },
      { name: "Issue Commented", description: "Issues commented in Linear" },
      { name: "Project Updates", description: "Project updates in Linear" },
    ],
    actions: [
      { name: "Create Linear Comment", description: "Adds a comment to an existing Linear issue." },
      { name: "Create Linear Issue", description: "Creates a new Linear issue." },
      { name: "List Linear Labels", description: "Lists all available labels in the Linear workspace. Can be filtered by team." },
      { name: "List Linear Projects", description: "Retrieves a list of all projects within the Linear workspace." },
      { name: "List Linear Project Milestones", description: "Retrieves a list of all milestones for a specific project within the Linear workspace." },
      { name: "List Linear Teams", description: "Retrieves a list of all teams within the Linear workspace." },
      { name: "List Linear Users", description: "Retrieves a list of all users within the Linear organization." },
      { name: "List Linear Workflow States", description: "Retrieves a list of all workflow statuses available in Linear, optionally filtered by team." },
      { name: "Search Linear Issues", description: "Searches for issues in Linear across all teams with support for filtering by assignee, state, priority, labels, project, and due dates. Automatically excludes Done, Canceled, and Duplicate issues" },
      { name: "Update Linear Issue", description: "Updates an existing Linear issue with new information such as assignee, title, description, or state." },
      { name: "Update Linear Project", description: "Updates an existing project within the Linear workspace." },
    ],
  },
  postiz: {
    name: "Postiz",
    desc: "Manage social media posts and channels",
    color: "#8B5CF6",
    letter: "P",
    triggers: [
      { name: "Post Published", description: "When a scheduled post goes live" },
      { name: "Post Failed", description: "When a post fails to publish" },
    ],
    actions: [
      { name: "Create Post", description: "Schedule a post across connected channels." },
      { name: "List Channels", description: "List all connected social channels." },
      { name: "Get Post Status", description: "Check the publish status of a scheduled post." },
    ],
  },
  ramp: {
    name: "Ramp",
    desc: "View Ramp cards, transactions, and business details",
    color: "#16A34A",
    letter: "R",
    triggers: [
      { name: "Transaction Created", description: "New transaction on a Ramp card" },
      { name: "Card Limit Updated", description: "Card spend limit was changed" },
    ],
    actions: [
      { name: "List Transactions", description: "Retrieve recent card transactions." },
      { name: "Get Card Details", description: "Look up details for a specific Ramp card." },
    ],
  },
};

export default async function IntegrationDetailPage({
  params,
}: {
  params: Promise<{ org: string; integration: string }>;
}) {
  const { org, integration } = await params;
  const i = INTEGRATIONS[integration];
  if (!i) notFound();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href={`/${org}/integrations`}
            className="text-ink-muted hover:text-ink"
            aria-label="Back"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div
            className="size-7 rounded-md flex items-center justify-center text-white font-semibold text-xs shrink-0"
            style={{ backgroundColor: i.color }}
          >
            {i.letter}
          </div>
          <h1 className="text-xl tracking-tight">{i.name}</h1>
        </div>
        <button
          type="button"
          className="text-sm rounded-md border border-line bg-paper px-3 py-1.5 hover:border-line-strong"
        >
          Connect
        </button>
      </div>

      <p className="text-sm text-ink-muted">{i.desc}</p>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        </span>
        <input
          placeholder="Search triggers and actions..."
          className="w-full h-9 rounded-md border border-line bg-paper pl-9 pr-3 text-base focus:outline-none focus:border-line-strong"
        />
      </div>

      {i.triggers.length > 0 && (
        <section className="space-y-2">
          <div>
            <h2 className="text-base font-medium">Triggers</h2>
            <p className="text-sm text-ink-muted">
              You can set up Cofounder to run when these events happen.
            </p>
          </div>
          <div className="rounded-lg border border-line/70 bg-paper divide-y divide-line/60">
            {i.triggers.map((t) => (
              <div key={t.name} className="px-4 py-3">
                <div className="text-base font-medium">{t.name}</div>
                <div className="text-sm text-ink-muted">{t.description}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {i.actions.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-base font-medium">Actions</h2>
          <div className="rounded-lg border border-line/70 bg-paper divide-y divide-line/60">
            {i.actions.map((a) => (
              <div key={a.name} className="px-4 py-3">
                <div className="text-base font-medium">{a.name}</div>
                <div className="text-sm text-ink-muted">{a.description}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
