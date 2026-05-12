"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/sidebar";
import OrgTopBar from "@/components/org-top-bar";
import OrgChatPanel from "@/components/org-chat-panel";

type Org = {
  id: string;
  slug: string;
  name: string;
};

export default function OrgShell({
  children,
  organization,
  orgName,
  founderInitial,
  hasPlan,
  orgs,
}: {
  children: React.ReactNode;
  organization: Org;
  orgName: string;
  founderInitial: string;
  hasPlan: boolean;
  orgs: { slug: string; name: string }[];
}) {
  const pathname = usePathname();
  const segs = pathname.replace(/^\/+|\/+$/g, "").split("/");

  const DEPT_SLUGS = new Set([
    "engineering", "design", "marketing", "sales",
    "operations", "finance", "legal", "support",
  ]);

  let breadcrumb = "Roadmap";
  if (segs[1] === "tasks") breadcrumb = "Tasks";
  else if (segs[1] === "approvals") breadcrumb = "Approvals";
  else if (segs[1] === "library") breadcrumb = "Library";
  else if (segs[1] && DEPT_SLUGS.has(segs[1]))
    breadcrumb = "Departments / " + capitalize(segs[1]);

  return (
    <div className="h-screen flex flex-col bg-canvas text-ink overflow-hidden">
      <OrgTopBar
        orgName={orgName}
        orgSlug={organization.slug}
        founderInitial={founderInitial}
        breadcrumb={breadcrumb}
        orgs={orgs}
      />
      <div
        className="flex-1 min-h-0"
        style={{ display: "grid", gridTemplateColumns: "232px 1fr 380px" }}
      >
        <Sidebar
          orgSlug={organization.slug}
          founderInitial={founderInitial}
          orgName={orgName}
        />
        <div className="relative flex flex-col min-w-0 min-h-0">
          {children}
        </div>
        <OrgChatPanel
          organization={organization}
          hasPlan={hasPlan}
        />
      </div>
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
