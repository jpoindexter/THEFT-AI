import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type InstallPluginDialogProps = {
  open: boolean;
  packageName: string;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onPackageNameChange: (value: string) => void;
  onInstall: () => void;
};

export function InstallPluginDialog({
  open,
  packageName,
  isPending,
  onOpenChange,
  onPackageNameChange,
  onInstall,
}: InstallPluginDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Install Plugin
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Install Plugin</DialogTitle>
          <DialogDescription>Enter the npm package name of the plugin you wish to install.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="packageName">npm Package Name</Label>
            <Input
              id="packageName"
              placeholder="@paperclipai/plugin-example"
              value={packageName}
              onChange={(event) => onPackageNameChange(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onInstall} disabled={!packageName || isPending}>
            {isPending ? "Installing..." : "Install"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
