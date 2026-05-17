import { useState, type ReactNode } from "react";
import { useNavigate } from "@/lib/router";
import {
  Archive,
  ArrowLeft,
  Copy,
  EyeOff,
  MoreVertical,
  SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface InboxMobileToolbarProps {
  backHref: string;
  issueId: string | undefined;
  issueHidden: boolean;
  onArchive: () => void;
  archivePending: boolean;
  onCopy: () => void;
  onProperties: () => void;
  onHide: () => void;
}

export function InboxMobileToolbar({
  backHref,
  issueId: issueIdProp,
  issueHidden,
  onArchive,
  archivePending,
  onCopy,
  onProperties,
  onHide,
}: InboxMobileToolbarProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex w-full items-center">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => {
          // Use browser back when we have real history so the inbox restores scroll.
          if (window.history.length > 1) {
            navigate(-1);
          } else {
            navigate(backHref);
          }
        }}
        aria-label="Back to inbox"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      <div className="ml-auto flex items-center gap-0.5">
        {issueIdProp && !issueHidden ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onArchive}
            disabled={archivePending}
            aria-label="Archive from inbox"
          >
            <Archive className="h-5 w-5" />
          </Button>
        ) : null}

        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="More actions">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-1" align="end">
            <ToolbarMenuButton
              label="Copy as markdown"
              onClick={() => { onCopy(); setMenuOpen(false); }}
            >
              <Copy className="h-3 w-3" />
            </ToolbarMenuButton>
            <ToolbarMenuButton
              label="Properties"
              onClick={() => { onProperties(); setMenuOpen(false); }}
            >
              <SlidersHorizontal className="h-3 w-3" />
            </ToolbarMenuButton>
            {issueIdProp ? (
              <ToolbarMenuButton
                label="Hide this issue"
                destructive
                onClick={() => { onHide(); setMenuOpen(false); }}
              >
                <EyeOff className="h-3 w-3" />
              </ToolbarMenuButton>
            ) : null}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

function ToolbarMenuButton({
  children,
  destructive = false,
  label,
  onClick,
}: {
  children: ReactNode;
  destructive?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="xs"
      className={destructive
        ? "w-full justify-start text-destructive hover:text-destructive"
        : "w-full justify-start"}
      onClick={onClick}
    >
      {children}
      {label}
    </Button>
  );
}
