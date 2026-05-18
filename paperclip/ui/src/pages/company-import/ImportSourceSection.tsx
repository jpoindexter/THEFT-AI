import type { ChangeEvent } from "react";
import { useId } from "react";
import type {
  CompanyPortabilityCollisionStrategy,
  CompanyPortabilityFileEntry,
} from "@paperclipai/shared";
import { Github, Upload, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "../../components/agent-config-primitives";
import { cn } from "../../lib/utils";

type SourceMode = "github" | "local";
type TargetMode = "existing" | "new";

interface LocalPackageSummary {
  name: string;
  rootPath: string | null;
  files: Record<string, CompanyPortabilityFileEntry>;
}

interface ImportSourceSectionProps {
  sourceMode: SourceMode;
  importUrl: string;
  localPackage: LocalPackageSummary | null;
  localZipHelpText: string;
  targetMode: TargetMode;
  selectedCompanyName: string | undefined;
  newCompanyName: string;
  collisionStrategy: CompanyPortabilityCollisionStrategy;
  hasSource: boolean;
  isPreviewing: boolean;
  onSourceModeChange: (mode: SourceMode) => void;
  onImportUrlChange: (value: string) => void;
  onChooseLocalPackage: (event: ChangeEvent<HTMLInputElement>) => void;
  onTargetModeChange: (mode: TargetMode) => void;
  onNewCompanyNameChange: (value: string) => void;
  onCollisionStrategyChange: (strategy: CompanyPortabilityCollisionStrategy) => void;
  onPreview: () => void;
}

const SOURCE_OPTIONS: Array<{
  key: SourceMode;
  icon: LucideIcon;
  label: string;
}> = [
  { key: "github", icon: Github, label: "GitHub repo" },
  { key: "local", icon: Upload, label: "Local zip" },
];

export function ImportSourceSection({
  sourceMode,
  importUrl,
  localPackage,
  localZipHelpText,
  targetMode,
  selectedCompanyName,
  newCompanyName,
  collisionStrategy,
  hasSource,
  isPreviewing,
  onSourceModeChange,
  onImportUrlChange,
  onChooseLocalPackage,
  onTargetModeChange,
  onNewCompanyNameChange,
  onCollisionStrategyChange,
  onPreview,
}: ImportSourceSectionProps) {
  const packageInputId = useId();

  return (
    <div className="space-y-4 border-b border-border px-5 py-5">
      <div>
        <h2 className="text-base font-semibold">Import source</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose a GitHub repo or upload a local Paperclip zip package.
        </p>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {SOURCE_OPTIONS.map(({ key, icon: Icon, label }) => (
          <Button
            key={key}
            type="button"
            variant={sourceMode === key ? "secondary" : "outline"}
            className={cn("justify-start text-left", sourceMode === key && "border-foreground")}
            onClick={() => onSourceModeChange(key)}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>

      {sourceMode === "local" ? (
        <div className="rounded-md border border-dashed border-border px-3 py-3">
          <Input
            id={packageInputId}
            type="file"
            accept=".zip,application/zip"
            className="sr-only"
            onChange={onChooseLocalPackage}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" asChild>
              <label htmlFor={packageInputId}>Choose zip</label>
            </Button>
            {localPackage && (
              <span className="text-xs text-muted-foreground">
                {localPackage.name} with {Object.keys(localPackage.files).length} file
                {Object.keys(localPackage.files).length === 1 ? "" : "s"}
              </span>
            )}
          </div>
          {!localPackage && (
            <p className="mt-2 text-xs text-muted-foreground">
              {localZipHelpText}
            </p>
          )}
        </div>
      ) : (
        <Field
          label="GitHub URL"
          hint="Repo tree path or blob URL to COMPANY.md (e.g. github.com/owner/repo/tree/main/company)."
        >
          <Input
            type="text"
            value={importUrl}
            placeholder="https://github.com/owner/repo/tree/main/company"
            onChange={(event) => onImportUrlChange(event.target.value)}
          />
        </Field>
      )}

      <Field label="Target" hint="Import into this company or create a new one.">
        <Select value={targetMode} onValueChange={(value) => onTargetModeChange(value as TargetMode)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">Create new company</SelectItem>
            <SelectItem value="existing">
              Existing company: {selectedCompanyName}
            </SelectItem>
          </SelectContent>
        </Select>
      </Field>

      {targetMode === "new" && (
        <Field
          label="New company name"
          hint="Optional override. Leave blank to use the package name."
        >
          <Input
            type="text"
            value={newCompanyName}
            onChange={(event) => onNewCompanyNameChange(event.target.value)}
            placeholder="Imported Company"
          />
        </Field>
      )}

      <Field
        label="Collision strategy"
        hint="Board imports can rename, skip, or replace matching company content."
      >
        <Select
          value={collisionStrategy}
          onValueChange={(value) => onCollisionStrategyChange(value as CompanyPortabilityCollisionStrategy)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rename">Rename on conflict</SelectItem>
            <SelectItem value="skip">Skip on conflict</SelectItem>
            <SelectItem value="replace">Replace existing</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onPreview}
          disabled={isPreviewing || !hasSource}
        >
          {isPreviewing ? "Previewing..." : "Preview import"}
        </Button>
      </div>
    </div>
  );
}
