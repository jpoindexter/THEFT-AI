import type { CompanyPortabilityFileEntry } from "@paperclipai/shared";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "../../components/EmptyState";
import { MarkdownBody } from "../../components/MarkdownBody";
import {
  FRONTMATTER_FIELD_LABELS,
  type FrontmatterData,
  parseFrontmatter,
} from "../../components/FileTree";
import {
  getPortableFileDataUrl,
  getPortableFileText,
  isPortableImageFile,
} from "../../lib/portable-files";

function FrontmatterCard({
  data,
  onSkillClick,
}: {
  data: FrontmatterData;
  onSkillClick?: (skill: string) => void;
}) {
  return (
    <div className="mb-4 rounded-md border border-border bg-accent/20 px-4 py-3">
      <dl className="space-y-1.5 text-sm">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-4">
            <dt className="shrink-0 whitespace-nowrap py-0.5 text-muted-foreground sm:w-32">
              {FRONTMATTER_FIELD_LABELS[key] ?? key}
            </dt>
            <dd className="py-0.5">
              {Array.isArray(value) ? (
                <div className="flex flex-wrap gap-1.5">
                  {value.map((item) => (
                    <Button
                      key={item}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      disabled={key !== "skills" || !onSkillClick}
                      onClick={() => key === "skills" && onSkillClick?.(item)}
                    >
                      {item}
                    </Button>
                  ))}
                </div>
              ) : (
                <span>{value}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function ExportPreviewPane({
  selectedFile,
  content,
  allFiles,
  onSkillClick,
}: {
  selectedFile: string | null;
  content: CompanyPortabilityFileEntry | null;
  allFiles: Record<string, CompanyPortabilityFileEntry>;
  onSkillClick?: (skill: string) => void;
}) {
  if (!selectedFile || content === null) {
    return <EmptyState icon={Package} message="Select a file to preview its contents." />;
  }

  const textContent = getPortableFileText(content);
  const isMarkdown = selectedFile.endsWith(".md") && textContent !== null;
  const parsed = isMarkdown && textContent ? parseFrontmatter(textContent) : null;
  const imageSrc = isPortableImageFile(selectedFile, content)
    ? getPortableFileDataUrl(selectedFile, content)
    : null;

  const resolveImageSrc = isMarkdown
    ? (src: string) => {
        if (/^(?:https?:|data:)/i.test(src)) return null;
        const dir = selectedFile.includes("/")
          ? selectedFile.slice(0, selectedFile.lastIndexOf("/") + 1)
          : "";
        const resolved = dir + src;
        const entry = allFiles[resolved] ?? allFiles[src];
        if (!entry) return null;
        return getPortableFileDataUrl(resolved in allFiles ? resolved : src, entry);
      }
    : undefined;

  return (
    <div className="min-w-0">
      <div className="border-b border-border px-5 py-3">
        <div className="truncate font-mono text-sm">{selectedFile}</div>
      </div>
      <div className="min-h-screen px-5 py-5">
        {parsed ? (
          <>
            <FrontmatterCard data={parsed.data} onSkillClick={onSkillClick} />
            {parsed.body.trim() && (
              <MarkdownBody resolveImageSrc={resolveImageSrc} softBreaks={false} linkIssueReferences={false}>
                {parsed.body}
              </MarkdownBody>
            )}
          </>
        ) : isMarkdown ? (
          <MarkdownBody resolveImageSrc={resolveImageSrc} softBreaks={false} linkIssueReferences={false}>
            {textContent ?? ""}
          </MarkdownBody>
        ) : imageSrc ? (
          <div className="flex min-h-96 items-center justify-center rounded-lg border border-border bg-accent/10 p-6">
            <img src={imageSrc} alt={selectedFile} className="max-h-96 max-w-full object-contain" />
          </div>
        ) : textContent !== null ? (
          <pre className="overflow-x-auto whitespace-pre-wrap break-words border-0 bg-transparent p-0 font-mono text-sm text-foreground">
            <code>{textContent}</code>
          </pre>
        ) : (
          <div className="rounded-lg border border-border bg-accent/10 px-4 py-3 text-sm text-muted-foreground">
            Binary asset preview is not available for this file type.
          </div>
        )}
      </div>
    </div>
  );
}
