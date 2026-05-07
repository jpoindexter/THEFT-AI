"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

export default function DatabaseNav({ org }: { org: string }) {
  const pathname = usePathname();
  return (
    <>
      {NAV.map(({ slug, label, Icon }) => {
        const href = slug ? `/${org}/database/${slug}` : `/${org}/database`;
        const active = slug
          ? pathname.includes(`/database/${slug}`)
          : pathname === `/${org}/database`;
        return (
          <Link
            key={slug || "root"}
            href={href}
            className={`rounded-md px-2 py-1.5 inline-flex items-center gap-2 text-left hover:bg-line/40 ${
              active ? "bg-line/40 text-ink font-medium" : "text-ink-muted"
            }`}
          >
            <Icon className="size-3.5 text-ink-soft" />
            {label}
          </Link>
        );
      })}
    </>
  );
}
