import { useQuery } from "@tanstack/react-query";
import type { AdapterInfo } from "@/api/adapters";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function fetchNpmLatestVersion(packageName: string): Promise<string | null> {
  return fetch(`https://registry.npmjs.org/${encodeURIComponent(packageName)}/latest`, {
    signal: AbortSignal.timeout(5000),
  })
    .then((res) => res.json())
    .then((data) => (typeof data?.version === "string" ? data.version as string : null))
    .catch(() => null);
}

export function RemoveAdapterDialog({
  removeType,
  hasPackage,
  isRemoving,
  onCancel,
  onConfirm,
}: {
  removeType: string | null;
  hasPackage: boolean;
  isRemoving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={removeType !== null} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove Adapter</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove the <strong>{removeType}</strong> adapter?
            It will be unregistered and removed from the adapter store.
            {hasPackage && <> npm packages will be cleaned up from disk.</>}
            {" "}This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" disabled={isRemoving} onClick={onConfirm}>
            {isRemoving ? "Removing..." : "Remove"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ReinstallDialog({
  adapter,
  open,
  isReinstalling,
  onConfirm,
  onCancel,
}: {
  adapter: AdapterInfo | null;
  open: boolean;
  isReinstalling: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { data: latestVersion, isLoading: isFetchingVersion } = useQuery({
    queryKey: ["npm-latest-version", adapter?.packageName],
    queryFn: () => {
      if (!adapter?.packageName) return null;
      return fetchNpmLatestVersion(adapter.packageName);
    },
    enabled: open && !!adapter?.packageName,
    staleTime: 60_000,
  });

  const isUpToDate = adapter?.version && latestVersion && adapter.version === latestVersion;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onCancel(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reinstall Adapter</DialogTitle>
          <DialogDescription>
            This will pull the latest version of <strong>{adapter?.packageName}</strong> from npm and hot-swap
            the running adapter module. Existing agents will use the new version on their next run.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1 rounded-md border bg-muted/50 px-4 py-3 text-sm">
          <VersionRow label="Package" value={adapter?.packageName} />
          <VersionRow label="Current" value={adapter?.version ? `v${adapter.version}` : "unknown"} />
          <VersionRow
            label="Latest on npm"
            value={isFetchingVersion ? "checking..." : latestVersion ? `v${latestVersion}` : "unavailable"}
          />
          {isUpToDate && <p className="pt-1 text-xs text-muted-foreground">Already on the latest version.</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isReinstalling}>Cancel</Button>
          <Button disabled={isReinstalling} onClick={onConfirm}>
            {isReinstalling ? "Reinstalling..." : "Reinstall"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VersionRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-mono">{value}</span>
    </div>
  );
}
