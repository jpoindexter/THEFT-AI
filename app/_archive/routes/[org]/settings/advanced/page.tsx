"use client";

import { use, useState } from "react";
import { SectionHeader, SettingsCard } from "@/components/settings/section";
import { GitBranch, AlertTriangle, Database, X, CheckCircle2 } from "lucide-react";

const REPO_STEPS = [
  "GitHub Access",
  "Repository",
  "Link Repo to Vercel",
  "Root Folder",
  "Supabase Environment Variables",
  "Environment Variables",
  "Migrations",
  "Agent",
  "Review",
  "Complete",
];

export default function Advanced({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  use(params);
  const [repoDialogOpen, setRepoDialogOpen] = useState(false);

  return (
    <>
      <SectionHeader
        title="Advanced"
        description="Manage repository import, Supabase import, and advanced workspace configuration."
      />

      <SettingsCard>
        <div className="rounded-md border border-line/70 px-3 py-3 flex items-center justify-between gap-3">
          <div className="flex items-start gap-2 text-base">
            <Database className="size-4 mt-0.5 text-ink-muted shrink-0" />
            <div>
              <div className="font-medium">Bring your own Supabase</div>
              <p className="text-xs text-ink-muted">
                Import an existing Supabase project and map its production and staging database branches.
              </p>
              <p className="text-xs text-ink-soft mt-1">
                Use this when the workspace should run against a Supabase project you already own. After import, the Engineering canvas database editor points at the selected production project.
              </p>
            </div>
          </div>
          <button className="text-sm rounded-md border border-line px-2 py-1 hover:border-line-strong inline-flex items-center gap-1 whitespace-nowrap shrink-0">
            <Database className="size-3" />
            Import your own Supabase
          </button>
        </div>
      </SettingsCard>

      <SettingsCard>
        <div className="rounded-md border border-line/70 px-3 py-3 flex items-center justify-between gap-3">
          <div className="flex items-start gap-2 text-base">
            <GitBranch className="size-4 mt-0.5 text-ink-muted shrink-0" />
            <div>
              <div className="font-medium">Manage your own repo</div>
              <p className="text-xs text-ink-muted">
                Switch the workspace from the managed repository to a GitHub repository you own.
              </p>
              <div className="inline-flex items-center gap-1 mt-2 text-xs text-brick-ink">
                <AlertTriangle className="size-3" />
                Destructive action
              </div>
              <p className="text-2xs text-ink-soft">
                This switches the managed Vercel project to a repo you already own. Future deploys and agent work will use that repo.
              </p>
            </div>
          </div>
          <button
            onClick={() => setRepoDialogOpen(true)}
            className="text-sm rounded-md border border-line px-2 py-1 hover:border-line-strong inline-flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <GitBranch className="size-3" />
            Open guided import
          </button>
        </div>
      </SettingsCard>

      {repoDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/30" onClick={() => setRepoDialogOpen(false)} />
          <div className="relative w-full max-w-lg rounded-xl bg-paper border border-line/70 shadow-xl p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-base font-medium text-ink">Bring Your Own Repository</div>
                <p className="text-xs text-ink-muted mt-0.5">
                  Pick a repo and we&apos;ll connect the managed Vercel project to it after you confirm.
                </p>
              </div>
              <button
                onClick={() => setRepoDialogOpen(false)}
                className="text-ink-soft hover:text-ink ml-4 shrink-0"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1">
              {REPO_STEPS.map((step, i) => (
                <span
                  key={step}
                  className={`text-2xs px-2 py-0.5 rounded-md border ${
                    i === 0
                      ? "border-ink bg-ink text-paper"
                      : "border-line/70 text-ink-muted"
                  }`}
                >
                  {i + 1}. {step}
                </span>
              ))}
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-ink">Give Operator access to repositories</div>
              <p className="text-xs text-ink-muted">
                Choose which public or private repositories Operator can access in GitHub, then pick the imported repo here.
              </p>
              <div className="flex items-center gap-2 py-0.5">
                <CheckCircle2 className="size-4 text-green-600 shrink-0" />
                <span className="text-sm text-ink">Operator has GitHub access</span>
              </div>
              <div className="rounded-md border border-line/70 px-3 py-2 text-sm text-ink-muted">
                No repositories are selected for this installation yet.
              </div>
              <p className="text-xs text-ink-muted">
                Update repository access in GitHub if the repo you need is missing.
              </p>
              <button className="text-sm rounded-md border border-line px-3 py-1.5 hover:border-line-strong">
                Add repositories in GitHub
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-line/70">
              <button
                onClick={() => setRepoDialogOpen(false)}
                className="text-sm rounded-md border border-line px-3 py-1.5 hover:border-line-strong"
              >
                Cancel
              </button>
              <button className="text-sm rounded-md bg-ink text-paper px-3 py-1.5 hover:opacity-90">
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
