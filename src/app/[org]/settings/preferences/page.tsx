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
          <button className="text-[12px] rounded-md border border-stone-200 px-2 py-1 hover:border-stone-400">
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
          <div className="inline-flex rounded-md border border-stone-200 overflow-hidden text-[12px]">
            <button className="px-3 py-1.5 hover:bg-stone-100">Light</button>
            <button className="px-3 py-1.5 bg-stone-100">System</button>
            <button className="px-3 py-1.5 hover:bg-stone-100">Dark</button>
          </div>
        </Row>
        <Row label="Shadows" hint="Soft drop shadow on cards">
          <Switch defaultChecked />
        </Row>
      </SettingsCard>

      <SettingsCard>
        <div>
          <h2 className="text-[14px] font-medium text-red-700">Danger Zone</h2>
          <p className="text-[12px] text-stone-500">
            Once you delete your account, there is no going back.
          </p>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="mt-3 text-[12px] rounded-md border border-red-300 text-red-700 px-3 py-1 hover:bg-red-50"
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
