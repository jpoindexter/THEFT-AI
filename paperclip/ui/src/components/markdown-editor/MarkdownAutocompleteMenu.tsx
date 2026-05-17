import type {
  MouseEvent as ReactMouseEvent,
  MutableRefObject,
  PointerEvent as ReactPointerEvent,
  TouchEvent as ReactTouchEvent,
} from "react";
import { createPortal } from "react-dom";
import { Boxes, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "../../lib/utils";
import { AgentIcon } from "../AgentIconPicker";
import type { AutocompleteOption, MentionState } from "./types";

export function MarkdownAutocompleteMenu({
  filteredMentions,
  handleAutocompletePress,
  handleAutocompleteTouchEnd,
  handleAutocompleteTouchMove,
  handleAutocompleteTouchStart,
  mentionActive,
  mentionIndex,
  mentionMenuPosition,
  mentionStateRef,
  setMentionIndex,
  skillEnterArmedRef,
}: {
  filteredMentions: AutocompleteOption[];
  handleAutocompletePress: (
    event: ReactMouseEvent<HTMLButtonElement> | ReactPointerEvent<HTMLButtonElement> | ReactTouchEvent<HTMLButtonElement>,
    option: AutocompleteOption,
  ) => void;
  handleAutocompleteTouchEnd: (
    event: ReactTouchEvent<HTMLButtonElement>,
    option: AutocompleteOption,
  ) => void;
  handleAutocompleteTouchMove: (event: ReactTouchEvent<HTMLButtonElement>) => void;
  handleAutocompleteTouchStart: (event: ReactTouchEvent<HTMLButtonElement>) => void;
  mentionActive: boolean;
  mentionIndex: number;
  mentionMenuPosition: { top: number; left: number } | null;
  mentionStateRef: MutableRefObject<MentionState | null>;
  setMentionIndex: (index: number) => void;
  skillEnterArmedRef: MutableRefObject<boolean>;
}) {
  if (!mentionActive || filteredMentions.length === 0 || !mentionMenuPosition) return null;

  return createPortal(
    <div
      className="fixed z-50 max-h-52 min-w-44 max-w-80 touch-pan-y overflow-y-auto rounded-md border border-border bg-popover shadow-md"
      style={{
        top: mentionMenuPosition.top,
        left: mentionMenuPosition.left,
        WebkitOverflowScrolling: "touch",
      }}
    >
      {filteredMentions.map((option, i) => (
        <Button
          key={option.id}
          type="button"
          variant="ghost"
          size="sm"
          tabIndex={-1}
          className={cn(
            "h-auto w-full justify-start px-3 py-1.5 text-left font-normal hover:bg-accent/50",
            i === mentionIndex && "bg-accent",
          )}
          onPointerDown={(event) => {
            if (event.pointerType === "touch") return;
            handleAutocompletePress(event, option);
          }}
          onMouseDown={(event) => handleAutocompletePress(event, option)}
          onTouchStart={handleAutocompleteTouchStart}
          onTouchMove={handleAutocompleteTouchMove}
          onTouchEnd={(event) => handleAutocompleteTouchEnd(event, option)}
          onMouseEnter={() => {
            if (mentionStateRef.current?.trigger === "skill") {
              skillEnterArmedRef.current = true;
            }
            setMentionIndex(i);
          }}
        >
          {option.kind === "skill" ? (
            <Boxes className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : option.kind === "project" && option.projectId ? (
            <span
              className="inline-flex h-2 w-2 rounded-full border border-border/50"
              style={{ backgroundColor: option.projectColor ?? "var(--muted-foreground)" }}
            />
          ) : option.kind === "user" ? (
            <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <AgentIcon
              icon={option.agentIcon}
              className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
            />
          )}
          <span>{option.kind === "skill" ? `/${option.slug}` : option.name}</span>
          {option.kind === "project" && option.projectId && (
            <span className="ml-auto text-nano uppercase tracking-wide text-muted-foreground">
              Project
            </span>
          )}
          {option.kind === "user" && (
            <span className="ml-auto text-nano uppercase tracking-wide text-muted-foreground">
              User
            </span>
          )}
          {option.kind === "skill" && (
            <span className="ml-auto text-nano uppercase tracking-wide text-muted-foreground">
              Skill
            </span>
          )}
        </Button>
      ))}
    </div>,
    document.body,
  );
}
