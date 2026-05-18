import { Button } from "@/components/ui/button";
import { SettingsSection } from "./SettingsSection";

export function ArchiveCompanySection({
  companyName,
  isArchived,
  isArchiving,
  archiveError,
  onArchive,
}: {
  companyName: string;
  isArchived: boolean;
  isArchiving: boolean;
  archiveError: unknown;
  onArchive: () => void;
}) {
  const archiveErrorMessage = archiveError
    ? archiveError instanceof Error
      ? archiveError.message
      : `Failed to archive ${companyName}`
    : null;

  return (
    <SettingsSection title="Danger Zone" tone="destructive">
      <div className="space-y-3 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-4">
        <p className="text-sm text-muted-foreground">
          Archive this company to hide it from the sidebar. This persists in the database.
        </p>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="destructive" disabled={isArchiving || isArchived} onClick={onArchive}>
            {isArchiving ? "Archiving..." : isArchived ? "Already archived" : "Archive company"}
          </Button>
          {archiveErrorMessage && (
            <span className="text-xs text-destructive">
              {archiveErrorMessage}
            </span>
          )}
        </div>
      </div>
    </SettingsSection>
  );
}
