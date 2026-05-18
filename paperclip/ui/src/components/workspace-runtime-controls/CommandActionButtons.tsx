import { Loader2, Play, RotateCcw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  WorkspaceRuntimeAction,
  WorkspaceRuntimeControlItem,
  WorkspaceRuntimeControlRequest,
} from "./types";
import { buildRequest, requestMatchesPending } from "./workspaceRuntimeModel";

export function CommandActionButtons({
  item,
  isPending,
  pendingRequest,
  onAction,
  square,
}: {
  item: WorkspaceRuntimeControlItem;
  isPending: boolean;
  pendingRequest: WorkspaceRuntimeControlRequest | null | undefined;
  onAction: (request: WorkspaceRuntimeControlRequest) => void;
  square?: boolean;
}) {
  const actions: WorkspaceRuntimeAction[] =
    item.kind === "job"
      ? ["run"]
      : item.statusLabel === "running" || item.statusLabel === "starting"
        ? ["stop", ...(item.canStart ? ["restart" as const] : [])]
        : ["start"];

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
      {actions.map((action) => {
        const request = buildRequest(item, action);
        const Icon = action === "stop" ? Square : action === "restart" ? RotateCcw : Play;
        const label = action === "run"
          ? "Run"
          : action === "start"
            ? "Start"
            : action === "stop"
              ? "Stop"
              : "Restart";
        const showSpinner = isPending && requestMatchesPending(pendingRequest, request);
        const disabled =
          isPending
          || (action === "run" && !item.canRun)
          || ((action === "start" || action === "restart") && !item.canStart);

        return (
          <Button
            key={`${item.key}:${action}`}
            variant={action === "stop" ? "destructive" : action === "restart" ? "outline" : "default"}
            size="sm"
            className={cn("w-full justify-start sm:w-auto", square ? "workspace-runtime-square-corners" : null)}
            disabled={disabled}
            onClick={() => onAction(request)}
          >
            {showSpinner ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
            {label}
          </Button>
        );
      })}
    </div>
  );
}
