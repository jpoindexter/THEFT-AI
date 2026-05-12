import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "@/lib/db/store";

export default async function DevLogin() {
  const orgs = await db.listOrgs();
  const target = orgs[0]?.slug;
  if (!target) redirect("/onboarding");
  const c = await cookies();
  c.set("theft-dev-session", "dev", {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect(`/${target}`);
}
