import type { CompanySkillDetail } from "@paperclipai/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExternalLink } from "lucide-react";

export function DeleteSkillDialog({
  open,
  onOpenChange,
  targetDetail,
  targetSkillId,
  isPending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetDetail: CompanySkillDetail | null;
  targetSkillId: string | null;
  isPending: boolean;
  onConfirm: () => void;
}) {
  const usedByCount = targetDetail?.usedByAgents.length ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remove skill</DialogTitle>
          <DialogDescription>
            Remove this skill from the company library. If any agents still use it, removal will be blocked until it is detached.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p>
            {targetDetail
              ? `You are about to remove ${targetDetail.name}.`
              : "You are about to remove this skill."}
          </p>
          {usedByCount > 0 ? (
            <div className="rounded-md border border-border px-3 py-3 text-muted-foreground">
              Currently used by {targetDetail?.usedByAgents.map((agent) => agent.name).join(", ")}.
            </div>
          ) : null}
          {usedByCount > 0 ? (
            <p className="text-muted-foreground">
              Detach this skill from all agents to enable removal.
            </p>
          ) : null}
        </div>
        <DialogFooter>
          {usedByCount > 0 ? (
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={onConfirm}
                disabled={isPending || !targetSkillId}
              >
                {isPending ? "Removing..." : "Remove skill"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EmptySourceHelpDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a skill source</DialogTitle>
          <DialogDescription>
            Paste a local path, GitHub URL, or `skills.sh` command into the field first.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <a
            href="https://skills.sh"
            target="_blank"
            rel="noreferrer"
            className="flex items-start justify-between rounded-md border border-border px-3 py-3 text-foreground no-underline transition-colors hover:bg-accent/40"
          >
            <span>
              <span className="block font-medium">Browse skills.sh</span>
              <span className="mt-1 block text-muted-foreground">
                Find install commands and paste one here.
              </span>
            </span>
            <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          </a>
          <a
            href="https://github.com/search?q=SKILL.md&type=code"
            target="_blank"
            rel="noreferrer"
            className="flex items-start justify-between rounded-md border border-border px-3 py-3 text-foreground no-underline transition-colors hover:bg-accent/40"
          >
            <span>
              <span className="block font-medium">Search GitHub</span>
              <span className="mt-1 block text-muted-foreground">
                Look for repositories with `SKILL.md`, then paste the repo URL here.
              </span>
            </span>
            <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          </a>
        </div>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
