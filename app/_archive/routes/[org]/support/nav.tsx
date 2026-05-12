"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LifeBuoy, BookOpen, GitFork } from "lucide-react";

const SECTIONS = [
  { slug: "", label: "Support Hub", Icon: LifeBuoy },
  { slug: "knowledge-base", label: "Knowledge Base", Icon: BookOpen },
  { slug: "decision-trees", label: "Decision Trees", Icon: GitFork },
];

export default function SupportNav({ org }: { org: string }) {
  const pathname = usePathname();
  return (
    <>
      {SECTIONS.map(({ slug, label, Icon }) => {
        const href = slug ? `/${org}/support/${slug}` : `/${org}/support`;
        const active = slug
          ? pathname.includes(`/support/${slug}`)
          : pathname === `/${org}/support` || pathname.endsWith("/support");
        return (
          <Link
            key={label}
            href={href}
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
