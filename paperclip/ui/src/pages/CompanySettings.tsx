import { Settings } from "lucide-react";
import { AppearanceSettingsSection } from "./company-settings/AppearanceSettingsSection";
import { ArchiveCompanySection } from "./company-settings/ArchiveCompanySection";
import { CompanyPackagesSection } from "./company-settings/CompanyPackagesSection";
import { GeneralSettingsSection } from "./company-settings/GeneralSettingsSection";
import { InviteSettingsSection } from "./company-settings/InviteSettingsSection";
import { TeamSettingsSection } from "./company-settings/TeamSettingsSection";
import { useCompanySettingsController } from "./company-settings/useCompanySettingsController";

export function CompanySettings() {
  const controller = useCompanySettingsController();
  const { selectedCompany } = controller;

  if (!selectedCompany) {
    return (
      <div className="text-sm text-muted-foreground">
        No company selected. Select a company from the switcher above.
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-lg font-semibold">Company Settings</h1>
      </div>

      <GeneralSettingsSection
        companyName={controller.companyName}
        description={controller.description}
        generalDirty={controller.generalDirty}
        attachmentMaxValid={controller.attachmentMaxValid}
        isSaving={controller.generalMutation.isPending}
        saveSuccess={controller.generalMutation.isSuccess}
        saveError={controller.generalMutation.error}
        onCompanyNameChange={controller.setCompanyName}
        onDescriptionChange={controller.setDescription}
        onSave={() => controller.generalMutation.mutate()}
      />

      <AppearanceSettingsSection
        companyName={controller.companyName}
        selectedCompanyName={selectedCompany.name}
        logoUrl={controller.logoUrl}
        brandColor={controller.brandColor}
        attachmentMaxMiB={controller.attachmentMaxMiB}
        attachmentMaxValid={controller.attachmentMaxValid}
        logoUploadError={controller.logoUploadError}
        logoMutationError={controller.logoUploadMutation.error}
        clearLogoError={controller.clearLogoMutation.error}
        isUploadingLogo={controller.logoUploadMutation.isPending}
        isClearingLogo={controller.clearLogoMutation.isPending}
        onLogoFileChange={controller.handleLogoFileChange}
        onClearLogo={() => controller.clearLogoMutation.mutate()}
        onBrandColorChange={controller.setBrandColor}
        onAttachmentMaxMiBChange={controller.setAttachmentMaxMiB}
      />

      <TeamSettingsSection
        requireApproval={!!selectedCompany.requireBoardApprovalForNewAgents}
        onRequireApprovalChange={(value) => controller.settingsMutation.mutate(value)}
      />

      <InviteSettingsSection
        inviteError={controller.inviteError}
        inviteSnippet={controller.inviteSnippet}
        snippetCopied={controller.snippetCopied}
        snippetCopyDelightId={controller.snippetCopyDelightId}
        isGenerating={controller.inviteMutation.isPending}
        onGenerate={() => controller.inviteMutation.mutate()}
        onCopy={() => void controller.copySnippet()}
      />

      <CompanyPackagesSection />

      <ArchiveCompanySection
        companyName={selectedCompany.name}
        isArchived={selectedCompany.status === "archived"}
        isArchiving={controller.archiveMutation.isPending}
        archiveError={controller.archiveMutation.error}
        onArchive={controller.handleArchive}
      />
    </div>
  );
}
