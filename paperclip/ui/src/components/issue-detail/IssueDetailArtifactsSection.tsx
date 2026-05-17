import type { ComponentProps, ReactNode } from "react";
import type {
  FeedbackDataSharingPreference,
  FeedbackVote,
  FeedbackVoteValue,
  Issue,
  IssueAttachment,
} from "@paperclipai/shared";

import { ImageGalleryModal } from "@/components/ImageGalleryModal";
import { IssueDocumentsSection } from "@/components/IssueDocumentsSection";
import { IssueWorkspaceCard } from "@/components/IssueWorkspaceCard";
import type { MentionOption } from "@/components/MarkdownEditor";

import { IssueAttachmentsSection } from "./IssueAttachmentsSection";

type IssueDetailArtifactsSectionProps = {
  issue: Issue;
  canDeleteDocuments: boolean;
  feedbackVotes?: FeedbackVote[];
  feedbackDataSharingPreference: FeedbackDataSharingPreference;
  feedbackTermsUrl: string | null;
  mentions: MentionOption[];
  documentExtraActions: ReactNode;
  onUploadDocumentImage: (file: File) => Promise<string>;
  onVoteDocument: (
    revisionId: string,
    vote: FeedbackVoteValue,
    options?: { allowSharing?: boolean; reason?: string },
  ) => Promise<void>;
  attachmentsInitialLoading: boolean;
  imageAttachments: IssueAttachment[];
  nonImageAttachments: IssueAttachment[];
  uploadAction: ReactNode;
  attachmentError: string | null;
  deleteAttachmentPending: boolean;
  onOpenImage: (attachment: IssueAttachment) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  onDragActiveChange: (active: boolean) => void;
  onDropFiles: (files: File[]) => void;
  galleryIndex: number;
  galleryOpen: boolean;
  onGalleryOpenChange: (open: boolean) => void;
  project: ComponentProps<typeof IssueWorkspaceCard>["project"];
  onUpdateWorkspace: (data: Record<string, unknown>) => void;
};

export function IssueDetailArtifactsSection({
  issue,
  canDeleteDocuments,
  feedbackVotes,
  feedbackDataSharingPreference,
  feedbackTermsUrl,
  mentions,
  documentExtraActions,
  onUploadDocumentImage,
  onVoteDocument,
  attachmentsInitialLoading,
  imageAttachments,
  nonImageAttachments,
  uploadAction,
  attachmentError,
  deleteAttachmentPending,
  onOpenImage,
  onDeleteAttachment,
  onDragActiveChange,
  onDropFiles,
  galleryIndex,
  galleryOpen,
  onGalleryOpenChange,
  project,
  onUpdateWorkspace,
}: IssueDetailArtifactsSectionProps) {
  return (
    <>
      <IssueDocumentsSection
        issue={issue}
        canDeleteDocuments={canDeleteDocuments}
        feedbackVotes={feedbackVotes}
        feedbackDataSharingPreference={feedbackDataSharingPreference}
        feedbackTermsUrl={feedbackTermsUrl}
        mentions={mentions}
        imageUploadHandler={onUploadDocumentImage}
        onVote={onVoteDocument}
        extraActions={documentExtraActions}
      />

      <IssueAttachmentsSection
        initialLoading={attachmentsInitialLoading}
        imageAttachments={imageAttachments}
        nonImageAttachments={nonImageAttachments}
        uploadAction={uploadAction}
        error={attachmentError}
        deletePending={deleteAttachmentPending}
        onOpenImage={onOpenImage}
        onDeleteAttachment={onDeleteAttachment}
        onDragActiveChange={onDragActiveChange}
        onDropFiles={onDropFiles}
      />

      <ImageGalleryModal
        images={imageAttachments}
        initialIndex={galleryIndex}
        open={galleryOpen}
        onOpenChange={onGalleryOpenChange}
      />

      <IssueWorkspaceCard issue={issue} project={project} onUpdate={onUpdateWorkspace} />
    </>
  );
}
