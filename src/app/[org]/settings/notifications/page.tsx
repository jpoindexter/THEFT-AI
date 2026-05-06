import { Switch } from "@/components/ui/switch";
import {
  SectionHeader,
  SettingsCard,
  Row,
} from "@/components/settings/section";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pill } from "@/components/ui/primitives";

const EVENT_TYPES = [
  {
    key: "review_required",
    label: "Review required",
    body: "Approvals, plan reviews, brand or copy decisions.",
    defaultDest: "desktop_email",
  },
  {
    key: "agent_question",
    label: "Agent asked a question",
    body: "Cofounder or department agents need a clarification.",
    defaultDest: "desktop",
  },
  {
    key: "agent_done",
    label: "Agent finished a task",
    body: "Run completed; results land in Library or PR.",
    defaultDest: "email",
  },
  {
    key: "agent_failed",
    label: "Agent run failed",
    body: "Errors during a task that need attention.",
    defaultDest: "desktop_email",
  },
  {
    key: "build_status",
    label: "Build / deploy status",
    body: "Vercel preview ready, prod merge succeeded, etc.",
    defaultDest: "email",
  },
  {
    key: "billing",
    label: "Billing & costs",
    body: "Budget thresholds, invoice failures, plan changes.",
    defaultDest: "email",
  },
];

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
          <Switch defaultChecked />
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

      <SettingsCard
        title="Per-event routing"
        description="Pick where each kind of event shows up. The bell in Canvas always reflects unread items."
      >
        <ul className="divide-y divide-line/60">
          {EVENT_TYPES.map((e) => (
            <li
              key={e.key}
              className="py-2.5 grid grid-cols-[1fr_auto] items-start gap-3"
            >
              <div>
                <div className="text-sm font-medium">{e.label}</div>
                <div className="text-xs text-ink-muted">{e.body}</div>
              </div>
              <Select defaultValue={e.defaultDest}>
                <SelectTrigger className="h-8 text-xs w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="off">Off</SelectItem>
                  <SelectItem value="desktop">Desktop only</SelectItem>
                  <SelectItem value="email">Email only</SelectItem>
                  <SelectItem value="desktop_email">Desktop + email</SelectItem>
                </SelectContent>
              </Select>
            </li>
          ))}
        </ul>
      </SettingsCard>

      <SettingsCard
        title="Quiet hours"
        description="Hold non-critical notifications until quiet hours end."
      >
        <Row label="Enabled">
          <Switch defaultChecked />
        </Row>
        <Row label="From">
          <input
            type="time"
            defaultValue="22:00"
            className="h-8 rounded-md border border-line bg-paper px-2 text-xs"
          />
        </Row>
        <Row label="To">
          <input
            type="time"
            defaultValue="08:00"
            className="h-8 rounded-md border border-line bg-paper px-2 text-xs"
          />
        </Row>
        <p className="text-xs text-ink-muted">
          <Pill tone="mustard">Critical only</Pill> — agent errors and approvals
          for time-sensitive items still come through.
        </p>
      </SettingsCard>
    </>
  );
}
