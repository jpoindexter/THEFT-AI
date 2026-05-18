import type { ChangeEvent, KeyboardEvent, RefObject } from "react";
import type { Company, IssueWorkMode } from "@paperclipai/shared";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "../../lib/utils";
import { IssuePropertyChips } from "./IssuePropertyChips";
import { NewIssueDialogBody, type NewIssueDialogBodyProps } from "./NewIssueDialogBody";
import { NewIssueDialogFooter } from "./NewIssueDialogFooter";
import { NewIssueDialogHeader } from "./NewIssueDialogHeader";

type DialogCompany = Pick<Company, "id" | "name" | "brandColor" | "status">;

export type NewIssueDialogSurfaceProps = NewIssueDialogBodyProps & {
  canDiscardDraft: boolean;
  closeNewIssue: () => void;
  companies: DialogCompany[];
  companyOpen: boolean;
  dialogCompany: DialogCompany | null | undefined;
  effectiveCompanyId: string | null | undefined;
  errorMessage: string | null;
  moreOpen: boolean;
  newIssueOpen: boolean;
  priority: string;
  priorityOpen: boolean;
  stageFileInputRef: RefObject<HTMLInputElement | null>;
  status: string;
  statusOpen: boolean;
  titleHasText: boolean;
  uploadDisabled: boolean;
  workMode: IssueWorkMode;
  workModeOpen: boolean;
  onClose: () => void;
  onCompanyChange: (companyId: string) => void;
  onCompanyOpenChange: (open: boolean) => void;
  onDiscardDraft: () => void;
  onExpandedChange: (expanded: boolean) => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  onMoreOpenChange: (open: boolean) => void;
  onPriorityChange: (priority: string) => void;
  onPriorityOpenChange: (open: boolean) => void;
  onStageFilesPicked: (event: ChangeEvent<HTMLInputElement>) => void;
  onStatusChange: (status: string) => void;
  onStatusOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  onWorkModeChange: (workMode: IssueWorkMode) => void;
  onWorkModeOpenChange: (open: boolean) => void;
};

export function NewIssueDialogSurface(props: NewIssueDialogSurfaceProps) {
  const {
    canDiscardDraft,
    closeNewIssue,
    companies,
    companyOpen,
    dialogCompany,
    effectiveCompanyId,
    errorMessage,
    expanded,
    isSubIssueMode,
    moreOpen,
    newIssueOpen,
    pending,
    priority,
    priorityOpen,
    stageFileInputRef,
    status,
    statusOpen,
    titleHasText,
    uploadDisabled,
    workMode,
    workModeOpen,
    onClose,
    onCompanyChange,
    onCompanyOpenChange,
    onDiscardDraft,
    onExpandedChange,
    onKeyDown,
    onMoreOpenChange,
    onPriorityChange,
    onPriorityOpenChange,
    onStageFilesPicked,
    onStatusChange,
    onStatusOpenChange,
    onSubmit,
    onWorkModeChange,
    onWorkModeOpenChange,
    ...bodyProps
  } = props;

  return (
    <Dialog
      open={newIssueOpen}
      onOpenChange={(open) => {
        if (!open && !pending) closeNewIssue();
      }}
    >
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className={cn(
          "flex h-dvh max-h-dvh flex-col gap-0 overflow-hidden p-0 sm:h-auto",
          expanded ? "sm:h-dvh sm:max-w-2xl" : "sm:max-w-lg",
        )}
        onKeyDown={onKeyDown}
        onEscapeKeyDown={(event) => {
          if (pending) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (pending) {
            event.preventDefault();
            return;
          }
          const target = event.detail.originalEvent.target as HTMLElement | null;
          if (target?.closest("[data-radix-popper-content-wrapper]")) {
            event.preventDefault();
          }
        }}
      >
        <NewIssueDialogHeader
          companyOpen={companyOpen}
          companies={companies}
          dialogCompany={dialogCompany}
          effectiveCompanyId={effectiveCompanyId}
          expanded={expanded}
          isSubIssueMode={isSubIssueMode}
          pending={pending}
          onClose={onClose}
          onCompanyChange={onCompanyChange}
          onCompanyOpenChange={onCompanyOpenChange}
          onExpandedChange={onExpandedChange}
        />

        <NewIssueDialogBody {...bodyProps} expanded={expanded} isSubIssueMode={isSubIssueMode} pending={pending} />

        <IssuePropertyChips
          status={status}
          statusOpen={statusOpen}
          priority={priority}
          priorityOpen={priorityOpen}
          stageFileInputRef={stageFileInputRef}
          uploadDisabled={uploadDisabled}
          workMode={workMode}
          workModeOpen={workModeOpen}
          moreOpen={moreOpen}
          onStatusChange={onStatusChange}
          onStatusOpenChange={onStatusOpenChange}
          onPriorityChange={onPriorityChange}
          onPriorityOpenChange={onPriorityOpenChange}
          onStageFilesPicked={onStageFilesPicked}
          onWorkModeChange={onWorkModeChange}
          onWorkModeOpenChange={onWorkModeOpenChange}
          onMoreOpenChange={onMoreOpenChange}
        />

        <NewIssueDialogFooter
          canDiscardDraft={canDiscardDraft}
          errorMessage={errorMessage}
          isSubIssueMode={isSubIssueMode}
          pending={pending}
          titleHasText={titleHasText}
          onDiscardDraft={onDiscardDraft}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
