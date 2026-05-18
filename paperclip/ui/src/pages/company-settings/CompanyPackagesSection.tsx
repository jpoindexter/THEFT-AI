import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsSection } from "./SettingsSection";

export function CompanyPackagesSection() {
  return (
    <SettingsSection title="Company Packages">
      <div className="rounded-md border border-border px-4 py-4">
        <p className="text-sm text-muted-foreground">
          Import and export have moved to dedicated pages accessible from the{" "}
          <a href="/org" className="underline hover:text-foreground">Org Chart</a> header.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <Button size="sm" variant="outline" asChild>
            <a href="/company/export">
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export
            </a>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href="/company/import">
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              Import
            </a>
          </Button>
        </div>
      </div>
    </SettingsSection>
  );
}
