import { Check } from "lucide-react";
import { HintIcon } from "@/components/agent-config-primitives";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SettingsSection } from "./SettingsSection";

type InviteSettingsSectionProps = {
  inviteError: string | null;
  inviteSnippet: string | null;
  snippetCopied: boolean;
  snippetCopyDelightId: number;
  isGenerating: boolean;
  onGenerate: () => void;
  onCopy: () => void;
};

export function InviteSettingsSection({
  inviteError,
  inviteSnippet,
  snippetCopied,
  snippetCopyDelightId,
  isGenerating,
  onGenerate,
  onCopy,
}: InviteSettingsSectionProps) {
  return (
    <SettingsSection title="Invites" testId="company-settings-invites-section">
      <div className="space-y-3 rounded-md border border-border px-4 py-4">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">
            Generate an OpenClaw agent invite snippet.
          </span>
          <HintIcon text="Creates a short-lived OpenClaw agent invite and renders a copy-ready prompt." />
        </div>
        <Button
          data-testid="company-settings-invites-generate-button"
          size="sm"
          onClick={onGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? "Generating..." : "Generate OpenClaw Invite Prompt"}
        </Button>
        {inviteError && <p className="text-sm text-destructive">{inviteError}</p>}
        {inviteSnippet && (
          <InviteSnippetPreview
            inviteSnippet={inviteSnippet}
            snippetCopied={snippetCopied}
            snippetCopyDelightId={snippetCopyDelightId}
            onCopy={onCopy}
          />
        )}
      </div>
    </SettingsSection>
  );
}

function InviteSnippetPreview({
  inviteSnippet,
  snippetCopied,
  snippetCopyDelightId,
  onCopy,
}: {
  inviteSnippet: string;
  snippetCopied: boolean;
  snippetCopyDelightId: number;
  onCopy: () => void;
}) {
  return (
    <div
      className="rounded-md border border-border bg-muted/30 p-2"
      data-testid="company-settings-invites-snippet"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">OpenClaw Invite Prompt</div>
        {snippetCopied && (
          <span
            key={snippetCopyDelightId}
            className="flex items-center gap-1 text-xs text-foreground animate-pulse"
          >
            <Check className="h-3 w-3" />
            Copied
          </span>
        )}
      </div>
      <div className="mt-1 space-y-1.5">
        <Textarea
          data-testid="company-settings-invites-snippet-textarea"
          className="min-h-96 font-mono text-xs"
          value={inviteSnippet}
          readOnly
        />
        <div className="flex justify-end">
          <Button data-testid="company-settings-invites-copy-button" size="sm" variant="ghost" onClick={onCopy}>
            {snippetCopied ? "Copied snippet" : "Copy snippet"}
          </Button>
        </div>
      </div>
    </div>
  );
}
