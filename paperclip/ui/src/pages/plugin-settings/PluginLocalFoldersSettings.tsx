import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderOpen, Loader2, Save } from "lucide-react";
import type { PluginLocalFolderDeclaration } from "@paperclipai/shared";

import { pluginsApi, type PluginLocalFolderStatus } from "@/api/plugins";
import { ChoosePathButton } from "@/components/PathInstructionsModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queryKeys } from "@/lib/queryKeys";

import { FolderRequirements } from "./LocalFolderRequirements";

interface PluginLocalFoldersSettingsProps {
  pluginId: string;
  companyId: string | null;
  declarations: PluginLocalFolderDeclaration[];
}

export function PluginLocalFoldersSettings({
  pluginId,
  companyId,
  declarations,
}: PluginLocalFoldersSettingsProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: companyId
      ? queryKeys.plugins.localFolders(pluginId, companyId)
      : ["plugins", pluginId, "companies", "none", "local-folders"],
    queryFn: () => pluginsApi.listLocalFolders(pluginId, companyId!),
    enabled: !!companyId,
  });
  const statusByKey = new Map((data?.folders ?? []).map((folder) => [folder.folderKey, folder]));

  if (!companyId) {
    return (
      <div className="rounded-md border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        Select a company to configure this plugin's local folders.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FolderOpen className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Local folders</h3>
      </div>
      {error ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {(error as Error).message || "Failed to load local folder settings."}
        </div>
      ) : null}
      {isLoading ? (
        <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading local folders...
        </div>
      ) : (
        <div className="space-y-3">
          {declarations.map((declaration) => (
            <PluginLocalFolderRow
              key={declaration.folderKey}
              pluginId={pluginId}
              companyId={companyId}
              declaration={declaration}
              status={statusByKey.get(declaration.folderKey)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PluginLocalFolderRow({
  pluginId,
  companyId,
  declaration,
  status,
}: {
  pluginId: string;
  companyId: string;
  declaration: PluginLocalFolderDeclaration;
  status?: PluginLocalFolderStatus;
}) {
  const queryClient = useQueryClient();
  const serverPath = status?.path ?? "";
  const [pathValue, setPathValue] = useState(serverPath);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setPathValue(serverPath);
    setMessage(null);
  }, [serverPath, declaration.folderKey]);

  const saveMutation = useMutation({
    mutationFn: (path: string) =>
      pluginsApi.configureLocalFolder(pluginId, companyId, declaration.folderKey, {
        path,
        access: declaration.access,
        requiredDirectories: declaration.requiredDirectories,
        requiredFiles: declaration.requiredFiles,
      }),
    onSuccess: (nextStatus) => {
      setMessage({
        type: nextStatus.healthy ? "success" : "error",
        text: nextStatus.healthy
          ? "Local folder saved."
          : "Local folder saved, but validation still needs attention.",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.plugins.localFolders(pluginId, companyId) });
    },
    onError: (err: Error) => {
      setMessage({ type: "error", text: err.message || "Failed to save local folder." });
    },
  });

  const trimmedPath = pathValue.trim();
  const isDirty = trimmedPath !== serverPath;
  const access = status?.access ?? declaration.access ?? "readWrite";

  const handleSave = useCallback(() => {
    if (!trimmedPath) {
      setMessage({ type: "error", text: "Local folder path is required." });
      return;
    }
    if (!isLikelyAbsolutePath(trimmedPath)) {
      setMessage({ type: "error", text: "Local folder must be a full absolute path." });
      return;
    }
    setMessage(null);
    saveMutation.mutate(trimmedPath);
  }, [saveMutation, trimmedPath]);

  return (
    <div className="space-y-4 rounded-md border border-border/70 bg-background px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-medium">{declaration.displayName}</h4>
            <Badge variant="outline" className="font-mono text-nano">
              {declaration.folderKey}
            </Badge>
            <Badge variant={status?.healthy ? "default" : "secondary"}>
              {status?.healthy ? "Healthy" : "Needs attention"}
            </Badge>
          </div>
          {declaration.description ? (
            <p className="max-w-3xl text-sm leading-5 text-muted-foreground">{declaration.description}</p>
          ) : null}
        </div>
        <Badge variant={access === "readWrite" ? "default" : "outline"}>
          {access === "readWrite" ? "Read/write" : "Read only"}
        </Badge>
      </div>

      <div className="grid gap-3 text-sm sm:grid-cols-3">
        <FolderStatusMetric label="Configured" value={status?.configured ? "Yes" : "No"} ok={!!status?.configured} />
        <FolderStatusMetric label="Readable" value={status?.readable ? "Yes" : "No"} ok={!!status?.readable} />
        <FolderStatusMetric
          label="Writable"
          value={access === "read" ? "Not requested" : status?.writable ? "Yes" : "No"}
          ok={access === "read" || !!status?.writable}
        />
      </div>

      {status?.path ? (
        <div className="space-y-1 text-sm">
          <div className="text-xs font-medium text-muted-foreground">Configured path</div>
          <div className="break-all rounded-md bg-muted/60 px-2 py-1.5 font-mono text-xs text-foreground">
            {status.path}
          </div>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground" htmlFor={`local-folder-${declaration.folderKey}`}>
          Local folder path
        </label>
        <div className="flex items-center gap-2">
          <Input
            id={`local-folder-${declaration.folderKey}`}
            className="h-8 flex-1 font-mono"
            value={pathValue}
            onChange={(event) => {
              setPathValue(event.target.value);
              setMessage(null);
            }}
            placeholder="/absolute/path/to/folder"
          />
          <ChoosePathButton className="h-8" />
          <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending || !isDirty}>
            {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save
          </Button>
        </div>
      </div>

      <FolderRequirements status={status} declaration={declaration} />

      {status?.problems?.length ? (
        <div className="space-y-2 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <div className="font-medium">Validation problems</div>
          <ul className="space-y-1">
            {status.problems.map((problem, index) => (
              <li key={`${problem.code}:${problem.path ?? ""}:${index}`}>
                {problem.message}
                {problem.path ? <span className="font-mono"> {problem.path}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <FolderMessage message={message} />
    </div>
  );
}

function FolderStatusMetric({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border/60 px-2.5 py-2">
      <span className="text-muted-foreground">{label}</span>
      <Badge variant={ok ? "default" : "secondary"}>{value}</Badge>
    </div>
  );
}

function FolderMessage({ message }: { message: { type: "success" | "error"; text: string } | null }) {
  if (!message) return null;
  return (
    <div className={`rounded-md border px-3 py-2 text-sm ${message.type === "success" ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400" : "border-destructive/20 bg-destructive/10 text-destructive"}`}>
      {message.text}
    </div>
  );
}

function isLikelyAbsolutePath(pathValue: string) {
  return pathValue.startsWith("/") || /^[A-Za-z]:[\\/]/.test(pathValue) || pathValue.startsWith("\\\\");
}
