import { notFound } from "next/navigation";
import { db } from "@/lib/db/store";
import MarketingCanvas from "@/components/marketing-canvas";

export default async function MarketingPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) notFound();
  return <MarketingCanvas />;
}
