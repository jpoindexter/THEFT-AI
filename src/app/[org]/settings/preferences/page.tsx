"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SectionHeader, SettingsCard, Row } from "@/components/settings/section";
import DeleteAccountDialog from "@/components/delete-account-dialog";

export default function Preferences() {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <SectionHeader
        title="Preferences"
        description="Manage your profile, appearance, and account-level preferences."
      />
      <SettingsCard title="Profile">
        <Row label="Profile picture" hint="200×200 px, JPG/PNG/WebP, 5MB max">
          <button className="text-sm rounded-md border border-line px-2 py-1 hover:border-line-strong">
            Upload Photo
          </button>
        </Row>
        <Row label="Preferred name">
          <Input defaultValue="founder" className="w-56 h-9" />
        </Row>
        <Row label="Email">
          <Input
            defaultValue="founder@example.com"
            className="w-56 h-9"
            disabled
          />
        </Row>
        <Row label="Timezone">
          <Input defaultValue="Europe/Madrid" className="w-56 h-9" />
        </Row>
      </SettingsCard>

      <SettingsCard title="Appearance">
        <Row label="Theme">
          <div className="inline-flex rounded-md border border-line overflow-hidden text-sm">
            <button className="px-3 py-1.5 hover:bg-cream">Light</button>
            <button className="px-3 py-1.5 bg-cream">System</button>
            <button className="px-3 py-1.5 hover:bg-cream">Dark</button>
          </div>
        </Row>
        <Row label="Shadows" hint="Soft drop shadow on cards">
          <Switch defaultChecked />
        </Row>
      </SettingsCard>

      <SettingsCard>
        <div>
          <h2 className="text-md font-medium text-brick-ink">Danger Zone</h2>
          <p className="text-sm text-ink-muted">
            Once you delete your account, there is no going back.
          </p>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="mt-3 text-sm rounded-md border border-brick/40 text-brick-ink px-3 py-1 hover:bg-brick/10"
          >
            Delete My Account
          </button>
        </div>
      </SettingsCard>

      <DeleteAccountDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={() => {
          // mock delete
          setDeleteOpen(false);
        }}
      />
    </>
  );
}
