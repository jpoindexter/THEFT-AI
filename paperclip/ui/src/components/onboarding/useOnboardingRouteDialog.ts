import { useEffect, useState } from "react";
import type { Company } from "@paperclipai/shared";

import { useLocation, useParams } from "@/lib/router";
import { resolveRouteOnboardingOptions } from "../../lib/onboarding-route";
import type { OnboardingStep } from "./types";

type OnboardingOptions = {
  initialStep?: OnboardingStep;
  companyId?: string;
};

export function useOnboardingRouteDialog({
  companies,
  companiesLoading,
  onboardingOpen,
  onboardingOptions,
}: {
  companies: Company[];
  companiesLoading: boolean;
  onboardingOpen: boolean;
  onboardingOptions: OnboardingOptions;
}) {
  const location = useLocation();
  const { companyPrefix } = useParams<{ companyPrefix?: string }>();
  const [routeDismissed, setRouteDismissed] = useState(false);

  const routeOnboardingOptions =
    companyPrefix && companiesLoading
      ? null
      : resolveRouteOnboardingOptions({
          pathname: location.pathname,
          companyPrefix,
          companies,
        });

  const effectiveOnboardingOpen =
    onboardingOpen || (routeOnboardingOptions !== null && !routeDismissed);
  const effectiveOnboardingOptions = onboardingOpen
    ? onboardingOptions
    : routeOnboardingOptions ?? {};

  useEffect(() => {
    setRouteDismissed(false);
  }, [location.pathname]);

  return {
    effectiveOnboardingOpen,
    effectiveOnboardingOptions,
    setRouteDismissed,
  };
}
