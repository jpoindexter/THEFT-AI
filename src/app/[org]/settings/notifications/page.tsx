import { Switch } from "@/components/ui/switch";
import { SectionHeader, SettingsCard, Row } from "@/components/settings/section";

export default function Notifications() {
  return (
    <>
      <SectionHeader
        title="Notifications"
        description="Control how Cofounder notifies you about completed work and approvals."
      />
      <SettingsCard>
        <Row
          label="Desktop alerts"
          hint="Show system notifications for approvals, questions, and events that need your attention."
        >
          <Switch />
        </Row>
        <Row
          label="Only when I'm away"
          hint="Skip alerts when you're active in Cofounder."
        >
          <Switch defaultChecked />
        </Row>
        <Row
          label="Hide task details"
          hint="Keep task names out of system notifications."
        >
          <Switch defaultChecked />
        </Row>
      </SettingsCard>
    </>
  );
}
