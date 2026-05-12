"use client";

import { useState } from "react";
import {
  SectionHeader,
  SettingsCard,
  Row,
} from "@/components/settings/section";
import { ButtonPrimary, Pill } from "@/components/ui/primitives";
import { Camera, Mail } from "lucide-react";
import { toast } from "@/components/toast-host";

const WORKSPACES = [
  { slug: "encompass-design", name: "Encompass Design" },
  { slug: "theft", name: "THEFT" },
  { slug: "ana-co", name: "Ana Co" },
];

export default function AccountPage() {
  const [name, setName] = useState("Jason Poindexter");
  const [defaultWs, setDefaultWs] = useState("theft");
  const [timezone, setTimezone] = useState("Europe/Madrid");

  return (
    <>
      <SectionHeader
        title="Profile"
        description="Your identity across every workspace. Each workspace inherits these as defaults."
      />

      <SettingsCard>
        <Row label="Avatar" hint="Shown in @-mentions and across the canvas.">
          <button className="size-12 rounded-full bg-cream border border-line/70 inline-flex items-center justify-center text-ink-muted hover:border-line-strong">
            <Camera className="size-4" />
          </button>
        </Row>
        <Row label="Display name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-56 h-9 rounded-md border border-line bg-paper px-3 text-sm focus:outline-none focus:border-line-strong"
          />
        </Row>
        <Row label="Email" hint="Primary email for magic links and receipts.">
          <span className="inline-flex items-center gap-2 text-sm">
            <Mail className="size-3.5 text-ink-muted" />
            jason@theft.studio
            <Pill tone="sage">Verified</Pill>
          </span>
        </Row>
      </SettingsCard>

      <SettingsCard
        title="Defaults"
        description="Where you land and what timezone meetings render in."
      >
        <Row label="Default workspace">
          <select
            value={defaultWs}
            onChange={(e) => setDefaultWs(e.target.value)}
            className="w-56 h-9 rounded-md border border-line bg-paper px-2 text-sm"
          >
            {WORKSPACES.map((w) => (
              <option key={w.slug} value={w.slug}>
                {w.name}
              </option>
            ))}
          </select>
        </Row>
        <Row label="Timezone">
          <input
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-56 h-9 rounded-md border border-line bg-paper px-3 text-sm font-mono focus:outline-none focus:border-line-strong"
          />
        </Row>
      </SettingsCard>

      <div className="flex justify-end pt-2">
        <ButtonPrimary onClick={() => toast("Profile saved", "ok")}>
          Save changes
        </ButtonPrimary>
      </div>
    </>
  );
}
