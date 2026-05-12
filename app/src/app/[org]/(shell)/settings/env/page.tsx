import { SectionHeader } from "@/components/settings/section";
import { FileText, Download, Upload } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function EnvFiles() {
  return (
    <>
      <SectionHeader
        title="Environment Files & Secrets"
        description="Upload .env files and manage project secrets from one place."
      />

      <section className="rounded-lg border border-line/70 bg-paper p-5 mb-4 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <h2 className="text-md font-medium">Environment Files</h2>
            <p className="text-sm text-ink-muted">
              Securely store encrypted .env files for your projects. Click a file to view and edit individual variables.
            </p>
          </div>
          <button className="shrink-0 inline-flex items-center gap-1 text-sm rounded-md border border-line px-2.5 py-1 hover:border-line-strong">
            <Upload className="size-3" />
            Upload
          </button>
        </div>
        <div className="rounded-md border border-dashed border-line/60 p-8 text-center flex flex-col items-center gap-2">
          <FileText className="size-5 text-ink-muted" />
          <p className="text-sm text-ink-muted">
            No environment files uploaded yet. Upload a .env file to securely share your configuration.
          </p>
          <button className="mt-1 inline-flex items-center gap-1 text-sm rounded-md border border-line px-2.5 py-1 hover:border-line-strong">
            <Upload className="size-3" />
            Upload Your First .env File
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-line/70 bg-paper p-5 mb-4 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <h2 className="text-md font-medium">Managed Vercel Staging Export</h2>
            <p className="text-sm text-ink-muted">
              Download the staging environment variables from your managed Vercel app or marketing website as a .env file.
            </p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="space-y-2">
          <div className="space-y-1">
            <div className="text-xs text-ink-muted">Product</div>
            <select className="w-full rounded-md border border-line bg-paper px-3 py-1.5 text-sm focus:outline-none focus:border-line-strong">
              <option>App</option>
              <option>Marketing Website</option>
            </select>
          </div>
          <div className="text-2xs text-ink-muted">Managed project: cofounder-3-21559</div>
          <button className="inline-flex items-center gap-1 text-sm rounded-md border border-line px-2.5 py-1.5 hover:border-line-strong">
            <Download className="size-3" />
            Download Staging .env
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-line/70 bg-paper p-5 mb-4 space-y-4">
        <div className="space-y-0.5">
          <h2 className="text-md font-medium">Secrets</h2>
          <p className="text-sm text-ink-muted">
            API keys synced directly to your Vercel projects. Values are never stored on our systems.
          </p>
        </div>
        <div className="space-y-1.5">
          <SecretRow label="App" project="cofounder-3-21559" />
          <SecretRow label="Marketing Website" project="cofounder-3-21559-marketing" />
        </div>
        <div className="text-xs text-ink-muted">No secrets added yet.</div>
        <button className="text-sm rounded-md border border-line px-2 py-1 hover:border-line-strong">
          + Add Secret
        </button>
      </section>
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
