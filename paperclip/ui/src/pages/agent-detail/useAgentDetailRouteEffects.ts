import { useEffect } from "react";
import type { AgentDetail } from "@paperclipai/shared";
import type { CompanySelectionSource } from "../../lib/company-selection";
import type { AgentDetailView } from "./agentDetailView";

type CompanySelectionOptions = { source?: CompanySelectionSource };

export function useAgentDetailRouteEffects({
  activeView,
  agent,
  canonicalAgentRef,
  closePanel,
  navigate,
  routeAgentRef,
  selectedCompanyId,
  setBreadcrumbs,
  setSelectedCompanyId,
  urlRunId,
  urlTab,
}: {
  activeView: AgentDetailView;
  agent: AgentDetail | undefined;
  canonicalAgentRef: string;
  closePanel: () => void;
  navigate: (href: string, options?: { replace?: boolean }) => void;
  routeAgentRef: string;
  selectedCompanyId: string | null;
  setBreadcrumbs: (crumbs: { label: string; href?: string }[]) => void;
  setSelectedCompanyId: (companyId: string, options?: CompanySelectionOptions) => void;
  urlRunId?: string;
  urlTab?: string;
}) {
  useEffect(() => {
    if (!agent) return;
    if (urlRunId) {
      if (routeAgentRef !== canonicalAgentRef) {
        navigate(`/agents/${canonicalAgentRef}/runs/${urlRunId}`, { replace: true });
      }
      return;
    }
    const canonicalTab = activeView;
    if (routeAgentRef !== canonicalAgentRef || urlTab !== canonicalTab) {
      navigate(`/agents/${canonicalAgentRef}/${canonicalTab}`, { replace: true });
    }
  }, [agent, routeAgentRef, canonicalAgentRef, urlRunId, urlTab, activeView, navigate]);

  useEffect(() => {
    if (!agent?.companyId || agent.companyId === selectedCompanyId) return;
    setSelectedCompanyId(agent.companyId, { source: "route_sync" });
  }, [agent?.companyId, selectedCompanyId, setSelectedCompanyId]);

  useEffect(() => {
    const crumbs: { label: string; href?: string }[] = [{ label: "Agents", href: "/agents" }];
    const agentName = agent?.name ?? routeAgentRef ?? "Agent";
    if (activeView === "dashboard" && !urlRunId) {
      crumbs.push({ label: agentName });
    } else {
      crumbs.push({ label: agentName, href: `/agents/${canonicalAgentRef}/dashboard` });
      if (urlRunId) {
        crumbs.push({ label: "Runs", href: `/agents/${canonicalAgentRef}/runs` });
        crumbs.push({ label: `Run ${urlRunId.slice(0, 8)}` });
      } else {
        crumbs.push({ label: activeView[0]!.toUpperCase() + activeView.slice(1) });
      }
    }
    setBreadcrumbs(crumbs);
  }, [setBreadcrumbs, agent, routeAgentRef, canonicalAgentRef, activeView, urlRunId]);

  useEffect(() => {
    closePanel();
    return () => closePanel();
  }, [closePanel]);
}
