import { Inbox, Settings } from "lucide-react";
import Link from "next/link";

const AGENTS = [
  {
    slug: "marketing",
    name: "Marketing Agent",
    address: "marketing@theft.ai",
    domain: "theft.ai",
    enabled: true,
    last_message: "RE: launch broadcast feedback",
    when: "12m ago",
  },
  {
    slug: "sales",
    name: "Sales Agent",
    address: "sales@theft.ai",
    domain: "theft.ai",
    enabled: true,
    last_message: "demo request — Encompass loan team",
    when: "1h ago",
  },
  {
    slug: "support",
    name: "Support Agent",
    address: "support@theft.ai",
    domain: "theft.ai",
    enabled: false,
    last_message: "—",
    when: "—",
  },
];

export default async function InboxPage({
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
            <h1 className="text-xl tracking-tight inline-flex items-center gap-2">
              <Inbox className="size-5 text-stone-500" /> Inbox
            </h1>
            <p className="text-[12px] text-stone-500">
              Per-agent email addresses. Inbound messages route to the agent
              and become tasks.
            </p>
          </div>
          <Link
            href={`/${org}/settings/inbox`}
            className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-1 text-[12px] hover:border-stone-400"
          >
            <Settings className="size-3" /> Settings
          </Link>
        </header>

        <ul className="rounded-lg border border-stone-200/70 bg-white divide-y divide-stone-100">
          {AGENTS.map((a) => (
            <li key={a.slug}>
              <Link
                href={
                  a.enabled
                    ? `/${org}/inbox/${a.slug}`
                    : `/${org}/settings/inbox`
                }
                className="px-4 py-3 flex items-center justify-between hover:bg-stone-50"
              >
                <div className="min-w-0">
                  <div className="text-[13px] font-medium">{a.name}</div>
                  <div className="text-[11px] font-mono text-stone-500">
                    {a.address}
                  </div>
                  <div className="text-[12px] text-stone-700 mt-1 truncate">
                    {a.last_message}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-stone-400">{a.when}</span>
                  <span
                    className={`text-[10px] uppercase rounded px-1.5 py-0.5 ${
                      a.enabled
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {a.enabled ? "Active" : "Off"}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
