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
        description="Manage global AI behavior and the model used for Operator conversations."
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

    </>
  );
}
