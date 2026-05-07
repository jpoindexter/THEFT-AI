import { SectionHeader, SettingsCard } from "@/components/settings/section";
import { GitBranch, AlertTriangle, Database } from "lucide-react";
import Link from "next/link";

export default async function Advanced({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  return (
    <>
      <SectionHeader
        title="Advanced"
        description="Manage repository import, Supabase import, and advanced workspace configuration."
      />

      <SettingsCard>
        <div className="rounded-md border border-line/70 px-3 py-3 flex items-center justify-between gap-3">
          <div className="flex items-start gap-2 text-[13px]">
            <Database className="size-4 mt-0.5 text-ink-muted" />
            <div>
              <div className="font-medium">Bring your own Supabase</div>
              <p className="text-[11px] text-ink-muted">
                Import an existing Supabase project and map its production and staging database branches.
              </p>
              <p className="text-[11px] text-ink-soft mt-1">
                Use this when the workspace should run against a Supabase project you already own. After import, the Engineering canvas database editor points at the selected production project.
              </p>
            </div>
          </div>
          <Link
            href={`/${org}/settings/advanced/import-supabase`}
            className="text-[12px] rounded-md border border-line px-2 py-1 hover:border-line-strong inline-flex items-center gap-1 whitespace-nowrap"
          >
            <Database className="size-3" />
            Import your own Supabase
          </Link>
        </div>
      </SettingsCard>

      <SettingsCard>
        <div className="rounded-md border border-line/70 px-3 py-3 flex items-center justify-between gap-3">
          <div className="flex items-start gap-2 text-[13px]">
            <GitBranch className="size-4 mt-0.5 text-ink-muted" />
            <div>
              <div className="font-medium">Manage your own repo</div>
              <p className="text-[11px] text-ink-muted">
                Switch the workspace from the managed repository to a GitHub repository you own.
              </p>
              <div className="inline-flex items-center gap-1 mt-2 text-[11px] text-brick-ink">
                <AlertTriangle className="size-3" />
                Destructive action
              </div>
              <p className="text-[10px] text-ink-soft">
                This switches the managed Vercel project to a repo you already own. Future deploys and agent work will use that repo.
              </p>
            </div>
          </div>
          <Link
            href={`/${org}/settings/advanced/import-repo`}
            className="text-[12px] rounded-md border border-line px-2 py-1 hover:border-line-strong inline-flex items-center gap-1 whitespace-nowrap"
          >
            <GitBranch className="size-3" />
            Open guided import
          </Link>
        </div>
      </SettingsCard>
    </>
  );
}
