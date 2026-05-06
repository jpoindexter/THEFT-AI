"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  ChevronDown,
  Search,
  Share2,
  SunMedium,
  Settings,
  Globe,
  Sparkles,
  GitBranch,
  Cable,
  Gift,
  Database,
  Receipt,
  Keyboard,
  MessageCircle,
  LifeBuoy,
  LogOut,
  CheckSquare,
  Calendar,
  Inbox,
  Activity,
  DollarSign,
  Rocket,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function LayoutHeader({
  orgName,
  orgSlug,
  founderInitial,
  hasPlan,
}: {
  orgName: string;
  orgSlug: string;
  founderInitial: string;
  hasPlan: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const segments = pathname.replace(/^\/+|\/+$/g, "").split("/");
  const after = segments.slice(1);
  const isSubpage = after.length > 0;
  const subSegment = after[0];

  const SUB_LABELS: Record<string, string> = {
    roadmap: "Roadmap",
    design: "Design",
    skills: "Skills",
    integrations: "Integrations",
    referrals: "Referrals",
    database: "Database",
    settings: "Settings",
    approvals: "Approvals",
    costs: "Costs",
    routines: "Routines",
    activity: "Activity",
    inbox: "Inbox",
    publishing: "Publishing",
    search: "Search",
    agents: "Agents",
    tasks: "Tasks",
    library: "Library",
  };
  const subLabel =
    subSegment && SUB_LABELS[subSegment]
      ? SUB_LABELS[subSegment]
      : subSegment
        ? capitalize(subSegment)
        : null;

  const goto = (href: string) => () => router.push(href);

  return (
    <header className="h-12 px-3 flex items-center justify-between text-[13px]">
      <div className="flex items-center gap-1.5 min-w-0">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label="Workspace menu"
                className="inline-flex items-center gap-1 rounded hover:bg-stone-200/60 px-1 py-1"
              >
                <span className="size-6 rounded-full bg-stone-200 inline-flex items-center justify-center text-[11px] font-medium text-stone-600">
                  {founderInitial}
                </span>
                <ChevronDown className="size-3 text-stone-400" />
              </button>
            }
          />
          <DropdownMenuContent align="start" className="w-48">
            <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-stone-500">
              {orgName}
            </div>
            <MenuRow
              onSelect={goto(`/${orgSlug}/settings`)}
              icon={<Settings className="size-3.5" />}
              label="Settings"
            />
            <MenuRow
              onSelect={goto(`/${orgSlug}/settings/domains`)}
              icon={<Globe className="size-3.5" />}
              label="Domains"
            />
            <MenuRow
              onSelect={goto(`/${orgSlug}/skills`)}
              icon={<Sparkles className="size-3.5" />}
              label="Skills"
            />
            <MenuRow
              onSelect={goto(`/${orgSlug}/roadmap`)}
              icon={<GitBranch className="size-3.5" />}
              label="Roadmap"
            />
            <MenuRow
              onSelect={goto(`/${orgSlug}/integrations`)}
              icon={<Cable className="size-3.5" />}
              label="Integrations"
            />
            <MenuRow
              onSelect={goto(`/${orgSlug}/approvals`)}
              icon={<CheckSquare className="size-3.5" />}
              label="Approvals"
            />
            <MenuRow
              onSelect={goto(`/${orgSlug}/inbox`)}
              icon={<Inbox className="size-3.5" />}
              label="Inbox"
            />
            <MenuRow
              onSelect={goto(`/${orgSlug}/routines`)}
              icon={<Calendar className="size-3.5" />}
              label="Routines"
            />
            <MenuRow
              onSelect={goto(`/${orgSlug}/activity`)}
              icon={<Activity className="size-3.5" />}
              label="Activity"
            />
            <MenuRow
              onSelect={goto(`/${orgSlug}/costs`)}
              icon={<DollarSign className="size-3.5" />}
              label="Costs"
            />
            <MenuRow
              onSelect={goto(`/${orgSlug}/publishing`)}
              icon={<Rocket className="size-3.5" />}
              label="Publishing"
            />
            <DropdownMenuSeparator />
            <MenuRow
              onSelect={goto(`/${orgSlug}/referrals`)}
              icon={<Gift className="size-3.5" />}
              label="Referrals"
            />
            <MenuRow
              onSelect={goto(`/${orgSlug}/database`)}
              icon={<Database className="size-3.5" />}
              label="Database"
            />
            <MenuRow
              onSelect={goto(`/${orgSlug}/settings/billing`)}
              icon={<Receipt className="size-3.5" />}
              label="Billing & Usage"
            />
            <DropdownMenuSeparator />
            <MenuRow
              icon={<Keyboard className="size-3.5" />}
              label="Keyboard Shortcuts"
            />
            <MenuRow
              onSelect={() =>
                window.open("https://discord.gg", "_blank", "noopener")
              }
              icon={<MessageCircle className="size-3.5" />}
              label="Join Discord"
            />
            <MenuRow
              onSelect={goto(`/${orgSlug}/settings/support`)}
              icon={<LifeBuoy className="size-3.5" />}
              label="Support ticket"
            />
            <DropdownMenuSeparator />
            <MenuRow icon={<LogOut className="size-3.5" />} label="Log out" />
          </DropdownMenuContent>
        </DropdownMenu>

        {hasPlan && (
          <Link
            href={`/${orgSlug}`}
            className="ml-1 tracking-tight text-[12px] uppercase text-stone-700 hover:text-stone-900"
          >
            {orgName}
          </Link>
        )}
        {isSubpage && hasPlan && subLabel && (
          <>
            <span className="mx-1 text-stone-300">›</span>
            <span className="tracking-tight text-stone-900">{subLabel}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-1 text-stone-500">
        <button
          type="button"
          className="rounded-md bg-stone-900 text-white px-2.5 py-1 text-[11px] font-medium tracking-wide hover:bg-stone-800 inline-flex items-center gap-1"
        >
          <SunMedium className="size-3 text-amber-300" />
          Upgrade
        </button>
        <IconBtn>
          <SunMedium className="size-3.5" />
        </IconBtn>
        <IconBtn>
          <Share2 className="size-3.5" />
        </IconBtn>
        <IconBtn onClick={goto(`/${orgSlug}/search`)}>
          <Search className="size-3.5" />
        </IconBtn>
      </div>
    </header>
  );
}

function MenuRow({
  icon,
  label,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  onSelect?: () => void;
}) {
  return (
    <DropdownMenuItem
      onClick={onSelect}
      className="text-[12px] gap-2 cursor-pointer"
    >
      {icon}
      {label}
    </DropdownMenuItem>
  );
}

function IconBtn({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="size-7 rounded-md hover:bg-stone-200/60 inline-flex items-center justify-center"
    >
      {children}
    </button>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
