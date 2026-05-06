import { HardDrive, Folder, Upload } from "lucide-react";
import {
  Card,
  Hint,
  PageTitle,
  Pill,
  ButtonPrimary,
} from "@/components/ui/primitives";

const BUCKETS = [
  { name: "avatars", size: "12.4 MB", files: 84, public: true },
  { name: "exports", size: "204.1 MB", files: 12, public: false },
  { name: "uploads", size: "1.3 GB", files: 1842, public: false },
  { name: "marketing-assets", size: "88.2 MB", files: 56, public: true },
];

export default function StoragePage() {
  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <PageTitle className="text-md font-medium inline-flex items-center gap-2">
            <HardDrive className="size-4 text-ink-muted" /> Storage
          </PageTitle>
          <Hint>File buckets backed by Supabase Storage.</Hint>
        </div>
        <ButtonPrimary className="inline-flex items-center gap-1">
          <Upload className="size-3.5" /> New bucket
        </ButtonPrimary>
      </header>

      <Card>
        <ul className="divide-y divide-line/60">
          {BUCKETS.map((b) => (
            <BucketRow key={b.name} b={b} />
          ))}
        </ul>
      </Card>
    </div>
  );
}

function BucketRow({
  b,
}: {
  b: { name: string; size: string; files: number; public: boolean };
}) {
  return (
    <li className="px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Folder className="size-4 text-ink-muted" />
        <div>
          <div className="text-base font-medium font-mono">{b.name}</div>
          <div className="text-xs text-ink-muted">
            {b.files} files · {b.size}
          </div>
        </div>
      </div>
      <Pill tone={b.public ? "mustard" : "neutral"}>
        {b.public ? "Public" : "Private"}
      </Pill>
    </li>
  );
}
