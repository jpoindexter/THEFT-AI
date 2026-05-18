import { useState, type ChangeEvent } from "react";
import type { CompanyPortabilitySource } from "@paperclipai/shared";
import {
  readLocalPackageZip,
  type LocalCompanyImportPackage,
} from "./importPreviewModel";

type SourceMode = "github" | "local";

type UseImportSourceStateOptions = {
  onResetPreview: () => void;
  onReadError: (error: unknown) => void;
};

export function useImportSourceState({
  onResetPreview,
  onReadError,
}: UseImportSourceStateOptions) {
  const [sourceMode, setSourceModeValue] = useState<SourceMode>("github");
  const [importUrl, setImportUrlValue] = useState("");
  const [localPackage, setLocalPackage] = useState<LocalCompanyImportPackage | null>(null);

  const hasSource =
    sourceMode === "local" ? !!localPackage : importUrl.trim().length > 0;

  const localZipHelpText =
    "Upload a .zip exported directly from Paperclip. Re-zipped archives created by Finder, Explorer, or other zip tools may not import correctly.";

  function setSourceMode(mode: SourceMode) {
    setSourceModeValue(mode);
    onResetPreview();
  }

  function setImportUrl(value: string) {
    setImportUrlValue(value);
    onResetPreview();
  }

  async function handleChooseLocalPackage(event: ChangeEvent<HTMLInputElement>) {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;
    try {
      setLocalPackage(await readLocalPackageZip(fileList[0]!));
      onResetPreview();
    } catch (error) {
      onReadError(error);
    }
  }

  function buildSource(): CompanyPortabilitySource | null {
    if (sourceMode === "local") {
      if (!localPackage) return null;
      return { type: "inline", rootPath: localPackage.rootPath, files: localPackage.files };
    }
    const url = importUrl.trim();
    if (!url) return null;
    return { type: "github", url };
  }

  return {
    buildSource,
    handleChooseLocalPackage,
    hasSource,
    importUrl,
    localPackage,
    localZipHelpText,
    setImportUrl,
    setSourceMode,
    sourceMode,
  };
}
