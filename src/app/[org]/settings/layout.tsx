import Link from "next/link";
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
  ArrowLeft,
  Globe,
  Brain,
} from "lucide-react";

const SECTIONS = [
  { slug: "preferences", label: "Preferences", Icon: Sliders },
  { slug: "ai-settings", label: "AI Settings", Icon: Sparkles },
  { slug: "env", label: "Env Files & Secrets", Icon: FileLock2 },
  { slug: "domains", label: "Domains", Icon: Globe },
  { slug: "notifications", label: "Notifications", Icon: Bell },
  { slug: "organization", label: "Organization", Icon: Building2 },
  { slug: "company-context", label: "Company Context", Icon: Brain },
  { slug: "inbox", label: "Inbox", Icon: Inbox },
  { slug: "support", label: "Support", Icon: LifeBuoy },
  { slug: "payments", label: "Payments", Icon: CreditCard },
  { slug: "stripe", label: "Stripe", Icon: CreditCard },
  { slug: "billing", label: "Billing", Icon: Receipt },
  { slug: "advanced", label: "Advanced", Icon: Wrench },
];

export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  return (
    <div className="absolute inset-0 grid grid-cols-[220px_1fr] bg-[#f5f4f0]">
      <aside className="border-r border-stone-200/80 p-3 text-[13px] flex flex-col gap-1">
        <Link
          href={`/${org}`}
          className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-900 px-2 py-1 mb-2"
        >
          <ArrowLeft className="size-3.5" /> Settings
        </Link>
        {SECTIONS.map(({ slug, label, Icon }) => (
          <Link
            key={slug}
            href={`/${org}/settings/${slug}`}
            className="rounded-md px-2 py-1.5 hover:bg-stone-200/50 inline-flex items-center gap-2"
          >
            <Icon className="size-3.5 text-stone-400" />
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
