import {
  SectionHeader,
  SettingsCard,
  Row,
} from "@/components/settings/section";
import { Switch } from "@/components/ui/switch";
import { Pill } from "@/components/ui/primitives";
import { ShieldCheck, Smartphone, Laptop, X } from "lucide-react";

const SESSIONS = [
  {
    id: "s1",
    label: "MacBook Pro · Chrome",
    Icon: Laptop,
    last: "now",
    location: "Valencia, ES",
    current: true,
  },
  {
    id: "s2",
    label: "iPhone · THEFT app",
    Icon: Smartphone,
    last: "2h",
    location: "Valencia, ES",
    current: false,
  },
  {
    id: "s3",
    label: "Linux laptop · Firefox",
    Icon: Laptop,
    last: "3d",
    location: "Lisbon, PT",
    current: false,
  },
];

const KEYS = [
  { id: "k1", name: "MacBook Pro · YubiKey 5C", added: "2025-12-12" },
  { id: "k2", name: "Backup · YubiKey 5", added: "2025-12-12" },
];

export default function SecuritySettings() {
  return (
    <>
      <SectionHeader
        title="Security"
        description="Two-factor methods, hardware keys, and active session control."
      />

      <SettingsCard>
        <Row
          label="Two-factor authentication"
          hint="Required after any new-device sign-in. Magic link still bypasses 2FA on the trusted device."
        >
          <span className="inline-flex items-center gap-2">
            <Pill tone="sage">On</Pill>
            <Switch defaultChecked />
          </span>
        </Row>
        <Row
          label="Require 2FA for billing changes"
          hint="Step up before adding/removing payment methods or upgrading plan."
        >
          <Switch defaultChecked />
        </Row>
        <Row
          label="Block agent-driven destructive actions"
          hint="Drops + truncates + force-pushes always need an explicit human approval, regardless of agent role."
        >
          <Switch defaultChecked />
        </Row>
      </SettingsCard>

      <SettingsCard
        title="Hardware keys"
        description="WebAuthn-based authenticators tied to this account."
      >
        <ul className="divide-y divide-line/60">
          {KEYS.map((k) => (
            <li
              key={k.id}
              className="py-2 flex items-center justify-between text-sm"
            >
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="size-3.5 text-ink-muted" />
                {k.name}
              </span>
              <span className="text-xs text-ink-muted">added {k.added}</span>
            </li>
          ))}
        </ul>
        <button className="mt-2 text-[11px] rounded-md border border-line px-2 py-1 hover:border-line-strong">
          + Register key
        </button>
      </SettingsCard>

      <SettingsCard
        title="Active sessions"
        description="Sign out anywhere a device shouldn't be authenticated. Sessions older than 30 days expire automatically."
      >
        <ul className="divide-y divide-line/60">
          {SESSIONS.map((s) => {
            const Icon = s.Icon;
            return (
              <li
                key={s.id}
                className="py-2.5 flex items-center justify-between gap-3"
              >
                <span className="flex items-center gap-3">
                  <span className="size-7 rounded-md bg-cream inline-flex items-center justify-center text-ink-muted shrink-0">
                    <Icon className="size-3.5" />
                  </span>
                  <span>
                    <span className="text-sm">{s.label}</span>
                    <div className="text-xs text-ink-muted">
                      {s.location} · last active {s.last}
                    </div>
                  </span>
                </span>
                {s.current ? (
                  <Pill tone="sage">This device</Pill>
                ) : (
                  <button
                    type="button"
                    title="Sign out"
                    className="size-7 rounded-md inline-flex items-center justify-center text-brick-ink hover:bg-brick/10"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        <button className="mt-2 text-[11px] rounded-md border border-brick/40 bg-brick/10 text-brick-ink px-2 py-1 hover:bg-brick/20">
          Sign out all other sessions
        </button>
      </SettingsCard>
    </>
  );
}
