import { Folder } from "lucide-react";

export default function StoragePage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-lg font-medium tracking-tight">Storage</h1>
        <p className="text-sm text-ink-muted">
          View and manage the files stored in your app.
        </p>
      </header>

      <div className="rounded-lg border border-line/70 bg-paper p-12 flex flex-col items-center justify-center text-center min-h-[200px] gap-2">
        <Folder className="size-6 text-line-strong" />
        <div className="text-base text-ink font-medium">No storage buckets</div>
        <p className="text-xs text-ink-muted max-w-xs">
          A bucket is a container used to store and protect files in your app.
        </p>
      </div>
    </div>
  );
}
