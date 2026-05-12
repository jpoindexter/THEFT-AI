import { z } from "zod";
import { err, invalidInput, ok } from "@/lib/api/responses";

const Body = z.object({
  model: z.string().min(1).max(200),
  baseUrl: z.string().url().optional(),
});

function baseUrl(value?: string) {
  return (value ?? process.env.OLLAMA_URL ?? "http://localhost:11434").replace(/\/$/, "");
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const target = baseUrl(url.searchParams.get("baseUrl") ?? undefined);
  try {
    const [versionRes, tagsRes] = await Promise.all([
      fetch(`${target}/api/version`),
      fetch(`${target}/api/tags`),
    ]);
    const version = versionRes.ok ? await versionRes.json().catch(() => null) : null;
    const tags = tagsRes.ok ? await tagsRes.json().catch(() => null) : null;
    return ok({
      ok: tagsRes.ok,
      baseUrl: target,
      version,
      models: Array.isArray(tags?.models) ? tags.models : [],
    });
  } catch (e) {
    return err(502, "ollama_unavailable", e instanceof Error ? e.message : "Could not reach Ollama", { baseUrl: target });
  }
}

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return invalidInput(parsed.error);
  const target = baseUrl(parsed.data.baseUrl);

  try {
    const res = await fetch(`${target}/api/pull`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: parsed.data.model, stream: false }),
    });
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      return err(502, "ollama_pull_failed", text.slice(0, 500) || `Ollama returned ${res.status}`, { baseUrl: target });
    }
    return ok({ ok: true, baseUrl: target, model: parsed.data.model, result: parseMaybeJson(text) });
  } catch (e) {
    return err(502, "ollama_unavailable", e instanceof Error ? e.message : "Could not reach Ollama", { baseUrl: target });
  }
}

function parseMaybeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
