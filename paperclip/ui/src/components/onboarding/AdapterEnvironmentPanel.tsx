import type { AdapterEnvironmentTestResult } from "@paperclipai/shared";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdapterEnvironmentResult } from "./AdapterEnvironmentResult";

export function AdapterEnvironmentPanel({
  adapterType,
  adapterEnvLoading,
  adapterEnvError,
  adapterEnvResult,
  shouldSuggestUnsetAnthropicApiKey,
  unsetAnthropicLoading,
  effectiveAdapterCommand,
  onTestEnvironment,
  onUnsetAnthropicApiKey,
}: {
  adapterType: string;
  adapterEnvLoading: boolean;
  adapterEnvError: string | null;
  adapterEnvResult: AdapterEnvironmentTestResult | null;
  shouldSuggestUnsetAnthropicApiKey: boolean;
  unsetAnthropicLoading: boolean;
  effectiveAdapterCommand: string;
  onTestEnvironment: () => void;
  onUnsetAnthropicApiKey: () => void;
}) {
  return (
    <div className="theft-surface-plain space-y-2 p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium">Adapter environment check</p>
          <p className="text-micro text-muted-foreground">
            Runs a live probe that asks the adapter CLI to respond with hello.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2.5 text-xs"
          disabled={adapterEnvLoading}
          onClick={onTestEnvironment}
        >
          {adapterEnvLoading ? "Testing..." : "Test now"}
        </Button>
      </div>

      {adapterEnvError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-2.5 py-2 text-micro text-destructive">
          {adapterEnvError}
        </div>
      )}

      {adapterEnvResult && adapterEnvResult.status === "pass" ? (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-xs text-foreground animate-in fade-in slide-in-from-bottom-1 duration-300">
          <Check className="h-3.5 w-3.5 shrink-0" />
          <span className="font-medium">Passed</span>
        </div>
      ) : adapterEnvResult ? (
        <AdapterEnvironmentResult result={adapterEnvResult} />
      ) : null}

      {shouldSuggestUnsetAnthropicApiKey && (
        <div className="space-y-2 rounded-md border border-border bg-muted px-2.5 py-2">
          <p className="text-micro leading-relaxed text-muted-foreground">
            Claude failed while{" "}
            <span className="font-mono">ANTHROPIC_API_KEY</span> is set. You
            can clear it in this Operator adapter config and retry the probe.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2.5 text-xs"
            disabled={adapterEnvLoading || unsetAnthropicLoading}
            onClick={onUnsetAnthropicApiKey}
          >
            {unsetAnthropicLoading ? "Retrying..." : "Unset ANTHROPIC_API_KEY"}
          </Button>
        </div>
      )}

      {adapterEnvResult && adapterEnvResult.status === "fail" && (
        <ManualDebug adapterType={adapterType} command={effectiveAdapterCommand} />
      )}
    </div>
  );
}

function ManualDebug({
  adapterType,
  command,
}: {
  adapterType: string;
  command: string;
}) {
  return (
    <div className="space-y-1.5 rounded-md border border-border/70 bg-muted/20 px-2.5 py-2 text-micro">
      <p className="font-medium">Manual debug</p>
      <p className="break-all font-mono text-muted-foreground">
        {adapterType === "cursor"
          ? `${command} -p --mode ask --output-format json "Respond with hello."`
          : adapterType === "codex_local"
            ? `${command} exec --json -`
            : adapterType === "gemini_local"
              ? `${command} --output-format json "Respond with hello."`
              : adapterType === "opencode_local"
                ? `${command} run --format json "Respond with hello."`
                : `${command} --print - --output-format stream-json --verbose`}
      </p>
      <p className="text-muted-foreground">
        Prompt: <span className="font-mono">Respond with hello.</span>
      </p>
      {["cursor", "codex_local", "gemini_local", "opencode_local"].includes(
        adapterType,
      ) ? (
        <p className="text-muted-foreground">
          If auth fails, set <span className="font-mono">{authEnv(adapterType)}</span>{" "}
          in env or run <span className="font-mono">{loginCommand(adapterType)}</span>.
        </p>
      ) : (
        <p className="text-muted-foreground">
          If login is required, run <span className="font-mono">claude login</span>{" "}
          and retry.
        </p>
      )}
    </div>
  );
}

function authEnv(adapterType: string) {
  if (adapterType === "cursor") return "CURSOR_API_KEY";
  if (adapterType === "gemini_local") return "GEMINI_API_KEY";
  return "OPENAI_API_KEY";
}

function loginCommand(adapterType: string) {
  if (adapterType === "cursor") return "agent login";
  if (adapterType === "codex_local") return "codex login";
  if (adapterType === "gemini_local") return "gemini auth";
  return "opencode auth login";
}
