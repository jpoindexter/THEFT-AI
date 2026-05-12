import { redirect } from "next/navigation";
import { db } from "@/lib/db/store";
import OnboardingFlow from "./flow";

export default async function OnboardingPage() {
  const orgs = await db.listOrgs();
  if (orgs.length > 0) redirect(`/${orgs[0].slug}`);
  return <OnboardingFlow />;
}
