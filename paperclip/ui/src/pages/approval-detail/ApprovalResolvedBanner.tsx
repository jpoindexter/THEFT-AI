import { CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type ApprovalResolvedBannerProps = {
  cta: {
    label: string;
    to: string;
  };
  onNavigate: (to: string) => void;
};

export function ApprovalResolvedBanner({ cta, onNavigate }: ApprovalResolvedBannerProps) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <div className="relative mt-0.5">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <Sparkles className="absolute -right-2 -top-1 h-3 w-3 animate-pulse text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Approval confirmed</p>
            <p className="text-xs text-muted-foreground">
              Requesting agent was notified to review this approval and linked issues.
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => onNavigate(cta.to)}>
          {cta.label}
        </Button>
      </div>
    </div>
  );
}
