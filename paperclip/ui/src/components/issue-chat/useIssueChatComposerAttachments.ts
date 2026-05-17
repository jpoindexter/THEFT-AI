import type { IssueAttachment } from "@paperclipai/shared";
import {
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type DragEvent as ReactDragEvent,
  type SetStateAction,
} from "react";

import {
  hasFilePayload,
  type ComposerAttachmentItem,
} from "./ComposerHelpers";

export function useIssueChatComposerAttachments({
  onImageUpload,
  onAttachImage,
  setBody,
}: {
  onImageUpload?: (file: File) => Promise<string>;
  onAttachImage?: (file: File) => Promise<IssueAttachment | void>;
  setBody: Dispatch<SetStateAction<string>>;
}) {
  const [attaching, setAttaching] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [attachments, setAttachments] = useState<ComposerAttachmentItem[]>([]);
  const attachInputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef(0);
  const canAcceptFiles = Boolean(onImageUpload || onAttachImage);

  async function attachFile(file: File) {
    const attachmentId = `${file.name}:${file.size}:${file.lastModified}:${Math.random().toString(36).slice(2)}`;
    const inline = Boolean(onImageUpload && file.type.startsWith("image/"));
    setAttachments((prev) => [
      ...prev,
      {
        id: attachmentId,
        name: file.name,
        size: file.size,
        status: "uploading",
        inline,
      },
    ]);

    try {
      if (onImageUpload && file.type.startsWith("image/")) {
        const url = await onImageUpload(file);
        const safeName = file.name.replace(/[[\]]/g, "\\$&");
        const markdown = `![${safeName}](${url})`;
        setBody((prev) => prev ? `${prev}\n\n${markdown}` : markdown);
        setAttachments((prev) => markAttached(prev, attachmentId, { contentPath: url }));
      } else if (onAttachImage) {
        const attachment = await onAttachImage(file);
        setAttachments((prev) =>
          markAttached(prev, attachmentId, {
            contentPath: attachment?.contentPath ?? undefined,
            name: attachment?.originalFilename ?? undefined,
          }),
        );
      } else {
        setAttachments((prev) =>
          markError(prev, attachmentId, "This file type cannot be attached here"),
        );
      }
    } catch (err) {
      setAttachments((prev) =>
        markError(prev, attachmentId, err instanceof Error ? err.message : "Upload failed"),
      );
    }
  }

  async function handleAttachFile(evt: ChangeEvent<HTMLInputElement>) {
    const file = evt.target.files?.[0];
    if (!file) return;
    setAttaching(true);
    try {
      await attachFile(file);
    } finally {
      setAttaching(false);
      if (attachInputRef.current) attachInputRef.current.value = "";
    }
  }

  async function handleDroppedFiles(files: FileList | null | undefined) {
    if (!files || files.length === 0) return;
    setAttaching(true);
    try {
      for (const file of Array.from(files)) {
        await attachFile(file);
      }
    } finally {
      setAttaching(false);
    }
  }

  function resetDragState() {
    dragDepthRef.current = 0;
    setIsDragOver(false);
  }

  function handleFileDragEnter(evt: ReactDragEvent<HTMLDivElement>) {
    if (!canAcceptFiles || !hasFilePayload(evt)) return;
    evt.preventDefault();
    evt.stopPropagation();
    dragDepthRef.current += 1;
    setIsDragOver(true);
  }

  function handleFileDragOver(evt: ReactDragEvent<HTMLDivElement>) {
    if (!canAcceptFiles || !hasFilePayload(evt)) return;
    evt.preventDefault();
    evt.stopPropagation();
    evt.dataTransfer.dropEffect = "copy";
  }

  function handleFileDragLeave(evt: ReactDragEvent<HTMLDivElement>) {
    if (!canAcceptFiles || !hasFilePayload(evt)) return;
    evt.preventDefault();
    evt.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setIsDragOver(false);
  }

  function handleFileDrop(evt: ReactDragEvent<HTMLDivElement>) {
    if (!canAcceptFiles || !hasFilePayload(evt)) return;
    evt.preventDefault();
    evt.stopPropagation();
    resetDragState();
    void handleDroppedFiles(evt.dataTransfer?.files);
  }

  return {
    attachInputRef,
    attaching,
    attachments,
    canAcceptFiles,
    clearAttachments: () => setAttachments([]),
    handleAttachFile,
    handleFileDragEnter,
    handleFileDragLeave,
    handleFileDragOver,
    handleFileDrop,
    isDragOver,
  };
}

function markAttached(
  attachments: ComposerAttachmentItem[],
  id: string,
  data: { contentPath?: string; name?: string },
) {
  return attachments.map((item) =>
    item.id === id
      ? {
          ...item,
          status: "attached" as const,
          contentPath: data.contentPath,
          name: data.name ?? item.name,
        }
      : item,
  );
}

function markError(attachments: ComposerAttachmentItem[], id: string, error: string) {
  return attachments.map((item) =>
    item.id === id
      ? {
          ...item,
          status: "error" as const,
          error,
        }
      : item,
  );
}
