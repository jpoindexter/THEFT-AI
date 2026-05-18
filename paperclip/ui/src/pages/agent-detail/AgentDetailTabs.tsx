import { PageTabBar } from "../../components/PageTabBar";
import { Tabs } from "@/components/ui/tabs";
import type { AgentDetailView } from "./agentDetailView";

export function AgentDetailTabs({
  activeView,
  agentRouteId,
  onNavigate,
}: {
  activeView: AgentDetailView;
  agentRouteId: string;
  onNavigate: (href: string) => void;
}) {
  const goToView = (value: string) => onNavigate(`/agents/${agentRouteId}/${value}`);

  return (
    <Tabs value={activeView} onValueChange={goToView}>
      <PageTabBar
        items={[
          { value: "dashboard", label: "Dashboard" },
          { value: "instructions", label: "Instructions" },
          { value: "skills", label: "Skills" },
          { value: "configuration", label: "Configuration" },
          { value: "runs", label: "Runs" },
          { value: "budget", label: "Budget" },
        ]}
        value={activeView}
        onValueChange={goToView}
      />
    </Tabs>
  );
}
