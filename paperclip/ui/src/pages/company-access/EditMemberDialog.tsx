import { HUMAN_COMPANY_MEMBERSHIP_ROLE_LABELS, PERMISSION_KEYS, type PermissionKey } from "@paperclipai/shared";
import type { CompanyMember } from "@/api/access";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getImplicitGrantKeys, memberDisplayName, permissionLabels, type EditableMemberStatus } from "./accessModel";

type EditMemberDialogProps = {
  member: CompanyMember | null;
  draftRole: CompanyMember["membershipRole"];
  draftStatus: EditableMemberStatus;
  draftGrants: Set<PermissionKey>;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onDraftRoleChange: (role: CompanyMember["membershipRole"]) => void;
  onDraftStatusChange: (status: EditableMemberStatus) => void;
  onGrantToggle: (permissionKey: PermissionKey, checked: boolean) => void;
  onSave: () => void;
};

export function EditMemberDialog({
  member,
  draftRole,
  draftStatus,
  draftGrants,
  isSaving,
  onOpenChange,
  onDraftRoleChange,
  onDraftStatusChange,
  onGrantToggle,
  onSave,
}: EditMemberDialogProps) {
  const implicitGrantKeys = getImplicitGrantKeys(draftRole);
  const implicitGrantSet = new Set(implicitGrantKeys);

  return (
    <Dialog open={!!member} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit member</DialogTitle>
          <DialogDescription>
            Update company role, membership status, and explicit grants for {memberDisplayName(member)}.
          </DialogDescription>
        </DialogHeader>
        {member ? (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Label className="block space-y-2">
                <span>Company role</span>
                <Select value={draftRole ?? "__unset"} onValueChange={(value) => onDraftRoleChange(value === "__unset" ? null : value as CompanyMember["membershipRole"])}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__unset">Unset</SelectItem>
                    {Object.entries(HUMAN_COMPANY_MEMBERSHIP_ROLE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Label>
              <Label className="block space-y-2">
                <span>Membership status</span>
                <Select value={draftStatus} onValueChange={(value) => onDraftStatusChange(value as EditableMemberStatus)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </Label>
            </div>
            <GrantSection
              draftRole={draftRole}
              draftGrants={draftGrants}
              implicitGrantKeys={implicitGrantKeys}
              implicitGrantSet={implicitGrantSet}
              onGrantToggle={onGrantToggle}
            />
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave} disabled={isSaving}>{isSaving ? "Saving..." : "Save access"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GrantSection({
  draftRole,
  draftGrants,
  implicitGrantKeys,
  implicitGrantSet,
  onGrantToggle,
}: {
  draftRole: CompanyMember["membershipRole"];
  draftGrants: Set<PermissionKey>;
  implicitGrantKeys: PermissionKey[];
  implicitGrantSet: Set<PermissionKey>;
  onGrantToggle: (permissionKey: PermissionKey, checked: boolean) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-medium">Grants</h3>
        <p className="text-sm text-muted-foreground">
          Roles provide implicit grants automatically. Explicit grants are for overrides and extra access.
        </p>
      </div>
      <div className="rounded-md border border-border px-3 py-3">
        <div className="text-sm font-medium">Implicit grants from role</div>
        <p className="mt-1 text-sm text-muted-foreground">
          {draftRole ? `${HUMAN_COMPANY_MEMBERSHIP_ROLE_LABELS[draftRole]} currently includes these permissions automatically.` : "No role is selected, so this member has no implicit grants right now."}
        </p>
        {implicitGrantKeys.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {implicitGrantKeys.map((permissionKey) => <Badge key={permissionKey} variant="outline">{permissionLabels[permissionKey]}</Badge>)}
          </div>
        ) : null}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {PERMISSION_KEYS.map((permissionKey) => (
          <Label key={permissionKey} className="flex items-start gap-3 rounded-md border border-border px-3 py-2">
            <Checkbox checked={draftGrants.has(permissionKey)} onCheckedChange={(checked) => onGrantToggle(permissionKey, Boolean(checked))} />
            <span className="space-y-1">
              <span className="block text-sm font-medium">{permissionLabels[permissionKey]}</span>
              <span className="block text-xs text-muted-foreground">{permissionKey}</span>
              {implicitGrantSet.has(permissionKey) ? (
                <span className="block text-xs text-muted-foreground">
                  Included implicitly by the {draftRole ? HUMAN_COMPANY_MEMBERSHIP_ROLE_LABELS[draftRole] : "selected"} role. Add an explicit grant only if it should stay after the role changes.
                </span>
              ) : null}
              {draftGrants.has(permissionKey) ? <span className="block text-xs text-muted-foreground">Stored explicitly for this member.</span> : null}
            </span>
          </Label>
        ))}
      </div>
    </div>
  );
}
