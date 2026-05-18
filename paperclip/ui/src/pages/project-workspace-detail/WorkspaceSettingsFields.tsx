import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { WorkspaceFormState } from "./workspaceModel";
import { WorkspaceField } from "./WorkspaceDetailPrimitives";

const runtimeConfigPlaceholder = `{
  "commands": [
    {
      "id": "web",
      "name": "web",
      "kind": "service",
      "command": "pnpm dev",
      "cwd": ".",
      "port": { "type": "auto" },
      "readiness": {
        "type": "http",
        "urlTemplate": "http://127.0.0.1:\${port}"
      },
      "expose": {
        "type": "url",
        "urlTemplate": "http://127.0.0.1:\${port}"
      },
      "lifecycle": "shared",
      "reuseScope": "project_workspace"
    }
  ]
}`;

type WorkspaceFieldSectionProps = {
  form: WorkspaceFormState;
  onChange: (patch: Partial<WorkspaceFormState>) => void;
};

export function WorkspaceRepositoryFields({ form, onChange }: WorkspaceFieldSectionProps) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <WorkspaceField label="Repo URL">
          <Input value={form.repoUrl} onChange={(event) => onChange({ repoUrl: event.target.value })} placeholder="https://github.com/org/repo" />
        </WorkspaceField>
        <WorkspaceField label="Repo ref">
          <Input className="font-mono" value={form.repoRef} onChange={(event) => onChange({ repoRef: event.target.value })} placeholder="origin/main" />
        </WorkspaceField>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <WorkspaceField label="Default ref">
          <Input className="font-mono" value={form.defaultRef} onChange={(event) => onChange({ defaultRef: event.target.value })} placeholder="origin/main" />
        </WorkspaceField>
        <WorkspaceField label="Shared workspace key">
          <Input className="font-mono" value={form.sharedWorkspaceKey} onChange={(event) => onChange({ sharedWorkspaceKey: event.target.value })} placeholder="frontend" />
        </WorkspaceField>
      </div>
    </>
  );
}

export function WorkspaceRemoteFields({ form, onChange }: WorkspaceFieldSectionProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <WorkspaceField label="Remote provider">
        <Input value={form.remoteProvider} onChange={(event) => onChange({ remoteProvider: event.target.value })} placeholder="codespaces" />
      </WorkspaceField>
      <WorkspaceField label="Remote workspace ref">
        <Input className="font-mono" value={form.remoteWorkspaceRef} onChange={(event) => onChange({ remoteWorkspaceRef: event.target.value })} placeholder="workspace-123" />
      </WorkspaceField>
    </div>
  );
}

export function WorkspaceCommandFields({ form, onChange }: WorkspaceFieldSectionProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <WorkspaceField label="Setup command" hint="Runs when this workspace needs custom bootstrap">
        <Textarea className="min-h-28 font-mono" value={form.setupCommand} onChange={(event) => onChange({ setupCommand: event.target.value })} placeholder="pnpm install && pnpm dev" />
      </WorkspaceField>
      <WorkspaceField label="Cleanup command" hint="Runs before project-level execution workspace teardown">
        <Textarea className="min-h-28 font-mono" value={form.cleanupCommand} onChange={(event) => onChange({ cleanupCommand: event.target.value })} placeholder="pkill -f vite || true" />
      </WorkspaceField>
    </div>
  );
}

export function WorkspaceRuntimeJson({ form, onChange }: WorkspaceFieldSectionProps) {
  return (
    <details className="rounded-md border border-dashed border-border bg-background px-3 py-3">
      <summary className="cursor-pointer text-sm font-medium">Advanced runtime JSON</summary>
      <p className="mt-2 text-sm text-muted-foreground">
        Paperclip derives Services and Jobs from this JSON. Prefer editing named commands first.
      </p>
      <div className="mt-3">
        <WorkspaceField label="Workspace commands JSON" hint="Execution workspaces inherit this config unless they override it.">
          <Textarea
            className="min-h-96 font-mono"
            value={form.runtimeConfig}
            onChange={(event) => onChange({ runtimeConfig: event.target.value })}
            placeholder={runtimeConfigPlaceholder}
          />
        </WorkspaceField>
      </div>
    </details>
  );
}
