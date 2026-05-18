import { CompanyEnvironmentsContent } from "./company-environments/CompanyEnvironmentsContent";
import { useCompanyEnvironmentsModel } from "./company-environments/useCompanyEnvironmentsModel";

export function CompanyEnvironments() {
  const model = useCompanyEnvironmentsModel();
  return <CompanyEnvironmentsContent {...model} />;
}
