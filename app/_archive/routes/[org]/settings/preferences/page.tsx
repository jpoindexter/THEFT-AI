"use client";

import { useState } from "react";
import { SectionHeader, SettingsCard } from "@/components/settings/section";
import DeleteAccountDialog from "@/components/delete-account-dialog";
import { AlertTriangle, User } from "lucide-react";

export default function Preferences() {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <SectionHeader
        title="Preferences"
        description="Manage your profile, appearance, and account-level preferences."
      />

      <SettingsCard title="Profile Picture">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-full border border-line/70 bg-canvas flex items-center justify-center text-ink-soft shrink-0">
            <User className="size-8" />
          </div>
          <div>
            <button className="text-sm rounded-md border border-line px-2 py-1 hover:border-line-strong">
              Upload Photo
            </button>
            <p className="text-2xs text-ink-muted mt-1.5 max-w-xs leading-snug">
              Upload a profile picture. Images will be resized to 200×200 pixels and converted to WebP format. Maximum file size: 5MB. Supported formats: JPEG, PNG, WebP, GIF.
            </p>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Appearance">
        <div className="flex items-center justify-between">
          <span className="text-base">Theme</span>
          <div className="inline-flex rounded-md border border-line overflow-hidden text-sm">
            <button className="px-3 py-1.5 hover:bg-cream">Light</button>
            <button className="px-3 py-1.5 bg-cream font-medium">System</button>
            <button className="px-3 py-1.5 hover:bg-cream">Dark</button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base">Shadows</div>
            <p className="text-xs text-ink-muted">Soft drop shadow on cards</p>
          </div>
          <div className="inline-flex rounded-md border border-line overflow-hidden text-sm">
            <button className="px-3 py-1.5 bg-cream font-medium">On</button>
            <button className="px-3 py-1.5 hover:bg-cream">Off</button>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Personalization">
        <div className="space-y-3">
          <div>
            <label className="text-sm text-ink-muted block mb-1">Preferred Name</label>
            <input
              defaultValue="founder"
              className="w-full rounded-md border border-line/70 bg-paper px-3 py-1.5 text-base focus:outline-none focus:border-line-strong"
            />
          </div>
          <div>
            <label className="text-sm text-ink-muted block mb-1">Email</label>
            <input
              defaultValue="founder@example.com"
              disabled
              className="w-full rounded-md border border-line/70 bg-canvas px-3 py-1.5 text-base text-ink-muted focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-ink-muted block mb-1">Timezone</label>
            <select className="w-full rounded-md border border-line/70 bg-paper px-3 py-1.5 text-base focus:outline-none focus:border-line-strong appearance-none">
              <option>Europe/Madrid</option>
              <option>America/New_York</option>
              <option>America/Los_Angeles</option>
              <option>UTC</option>
            </select>
          </div>
        </div>
        <div className="rounded-md bg-mustard/15 border border-mustard/30 px-3 py-2.5 space-y-1.5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="size-3.5 text-mustard mt-0.5 shrink-0" />
            <span className="text-sm font-medium text-ink">Vercel project access unlocks after upgrading</span>
          </div>
          <p className="text-xs text-ink-muted">Vercel access is sent to your email once the workspace upgrades.</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-muted">Vercel · founder@example.com</span>
            <button className="text-xs text-ink-muted hover:text-ink">Don&apos;t after upgrade</button>
          </div>
        </div>
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
        onConfirm={() => setDeleteOpen(false)}
      />
    </>
  );
}
