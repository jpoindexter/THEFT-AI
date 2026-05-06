import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionHeader, SettingsCard, Row } from "@/components/settings/section";

export default function AISettings() {
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
        <Row label="Cofounder Review Bot mode" hint="Controls how selective Cofounder Review Bot is when reviewing GitHub repositories.">
          <Select defaultValue="blockers">
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="off">Off</SelectItem>
              <SelectItem value="blockers">Blockers only</SelectItem>
              <SelectItem value="all">All comments</SelectItem>
            </SelectContent>
          </Select>
        </Row>
        <div className="space-y-1">
          <div className="text-[13px]">Global Prompt Personalization</div>
          <p className="text-[11px] text-stone-500">
            Add context that should be included globally across chats and agents.
          </p>
          <Textarea
            placeholder="Example: be direct. Prefer bullets over paragraphs. Flag assumptions explicitly."
            className="min-h-24"
          />
          <div className="flex justify-end">
            <button className="text-[11px] rounded-md bg-stone-900 text-white px-3 py-1">
              Save
            </button>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="AI Model" description="Choose which AI model powers your Cofounder conversations.">
        <Row label="Cofounder">
          <Select defaultValue="sonnet-4-6">
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sonnet-4-6">Claude Sonnet 4.6</SelectItem>
              <SelectItem value="opus-4-7">Claude Opus 4.7</SelectItem>
              <SelectItem value="haiku-4-5">Claude Haiku 4.5</SelectItem>
            </SelectContent>
          </Select>
        </Row>
      </SettingsCard>
    </>
  );
}
