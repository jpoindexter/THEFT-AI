import { FolderOpen, Package, Plus } from "lucide-react";
import { ChoosePathButton } from "@/components/PathInstructionsModal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type InstallAdapterDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installPackage: string;
  installVersion: string;
  isLocalPath: boolean;
  isInstalling: boolean;
  onPackageChange: (value: string) => void;
  onVersionChange: (value: string) => void;
  onSourceChange: (isLocalPath: boolean) => void;
  onInstall: () => void;
};

export function InstallAdapterDialog({
  open,
  onOpenChange,
  installPackage,
  installVersion,
  isLocalPath,
  isInstalling,
  onPackageChange,
  onVersionChange,
  onSourceChange,
  onInstall,
}: InstallAdapterDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Install Adapter
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Install External Adapter</DialogTitle>
          <DialogDescription>
            Add an adapter from npm or a local path. The adapter package must export{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">createServerAdapter()</code>.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={!isLocalPath ? "secondary" : "outline"}
              size="xs"
              onClick={() => onSourceChange(false)}
            >
              <Package className="h-3.5 w-3.5" />
              npm package
            </Button>
            <Button
              type="button"
              variant={isLocalPath ? "secondary" : "outline"}
              size="xs"
              onClick={() => onSourceChange(true)}
            >
              <FolderOpen className="h-3.5 w-3.5" />
              Local path
            </Button>
          </div>

          {isLocalPath ? (
            <div className="grid gap-2">
              <Label htmlFor="adapterLocalPath">Path to adapter package</Label>
              <div className="flex gap-2">
                <Input
                  id="adapterLocalPath"
                  className="flex-1 font-mono text-xs"
                  placeholder="/mnt/e/Projects/my-adapter  or  E:\Projects\my-adapter"
                  value={installPackage}
                  onChange={(event) => onPackageChange(event.target.value)}
                />
                <ChoosePathButton />
              </div>
              <p className="text-xs text-muted-foreground">
                Accepts Linux, WSL, and Windows paths. Windows paths are auto-converted.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-2">
                <Label htmlFor="adapterPackageName">Package Name</Label>
                <Input
                  id="adapterPackageName"
                  placeholder="my-paperclip-adapter"
                  value={installPackage}
                  onChange={(event) => onPackageChange(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="adapterVersion">Version (optional)</Label>
                <Input
                  id="adapterVersion"
                  placeholder="latest"
                  value={installVersion}
                  onChange={(event) => onVersionChange(event.target.value)}
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onInstall} disabled={!installPackage || isInstalling}>
            {isInstalling ? "Installing..." : "Install"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
