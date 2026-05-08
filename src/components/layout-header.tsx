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
  Eye,
  Users,
  ShieldCheck,
  Brain,
  Stethoscope,
  LayoutDashboard,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import KeyboardShortcutsDialog from "@/components/keyboard-shortcuts-dialog";
import ThemeToggle from "@/components/theme-toggle";
import CommandPalette from "@/components/command-palette";
import ShareDialog from "@/components/share-dialog";

export default function LayoutHeader({
  orgName,
  orgSlug,
  founderInitial,
  hasPlan,
  orgs = [],
}: {
  orgName: string;
  orgSlug: string;
  founderInitial: string;
  hasPlan: boolean;
  orgs?: { slug: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [extraCrumbs, setExtraCrumbs] = useState<{ label: string; href?: string }[]>([]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setShortcutsOpen(true);
      } else if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      } else if ((e.metaKey || e.ctrlKey) && e.key === ".") {
        e.preventDefault();
        router.push(`/${orgSlug}/review`);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, orgSlug]);
  // Dept slugs that live at /[org]/[slug] but are NOT departments
  const NON_DEPT = new Set([
    "roadmap", "settings", "skills", "integrations", "referrals",
    "database", "tasks", "agents", "team", "approvals", "inbox",
    "routines", "activity", "costs", "publishing", "referrals",
    "managed-services", "memory", "diagnostics", "billing", "review",
    "search", "library", "marketplace", "studio", "timeline", "dashboard",
    "share", "import", "sandbox", "whats-new", "help", "feed",
  ]);

  const DEPT_AGENT_LABEL: Record<string, string> = {
    engineering: "Engineer",
    design: "Design Agent",
    marketing: "Marketing Agent",
    sales: "Sales Agent",
    operations: "Operations Agent",
    finance: "Finance Agent",
    legal: "Legal Agent",
    support: "Support Agent",
  };

  useEffect(() => {
    const segs = pathname.replace(/^\/+|\/+$/g, "").split("/");
    if (!hasPlan) { setExtraCrumbs([]); return; }

    // Task detail page: /[org]/tasks/[taskId]
    if (segs[1] === "tasks" && segs[2]) {
      void fetch(`/api/${orgSlug}/tasks/${segs[2]}`)
        .then((r) => r.json())
        .then((d: { task: { title: string }; agentName: string | null; deptName: string | null; deptSlug: string | null }) => {
          const crumbs: { label: string; href?: string }[] = [];
          if (d.deptSlug) crumbs.push({ label: d.deptName ?? capitalize(d.deptSlug), href: `/${orgSlug}/${d.deptSlug}` });
          if (d.agentName) crumbs.push({ label: d.agentName });
          crumbs.push({ label: d.task.title });
          setExtraCrumbs(crumbs);
        })
        .catch(() => setExtraCrumbs([]));
      return;
    }

    // Department page: /[org]/[deptSlug]
    if (segs[1] && !NON_DEPT.has(segs[1]) && segs.length === 2) {
      const deptSlug = segs[1];
      setExtraCrumbs([
        { label: capitalize(deptSlug), href: `/${orgSlug}/${deptSlug}` },
        { label: DEPT_AGENT_LABEL[deptSlug] ?? capitalize(deptSlug) + " Agent" },
      ]);
      return;
    }

    setExtraCrumbs([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, orgSlug, hasPlan]);

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
    review: "Review",
    "managed-services": "Managed services",
    preview: "Preview",
    memory: "Company memory",
    notifications: "Notifications",
    billing: "Billing",
    sandbox: "Sandbox",
    diagnostics: "Diagnostics",
    "whats-new": "What's new",
    help: "Help",
    feed: "Feed",
    studio: "Studio",
    timeline: "Timeline",
    dashboard: "Dashboard",
    share: "Share",
    team: "Team",
    import: "Import",
    marketplace: "Marketplace",
  };
  const subLabel =
    subSegment && SUB_LABELS[subSegment]
      ? SUB_LABELS[subSegment]
      : subSegment
        ? capitalize(subSegment)
        : null;

  const goto = (href: string) => () => router.push(href);

  return (
    <header className="h-12 px-3 flex items-center justify-between text-base">
      <div className="flex items-center gap-1.5 min-w-0">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label="Workspace menu"
                className="inline-flex items-center gap-1 rounded hover:bg-line/60 px-1 py-1"
              >
                <span className="size-6 rounded-full bg-line inline-flex items-center justify-center text-xs font-medium text-ink-muted">
                  {founderInitial}
                </span>
                <ChevronDown className="size-3 text-ink-soft" />
              </button>
            }
          />
          <DropdownMenuContent align="start" className="w-56">
            {orgs.length > 1 && (
              <>
                <div className="px-2 py-1.5 text-2xs uppercase tracking-wider text-ink-muted">
                  Workspaces
                </div>
                {orgs.map((o) => (
                  <MenuRow
                    key={o.slug}
                    onSelect={goto(`/${o.slug}`)}
                    icon={
                      <span
                        className={`size-3.5 rounded-sm ${
                          o.slug === orgSlug
                            ? "bg-ink"
                            : "bg-line"
                        }`}
                      />
                    }
                    label={o.name}
                  />
                ))}
                <MenuRow
                  onSelect={goto("/onboarding")}
                  icon={<span className="size-3.5 inline-flex items-center justify-center text-ink-muted">+</span>}
                  label="New workspace"
                />
                <DropdownMenuSeparator />
              </>
            )}
            {orgs.length <= 1 && (
              <div className="px-2 py-1.5 text-2xs uppercase tracking-wider text-ink-muted">
                {orgName}
              </div>
            )}
            <MenuRow
              onSelect={goto(`/${orgSlug}/studio`)}
              icon={<LayoutDashboard className="size-3.5" />}
              label="Studio"
            />
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
              onSelect={goto(`/${orgSlug}/agents`)}
              icon={<Users className="size-3.5" />}
              label="Agents"
            />
            <MenuRow
              onSelect={goto(`/${orgSlug}/team`)}
              icon={<Users className="size-3.5" />}
              label="Team"
            />
            <MenuRow
              onSelect={goto(`/${orgSlug}/skills`)}
              icon={<Sparkles className="size-3.5" />}
              label="Skills"
            />
            <MenuRow
              onSelect={goto(`/${orgSlug}/marketplace`)}
              icon={<Sparkles className="size-3.5" />}
              label="Marketplace"
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
              onSelect={goto(`/${orgSlug}/review`)}
              icon={<Eye className="size-3.5" />}
              label="Review"
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
              onSelect={goto(`/${orgSlug}/managed-services`)}
              icon={<ShieldCheck className="size-3.5" />}
              label="Managed services"
            />
            <MenuRow
              onSelect={goto(`/${orgSlug}/memory`)}
              icon={<Brain className="size-3.5" />}
              label="Company memory"
            />
            <MenuRow
              onSelect={goto(`/${orgSlug}/diagnostics`)}
              icon={<Stethoscope className="size-3.5" />}
              label="Diagnostics"
            />
            <MenuRow
              onSelect={goto(`/${orgSlug}/settings/billing`)}
              icon={<Receipt className="size-3.5" />}
              label="Billing & Usage"
            />
            <DropdownMenuSeparator />
            <MenuRow
              onSelect={() => setShortcutsOpen(true)}
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
              onSelect={goto(`/${orgSlug}/help`)}
              icon={<LifeBuoy className="size-3.5" />}
              label="Help"
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
            className="ml-1 tracking-tight text-sm uppercase text-ink hover:text-ink"
          >
            {orgName}
          </Link>
        )}
        {hasPlan && isSubpage && (
          extraCrumbs.length > 0 ? (
            extraCrumbs.map((c, i) => (
              <span key={i} className="inline-flex items-center gap-1">
                <span className="mx-1 text-line-strong">›</span>
                {c.href ? (
                  <Link
                    href={c.href}
                    className="tracking-tight text-ink max-w-[140px] truncate hover:underline"
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span className="tracking-tight text-ink max-w-[140px] truncate">
                    {c.label}
                  </span>
                )}
              </span>
            ))
          ) : subLabel ? (
            <>
              <span className="mx-1 text-line-strong">›</span>
              <span className="tracking-tight text-ink">{subLabel}</span>
            </>
          ) : null
        )}
      </div>
      <div className="flex items-center gap-1 text-ink-muted">
        <Link
          href={`/${orgSlug}/billing/upgrade`}
          className="rounded-md bg-ink text-paper px-2.5 py-1 text-xs font-medium tracking-wide hover:opacity-90 inline-flex items-center gap-1"
          title="Upgrade plan"
        >
          <SunMedium className="size-3 text-mustard" />
          Upgrade
        </Link>
        <ThemeToggle />
        <IconBtn
          onClick={() => setShareOpen(true)}
          title="Share workspace"
        >
          <Share2 className="size-3.5" />
        </IconBtn>
        <IconBtn
          onClick={() => setPaletteOpen(true)}
          title="Search (⌘K)"
        >
          <Search className="size-3.5" />
        </IconBtn>
      </div>
      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <ShareDialog
        orgSlug={orgSlug}
        open={shareOpen}
        onOpenChange={setShareOpen}
      />
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
      className="text-sm gap-2 cursor-pointer"
    >
      {icon}
      {label}
    </DropdownMenuItem>
  );
}

function IconBtn({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="size-7 rounded-md hover:bg-line/40 inline-flex items-center justify-center text-ink-muted hover:text-ink"
    >
      {children}
    </button>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
