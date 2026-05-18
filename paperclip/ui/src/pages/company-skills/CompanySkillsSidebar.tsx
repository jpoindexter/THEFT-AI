import type { CompanySkillCreateRequest, CompanySkillListItem } from "@paperclipai/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, RefreshCw, Search } from "lucide-react";
import { PageSkeleton } from "../../components/PageSkeleton";
import { cn } from "../../lib/utils";
import { NewSkillForm } from "./NewSkillForm";
import { SkillList } from "./SkillList";

export function CompanySkillsSidebar({
  skills,
  skillsLoading,
  skillsError,
  selectedSkillId,
  selectedPath,
  skillFilter,
  source,
  createOpen,
  scanStatusMessage,
  importPending,
  createPending,
  scanPending,
  expandedSkillId,
  expandedDirs,
  onSkillFilterChange,
  onSourceChange,
  onCreateOpenChange,
  onScanProjects,
  onAddSkillSource,
  onCreateSkill,
  onToggleSkill,
  onToggleDir,
  onSelectSkill,
}: {
  skills: CompanySkillListItem[] | undefined;
  skillsLoading: boolean;
  skillsError: Error | null;
  selectedSkillId: string | null;
  selectedPath: string;
  skillFilter: string;
  source: string;
  createOpen: boolean;
  scanStatusMessage: string | null;
  importPending: boolean;
  createPending: boolean;
  scanPending: boolean;
  expandedSkillId: string | null;
  expandedDirs: Record<string, Set<string>>;
  onSkillFilterChange: (value: string) => void;
  onSourceChange: (value: string) => void;
  onCreateOpenChange: (value: boolean | ((current: boolean) => boolean)) => void;
  onScanProjects: () => void;
  onAddSkillSource: () => void;
  onCreateSkill: (payload: CompanySkillCreateRequest) => void;
  onToggleSkill: (skillId: string) => void;
  onToggleDir: (skillId: string, path: string) => void;
  onSelectSkill: (skillId: string) => void;
}) {
  return (
    <aside className="border-r border-border">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-base font-semibold">Skills</h1>
            <p className="text-xs text-muted-foreground">
              {skills?.length ?? 0} available
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onScanProjects}
              disabled={scanPending}
              title="Scan project workspaces for skills"
            >
              <RefreshCw className={cn("h-4 w-4", scanPending && "animate-spin")} />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => onCreateOpenChange((value) => !value)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 border-b border-border pb-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            value={skillFilter}
            onChange={(event) => onSkillFilterChange(event.target.value)}
            placeholder="Filter skills"
            className="h-8 w-full border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
          />
        </div>

        <div className="mt-3 flex items-center gap-2 border-b border-border pb-2">
          <Input
            value={source}
            onChange={(event) => onSourceChange(event.target.value)}
            placeholder="Paste path, GitHub URL, or skills.sh command"
            className="h-8 w-full border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
          />
          <Button size="sm" variant="ghost" onClick={onAddSkillSource} disabled={importPending}>
            {importPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Add"}
          </Button>
        </div>
        {scanStatusMessage && (
          <p className="mt-3 text-xs text-muted-foreground">
            {scanStatusMessage}
          </p>
        )}
      </div>

      {createOpen && (
        <NewSkillForm
          onCreate={onCreateSkill}
          isPending={createPending}
          onCancel={() => onCreateOpenChange(false)}
        />
      )}

      {skillsLoading ? (
        <PageSkeleton variant="list" />
      ) : skillsError ? (
        <div className="px-4 py-6 text-sm text-destructive">{skillsError.message}</div>
      ) : (
        <SkillList
          skills={skills ?? []}
          selectedSkillId={selectedSkillId}
          skillFilter={skillFilter}
          expandedSkillId={expandedSkillId}
          expandedDirs={expandedDirs}
          selectedPaths={selectedSkillId ? { [selectedSkillId]: selectedPath } : {}}
          onToggleSkill={onToggleSkill}
          onToggleDir={onToggleDir}
          onSelectSkill={onSelectSkill}
          onSelectPath={() => {}}
        />
      )}
    </aside>
  );
}
