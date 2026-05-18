import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkspaceRuntimeControlItem, WorkspaceRuntimeControlRequest } from "./types";
import { CommandActionButtons } from "./CommandActionButtons";

function healthBadgeClass(healthStatus: WorkspaceRuntimeControlItem["healthStatus"]) {
  if (healthStatus === "healthy") return "border-primary/30 bg-primary/5 text-primary";
  if (healthStatus === "unhealthy") return "border-destructive/30 bg-destructive/10 text-destructive";
  return "border-border text-muted-foreground";
}

export function CommandSection({
  title,
  description,
  items,
  emptyMessage,
  disabledHint,
  isPending,
  pendingRequest,
  onAction,
  square,
}: {
  title: string;
  description: string;
  items: WorkspaceRuntimeControlItem[];
  emptyMessage: string;
  disabledHint?: string | null;
  isPending: boolean;
  pendingRequest: WorkspaceRuntimeControlRequest | null | undefined;
  onAction: (request: WorkspaceRuntimeControlRequest) => void;
  square?: boolean;
}) {
  const panelShape = square ? "workspace-runtime-square-corners" : "rounded-xl";

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="text-sm font-medium">{title}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {items.length === 0 ? (
        <div className={cn("border border-dashed border-border/80 bg-background px-3 py-4 text-sm text-muted-foreground", panelShape)}>
          {emptyMessage}
          {disabledHint ? <p className="mt-2 text-xs">{disabledHint}</p> : null}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.key} className={cn("border border-border/80 bg-background px-3 py-3", panelShape)}>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="text-sm font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.kind} · {item.statusLabel}
                      {item.lifecycle ? ` · ${item.lifecycle}` : ""}
                    </div>
                  </div>
                  <CommandActionButtons
                    item={item}
                    isPending={isPending}
                    pendingRequest={pendingRequest}
                    onAction={onAction}
                    square={square}
                  />
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
                      {item.url}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                  {item.port ? <div>Port {item.port}</div> : null}
                  {item.command ? <div className="break-all font-mono">{item.command}</div> : null}
                  {item.cwd ? <div className="break-all font-mono">{item.cwd}</div> : null}
                  {item.disabledReason ? <div>{item.disabledReason}</div> : null}
                </div>
                {item.healthStatus && item.statusLabel !== "stopped" ? (
                  <div className="flex items-center gap-2">
                    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-micro", healthBadgeClass(item.healthStatus))}>
                      {item.healthStatus}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
