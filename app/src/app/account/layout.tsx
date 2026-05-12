import Link from "next/link";
import {
  ArrowLeft,
  User,
  KeyRound,
  Bell,
  Building2,
  ScrollText,
} from "lucide-react";

const NAV = [
  { slug: "", label: "Profile", Icon: User },
  { slug: "security", label: "Security", Icon: KeyRound },
  { slug: "notifications", label: "Notifications", Icon: Bell },
  { slug: "workspaces", label: "Workspaces", Icon: Building2 },
  { slug: "activity", label: "Activity", Icon: ScrollText },
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 grid grid-cols-[220px_1fr] bg-cream">
      <aside className="border-r border-line/70 p-3 text-sm flex flex-col gap-1">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-ink-muted hover:text-ink px-2 py-1 mb-2"
        >
          <ArrowLeft className="size-3.5" /> Account
        </Link>
        {NAV.map(({ slug, label, Icon }) => (
          <Link
            key={slug || "profile"}
            href={`/account${slug ? `/${slug}` : ""}`}
            className="rounded-md px-2 py-1.5 hover:bg-line/50 inline-flex items-center gap-2 text-sm"
          >
            <Icon className="size-3.5 text-ink-soft" />
            {label}
          </Link>
        ))}
      </aside>
      <main className="overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
