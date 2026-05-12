import { notFound } from "next/navigation";
import { db } from "@/lib/db/store";
import { SectionHeader, SettingsCard } from "@/components/settings/section";
import AISettingsForm from "@/components/settings/ai-settings-form";

export default async function AISettings({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const organization = await db.getOrgBySlug(org);
  if (!organization) notFound();

  return (
    <>
      <SectionHeader
        title="AI Settings"
        description="Choose the runtime and model IDs agents use. OAuth CLIs run through your local logged-in tools; local harnesses run through Ollama, LM Studio, or any OpenAI-compatible endpoint."
      />

      <SettingsCard
        title="Runtime and Models"
        description="Use OpenCode-style provider/model IDs. Examples: openai/gpt-5, openrouter/anthropic/claude-sonnet-4, ollama/qwen2.5:7b, lmstudio/local-model."
      >
        <AISettingsForm
          org={org}
          initialAiModel={organization.ai_model ?? "codex/gpt-5.5"}
          initialEngineerModel={organization.engineer_model ?? "codex/gpt-5.3-codex"}
          initialLlmBackend={organization.llm_backend ?? "codex-cli"}
          initialLlmBaseUrl={organization.llm_base_url ?? ""}
          initialGlobalPrompt={organization.global_prompt ?? ""}
          initialReviewBotMode={organization.review_bot_mode ?? "blockers"}
        />
      </SettingsCard>
    </>
  );
}
