import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronsUpDown,
  LogOut,
  Plus,
  Settings,
  UserPlus,
} from "lucide-react";
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Company } from "@paperclipai/shared";
import { Link, useLocation, useNavigate } from "@/lib/router";
import { authApi } from "@/api/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCompany } from "@/context/CompanyContext";
import { useDialogActions } from "@/context/DialogContext";
import { useCompanyOrder } from "@/hooks/useCompanyOrder";
import { queryKeys } from "@/lib/queryKeys";
import { cn } from "@/lib/utils";
import { useSidebar } from "../context/SidebarContext";
import { SortableCompanyItem, WorkspaceIcon } from "./sidebar-company-menu/SortableCompanyItem";

interface SidebarCompanyMenuProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  compact?: boolean;
}

export function SidebarCompanyMenu({ open: controlledOpen, onOpenChange, compact = false }: SidebarCompanyMenuProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const queryClient = useQueryClient();
  const { companies, selectedCompany, setSelectedCompanyId } = useCompany();
  const { openOnboarding } = useDialogActions();
  const { isMobile, setSidebarOpen } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    }),
  );
  const sidebarCompanies = useMemo(
    () => companies.filter((company) => company.status !== "archived"),
    [companies],
  );
  const { data: session } = useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: () => authApi.getSession(),
    retry: false,
  });
  const currentUserId = session?.user?.id ?? session?.session?.userId ?? null;
  const { orderedCompanies, persistOrder } = useCompanyOrder({
    companies: sidebarCompanies,
    userId: currentUserId,
  });

  const signOutMutation = useMutation({
    mutationFn: () => authApi.signOut(),
    onSuccess: async () => {
      setOpen(false);
      if (isMobile) setSidebarOpen(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.session });
    },
  });

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setIsEditingOrder(false);
    setOpen(nextOpen);
  }

  function closeNavigationChrome() {
    setOpen(false);
    setIsEditingOrder(false);
    if (isMobile) setSidebarOpen(false);
  }

  function selectCompany(company: Company) {
    const pathPrefix = location.pathname.split("/")[1]?.toUpperCase();
    const isCompanyRoute = sidebarCompanies.some((sidebarCompany) => (
      sidebarCompany.issuePrefix.toUpperCase() === pathPrefix
    ));
    const shouldLeaveCurrentRoute = company.id !== selectedCompany?.id
      && (location.pathname.startsWith("/instance/") || isCompanyRoute);

    setSelectedCompanyId(company.id);
    setOpen(false);
    if (isMobile) setSidebarOpen(false);
    if (shouldLeaveCurrentRoute) {
      navigate(`/${company.issuePrefix}/dashboard`);
    }
  }

  function addCompany() {
    setOpen(false);
    if (isMobile) setSidebarOpen(false);
    openOnboarding();
  }

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const ids = orderedCompanies.map((company) => company.id);
      const oldIndex = ids.indexOf(active.id as string);
      const newIndex = ids.indexOf(over.id as string);
      if (oldIndex === -1 || newIndex === -1) return;

      persistOrder(arrayMove(ids, oldIndex, newIndex));
    },
    [orderedCompanies, persistOrder],
  );

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "h-9 justify-start gap-2 px-2 text-left",
            compact ? "w-8 justify-center rounded-full" : "flex-1",
          )}
          aria-label={selectedCompany ? `Open ${selectedCompany.name} workspace switcher` : "Open workspace switcher"}
        >
          <span className={cn("flex min-w-0 items-center gap-2", compact ? "flex-none" : "flex-1")}>
            {selectedCompany ? <WorkspaceIcon company={selectedCompany} /> : null}
            <span className={cn("truncate text-sm font-bold text-foreground", compact && "sr-only")}>
              {selectedCompany?.name ?? "Select workspace"}
            </span>
          </span>
          {compact ? null : <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8} className="w-64 p-1">
        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
          <DropdownMenuLabel className="theft-label-compact p-0 font-semibold">
            Switch workspace
          </DropdownMenuLabel>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setIsEditingOrder((current) => !current);
            }}
            className="px-1.5 text-micro text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            {isEditingOrder ? "Done" : "Edit"}
          </Button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={orderedCompanies.map((company) => company.id)}
              strategy={verticalListSortingStrategy}
            >
              {orderedCompanies.map((company) => (
                <SortableCompanyItem
                  key={company.id}
                  company={company}
                  isEditing={isEditingOrder}
                  isSelected={company.id === selectedCompany?.id}
                  onSelect={selectCompany}
                />
              ))}
            </SortableContext>
          </DndContext>
          {orderedCompanies.length === 0 ? (
            <DropdownMenuItem disabled>No workspaces</DropdownMenuItem>
          ) : null}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={addCompany}
          className="gap-2 py-2 text-muted-foreground"
          disabled={isEditingOrder}
        >
          <Plus className="size-4" />
          <span>Add company...</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild disabled={isEditingOrder}>
          <Link
            to="/company/settings/invites"
            onClick={(event) => {
              if (isEditingOrder) {
                event.preventDefault();
                return;
              }
              closeNavigationChrome();
            }}
          >
            <UserPlus className="size-4" />
            <span className="truncate">
              {selectedCompany ? `Invite people to ${selectedCompany.name}` : "Invite people"}
            </span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild disabled={isEditingOrder}>
          <Link
            to="/company/settings"
            onClick={(event) => {
              if (isEditingOrder) {
                event.preventDefault();
                return;
              }
              closeNavigationChrome();
            }}
          >
            <Settings className="size-4" />
            <span>Company settings</span>
          </Link>
        </DropdownMenuItem>
        {session?.session ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => signOutMutation.mutate()}
              disabled={isEditingOrder || signOutMutation.isPending}
            >
              <LogOut className="size-4" />
              <span>{signOutMutation.isPending ? "Signing out..." : "Sign out"}</span>
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
