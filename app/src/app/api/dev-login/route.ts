import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function POST() {
  const orgs = await db.listOrgs();
  const target = orgs[0]?.slug;
  if (!target) {
    return NextResponse.json({ slug: null, redirect: "/onboarding" });
  }
  const res = NextResponse.json({ slug: target, redirect: `/${target}` });
  res.cookies.set("theft-dev-session", "dev", {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
