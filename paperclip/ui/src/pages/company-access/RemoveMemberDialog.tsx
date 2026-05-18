import type { Agent, Issue } from "@paperclipai/shared";
import type { CompanyMember } from "@/api/access";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { memberDisplayName } from "./accessModel";

type RemoveMemberDialogProps = {
  member: CompanyMember | null;
  assignedIssues: Issue[];
  isCheckingIssues: boolean;
  isRemoving: boolean;
  reassignmentTarget: string;
  activeReassignmentUsers: CompanyMember[];
  activeReassignmentAgents: Agent[];
  onOpenChange: (open: boolean) => void;
  onReassignmentTargetChange: (target: string) => void;
  onRemove: () => void;
};

export function RemoveMemberDialog({
  member,
  assignedIssues,
  isCheckingIssues,
  isRemoving,
  reassignmentTarget,
  activeReassignmentUsers,
  activeReassignmentAgents,
  onOpenChange,
  onReassignmentTargetChange,
  onRemove,
}: RemoveMemberDialogProps) {
  return (
    <Dialog open={!!member} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Remove member</DialogTitle>
          <DialogDescription>
            Archive {memberDisplayName(member)} and move active assignments before hiding this user from assignment fields.
          </DialogDescription>
        </DialogHeader>
        {member ? (
          <div className="space-y-5">
            <div className="rounded-md border border-border px-3 py-3">
              <div className="text-sm font-medium">{memberDisplayName(member)}</div>
              <div className="text-sm text-muted-foreground">{member.user?.email || member.principalId}</div>
              <div className="mt-2 text-sm text-muted-foreground">
                {isCheckingIssues
                  ? "Checking assigned issues..."
                  : `${assignedIssues.length} open assigned issue${assignedIssues.length === 1 ? "" : "s"}`}
              </div>
            </div>
            {assignedIssues.length > 0 ? (
              <IssueReassignment
                target={reassignmentTarget}
                assignedIssues={assignedIssues}
                users={activeReassignmentUsers}
                agents={activeReassignmentAgents}
                onChange={onReassignmentTargetChange}
              />
            ) : null}
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={onRemove} disabled={isRemoving || isCheckingIssues}>
            {isRemoving ? "Removing..." : "Remove member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function IssueReassignment({
  target,
  assignedIssues,
  users,
  agents,
  onChange,
}: {
  target: string;
  assignedIssues: Issue[];
  users: CompanyMember[];
  agents: Agent[];
  onChange: (target: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Issue reassignment</div>
      <Select value={target} onValueChange={onChange}>
        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__unassigned">Leave unassigned</SelectItem>
          {users.length > 0 ? (
            <SelectGroup>
              <SelectLabel>Humans</SelectLabel>
              {users.map((member) => <SelectItem key={member.id} value={`user:${member.principalId}`}>{memberDisplayName(member)}</SelectItem>)}
            </SelectGroup>
          ) : null}
          {agents.length > 0 ? (
            <SelectGroup>
              <SelectLabel>Agents</SelectLabel>
              {agents.map((agent) => <SelectItem key={agent.id} value={`agent:${agent.id}`}>{agent.name} ({agent.role})</SelectItem>)}
            </SelectGroup>
          ) : null}
        </SelectContent>
      </Select>
      <div className="max-h-36 overflow-auto rounded-md border border-border">
        {assignedIssues.slice(0, 6).map((issue) => (
          <div key={issue.id} className="border-b border-border px-3 py-2 text-sm last:border-b-0">
            <div className="font-medium">{issue.identifier ?? issue.id.slice(0, 8)}</div>
            <div className="truncate text-muted-foreground">{issue.title}</div>
          </div>
        ))}
        {assignedIssues.length > 6 ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            {assignedIssues.length - 6} more issue{assignedIssues.length - 6 === 1 ? "" : "s"}
          </div>
        ) : null}
      </div>
    </div>
  );
}
