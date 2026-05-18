import type {
  CompanyPortabilityExportResult,
  CompanyPortabilityFileEntry,
} from "@paperclipai/shared";
import { createZipArchive } from "../../lib/zip";

export function downloadZip(
  exported: CompanyPortabilityExportResult,
  selectedFiles: Set<string>,
  effectiveFiles: Record<string, CompanyPortabilityFileEntry>,
) {
  const filteredFiles: Record<string, CompanyPortabilityFileEntry> = {};
  for (const [path] of Object.entries(exported.files)) {
    if (selectedFiles.has(path)) filteredFiles[path] = effectiveFiles[path] ?? exported.files[path];
  }
  const zipBytes = createZipArchive(filteredFiles, exported.rootPath);
  const zipBuffer = new ArrayBuffer(zipBytes.byteLength);
  new Uint8Array(zipBuffer).set(zipBytes);
  const blob = new Blob([zipBuffer], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${exported.rootPath}.zip`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
