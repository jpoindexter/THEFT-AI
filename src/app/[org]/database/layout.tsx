import Link from "next/link";
import {
  Database,
  FileText,
  HardDrive,
  Lock,
  Users,
  KeyRound,
  ScrollText,
  Lightbulb,
} from "lucide-react";

const NAV = [
  { slug: "", label: "Database", Icon: Database },
  { slug: "migrations", label: "Migrations", Icon: FileText },
  { slug: "storage", label: "Storage", Icon: HardDrive },
  { slug: "auth", label: "Authentication", Icon: Lock },
  { slug: "users", label: "Users", Icon: Users },
  { slug: "secrets", label: "Secrets", Icon: KeyRound },
  { slug: "logs", label: "Logs", Icon: ScrollText },
  { slug: "suggestions", label: "Suggestions", Icon: Lightbulb },
];

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
          theft-ai
          <div className="text-2xs text-ink-soft mt-0.5">Managed Supabase</div>
        </div>
        <div className="my-2 border-t border-line/70" />
        {NAV.map(({ slug, label, Icon }) => {
          const href = slug
            ? `/${org}/database/${slug}`
            : `/${org}/database`;
          return (
            <Link
              key={slug || "root"}
              href={href}
              className="rounded-md px-2 py-1.5 inline-flex items-center gap-2 text-left text-ink-muted hover:bg-line/40"
            >
              <Icon className="size-3.5 text-ink-soft" />
              {label}
            </Link>
          );
        })}
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
