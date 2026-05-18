import type { PluginRecord } from "@paperclipai/shared";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getPluginErrorSummary } from "./pluginManagerModel";

type UninstallPluginDialogProps = {
  pluginId: string | null;
  pluginName: string;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function UninstallPluginDialog({
  pluginId,
  pluginName,
  isPending,
  onOpenChange,
  onConfirm,
}: UninstallPluginDialogProps) {
  return (
    <Dialog open={pluginId !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Uninstall Plugin</DialogTitle>
          <DialogDescription>
            Are you sure you want to uninstall <strong>{pluginName}</strong>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={isPending} onClick={onConfirm}>
            {isPending ? "Uninstalling..." : "Uninstall"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type PluginErrorDetailsDialogProps = {
  plugin: PluginRecord | null;
  onOpenChange: (open: boolean) => void;
};

export function PluginErrorDetailsDialog({ plugin, onOpenChange }: PluginErrorDetailsDialogProps) {
  return (
    <Dialog open={plugin !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Error Details</DialogTitle>
          <DialogDescription>
            {plugin?.manifestJson.displayName ?? plugin?.packageName ?? "Plugin"} hit an error state.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-md border border-destructive/25 bg-destructive/5 px-4 py-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div className="space-y-1 text-sm">
                <p className="font-medium text-destructive">What errored</p>
                <p className="break-words text-destructive">
                  {plugin ? getPluginErrorSummary(plugin) : "No error summary available."}
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Full error output</p>
            <pre className="max-h-dialog-list overflow-auto rounded-md border bg-muted/40 p-3 text-xs leading-5 whitespace-pre-wrap break-words">
              {plugin?.lastError ?? "No stored error message."}
            </pre>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
