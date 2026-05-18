import type { Dispatch, SetStateAction } from "react";
import type { ExecutionWorkspace, ProjectWorkspace } from "@paperclipai/shared";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "./WorkspaceDetailPrimitives";
import { formatJson, type WorkspaceFormState } from "./workspaceForm";

export function WorkspaceSettingsCard({
  workspace,
  form,
  initialState,
  isDirty,
  isSaving,
  errorMessage,
  inheritedRuntimeConfig,
  linkedProjectWorkspace,
  runtimeConfigSource,
  setForm,
  onCloseWorkspace,
  onSave,
  onResetMessages,
}: {
  workspace: ExecutionWorkspace;
  form: WorkspaceFormState;
  initialState: WorkspaceFormState;
  isDirty: boolean;
  isSaving: boolean;
  errorMessage: string | null;
  inheritedRuntimeConfig: Record<string, unknown> | null;
  linkedProjectWorkspace: ProjectWorkspace | null;
  runtimeConfigSource: "execution_workspace" | "project_workspace" | "none";
  setForm: Dispatch<SetStateAction<WorkspaceFormState | null>>;
  onCloseWorkspace: () => void;
  onSave: () => void;
  onResetMessages: () => void;
}) {
  const updateField = (field: keyof WorkspaceFormState, value: string | boolean) => {
    setForm((current) => (current ? { ...current, [field]: value } : current));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace settings</CardTitle>
        <CardDescription>
          Edit the concrete path, repo, branch, provisioning, teardown, and runtime overrides attached to this execution workspace.
        </CardDescription>
        <CardAction>
          <Button
            variant="destructive"
            size="sm"
            className="w-full sm:w-auto"
            onClick={onCloseWorkspace}
            disabled={workspace.status === "archived"}
          >
            {workspace.status === "cleanup_failed" ? "Retry close" : "Close workspace"}
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">General</div>
            <Field label="Workspace name">
              <Input
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Execution workspace name"
              />
            </Field>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Source control</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Branch name" hint="Useful for isolated worktrees">
                <Input
                  className="font-mono"
                  value={form.branchName}
                  onChange={(event) => updateField("branchName", event.target.value)}
                  placeholder="PAP-946-workspace"
                />
              </Field>

              <Field label="Base ref">
                <Input
                  className="font-mono"
                  value={form.baseRef}
                  onChange={(event) => updateField("baseRef", event.target.value)}
                  placeholder="origin/main"
                />
              </Field>
            </div>

            <Field label="Repo URL">
              <Input
                value={form.repoUrl}
                onChange={(event) => updateField("repoUrl", event.target.value)}
                placeholder="https://github.com/org/repo"
              />
            </Field>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Paths</div>
            <Field label="Working directory">
              <Input
                className="font-mono"
                value={form.cwd}
                onChange={(event) => updateField("cwd", event.target.value)}
                placeholder="/absolute/path/to/workspace"
              />
            </Field>

            <Field label="Provider path / ref">
              <Input
                className="font-mono"
                value={form.providerRef}
                onChange={(event) => updateField("providerRef", event.target.value)}
                placeholder="/path/to/worktree or provider ref"
              />
            </Field>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Lifecycle commands</div>
            <Field label="Provision command" hint="Runs when Paperclip prepares this execution workspace">
              <Textarea
                className="min-h-20 font-mono"
                value={form.provisionCommand}
                onChange={(event) => updateField("provisionCommand", event.target.value)}
                placeholder="bash ./scripts/provision-worktree.sh"
              />
            </Field>

            <Field label="Teardown command" hint="Runs when the execution workspace is archived or cleaned up">
              <Textarea
                className="min-h-20 font-mono"
                value={form.teardownCommand}
                onChange={(event) => updateField("teardownCommand", event.target.value)}
                placeholder="bash ./scripts/teardown-worktree.sh"
              />
            </Field>

            <Field label="Cleanup command" hint="Workspace-specific cleanup before teardown">
              <Textarea
                className="min-h-16 font-mono"
                value={form.cleanupCommand}
                onChange={(event) => updateField("cleanupCommand", event.target.value)}
                placeholder="pkill -f vite || true"
              />
            </Field>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Runtime config</div>
            <div className="rounded-md border border-dashed border-border/70 bg-background px-4 py-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-foreground">Runtime config source</div>
                  <p className="text-sm text-muted-foreground">
                    {runtimeConfigSource === "execution_workspace"
                      ? "This execution workspace currently overrides the project workspace runtime config."
                      : runtimeConfigSource === "project_workspace"
                        ? "This execution workspace is inheriting the project workspace runtime config."
                        : "No runtime config is currently defined on this execution workspace or its project workspace."}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  size="sm"
                  disabled={!linkedProjectWorkspace?.runtimeConfig?.workspaceRuntime}
                  onClick={() => setForm((current) => current ? { ...current, inheritRuntime: true, workspaceRuntime: "" } : current)}
                >
                  Reset to inherit
                </Button>
              </div>
            </div>

            <details className="rounded-md border border-dashed border-border/70 bg-background px-4 py-3">
              <summary className="cursor-pointer text-sm font-medium">Advanced runtime JSON</summary>
              <p className="mt-2 text-sm text-muted-foreground">
                Override the inherited workspace command model only when this execution workspace truly needs different service or job behavior.
              </p>
              <div className="mt-3">
                <Field label="Workspace commands JSON" hint="Legacy `services` arrays still work, but `commands` supports both services and jobs.">
                  <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Checkbox
                      id="inherit-runtime-config"
                      checked={form.inheritRuntime}
                      onCheckedChange={(checked) => {
                        const inheritRuntime = checked === true;
                        setForm((current) => {
                          if (!current) return current;
                          if (!inheritRuntime && !current.workspaceRuntime.trim() && inheritedRuntimeConfig) {
                            return { ...current, inheritRuntime, workspaceRuntime: formatJson(inheritedRuntimeConfig) };
                          }
                          return { ...current, inheritRuntime };
                        });
                      }}
                    />
                    <label htmlFor="inherit-runtime-config">Inherit project workspace runtime config</label>
                  </div>
                  <Textarea
                    className="min-h-64 font-mono sm:min-h-96"
                    value={form.workspaceRuntime}
                    onChange={(event) => updateField("workspaceRuntime", event.target.value)}
                    disabled={form.inheritRuntime}
                    placeholder={'{\n  "commands": [\n    {\n      "id": "web",\n      "name": "web",\n      "kind": "service",\n      "command": "pnpm dev",\n      "cwd": ".",\n      "port": { "type": "auto" }\n    },\n    {\n      "id": "db-migrate",\n      "name": "db:migrate",\n      "kind": "job",\n      "command": "pnpm db:migrate",\n      "cwd": "."\n    }\n  ]\n}'}
                  />
                </Field>
              </div>
            </details>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Button className="w-full sm:w-auto" disabled={!isDirty || isSaving} onClick={onSave}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save changes
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            disabled={!isDirty || isSaving}
            onClick={() => {
              setForm(initialState);
              onResetMessages();
            }}
          >
            Reset
          </Button>
          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
          {!errorMessage && !isDirty ? <p className="text-sm text-muted-foreground">No unsaved changes.</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
