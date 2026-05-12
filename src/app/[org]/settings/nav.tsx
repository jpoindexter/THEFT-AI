"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sliders,
  Sparkles,
  FileLock2,
  Bell,
  Building2,
  Inbox,
  LifeBuoy,
  CreditCard,
  Receipt,
  Wrench,
} from "lucide-react";

const SECTIONS = [
  { slug: "preferences", label: "Preferences", Icon: Sliders },
  { slug: "ai-settings", label: "AI Settings", Icon: Sparkles },
  { slug: "env", label: "Env Files & Secrets", Icon: FileLock2 },
  { slug: "notifications", label: "Notifications", Icon: Bell },
  { slug: "organization", label: "Organization", Icon: Building2 },
  { slug: "inbox", label: "Inbox", Icon: Inbox },
  { slug: "support", label: "Support", Icon: LifeBuoy },
  { slug: "stripe", label: "Stripe", Icon: CreditCard },
  { slug: "billing", label: "Billing", Icon: Receipt },
  { slug: "advanced", label: "Advanced", Icon: Wrench },
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
