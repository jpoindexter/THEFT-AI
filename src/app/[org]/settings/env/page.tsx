import { SectionHeader, SettingsCard } from "@/components/settings/section";
import { FileText, Download, Upload } from "lucide-react";

export default function EnvFiles() {
  return (
    <>
      <SectionHeader
        title="Environment Files & Secrets"
        description="Upload .env files and manage project secrets from one place."
      />

      <SettingsCard title="Environment Files" description="Securely store encrypted .env files for your projects.">
        <div className="rounded-md border border-dashed border-line-strong p-8 text-center text-sm text-ink-muted flex flex-col items-center gap-2">
          <FileText className="size-5" />
          No environment files uploaded yet. Upload a .env file to securely share your configuration.
          <button className="mt-2 inline-flex items-center gap-1 text-sm rounded-md bg-ink text-paper px-2.5 py-1">
            <Upload className="size-3" />
            Upload your first .env file
          </button>
        </div>
      </SettingsCard>

      <SettingsCard title="Managed Vercel Staging Export" description="Download the staging environment variables from your managed Vercel app or marketing website as a .env file.">
        <div className="rounded-md border border-line/70 px-3 py-2 flex items-center justify-between text-base">
          <span>App</span>
          <button className="inline-flex items-center gap-1 text-sm rounded-md border border-line px-2 py-1 hover:border-line-strong">
            <Download className="size-3" />
            Download Staging .env
          </button>
        </div>
      </SettingsCard>

      <SettingsCard title="Secrets" description="API keys synced directly to your Vercel projects. Values are never stored on our systems.">
        <div className="space-y-1.5">
          <SecretRow label="App" project="theft-app" />
          <SecretRow label="Marketing Website" project="theft-marketing" />
        </div>
        <button className="mt-3 text-sm rounded-md border border-line px-2 py-1 hover:border-line-strong">
          + Add Secret
        </button>
      </SettingsCard>
    </>
  );
}

function SecretRow({ label, project }: { label: string; project: string }) {
  return (
    <div className="rounded-md border border-line/70 px-3 py-1.5 flex items-center justify-between text-sm">
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-2xs text-ink-muted">{project}</div>
      </div>
      <button className="text-xs rounded-md border border-line px-2 py-0.5 hover:border-line-strong">
        View on Vercel
      </button>
    </div>
  );
}
