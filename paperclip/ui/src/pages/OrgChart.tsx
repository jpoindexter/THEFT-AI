import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Network } from "lucide-react";
import { agentsApi } from "../api/agents";
import { EmptyState } from "../components/EmptyState";
import { PageSkeleton } from "../components/PageSkeleton";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useCompany } from "../context/CompanyContext";
import { useNavigate } from "../lib/router";
import { queryKeys } from "../lib/queryKeys";
import { OrgChartToolbar } from "./org-chart/OrgChartToolbar";
import { OrgChartViewport } from "./org-chart/OrgChartViewport";
import {
  buildAgentMap,
  collectEdges,
  flattenLayout,
  getChartBounds,
  layoutForest,
} from "./org-chart/orgChartModel";
import { useOrgChartPanZoom } from "./org-chart/useOrgChartPanZoom";

export function OrgChart() {
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const navigate = useNavigate();

  const { data: orgTree, isLoading } = useQuery({
    queryKey: queryKeys.org(selectedCompanyId!),
    queryFn: () => agentsApi.org(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const { data: agents } = useQuery({
    queryKey: queryKeys.agents.list(selectedCompanyId!),
    queryFn: () => agentsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  useEffect(() => {
    setBreadcrumbs([{ label: "Org Chart" }]);
  }, [setBreadcrumbs]);

  const agentMap = useMemo(() => buildAgentMap(agents), [agents]);
  const layout = useMemo(() => layoutForest(orgTree ?? []), [orgTree]);
  const allNodes = useMemo(() => flattenLayout(layout), [layout]);
  const edges = useMemo(() => collectEdges(layout), [layout]);
  const bounds = useMemo(() => getChartBounds(allNodes), [allNodes]);
  const panZoom = useOrgChartPanZoom(allNodes, bounds);

  if (!selectedCompanyId) {
    return <EmptyState icon={Network} message="Select a company to view the org chart." />;
  }

  if (isLoading) {
    return <PageSkeleton variant="org-chart" />;
  }

  if (orgTree && orgTree.length === 0) {
    return <EmptyState icon={Network} message="No organizational hierarchy defined." />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <OrgChartToolbar />
      <OrgChartViewport
        containerRef={panZoom.containerRef}
        nodes={allNodes}
        edges={edges}
        agentMap={agentMap}
        pan={panZoom.pan}
        zoom={panZoom.zoom}
        dragging={panZoom.dragging}
        onNavigate={(href) => navigate(href)}
        onZoomTowardPoint={panZoom.zoomTowardPoint}
        onFitToScreen={panZoom.fitToScreen}
        onCardClickCapture={panZoom.consumeSuppressedCardClick}
        handlers={panZoom.handlers}
      />
    </div>
  );
}
