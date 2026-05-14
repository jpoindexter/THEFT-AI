import { redirect } from "next/navigation";
import { db } from "@/lib/db/store";
import OnboardingFlow from "./flow";
import { hasLocalSession } from "@/lib/auth/session";

export default async function OnboardingPage() {
  const authed = await hasLocalSession();
  if (!authed) redirect("/signin");
  const orgs = await db.listOrgs();
  if (orgs.length > 0) redirect(`/${orgs[0].slug}`);
  return <OnboardingFlow />;
}
