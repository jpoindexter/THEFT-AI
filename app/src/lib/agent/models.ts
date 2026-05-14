export type ModelProvider = {
  id: string;
  name: string;
  mode: "oauth-cli" | "api" | "local" | "proxy" | "offline";
  env?: string[];
  baseUrl?: string;
  models: Array<{
    id: string;
    name: string;
    recommended?: boolean;
    local?: boolean;
    notes?: string;
  }>;
};

export const LLM_BACKENDS = [
  { id: "codex-cli", name: "Codex CLI", description: "Uses local Codex OAuth/session auth, WorkspaceSync-style." },
  { id: "gemini-cli", name: "Gemini CLI", description: "Uses local Gemini CLI auth and model config." },
  { id: "opencode-cli", name: "OpenCode CLI", description: "Uses OpenCode's provider/model registry and local credentials." },
  { id: "claude-cli", name: "Claude CLI", description: "Uses Claude Code OAuth/session auth." },
  { id: "ollama", name: "Ollama", description: "Runs local Ollama models through the native chat API." },
  { id: "lmstudio", name: "LM Studio", description: "Runs a local OpenAI-compatible LM Studio server." },
  { id: "openai-compatible", name: "OpenAI-compatible", description: "Runs any compatible local or hosted endpoint." },
  { id: "anthropic", name: "Anthropic API", description: "Uses ANTHROPIC_API_KEY." },
  { id: "offline", name: "Offline fallback", description: "Deterministic local responses for setup and onboarding." },
] as const;

export const MODEL_PROVIDERS: ModelProvider[] = [
  {
    id: "opencode",
    name: "OpenCode-managed",
    mode: "oauth-cli",
    models: [
      { id: "openai/gpt-5", name: "OpenAI GPT-5", recommended: true },
      { id: "anthropic/claude-sonnet-4-6", name: "Claude Sonnet 4.6" },
      { id: "google/gemini-3-pro", name: "Gemini 3 Pro" },
      { id: "openrouter/openai/gpt-5", name: "OpenRouter GPT-5" },
      { id: "github-copilot/gpt-5-mini", name: "GitHub Copilot GPT-5 Mini" },
    ],
  },
  {
    id: "gemini",
    name: "Gemini CLI",
    mode: "oauth-cli",
    models: [
      { id: "gemini-3-pro", name: "Gemini 3 Pro", recommended: true },
      { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
      { id: "default", name: "Default (CLI config)" },
    ],
  },
  {
    id: "codex",
    name: "Codex CLI",
    mode: "oauth-cli",
    models: [
      { id: "gpt-5.5", name: "GPT-5.5", recommended: true },
      { id: "gpt-5.4", name: "GPT-5.4" },
      { id: "gpt-5.3-codex", name: "GPT-5.3 Codex" },
      { id: "gpt-5.3-codex-spark", name: "GPT-5.3 Codex Spark" },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    mode: "api",
    env: ["ANTHROPIC_API_KEY"],
    models: [
      { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", recommended: true },
      { id: "claude-opus-4-7", name: "Claude Opus 4.7" },
      { id: "claude-haiku-4-5", name: "Claude Haiku 4.5" },
    ],
  },
  {
    id: "ollama",
    name: "Ollama",
    mode: "local",
    baseUrl: "http://localhost:11434",
    models: [
      { id: "qwen2.5:7b", name: "Qwen 2.5 7B", recommended: true, local: true },
      { id: "llama3.1:8b", name: "Llama 3.1 8B", local: true },
      { id: "gpt-oss:20b", name: "GPT OSS 20B", local: true },
      { id: "mistral:7b", name: "Mistral 7B", local: true },
      { id: "deepseek-r1:8b", name: "DeepSeek R1 8B", local: true },
    ],
  },
  {
    id: "lmstudio",
    name: "LM Studio",
    mode: "local",
    baseUrl: "http://localhost:1234/v1",
    models: [
      { id: "local-model", name: "Loaded LM Studio model", recommended: true, local: true },
    ],
  },
  {
    id: "openai-compatible",
    name: "OpenAI-compatible",
    mode: "proxy",
    models: [
      { id: "local-model", name: "Custom compatible model", recommended: true },
    ],
  },
];

export function splitProviderModel(value: string | null | undefined) {
  if (!value) return null;
  const [provider, ...rest] = value.split("/");
  if (!provider || rest.length === 0) return { provider: null, model: value };
  return { provider, model: rest.join("/") };
}
