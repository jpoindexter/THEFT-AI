"use client";

import { useState } from "react";
import {
  SectionHeader,
  SettingsCard,
  Row,
} from "@/components/settings/section";
import { Switch } from "@/components/ui/switch";
import { ButtonPrimary, Pill } from "@/components/ui/primitives";
import { ShieldCheck, Laptop, Smartphone, X } from "lucide-react";
import { toast } from "@/components/toast-host";

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
    label: "Desktop · Firefox",
    Icon: Laptop,
    last: "5d",
    location: "Lisbon, PT",
    current: false,
  },
];

export default function AccountSecurityPage() {
  const [twoFA, setTwoFA] = useState(true);
  const [stepUpBilling, setStepUpBilling] = useState(true);

  return (
    <>
      <SectionHeader
        title="Security"
        description="Account-level: 2FA, hardware keys, and every active session across every workspace."
      />

      <SettingsCard title="Two-factor">
        <Row
          label="Two-factor authentication"
          hint="WebAuthn, TOTP, or SMS. Required for new-device sign-in."
        >
          <span className="inline-flex items-center gap-2">
            <Pill tone={twoFA ? "sage" : "mustard"}>
              {twoFA ? "On" : "Off"}
            </Pill>
            <Switch checked={twoFA} onCheckedChange={setTwoFA} />
          </span>
        </Row>
        <Row
          label="Step up before billing changes"
          hint="Require a fresh 2FA challenge when adding a payment method or upgrading a plan."
        >
          <Switch
            checked={stepUpBilling}
            onCheckedChange={setStepUpBilling}
          />
        </Row>
      </SettingsCard>

      <SettingsCard
        title="Active sessions"
        description="Sign out anywhere a device shouldn't be authenticated."
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
        <button
          onClick={() => toast("All other sessions signed out", "ok")}
          className="mt-2 text-2xs rounded-md border border-brick/40 bg-paper text-brick-ink px-2 py-1 hover:bg-brick/10"
        >
          Sign out all other sessions
        </button>
      </SettingsCard>

      <div className="flex justify-end pt-2 gap-2">
        <ButtonPrimary
          onClick={() => toast("Security settings saved", "ok")}
          className="inline-flex items-center gap-1"
        >
          <ShieldCheck className="size-3.5" /> Save
        </ButtonPrimary>
      </div>
    </>
  );
}
