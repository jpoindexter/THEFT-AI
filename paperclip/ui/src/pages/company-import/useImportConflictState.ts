import { useState } from "react";
import type { CompanyPortabilityPreviewResult } from "@paperclipai/shared";
import {
  buildConflictList,
  deriveSourcePrefix,
  prefixedName,
} from "./importPreviewModel";

type UseImportConflictStateOptions = {
  importUrl: string;
  localPackageName: string | null;
  localPackageRootPath: string | null;
  sourceMode: "github" | "local";
};

export function useImportConflictState({
  importUrl,
  localPackageName,
  localPackageRootPath,
  sourceMode,
}: UseImportConflictStateOptions) {
  const [nameOverrides, setNameOverrides] = useState<Record<string, string>>({});
  const [skippedSlugs, setSkippedSlugs] = useState<Set<string>>(new Set());
  const [confirmedSlugs, setConfirmedSlugs] = useState<Set<string>>(new Set());

  function initializeForPreview(result: CompanyPortabilityPreviewResult) {
    const conflicts = buildConflictList(result);
    const prefix = deriveSourcePrefix(sourceMode, importUrl, localPackageName, localPackageRootPath);
    const defaultOverrides: Record<string, string> = {};

    for (const conflict of conflicts) {
      if (conflict.action === "rename" && prefix) {
        defaultOverrides[conflict.slug] = prefixedName(prefix, conflict.originalName);
      }
    }

    setNameOverrides(defaultOverrides);
    setSkippedSlugs(new Set());
    setConfirmedSlugs(new Set());
  }

  function buildFinalNameOverrides(): Record<string, string> | undefined {
    const overrides: Record<string, string> = {};
    for (const [slug, name] of Object.entries(nameOverrides)) {
      if (name.trim()) overrides[slug] = name.trim();
    }
    return Object.keys(overrides).length > 0 ? overrides : undefined;
  }

  function handleConflictRename(slug: string, newName: string) {
    setNameOverrides((prev) => ({ ...prev, [slug]: newName }));
    setConfirmedSlugs((prev) => {
      if (!prev.has(slug)) return prev;
      const next = new Set(prev);
      next.delete(slug);
      return next;
    });
  }

  function handleConflictToggleConfirm(slug: string) {
    setConfirmedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  function handleConflictToggleSkip(
    slug: string,
    filePath: string | null,
    syncCheckedFile: (filePath: string, skipped: boolean) => void,
  ) {
    setSkippedSlugs((prev) => {
      const next = new Set(prev);
      const wasSkipped = next.has(slug);
      if (wasSkipped) next.delete(slug);
      else next.add(slug);

      if (filePath) syncCheckedFile(filePath, !wasSkipped);
      return next;
    });
  }

  return {
    buildFinalNameOverrides,
    confirmedSlugs,
    handleConflictRename,
    handleConflictToggleConfirm,
    handleConflictToggleSkip,
    initializeForPreview,
    nameOverrides,
    skippedSlugs,
  };
}
