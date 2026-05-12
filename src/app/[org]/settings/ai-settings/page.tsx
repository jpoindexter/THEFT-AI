import { Switch } from "@/components/ui/switch";
import { SectionHeader, SettingsCard, Row } from "@/components/settings/section";
import { db } from "@/lib/db/store";
import { notFound } from "next/navigation";
import AISettingsForm from "@/components/settings/ai-settings-form";

export default async function AISettings({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) notFound();

  return (
    <>
      <SectionHeader
        title="AI Settings"
        description="Manage global AI behavior and the model used for Cofounder conversations."
      />

      <SettingsCard title="Agent Configuration">
        <Row
          label="Suggested Tasks"
          hint="Show AI-generated task suggestions on the home pane based on recent work, open PRs, and user input."
        >
          <Switch defaultChecked />
        </Row>
        <Row
          label="Queue messages by default while an agent is running"
          hint="When an agent is running, Enter queues your message for the next turn instead of starting a new run immediately."
        >
          <Switch defaultChecked />
        </Row>
        <AISettingsForm
          org={org}
          initialAiModel={o.ai_model ?? "sonnet-4-6"}
          initialEngineerModel={o.engineer_model ?? "opus-4-7"}
          initialGlobalPrompt={o.global_prompt ?? ""}
          initialReviewBotMode={o.review_bot_mode ?? "blockers"}
        />
      </SettingsCard>

      <SettingsCard
        title="Browser test credentials"
        description="Used by the Engineer when it needs to log into the running app. Stored encrypted; never shown back."
      >
        <Row label="Email">
          <input
            type="email"
            placeholder="test@theft.ai"
            className="w-72 h-9 rounded-md border border-line bg-paper px-3 text-base focus:outline-none focus:border-line-strong"
          />
        </Row>
        <Row label="Password">
          <input
            type="password"
            placeholder="••••••••"
            className="w-72 h-9 rounded-md border border-line bg-paper px-3 text-base font-mono focus:outline-none focus:border-line-strong"
          />
        </Row>
      </SettingsCard>
    </>
  );
}
