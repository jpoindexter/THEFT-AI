import Link from "next/link";
import DatabaseNav from "./nav";

export default async function DatabaseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  return (
    <div className="absolute inset-0 grid grid-cols-[200px_1fr]">
      <aside className="border-r border-line/70 p-3 text-base flex flex-col gap-0.5 bg-canvas/50">
        <div className="px-2 py-1 text-xs text-ink-muted">
          {org}
          <div className="text-2xs text-ink-soft mt-0.5">Managed Supabase</div>
        </div>
        <div className="my-2 border-t border-line/70" />
        <DatabaseNav org={org} />
      </aside>
      <div className="overflow-y-auto p-6">{children}</div>
      <Link
        href={`/${org}`}
        className="absolute top-3 right-3 size-7 rounded-md hover:bg-line/60 inline-flex items-center justify-center text-ink-soft"
        aria-label="Close" title="Close"
      >
        ×
      </Link>
    </div>
  );
}
