import { Link } from "@/lib/router";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { AgentSkillEntry } from "@paperclipai/shared";
import { MarkdownBody } from "../../components/MarkdownBody";
import { cn } from "../../lib/utils";

export type AgentSkillRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  detail: string | null;
  locationLabel: string | null;
  originLabel: string | null;
  linkTo: string | null;
  readOnly: boolean;
  adapterEntry: AgentSkillEntry | null;
};

type AgentSkillRowsProps = {
  optionalSkillRows: AgentSkillRow[];
  requiredSkillRows: AgentSkillRow[];
  unmanagedSkillRows: AgentSkillRow[];
  adapterEntryByKey: Map<string, AgentSkillEntry>;
  skillDraft: string[];
  unsupportedMode: boolean;
  unsupportedSkillMessage: string | null;
  unmanagedOpen: boolean;
  onSkillDraftChange: (skills: string[]) => void;
  onUnmanagedOpenChange: (open: boolean) => void;
};

export function AgentSkillRows({
  optionalSkillRows,
  requiredSkillRows,
  unmanagedSkillRows,
  adapterEntryByKey,
  skillDraft,
  unsupportedMode,
  unsupportedSkillMessage,
  unmanagedOpen,
  onSkillDraftChange,
  onUnmanagedOpenChange,
}: AgentSkillRowsProps) {
  const renderSkillRow = (skill: AgentSkillRow) => (
    <AgentSkillRowItem
      key={skill.id}
      skill={skill}
      adapterEntry={skill.adapterEntry ?? adapterEntryByKey.get(skill.key) ?? null}
      checked={Boolean(skill.adapterEntry?.required) || skillDraft.includes(skill.key)}
      disabled={Boolean(skill.adapterEntry?.required) || unsupportedMode}
      unsupportedMode={unsupportedMode}
      skillDraft={skillDraft}
      unsupportedSkillMessage={unsupportedSkillMessage}
      onSkillDraftChange={onSkillDraftChange}
    />
  );

  if (optionalSkillRows.length === 0 && requiredSkillRows.length === 0 && unmanagedSkillRows.length === 0) {
    return (
      <section className="border-y border-border">
        <div className="px-3 py-6 text-sm text-muted-foreground">
          Import skills into the company library first, then attach them here.
        </div>
      </section>
    );
  }

  return (
    <>
      {optionalSkillRows.length > 0 && (
        <section className="border-y border-border">
          {optionalSkillRows.map(renderSkillRow)}
        </section>
      )}

      {requiredSkillRows.length > 0 && (
        <section className="border-y border-border">
          <div className="border-b border-border bg-muted/40 px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground">Required by Paperclip</span>
          </div>
          {requiredSkillRows.map(renderSkillRow)}
        </section>
      )}

      {unmanagedSkillRows.length > 0 && (
        <section className="border-y border-border">
          <div
            role="button"
            tabIndex={0}
            className="flex cursor-pointer items-center gap-2 border-b border-border bg-muted/40 px-3 py-2 select-none"
            onClick={() => onUnmanagedOpenChange(!unmanagedOpen)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onUnmanagedOpenChange(!unmanagedOpen);
              }
            }}
          >
            <span className="text-xs font-medium text-muted-foreground">
              ({unmanagedSkillRows.length}) User-installed skills, not managed by Paperclip
            </span>
            {unmanagedOpen ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
          {unmanagedOpen && unmanagedSkillRows.map(renderSkillRow)}
        </section>
      )}
    </>
  );
}

function AgentSkillRowItem({
  skill,
  adapterEntry,
  checked,
  disabled,
  unsupportedMode,
  skillDraft,
  unsupportedSkillMessage,
  onSkillDraftChange,
}: {
  skill: AgentSkillRow;
  adapterEntry: AgentSkillEntry | null;
  checked: boolean;
  disabled: boolean;
  unsupportedMode: boolean;
  skillDraft: string[];
  unsupportedSkillMessage: string | null;
  onSkillDraftChange: (skills: string[]) => void;
}) {
  const required = Boolean(adapterEntry?.required);
  const rowClassName = cn(
    "flex items-start gap-3 border-b border-border px-3 py-3 text-sm last:border-b-0",
    skill.readOnly ? "bg-muted/20" : "hover:bg-accent/20",
  );
  const body = (
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="truncate font-medium">{skill.name}</span>
        </div>
        {skill.linkTo ? (
          <Link to={skill.linkTo} className="shrink-0 text-xs text-muted-foreground no-underline hover:text-foreground">
            View
          </Link>
        ) : null}
      </div>
      {skill.description && (
        <MarkdownBody className="mt-1 text-xs text-muted-foreground prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
          {skill.description}
        </MarkdownBody>
      )}
      {skill.readOnly && skill.originLabel && <p className="mt-1 text-xs text-muted-foreground">{skill.originLabel}</p>}
      {skill.readOnly && skill.locationLabel && (
        <p className="mt-1 text-xs text-muted-foreground">Location: {skill.locationLabel}</p>
      )}
      {skill.detail && <p className="mt-1 text-xs text-muted-foreground">{skill.detail}</p>}
    </div>
  );

  if (skill.readOnly) {
    return (
      <div className={rowClassName}>
        <span className="mt-1 h-2 w-2 rounded-full bg-muted-foreground/40" />
        {body}
      </div>
    );
  }

  const checkbox = (
    <Checkbox
      checked={checked}
      disabled={disabled}
      className="mt-0.5"
      onCheckedChange={(nextChecked) => {
        const next = nextChecked === true
          ? Array.from(new Set([...skillDraft, skill.key]))
          : skillDraft.filter((value) => value !== skill.key);
        onSkillDraftChange(next);
      }}
    />
  );

  return (
    <div className={rowClassName}>
      {required && adapterEntry?.requiredReason ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span>{checkbox}</span>
          </TooltipTrigger>
          <TooltipContent side="top">{adapterEntry.requiredReason}</TooltipContent>
        </Tooltip>
      ) : unsupportedMode ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span>{checkbox}</span>
          </TooltipTrigger>
          <TooltipContent side="top">
            {unsupportedSkillMessage ?? "Manage skills in the adapter directly."}
          </TooltipContent>
        </Tooltip>
      ) : (
        checkbox
      )}
      {body}
    </div>
  );
}
