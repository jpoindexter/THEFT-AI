import { type RefObject } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchHeaderProps {
  inputRef: RefObject<HTMLInputElement | null>;
  draftQuery: string;
  onDraftQueryChange: (query: string) => void;
  onClear: () => void;
}

export function SearchHeader({ inputRef, draftQuery, onDraftQueryChange, onClear }: SearchHeaderProps) {
  return (
    <div className="border-b border-border px-4 py-3 sm:px-6">
      <h1 className="sr-only">Search</h1>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          autoFocus
          value={draftQuery}
          onChange={(event) => onDraftQueryChange(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              if (draftQuery.length > 0) {
                event.preventDefault();
                onClear();
              } else {
                event.currentTarget.blur();
              }
            }
          }}
          placeholder="Search issues, comments, documents, agents, projects…"
          aria-label="Search query"
          className="h-10 pl-9 pr-20 text-sm"
        />
        {draftQuery.length > 0 ? (
          <Button
            type="button"
            onClick={onClear}
            aria-label="Clear search"
            variant="ghost"
            size="icon-xs"
            className="absolute right-12 top-1/2 -translate-y-1/2 rounded-full text-muted-foreground hover:bg-accent/50"
          >
            <X className="size-3.5" />
          </Button>
        ) : null}
        <kbd
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground"
        >
          ⌘K
        </kbd>
      </div>
    </div>
  );
}
