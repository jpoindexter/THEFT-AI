import type { ReactNode } from "react";
import type { Project } from "@paperclipai/shared";
import { ExternalLink, Github, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChoosePathButton } from "../PathInstructionsModal";
import { cn } from "../../lib/utils";

export function CodebaseHelpLabel() {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span>Codebase</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            className="h-4 w-4 rounded-full text-nano text-muted-foreground hover:text-foreground"
            aria-label="Codebase help"
          >
            ?
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          Repo identifies the source of truth. Local folder is the default place agents write code.
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export function RepoSummary({
  repoUrl,
  onChange,
  onClear,
}: {
  repoUrl?: string | null;
  onChange: () => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-1">
      <div className="theft-label-compact">Repo</div>
      {repoUrl ? (
        <div className="flex items-center justify-between gap-2">
          {isSafeExternalUrl(repoUrl) ? (
            <a
              href={repoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              <Github className="h-3 w-3 shrink-0" />
              <span className="min-w-0 break-all">{formatRepoUrl(repoUrl)}</span>
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          ) : (
            <div className="inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
              <Github className="h-3 w-3 shrink-0" />
              <span className="min-w-0 break-all">{repoUrl}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Button variant="outline" size="xs" className="h-6 px-2" onClick={onChange}>
              Change repo
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={onClear} aria-label="Clear repo">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">Not set.</div>
          <Button variant="outline" size="xs" className="h-6 px-2" onClick={onChange}>
            Set repo
          </Button>
        </div>
      )}
    </div>
  );
}

export function LocalFolderSummary({
  effectiveLocalFolder,
  origin,
  hasLocalFolder,
  onChange,
  onClear,
}: {
  effectiveLocalFolder: string;
  origin: string;
  hasLocalFolder: boolean;
  onChange: () => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-1">
      <div className="theft-label-compact">Local folder</div>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <div className="min-w-0 break-all font-mono text-xs text-muted-foreground">
            {effectiveLocalFolder}
          </div>
          {origin === "managed_checkout" ? (
            <div className="text-micro text-muted-foreground">Paperclip-managed folder.</div>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="xs" className="h-6 px-2" onClick={onChange}>
            {hasLocalFolder ? "Change local folder" : "Set local folder"}
          </Button>
          {hasLocalFolder ? (
            <Button variant="ghost" size="icon-xs" onClick={onClear} aria-label="Clear local folder">
              <Trash2 className="h-3 w-3" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function RuntimeServices({
  services,
}: {
  services: NonNullable<NonNullable<Project["primaryWorkspace"]>["runtimeServices"]>;
}) {
  if (services.length === 0) return null;

  return (
    <div className="space-y-1">
      {services.map((service) => (
        <div
          key={service.id}
          className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-2 py-1"
        >
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-micro font-medium">{service.serviceName}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-nano uppercase tracking-wide",
                  service.status === "running"
                    ? "bg-chart-2/10 text-chart-2"
                    : service.status === "failed"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {service.status}
              </span>
            </div>
            <div className="text-micro text-muted-foreground">
              {service.url ? (
                <a href={service.url} target="_blank" rel="noreferrer" className="hover:text-foreground hover:underline">
                  {service.url}
                </a>
              ) : (
                service.command ?? "No URL"
              )}
            </div>
          </div>
          <div className="whitespace-nowrap text-nano text-muted-foreground">
            {service.lifecycle}
          </div>
        </div>
      ))}
    </div>
  );
}

export function LocalWorkspaceEditPanel({
  value,
  onChange,
  saveDisabled,
  onSave,
  onCancel,
}: {
  value: string;
  onChange: (value: string) => void;
  saveDisabled: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <WorkspaceEditPanel
      value={value}
      onChange={onChange}
      placeholder="/absolute/path/to/workspace"
      mono
      rightSlot={<ChoosePathButton />}
      saveDisabled={saveDisabled}
      onSave={onSave}
      onCancel={onCancel}
    />
  );
}

export function RepoWorkspaceEditPanel({
  value,
  onChange,
  saveDisabled,
  onSave,
  onCancel,
}: {
  value: string;
  onChange: (value: string) => void;
  saveDisabled: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <WorkspaceEditPanel
      value={value}
      onChange={onChange}
      placeholder="https://github.com/org/repo"
      saveDisabled={saveDisabled}
      onSave={onSave}
      onCancel={onCancel}
    />
  );
}

function WorkspaceEditPanel({
  value,
  onChange,
  placeholder,
  saveDisabled,
  onSave,
  onCancel,
  mono = false,
  rightSlot,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  saveDisabled: boolean;
  onSave: () => void;
  onCancel: () => void;
  mono?: boolean;
  rightSlot?: ReactNode;
}) {
  return (
    <div className="space-y-1.5 rounded-md border border-border p-2">
      <div className="flex items-center gap-2">
        <Input
          className={cn("h-8 text-xs", mono && "font-mono")}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
        {rightSlot}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="xs" className="h-6 px-2" disabled={saveDisabled} onClick={onSave}>
          Save
        </Button>
        <Button variant="ghost" size="xs" className="h-6 px-2" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function isSafeExternalUrl(value: string | null | undefined) {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function formatRepoUrl(value: string) {
  try {
    const parsed = new URL(value);
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length < 2) return parsed.host;
    const owner = segments[0];
    const repo = segments[1]?.replace(/\.git$/i, "");
    if (!owner || !repo) return parsed.host;
    return `${parsed.host}/${owner}/${repo}`;
  } catch {
    return value;
  }
}
