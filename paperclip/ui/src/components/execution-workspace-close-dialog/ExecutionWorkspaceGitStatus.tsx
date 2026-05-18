import type { ReactNode } from "react";
import type { ExecutionWorkspaceCloseGitReadiness } from "@paperclipai/shared";

interface ExecutionWorkspaceGitStatusProps {
  git: ExecutionWorkspaceCloseGitReadiness;
}

function GitField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

export function ExecutionWorkspaceGitStatus({ git }: ExecutionWorkspaceGitStatusProps) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-medium">Git status</h3>
      <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm">
        <div className="grid gap-2 sm:grid-cols-2">
          <GitField label="Branch">
            <div className="font-mono text-xs">{git.branchName ?? "Unknown"}</div>
          </GitField>
          <GitField label="Base ref">
            <div className="font-mono text-xs">{git.baseRef ?? "Not set"}</div>
          </GitField>
          <GitField label="Merged into base">
            <div>{git.isMergedIntoBase == null ? "Unknown" : git.isMergedIntoBase ? "Yes" : "No"}</div>
          </GitField>
          <GitField label="Ahead / behind">
            <div>
              {(git.aheadCount ?? 0).toString()} / {(git.behindCount ?? 0).toString()}
            </div>
          </GitField>
          <GitField label="Dirty tracked files">
            <div>{git.dirtyEntryCount}</div>
          </GitField>
          <GitField label="Untracked files">
            <div>{git.untrackedEntryCount}</div>
          </GitField>
        </div>
      </div>
    </section>
  );
}
