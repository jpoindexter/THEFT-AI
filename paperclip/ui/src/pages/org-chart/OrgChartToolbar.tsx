import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/router";

export function OrgChartToolbar() {
  return (
    <div className="mb-2 flex shrink-0 flex-wrap items-center justify-start gap-2">
      <Link to="/company/import">
        <Button variant="outline" size="sm">
          <Upload className="size-3.5" />
          Import company
        </Button>
      </Link>
      <Link to="/company/export">
        <Button variant="outline" size="sm">
          <Download className="size-3.5" />
          Export company
        </Button>
      </Link>
    </div>
  );
}
