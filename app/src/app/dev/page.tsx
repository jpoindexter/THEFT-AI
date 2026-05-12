import { redirect } from "next/navigation";

export default async function DevLogin() {
  redirect("/api/dev-login");
}
