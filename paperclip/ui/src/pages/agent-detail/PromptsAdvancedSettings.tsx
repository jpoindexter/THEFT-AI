import { ChevronRight, Copy, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CopyText } from "../../components/CopyText";

type BundleDraft = {
  mode: "managed" | "external";
  rootPath: string;
  entryFile: string;
};

export function PromptsAdvancedSettings({
  currentEntryFile,
  currentMode,
  currentRootPath,
  externalBundle,
  managedRootPath,
  persistedExternalRootPath,
  selectedOrEntryFile,
  setBundleDraft,
  setExternalBundle,
  setSelectedFile,
}: {
  currentEntryFile: string;
  currentMode: "managed" | "external";
  currentRootPath: string;
  externalBundle: (BundleDraft & { selectedFile: string }) | null;
  managedRootPath: string | undefined;
  persistedExternalRootPath: string;
  selectedOrEntryFile: string;
  setBundleDraft: (value: BundleDraft) => void;
  setExternalBundle: (value: (BundleDraft & { selectedFile: string }) | null) => void;
  setSelectedFile: (value: string) => void;
}) {
  return (
    <Collapsible defaultOpen={currentMode === "external"}>
      <CollapsibleTrigger className="group flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
        <ChevronRight className="h-3 w-3 transition-transform group-data-[state=open]:rotate-90" />
        Advanced
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-6 pt-4">
        <TooltipProvider>
          <div className="grid gap-x-6 gap-y-4 md:grid-cols-3">
            <label className="min-w-0 space-y-1.5">
              <PromptFieldLabel label="Mode">
                Managed: Paperclip stores and serves the instructions bundle. External: you provide a path on disk where the instructions live.
              </PromptFieldLabel>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={currentMode === "managed" ? "default" : "outline"}
                  onClick={() => {
                    if (currentMode === "external") {
                      setExternalBundle({
                        rootPath: currentRootPath,
                        entryFile: currentEntryFile,
                        selectedFile: selectedOrEntryFile,
                        mode: "external",
                      });
                    }
                    const nextEntryFile = currentEntryFile || "AGENTS.md";
                    setBundleDraft({
                      mode: "managed",
                      rootPath: managedRootPath ?? currentRootPath,
                      entryFile: nextEntryFile,
                    });
                    setSelectedFile(nextEntryFile);
                  }}
                >
                  Managed
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={currentMode === "external" ? "default" : "outline"}
                  onClick={() => {
                    const nextEntryFile = externalBundle?.entryFile ?? currentEntryFile ?? "AGENTS.md";
                    setBundleDraft({
                      mode: "external",
                      rootPath: externalBundle?.rootPath ?? persistedExternalRootPath,
                      entryFile: nextEntryFile,
                    });
                    setSelectedFile(externalBundle?.selectedFile ?? nextEntryFile);
                  }}
                >
                  External
                </Button>
              </div>
            </label>
            <label className="min-w-0 space-y-1.5">
              <PromptFieldLabel label="Root path">
                The absolute directory on disk where the instructions bundle lives. In managed mode this is set by Paperclip automatically.
              </PromptFieldLabel>
              {currentMode === "managed" ? (
                <div className="flex items-center gap-1.5 pt-1.5 font-mono text-xs text-muted-foreground">
                  <span className="min-w-0 truncate" title={currentRootPath || undefined}>{currentRootPath || "(managed)"}</span>
                  {currentRootPath ? (
                    <CopyText text={currentRootPath} className="shrink-0">
                      <Copy className="h-3.5 w-3.5" />
                    </CopyText>
                  ) : null}
                </div>
              ) : (
                <RootPathInput
                  currentEntryFile={currentEntryFile}
                  currentRootPath={currentRootPath}
                  selectedOrEntryFile={selectedOrEntryFile}
                  setBundleDraft={setBundleDraft}
                  setExternalBundle={setExternalBundle}
                />
              )}
            </label>
            <label className="space-y-1.5">
              <PromptFieldLabel label="Entry file">
                The main file the agent reads first when loading instructions. Defaults to AGENTS.md.
              </PromptFieldLabel>
              <Input
                value={currentEntryFile}
                onChange={(event) => {
                  const nextEntryFile = event.target.value || "AGENTS.md";
                  const nextSelectedFile = selectedOrEntryFile === currentEntryFile ? nextEntryFile : selectedOrEntryFile;
                  if (currentMode === "external") {
                    setExternalBundle({
                      rootPath: currentRootPath,
                      entryFile: nextEntryFile,
                      selectedFile: nextSelectedFile,
                      mode: "external",
                    });
                  }
                  if (selectedOrEntryFile === currentEntryFile) setSelectedFile(nextEntryFile);
                  setBundleDraft({ mode: currentMode, rootPath: currentRootPath, entryFile: nextEntryFile });
                }}
                className="font-mono text-sm"
              />
            </label>
          </div>
        </TooltipProvider>
      </CollapsibleContent>
    </Collapsible>
  );
}

function PromptFieldLabel({ children, label }: { children: string; label: string }) {
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
      {label}
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-3 w-3 cursor-help text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={4}>{children}</TooltipContent>
      </Tooltip>
    </span>
  );
}

function RootPathInput({
  currentEntryFile,
  currentRootPath,
  selectedOrEntryFile,
  setBundleDraft,
  setExternalBundle,
}: {
  currentEntryFile: string;
  currentRootPath: string;
  selectedOrEntryFile: string;
  setBundleDraft: (value: BundleDraft) => void;
  setExternalBundle: (value: (BundleDraft & { selectedFile: string }) | null) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Input
        value={currentRootPath}
        onChange={(event) => {
          const nextRootPath = event.target.value;
          setExternalBundle({ rootPath: nextRootPath, entryFile: currentEntryFile, selectedFile: selectedOrEntryFile, mode: "external" });
          setBundleDraft({ mode: "external", rootPath: nextRootPath, entryFile: currentEntryFile });
        }}
        className="font-mono text-sm"
        placeholder="/absolute/path/to/agent/prompts"
      />
      {currentRootPath ? (
        <CopyText text={currentRootPath} className="shrink-0">
          <Copy className="h-3.5 w-3.5" />
        </CopyText>
      ) : null}
    </div>
  );
}
