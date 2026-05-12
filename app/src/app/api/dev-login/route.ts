import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";

async function resolveDevLogin() {
  const orgs = await db.listOrgs();
  const target = orgs[0]?.slug;
  return target ? `/${target}` : "/onboarding";
}

function setDevCookie(res: NextResponse) {
  res.cookies.set("theft-dev-session", "dev", {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function GET(req: Request) {
  const redirectTo = await resolveDevLogin();
  const res = NextResponse.redirect(new URL(redirectTo, req.url));
  setDevCookie(res);
  return res;
}

export async function POST() {
  const redirectTo = await resolveDevLogin();
  const target = redirectTo === "/onboarding" ? null : redirectTo.slice(1);
  if (!target) {
    return NextResponse.json({ slug: null, redirect: "/onboarding" });
  }
  const res = NextResponse.json({ slug: target, redirect: redirectTo });
  setDevCookie(res);
  return res;
}
