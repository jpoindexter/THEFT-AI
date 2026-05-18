import { useCallback, useRef, useState, type ChangeEvent, type DragEvent } from "react";

export type StagedIssueFile = {
  id: string;
  file: File;
  kind: "document" | "attachment";
  documentKey?: string;
  title?: string | null;
};

function isTextDocumentFile(file: File) {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".md") ||
    name.endsWith(".markdown") ||
    name.endsWith(".txt") ||
    file.type === "text/markdown" ||
    file.type === "text/plain"
  );
}

function fileBaseName(filename: string) {
  return filename.replace(/\.[^.]+$/, "");
}

function slugifyDocumentKey(input: string) {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "document";
}

function titleizeFilename(input: string) {
  return input
    .split(/[-_ ]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function createUniqueDocumentKey(baseKey: string, stagedFiles: StagedIssueFile[]) {
  const existingKeys = new Set(
    stagedFiles
      .filter((file) => file.kind === "document")
      .map((file) => file.documentKey)
      .filter((key): key is string => Boolean(key)),
  );
  if (!existingKeys.has(baseKey)) return baseKey;
  let suffix = 2;
  while (existingKeys.has(`${baseKey}-${suffix}`)) {
    suffix += 1;
  }
  return `${baseKey}-${suffix}`;
}

function createStagedIssueFile(file: File, stagedFiles: StagedIssueFile[]): StagedIssueFile {
  if (!isTextDocumentFile(file)) {
    return {
      id: `${file.name}:${file.size}:${file.lastModified}`,
      file,
      kind: "attachment",
    };
  }

  const baseName = fileBaseName(file.name);
  const documentKey = createUniqueDocumentKey(slugifyDocumentKey(baseName), stagedFiles);
  return {
    id: `${file.name}:${file.size}:${file.lastModified}:${documentKey}`,
    file,
    kind: "document",
    documentKey,
    title: titleizeFilename(baseName),
  };
}

export function useStagedIssueFiles() {
  const [stagedFiles, setStagedFiles] = useState<StagedIssueFile[]>([]);
  const [isFileDragOver, setIsFileDragOver] = useState(false);
  const stageFileInputRef = useRef<HTMLInputElement | null>(null);

  const stageFiles = useCallback((files: File[]) => {
    if (files.length === 0) return;
    setStagedFiles((current) => {
      const next = [...current];
      for (const file of files) {
        next.push(createStagedIssueFile(file, next));
      }
      return next;
    });
  }, []);

  const handleStageFilesPicked = useCallback((evt: ChangeEvent<HTMLInputElement>) => {
    stageFiles(Array.from(evt.target.files ?? []));
    if (stageFileInputRef.current) {
      stageFileInputRef.current.value = "";
    }
  }, [stageFiles]);

  const handleFileDragEnter = useCallback((evt: DragEvent<HTMLDivElement>) => {
    if (!evt.dataTransfer.types.includes("Files")) return;
    evt.preventDefault();
    setIsFileDragOver(true);
  }, []);

  const handleFileDragOver = useCallback((evt: DragEvent<HTMLDivElement>) => {
    if (!evt.dataTransfer.types.includes("Files")) return;
    evt.preventDefault();
    evt.dataTransfer.dropEffect = "copy";
    setIsFileDragOver(true);
  }, []);

  const handleFileDragLeave = useCallback((evt: DragEvent<HTMLDivElement>) => {
    if (evt.currentTarget.contains(evt.relatedTarget as Node | null)) return;
    setIsFileDragOver(false);
  }, []);

  const handleFileDrop = useCallback((evt: DragEvent<HTMLDivElement>) => {
    if (!evt.dataTransfer.files.length) return;
    evt.preventDefault();
    setIsFileDragOver(false);
    stageFiles(Array.from(evt.dataTransfer.files));
  }, [stageFiles]);

  const removeStagedFile = useCallback((id: string) => {
    setStagedFiles((current) => current.filter((file) => file.id !== id));
  }, []);

  const resetStagedFiles = useCallback(() => {
    setStagedFiles([]);
    setIsFileDragOver(false);
  }, []);

  return {
    stagedFiles,
    isFileDragOver,
    stageFileInputRef,
    handleStageFilesPicked,
    handleFileDragEnter,
    handleFileDragOver,
    handleFileDragLeave,
    handleFileDrop,
    removeStagedFile,
    resetStagedFiles,
  };
}
