import type { ComponentProps } from "react";
import { Activity, ListTree, MessageSquare } from "lucide-react";
import type { Issue } from "@paperclipai/shared";

import { IssueRelatedWorkPanel } from "@/components/IssueRelatedWorkPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PluginSlotMount } from "@/plugins/slots";

import { IssueDetailActivityTab } from "./IssueDetailActivityTab";
import { IssueDetailChatTab } from "./IssueDetailChatTab";

type IssuePluginTabItem = {
  value: string;
  label: string;
  slot: ComponentProps<typeof PluginSlotMount>["slot"];
};

type IssueDetailTabsProps = {
  value: string;
  onValueChange: (value: string) => void;
  chatProps: ComponentProps<typeof IssueDetailChatTab>;
  activityProps: ComponentProps<typeof IssueDetailActivityTab>;
  relatedWork: Issue["relatedWork"];
  pluginTabItems: IssuePluginTabItem[];
  activePluginTab: IssuePluginTabItem | null;
  pluginContext: ComponentProps<typeof PluginSlotMount>["context"];
};

export function IssueDetailTabs({
  value,
  onValueChange,
  chatProps,
  activityProps,
  relatedWork,
  pluginTabItems,
  activePluginTab,
  pluginContext,
}: IssueDetailTabsProps) {
  return (
    <Tabs value={value} onValueChange={onValueChange} className="space-y-3">
      <TabsList variant="line" className="w-full justify-start gap-1">
        <TabsTrigger value="related-work" className="gap-1.5">
          <ListTree className="h-3.5 w-3.5" />
          Context
        </TabsTrigger>
        <TabsTrigger value="chat" className="gap-1.5">
          <MessageSquare className="h-3.5 w-3.5" />
          Runtime diagnostics
        </TabsTrigger>
        <TabsTrigger value="activity" className="gap-1.5">
          <Activity className="h-3.5 w-3.5" />
          Audit
        </TabsTrigger>
        {pluginTabItems.map((item) => (
          <TabsTrigger key={item.value} value={item.value}>
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="chat">
        <IssueDetailChatTab {...chatProps} />
      </TabsContent>

      <TabsContent value="activity">
        {value === "activity" ? <IssueDetailActivityTab {...activityProps} /> : null}
      </TabsContent>

      <TabsContent value="related-work">
        <IssueRelatedWorkPanel relatedWork={relatedWork} />
      </TabsContent>

      {activePluginTab ? (
        <TabsContent value={activePluginTab.value}>
          <PluginSlotMount
            slot={activePluginTab.slot}
            context={pluginContext}
            missingBehavior="placeholder"
          />
        </TabsContent>
      ) : null}
    </Tabs>
  );
}
