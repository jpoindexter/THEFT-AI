import type { PluginLocalFolderDeclaration } from "@paperclipai/shared";

import type { PluginLocalFolderStatus } from "@/api/plugins";
import { Badge } from "@/components/ui/badge";

export function FolderRequirements({
  status,
  declaration,
}: {
  status?: PluginLocalFolderStatus;
  declaration: PluginLocalFolderDeclaration;
}) {
  const requiredDirectories = status?.requiredDirectories ?? declaration.requiredDirectories ?? [];
  const requiredFiles = status?.requiredFiles ?? declaration.requiredFiles ?? [];
  const rootNotInspected = isRootNotInspected(status);

  if (requiredDirectories.length === 0 && requiredFiles.length === 0) return null;

  return (
    <div className="grid gap-3 text-sm md:grid-cols-2">
      <RequirementList
        title="Required directories"
        items={requiredDirectories}
        missingItems={status?.missingDirectories ?? requiredDirectories}
        missingLabel="Missing directories"
        inspectionUnavailable={rootNotInspected}
      />
      <RequirementList
        title="Required files"
        items={requiredFiles}
        missingItems={status?.missingFiles ?? requiredFiles}
        missingLabel="Missing files"
        inspectionUnavailable={rootNotInspected}
      />
    </div>
  );
}

function RequirementList({
  title,
  items,
  missingItems,
  missingLabel,
  inspectionUnavailable,
}: {
  title: string;
  items: string[];
  missingItems: string[];
  missingLabel: string;
  inspectionUnavailable?: boolean;
}) {
  return (
    <div className="space-y-2 rounded-md border border-border/60 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        <RequirementBadge inspectionUnavailable={inspectionUnavailable} missingCount={missingItems.length} />
      </div>
      {items.length > 0 ? (
        <RequirementItems
          items={items}
          missingItems={missingItems}
          inspectionUnavailable={inspectionUnavailable}
        />
      ) : (
        <p className="text-xs text-muted-foreground">None declared.</p>
      )}
      {inspectionUnavailable ? (
        <p className="text-xs text-amber-700 dark:text-amber-300">Configured root was not inspected.</p>
      ) : missingItems.length > 0 ? (
        <p className="text-xs text-destructive">{missingLabel}: {missingItems.join(", ")}</p>
      ) : null}
    </div>
  );
}

function RequirementItems({
  items,
  missingItems,
  inspectionUnavailable,
}: {
  items: string[];
  missingItems: string[];
  inspectionUnavailable?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => {
        const missing = missingItems.includes(item);
        return (
          <span
            key={item}
            className={`rounded border px-1.5 py-0.5 font-mono text-micro ${getRequirementItemClass(missing, inspectionUnavailable)}`}
          >
            {item}
          </span>
        );
      })}
    </div>
  );
}

function RequirementBadge({
  inspectionUnavailable,
  missingCount,
}: {
  inspectionUnavailable?: boolean;
  missingCount: number;
}) {
  if (inspectionUnavailable) return <Badge variant="secondary" className="text-nano">Not inspected</Badge>;
  if (missingCount > 0) return <Badge variant="destructive" className="text-nano">{missingCount} missing</Badge>;
  return <Badge variant="outline" className="text-nano">Present</Badge>;
}

function getRequirementItemClass(missing: boolean, inspectionUnavailable?: boolean) {
  if (inspectionUnavailable) return "border-amber-300/60 bg-amber-50 text-amber-700 dark:border-amber-800/70 dark:bg-amber-950/30 dark:text-amber-300";
  if (missing) return "border-destructive/30 bg-destructive/10 text-destructive";
  return "border-border bg-muted/50 text-foreground/80";
}

function isRootNotInspected(status?: PluginLocalFolderStatus) {
  if (!status?.configured || status.readable) return false;
  return status.problems.some((problem) =>
    problem.code === "missing" || problem.code === "not_readable" || problem.code === "not_directory"
  );
}
