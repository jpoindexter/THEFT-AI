"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { ArrowLeft, Share2, Command, KeyRound } from "lucide-react";

const NAV = [
  { href: "integrations", label: "Integrations", Icon: Share2 },
  { href: "integrations/mcp", label: "MCP", Icon: Command },
  { href: "integrations/new", label: "Custom Integrations", Icon: KeyRound },
];

export default function IntegrationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ org: string }>();
  const pathname = usePathname();
  const org = params.org;

  return (
    <div className="absolute inset-0 grid grid-cols-[220px_1fr] bg-cream">
      <aside className="border-r border-line/70 p-3 text-base flex flex-col gap-1">
        <Link
          href={`/${org}`}
          className="inline-flex items-center gap-1.5 text-ink-muted hover:text-ink px-2 py-1 mb-2"
        >
          <ArrowLeft className="size-3.5" /> Integrations
        </Link>
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === `/${org}/${href}` || pathname.startsWith(`/${org}/${href}/`);
          return (
            <Link
              key={href}
              href={`/${org}/${href}`}
              className={`rounded-md px-2 py-1.5 hover:bg-line/50 inline-flex items-center gap-2 ${
                active ? "bg-line/50 text-ink font-medium" : ""
              }`}
            >
              <Icon className="size-3.5 text-ink-soft" />
              {label}
            </Link>
          );
        })}
      </aside>
      <main className="overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
