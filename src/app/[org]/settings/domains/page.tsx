import { SectionHeader, SettingsCard } from "@/components/settings/section";
import { Plus, Globe } from "lucide-react";

export default function Domains() {
  return (
    <>
      <SectionHeader
        title="Domains"
        description="Manage which domains your app and marketing site live on, and how email is routed."
      />
      <SettingsCard title="Domains">
        <div className="rounded-md border border-dashed border-stone-300 p-8 text-center text-[12px] text-stone-500 flex flex-col items-center gap-2">
          <Globe className="size-5" />
          No domains added yet.
          <div className="flex gap-2 mt-2">
            <button className="inline-flex items-center gap-1 rounded-md bg-stone-900 text-white px-3 py-1.5 text-[12px]">
              <Plus className="size-3" />
              Add or buy a domain
            </button>
          </div>
        </div>
        <p className="text-[11px] text-stone-500">
          Propagation can take up to 24 hours. Buying through Cofounder runs DNS, nameserver, and Postmark setup automatically.
        </p>
      </SettingsCard>
      <SettingsCard title="Inbox domains" description="Once a domain is verified for inbound email, you can route it to specific agents in Settings → Inbox.">
        <p className="text-[12px] text-stone-500">
          No inbox-ready domains yet.
        </p>
      </SettingsCard>
    </>
  );
}
