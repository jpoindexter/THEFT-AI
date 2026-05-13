"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  FileLock2,
  Building2,
  Inbox,
  LifeBuoy,
  Globe,
  CreditCard,
  FileText,
} from "lucide-react";

const SECTIONS = [
  { slug: "organization", label: "Organization", Icon: Building2 },
  { slug: "company-context", label: "Company Context", Icon: FileText },
  { slug: "ai-settings", label: "AI Settings", Icon: Sparkles },
  { slug: "env", label: "Env Files & Secrets", Icon: FileLock2 },
  { slug: "inbox", label: "Inbox", Icon: Inbox },
  { slug: "payments", label: "Payments", Icon: CreditCard },
  { slug: "domains", label: "Domains", Icon: Globe },
  { slug: "support", label: "Support", Icon: LifeBuoy },
];

export default function SettingsNav({ org }: { org: string }) {
  const pathname = usePathname();
  return (
    <>
      {SECTIONS.map(({ slug, label, Icon }) => {
        const active = pathname.includes(`/settings/${slug}`);
        return (
          <Link
            key={slug}
            href={`/${org}/settings/${slug}`}
            className={`rounded-md px-2 py-1.5 hover:bg-line/50 inline-flex items-center gap-2 ${
              active ? "bg-line/50 text-ink font-medium" : ""
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
