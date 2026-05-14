import { cookies } from "next/headers";

export async function hasLocalSession(): Promise<boolean> {
  const jar = await cookies();
  return jar.get("theft-dev-session")?.value === "dev";
}
