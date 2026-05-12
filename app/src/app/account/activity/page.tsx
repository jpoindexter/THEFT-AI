import {
  SectionHeader,
  SettingsCard,
} from "@/components/settings/section";
import { Pill } from "@/components/ui/primitives";
import { Hint } from "@/components/ui/primitives";

type Tone = "sage" | "mustard" | "brick" | "neutral";

type Event = {
  when: string;
  workspace: string;
  action: string;
  detail: string;
  tone: Tone;
};

const ROWS: Event[] = [
  { when: "2m", workspace: "encompass-design", action: "approved", detail: "Engineer · subscriptions PR", tone: "sage" },
  { when: "12m", workspace: "theft", action: "edited memory", detail: "ICP: added mortgage tech", tone: "mustard" },
  { when: "1h", workspace: "theft", action: "signed in", detail: "MacBook Pro · Chrome · Valencia", tone: "neutral" },
  { when: "3h", workspace: "ana-co", action: "declined", detail: "Marketing · launch broadcast", tone: "brick" },
  { when: "yesterday", workspace: "theft", action: "rotated key", detail: "Anthropic API key", tone: "sage" },
];

export default function AccountActivityPage() {
  return (
    <>
      <SectionHeader
        title="Activity"
        description="Audit log of everything you've done across every workspace."
      />

      <SettingsCard>
        <ul className="divide-y divide-line/60">
          {ROWS.map((r, i) => (
            <li
              key={i}
              className="py-2.5 grid grid-cols-12 items-center text-sm"
            >
              <div className="col-span-1 text-2xs text-ink-soft">{r.when}</div>
              <div className="col-span-2 font-mono text-2xs truncate">
                {r.workspace}
              </div>
              <div className="col-span-2">
                <Pill tone={r.tone}>{r.action}</Pill>
              </div>
              <div className="col-span-7 text-xs text-ink-muted truncate">
                {r.detail}
              </div>
            </li>
          ))}
        </ul>
        <Hint>
          Workspaces can extend retention beyond 30 days under their own audit
          settings; account-level activity always shows the last 30 days.
        </Hint>
      </SettingsCard>
    </>
  );
}
