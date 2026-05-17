import { useCallback, useRef, useState, type ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Paperclip } from "lucide-react";
import type { Issue, IssueAttachment } from "@paperclipai/shared";

import { issuesApi } from "@/api/issues";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queryKeys } from "@/lib/queryKeys";
import { keepPreviousDataForSameQueryTail } from "@/lib/query-placeholder-data";
import { cn } from "@/lib/utils";

import {
  fileBaseName,
  isMarkdownFile,
  slugifyDocumentKey,
  titleizeFilename,
} from "./IssueDetailUtils";

type UseIssueDetailAttachmentsInput = {
  issueId?: string;
  issue: Issue | null | undefined;
  selectedCompanyId: string | null | undefined;
  invalidateIssueDetail: () => void;
};

export function useIssueDetailAttachments({
  issueId,
  issue,
  selectedCompanyId,
  invalidateIssueDetail,
}: UseIssueDetailAttachmentsInput) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [attachmentDragActive, setAttachmentDragActive] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const { data: attachments, isLoading: attachmentsLoading } = useQuery({
    queryKey: queryKeys.issues.attachments(issueId!),
    queryFn: () => issuesApi.listAttachments(issueId!),
    enabled: !!issueId,
    placeholderData: keepPreviousDataForSameQueryTail<IssueAttachment[]>(issueId ?? "pending"),
  });

  const uploadAttachment = useMutation({
    mutationFn: async (file: File) => {
      if (!selectedCompanyId) throw new Error("No company selected");
      return issuesApi.uploadAttachment(selectedCompanyId, issueId!, file);
    },
    onSuccess: () => {
      setAttachmentError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.attachments(issueId!) });
      invalidateIssueDetail();
    },
    onError: (err) => {
      setAttachmentError(err instanceof Error ? err.message : "Upload failed");
    },
  });

  const importMarkdownDocument = useMutation({
    mutationFn: async (file: File) => {
      const baseName = fileBaseName(file.name);
      const key = slugifyDocumentKey(baseName);
      const existing = (issue?.documentSummaries ?? []).find((doc) => doc.key === key) ?? null;
      const body = await file.text();
      const inferredTitle = titleizeFilename(baseName);
      const nextTitle = existing?.title ?? inferredTitle ?? null;
      return issuesApi.upsertDocument(issueId!, key, {
        title: key === "plan" ? null : nextTitle,
        format: "markdown",
        body,
        baseRevisionId: existing?.latestRevisionId ?? null,
      });
    },
    onSuccess: () => {
      setAttachmentError(null);
      invalidateIssueDetail();
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.documents(issueId!) });
    },
    onError: (err) => {
      setAttachmentError(err instanceof Error ? err.message : "Document import failed");
    },
  });

  const deleteAttachment = useMutation({
    mutationFn: (attachmentId: string) => issuesApi.deleteAttachment(attachmentId),
    onSuccess: () => {
      setAttachmentError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.attachments(issueId!) });
      invalidateIssueDetail();
    },
    onError: (err) => {
      setAttachmentError(err instanceof Error ? err.message : "Delete failed");
    },
  });

  const isImageAttachment = (attachment: IssueAttachment) => attachment.contentType.startsWith("image/");
  const attachmentList = attachments ?? [];
  const imageAttachments = attachmentList.filter(isImageAttachment);
  const nonImageAttachments = attachmentList.filter((attachment) => !isImageAttachment(attachment));
  const attachmentsInitialLoading = attachmentsLoading && attachments === undefined;

  const importOrUploadFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    for (const file of files) {
      if (isMarkdownFile(file)) {
        await importMarkdownDocument.mutateAsync(file);
      } else {
        await uploadAttachment.mutateAsync(file);
      }
    }
  }, [importMarkdownDocument, uploadAttachment]);

  const handleFilePicked = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    await importOrUploadFiles(Array.from(files));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [importOrUploadFiles]);

  const handleChatImageClick = useCallback(
    (src: string) => {
      let index = imageAttachments.findIndex((attachment) => attachment.contentPath === src);
      if (index < 0) {
        const assetMatch = src.match(/\/api\/assets\/([^/]+)\/content/);
        if (assetMatch) {
          index = imageAttachments.findIndex((attachment) => attachment.assetId === assetMatch[1]);
        }
      }
      if (index >= 0) {
        setGalleryIndex(index);
        setGalleryOpen(true);
        return;
      }
      window.open(src, "_blank");
    },
    [imageAttachments],
  );

  const handleOpenAttachmentImage = useCallback((attachment: IssueAttachment) => {
    const index = imageAttachments.findIndex((candidate) => candidate.id === attachment.id);
    setGalleryIndex(index >= 0 ? index : 0);
    setGalleryOpen(true);
  }, [imageAttachments]);

  const handleUploadImageForMarkdown = useCallback(async (file: File) => {
    const attachment = await uploadAttachment.mutateAsync(file);
    return attachment.contentPath;
  }, [uploadAttachment]);
  const handleDropDescriptionFile = useCallback(async (file: File) => {
    await uploadAttachment.mutateAsync(file);
  }, [uploadAttachment]);

  const attachmentUploadButton = (
    <>
      <Input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFilePicked}
        multiple
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploadAttachment.isPending || importMarkdownDocument.isPending}
        className={cn(
          "shadow-none",
          attachmentDragActive && "border-primary bg-primary/5",
        )}
      >
        <Paperclip className="h-3.5 w-3.5 mr-1.5" />
        {uploadAttachment.isPending || importMarkdownDocument.isPending ? "Uploading..." : (
          <>
            <span className="hidden sm:inline">Upload attachment</span>
            <span className="sm:hidden">Upload</span>
          </>
        )}
      </Button>
    </>
  );

  return {
    attachmentError,
    attachmentUploadButton,
    attachmentsInitialLoading,
    galleryIndex,
    galleryOpen,
    imageAttachments,
    nonImageAttachments,
    deleteAttachmentPending: deleteAttachment.isPending,
    handleAttachmentFiles: importOrUploadFiles,
    handleChatImageClick,
    handleCommentAttachImage: uploadAttachment.mutateAsync,
    handleCommentImageUpload: handleUploadImageForMarkdown,
    handleDeleteAttachment: deleteAttachment.mutate,
    handleDropDescriptionFile,
    handleOpenAttachmentImage,
    handleUploadImageForMarkdown,
    hasAttachments: attachmentList.length > 0,
    setAttachmentDragActive,
    setGalleryOpen,
  };
}
