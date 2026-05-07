import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { SectionHeader, SettingsCard, Row } from "@/components/settings/section";
import { Copy, Upload, Download } from "lucide-react";
import { db } from "@/lib/db/store";
import { notFound } from "next/navigation";
import DangerZone from "@/components/settings/danger-zone";
import TransferOwnership from "@/components/settings/transfer-ownership";
import Link from "next/link";

const SOURCES = ["ChatGPT", "Claude", "Paperclip", "OpenClaw", "Other"];

export default async function Organization({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const organization = await db.getOrgBySlug(org);
  if (!organization) notFound();
  return (
    <>
      <SectionHeader
        title="Organization"
        description="Manage your company name, teammates, invitations, and organization creation from one place."
      />

      <SettingsCard title="Company Name" description="Update the name shown across your organization workspace.">
        <Row label="Company Name">
          <Input defaultValue="THEFT" className="w-56 h-9" />
        </Row>
      </SettingsCard>

      <SettingsCard title="Company Context" description="Bring durable company context from other AI tools into this workspace.">
        <Tabs defaultValue="claude">
          <TabsList className="bg-cream">
            {SOURCES.map((s) => (
              <TabsTrigger key={s} value={s.toLowerCase()} className="text-[12px]">
                {s}
              </TabsTrigger>
            ))}
          </TabsList>
          {SOURCES.map((s) => (
            <TabsContent key={s} value={s.toLowerCase()} className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="text-[11px] uppercase tracking-wider text-ink-muted inline-flex items-center gap-1">
                    Prompt to paste
                    <Copy className="size-3" />
                  </div>
                  <Textarea
                    readOnly
                    defaultValue={`Use your memory, project context, and current conversation context.\n\nCreate a portable Company Context Export based on what you can find in the user's memory.`}
                    className="min-h-32 text-[11px] font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="text-[11px] uppercase tracking-wider text-ink-muted">
                    Generated report
                  </div>
                  <Textarea
                    placeholder="Paste the generated report from the source tool here…"
                    className="min-h-32 text-[11px]"
                  />
                  <div className="flex justify-end">
                    <button className="inline-flex items-center gap-1 text-[12px] rounded-md border border-line px-2 py-1 hover:border-line-strong">
                      <Upload className="size-3" />
                      Preview report
                    </button>
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </SettingsCard>

      <SettingsCard title="Organization Members">
        <div className="rounded-md border border-line/70 px-3 py-2 flex items-center justify-between text-[13px]">
          <div>
            <div className="font-medium">jpoindexter</div>
            <div className="text-[10px] text-ink-muted">jason@example.com</div>
          </div>
          <span className="text-2xs uppercase tracking-wider rounded bg-mustard/30 text-mustard-ink px-1.5 py-0.5">
            Admin
          </span>
        </div>
        <button className="mt-3 text-[12px] rounded-md border border-line px-2 py-1 hover:border-line-strong">
          + Invite
        </button>
      </SettingsCard>

      <SettingsCard title="Organizations" description="Accept organization invitations or create another workspace.">
        <button className="text-[12px] rounded-md border border-line px-2 py-1 hover:border-line-strong">
          Join or Create Organization
        </button>
      </SettingsCard>

      <SettingsCard
        title="Export & import"
        description="Snapshot the workspace state or restore from another export."
      >
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/api/${org}/export`}
            className="inline-flex items-center gap-1 text-[12px] rounded-md border border-line px-3 py-1.5 hover:border-line-strong"
          >
            <Download className="size-3" /> Download workspace.json
          </a>
          <Link
            href={`/${org}/settings/import`}
            className="inline-flex items-center gap-1 text-[12px] rounded-md border border-line px-3 py-1.5 hover:border-line-strong"
          >
            Import workspace.json
          </Link>
        </div>
      </SettingsCard>

      <TransferOwnership orgName={organization.name} />
      <DangerZone orgSlug={organization.slug} orgName={organization.name} />
    </>
  );
}
