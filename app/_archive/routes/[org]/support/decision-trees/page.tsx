import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { db } from "@/lib/db/store";
import { SectionHeader } from "@/components/settings/section";
import TreeList, { type DecisionTree } from "./tree-list";

const TREES: DecisionTree[] = [
  {
    id: "login-problems",
    title: "Login Problems",
    nodeCount: 8,
    updatedAt: "2026-05-03",
    tree: {
      label: "Can you reach the login page?",
      children: [
        {
          label: "Yes — have an account?",
          children: [
            {
              label: "Password login",
              children: [
                { label: "Reset password email sent" },
              ],
            },
            {
              label: "SSO / Google login",
              children: [
                { label: "Check Okta / Google Workspace config" },
              ],
            },
          ],
        },
        {
          label: "No — site unreachable",
          children: [
            { label: "Check status page at status.theft.studio" },
          ],
        },
      ],
    },
  },
  {
    id: "billing-questions",
    title: "Billing Questions",
    nodeCount: 11,
    updatedAt: "2026-05-07",
    tree: {
      label: "What is the billing question?",
      children: [
        {
          label: "View invoice",
          children: [
            { label: "Link to billing portal" },
          ],
        },
        {
          label: "Change plan",
          children: [
            {
              label: "Downgrade",
              children: [
                { label: "Confirm data loss warning → proceed" },
              ],
            },
            {
              label: "Upgrade",
              children: [
                { label: "Show plan comparison → checkout" },
              ],
            },
          ],
        },
        {
          label: "Cancel",
          children: [
            { label: "Retention offer → confirm cancellation" },
          ],
        },
      ],
    },
  },
];

export default async function DecisionTreesPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const organization = await db.getOrgBySlug(org);
  if (!organization) notFound();

  return (
    <>
      <div className="flex items-start justify-between mb-6">
        <SectionHeader
          title="Decision Trees"
          description="Structured resolution flows for common support scenarios."
        />
        <button
          type="button"
          className="shrink-0 inline-flex items-center gap-1.5 text-sm rounded-md bg-ink text-paper px-3 py-1.5 hover:opacity-90 whitespace-nowrap ml-4 mt-1"
        >
          <Plus className="size-3.5" />
          New tree
        </button>
      </div>
      <TreeList trees={TREES} />
    </>
  );
}
