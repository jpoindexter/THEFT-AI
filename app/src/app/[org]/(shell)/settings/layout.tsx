import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SettingsNav from "./nav";

export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  return (
    <div className="absolute inset-0 grid grid-cols-[220px_1fr] bg-cream">
      <aside className="border-r border-line/70 p-3 text-base flex flex-col gap-1">
        <Link
          href={`/${org}`}
          className="inline-flex items-center gap-1.5 text-ink-muted hover:text-ink px-2 py-1 mb-2"
        >
          <ArrowLeft className="size-3.5" /> Settings
        </Link>
        <SettingsNav org={org} />
      </aside>
      <main className="overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
