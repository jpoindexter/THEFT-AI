import type { RefObject, ReactNode } from "react";
import { BreadcrumbBar } from "../BreadcrumbBar";
import { PropertiesPanel } from "../PropertiesPanel";
import { cn } from "../../lib/utils";
import { NotFoundPage } from "../../pages/NotFound";

type MainContentShellProps = {
  children: ReactNode;
  companyPrefix?: string;
  hasUnknownCompanyPrefix: boolean;
  isMobile: boolean;
  mainContentRef: RefObject<HTMLElement | null>;
  selectedCompanyPrefix?: string;
};

export function MainContentShell({
  children,
  companyPrefix,
  hasUnknownCompanyPrefix,
  isMobile,
  mainContentRef,
  selectedCompanyPrefix,
}: MainContentShellProps) {
  return (
    <div className={cn("flex min-w-0 flex-col", isMobile ? "h-full w-full min-h-0" : "h-full flex-1")}>
      <div
        className={cn(
          isMobile && "sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85",
        )}
      >
        <BreadcrumbBar />
      </div>
      <div className={cn(isMobile ? "min-h-0 flex-1 overflow-hidden" : "flex flex-1 min-h-0")}>
        <main
          id="main-content"
          ref={mainContentRef}
          tabIndex={-1}
          className={cn(
            "theft-main-surface min-w-0 flex-1 p-4 outline-none md:p-6",
            isMobile
              ? "h-full w-full max-w-full overflow-x-hidden overflow-y-auto overscroll-contain pb-[calc(5rem+env(safe-area-inset-bottom))]"
              : "overflow-auto",
          )}
        >
          {hasUnknownCompanyPrefix ? (
            <NotFoundPage
              scope="invalid_company_prefix"
              requestedPrefix={companyPrefix ?? selectedCompanyPrefix}
            />
          ) : (
            children
          )}
        </main>
        <PropertiesPanel />
      </div>
    </div>
  );
}
