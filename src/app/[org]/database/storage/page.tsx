import { HardDrive, Folder, Upload } from "lucide-react";

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
          <h1 className="text-lg font-medium tracking-tight inline-flex items-center gap-2">
            <HardDrive className="size-4 text-stone-500" /> Storage
          </h1>
          <p className="text-[12px] text-stone-500">
            File buckets backed by Supabase Storage.
          </p>
        </div>
        <button className="inline-flex items-center gap-1 rounded-md bg-stone-900 text-white px-3 py-1.5 text-[12px]">
          <Upload className="size-3.5" /> New bucket
        </button>
      </header>

      <ul className="rounded-lg border border-stone-200/70 bg-white divide-y divide-stone-100">
        {BUCKETS.map((b) => (
          <li
            key={b.name}
            className="px-4 py-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Folder className="size-4 text-stone-500" />
              <div>
                <div className="text-[13px] font-medium font-mono">
                  {b.name}
                </div>
                <div className="text-[11px] text-stone-500">
                  {b.files} files · {b.size}
                </div>
              </div>
            </div>
            <span
              className={`text-[10px] uppercase rounded px-1.5 py-0.5 ${
                b.public
                  ? "bg-amber-100 text-amber-800"
                  : "bg-stone-100 text-stone-500"
              }`}
            >
              {b.public ? "Public" : "Private"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
