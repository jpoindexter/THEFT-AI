import Link from "next/link";
import {
  SectionHeader,
  SettingsCard,
} from "@/components/settings/section";
import { Pill } from "@/components/ui/primitives";
import { db } from "@/lib/db/store";
import { Crown, ExternalLink } from "lucide-react";

export default async function AccountWorkspacesPage() {
  const orgs = await db.listOrgs();
  return (
    <>
      <SectionHeader
        title="Workspaces"
        description="Every workspace your account belongs to, across orgs you own and orgs you've joined."
      />

      <SettingsCard>
        <ul className="divide-y divide-line/60">
          {orgs.map((o, i) => (
            <li
              key={o.id}
              className="py-3 flex items-center justify-between gap-3"
            >
              <span className="inline-flex items-center gap-2 min-w-0">
                <span className="size-8 rounded-md bg-cream inline-flex items-center justify-center text-2xs font-medium text-ink-muted shrink-0">
                  {o.name[0].toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="inline-flex items-center gap-1 text-sm font-medium tracking-tight">
                    {o.name}
                    {i === 0 && (
                      <Crown
                        className="size-3 text-mustard-ink"
                        aria-label="You own this"
                      />
                    )}
                  </span>
                  <div className="text-2xs text-ink-soft font-mono truncate">
                    {o.slug}
                  </div>
                </span>
              </span>
              <span className="inline-flex items-center gap-2 shrink-0">
                <Pill tone={i === 0 ? "mustard" : "neutral"}>
                  {i === 0 ? "Owner" : "Editor"}
                </Pill>
                <Link
                  href={`/${o.slug}`}
                  className="inline-flex items-center gap-1 text-2xs rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
                >
                  Open <ExternalLink className="size-3" />
                </Link>
              </span>
            </li>
          ))}
          {orgs.length === 0 && (
            <li className="py-6 text-sm text-ink-muted text-center">
              You aren&apos;t in any workspaces yet.{" "}
              <Link
                href="/onboarding"
                className="underline hover:text-ink"
              >
                Create one
              </Link>
              .
            </li>
          )}
        </ul>
      </SettingsCard>

      <SettingsCard
        title="Pending invitations"
        description="Workspace invitations waiting on your acceptance."
      >
        <p className="text-xs text-ink-muted">No pending invitations.</p>
      </SettingsCard>
    </>
  );
}
