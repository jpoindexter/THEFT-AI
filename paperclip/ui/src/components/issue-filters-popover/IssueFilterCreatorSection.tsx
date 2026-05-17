import { useMemo, useState } from "react";
import { Bot, Search, User, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatAssigneeUserLabel } from "../../lib/assignees";
import { toggleIssueFilterValue } from "../../lib/issue-filters";
import type { CreatorOption } from "./types";

interface IssueFilterCreatorSectionProps {
  creators?: CreatorOption[];
  currentUserId?: string | null;
  selectedCreatorIds: string[];
  onChange: (creators: string[]) => void;
}

export function IssueFilterCreatorSection({
  creators,
  currentUserId,
  selectedCreatorIds,
  onChange,
}: IssueFilterCreatorSectionProps) {
  const [creatorSearch, setCreatorSearch] = useState("");
  const creatorOptions = creators ?? [];
  const creatorOptionById = useMemo(
    () => new Map(creatorOptions.map((option) => [option.id, option])),
    [creatorOptions],
  );
  const normalizedCreatorSearch = creatorSearch.trim().toLowerCase();
  const visibleCreatorOptions = useMemo(() => {
    if (!normalizedCreatorSearch) return creatorOptions;
    return creatorOptions.filter((option) =>
      `${option.label} ${option.searchText ?? ""}`.toLowerCase().includes(normalizedCreatorSearch),
    );
  }, [creatorOptions, normalizedCreatorSearch]);
  const selectedCreatorOptions = useMemo(
    () => selectedCreatorIds.map((creatorId) => {
      const knownOption = creatorOptionById.get(creatorId);
      if (knownOption) return knownOption;
      if (creatorId.startsWith("agent:")) {
        const agentId = creatorId.slice("agent:".length);
        return { id: creatorId, label: agentId.slice(0, 8), kind: "agent" as const };
      }
      const userId = creatorId.startsWith("user:") ? creatorId.slice("user:".length) : creatorId;
      return {
        id: creatorId,
        label: formatAssigneeUserLabel(userId, currentUserId) ?? userId.slice(0, 5),
        kind: "user" as const,
      };
    }),
    [creatorOptionById, currentUserId, selectedCreatorIds],
  );

  if (creatorOptions.length === 0) return null;

  return (
    <div className="space-y-1">
      <span className="text-xs text-muted-foreground">Creator</span>
      {selectedCreatorOptions.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {selectedCreatorOptions.map((creator) => (
            <Badge key={creator.id} variant="secondary" className="gap-1 pr-1">
              {creator.kind === "agent" ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
              <span>{creator.label}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="rounded-full p-0.5 hover:bg-accent"
                onClick={() => onChange(selectedCreatorIds.filter((value) => value !== creator.id))}
                aria-label={`Remove creator ${creator.label}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      ) : null}
      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={creatorSearch}
          onChange={(event) => setCreatorSearch(event.target.value)}
          placeholder="Search creators..."
          className="h-8 pl-7 text-xs"
        />
      </div>
      <div className="max-h-32 space-y-0.5 overflow-y-auto">
        {visibleCreatorOptions.length > 0 ? visibleCreatorOptions.map((creator) => {
          const selected = selectedCreatorIds.includes(creator.id);
          return (
            <Button
              key={creator.id}
              type="button"
              variant="ghost"
              size="xs"
              className={cn(
                "h-auto w-full justify-start rounded-sm px-2 py-1 text-left text-sm",
                selected ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
              onClick={() => onChange(toggleIssueFilterValue(selectedCreatorIds, creator.id))}
            >
              {creator.kind === "agent" ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
              <span className="min-w-0 flex-1 truncate">{creator.label}</span>
              {selected ? <X className="h-3 w-3" /> : null}
            </Button>
          );
        }) : (
          <div className="px-2 py-1 text-xs text-muted-foreground">No creators match.</div>
        )}
      </div>
    </div>
  );
}
