import { err, ok } from "@/lib/api/responses";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const baseUrl = (url.searchParams.get("baseUrl") ?? process.env.LMSTUDIO_URL ?? "http://localhost:1234/v1").replace(/\/$/, "");
  try {
    const res = await fetch(`${baseUrl}/models`, {
      headers: { Authorization: `Bearer ${process.env.OPENAI_COMPAT_API_KEY ?? "not-needed"}` },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return err(502, "lmstudio_list_failed", `LM Studio returned ${res.status}`, { baseUrl, data });
    return ok({ ok: true, baseUrl, models: Array.isArray(data?.data) ? data.data : [] });
  } catch (e) {
    return err(502, "lmstudio_unavailable", e instanceof Error ? e.message : "Could not reach LM Studio", { baseUrl });
  }
}
