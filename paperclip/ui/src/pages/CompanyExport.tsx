import { Package } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { PageSkeleton } from "../components/PageSkeleton";
import { ExportActionBar, ExportWarnings } from "./company-export/ExportActionBar";
import { ExportFileSidebar } from "./company-export/ExportFileSidebar";
import { ExportPreviewPane } from "./company-export/ExportPreviewPane";
import { useCompanyExportController } from "./company-export/useCompanyExportController";

export function CompanyExport() {
  const exportController = useCompanyExportController();

  if (!exportController.selectedCompanyId) {
    return <EmptyState icon={Package} message="Select a company to export." />;
  }
  if (exportController.isLoading) {
    return <PageSkeleton variant="detail" />;
  }
  if (!exportController.exportData) {
    return <EmptyState icon={Package} message="Loading export data..." />;
  }

  return (
    <div>
      <ExportActionBar
        companyName={exportController.companyName}
        selectedCount={exportController.selectedCount}
        totalFiles={exportController.totalFiles}
        warningsCount={exportController.warnings.length}
        isDownloading={exportController.isDownloading}
        onDownload={exportController.download}
      />
      <ExportWarnings warnings={exportController.warnings} />
      <div className="grid min-h-screen gap-0 xl:grid-cols-4">
        <ExportFileSidebar
          displayTree={exportController.displayTree}
          selectedFile={exportController.selectedFile}
          expandedDirs={exportController.expandedDirs}
          checkedFiles={exportController.checkedFiles}
          treeSearch={exportController.treeSearch}
          totalTaskChildren={exportController.totalTaskChildren}
          visibleTaskChildren={exportController.visibleTaskChildren}
          onSearchChange={exportController.handleSearchChange}
          onTaskLimitIncrease={exportController.increaseTaskLimit}
          onToggleDir={exportController.handleToggleDir}
          onSelectFile={exportController.selectFile}
          onToggleCheck={exportController.handleToggleCheck}
        />
        <div className="min-w-0 overflow-y-auto pl-6 xl:col-span-3">
          <ExportPreviewPane
            selectedFile={exportController.selectedFile}
            content={exportController.previewContent}
            allFiles={exportController.effectiveFiles}
            onSkillClick={exportController.handleSkillClick}
          />
        </div>
      </div>
    </div>
  );
}
