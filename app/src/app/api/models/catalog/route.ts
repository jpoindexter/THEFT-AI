import { ok } from "@/lib/api/responses";
import { LLM_BACKENDS, MODEL_PROVIDERS } from "@/lib/agent/models";

export async function GET() {
  return ok({
    backends: LLM_BACKENDS,
    providers: MODEL_PROVIDERS,
    modelFormat: "provider/model",
    customModelHint: "OpenCode model IDs use provider/model, for example openai/gpt-5 or openrouter/anthropic/claude-sonnet-4.",
  });
}
