import {
  Lightbulb, Code2, Building2, Palette, Globe, Share2, Target,
  CreditCard, Laptop2, KeyRound, Rocket, Mail, LayoutTemplate,
  SendHorizontal, CalendarDays, Users2, MailCheck, Folder,
  BookOpen, TrendingUp, Megaphone, Layers, Monitor, Filter,
  Activity, Search, MessageCircle, Handshake, UserPlus, Receipt,
  Headphones, Gift, Scale, MessageSquare, DollarSign,
} from "lucide-react";

export type IconMeta = { icon: React.ElementType; color: string };

export const NODE_META: Record<string, IconMeta> = {
  // IDEA
  "initial-idea":               { icon: Lightbulb,      color: "bg-amber-100 text-amber-600" },
  // INITIAL
  "pick-company-name":          { icon: Target,          color: "bg-blue-100 text-blue-600" },
  "prepare-repository":         { icon: Code2,           color: "bg-purple-100 text-purple-600" },
  "incorporate-llc":            { icon: Building2,       color: "bg-slate-100 text-slate-600" },
  // IDENTITY
  "brand-identity":             { icon: Palette,         color: "bg-pink-100 text-pink-600" },
  "buy-domain":                 { icon: Globe,           color: "bg-sky-100 text-sky-600" },
  "setup-social-presence":      { icon: Share2,          color: "bg-cyan-100 text-cyan-600" },
  "define-positioning":         { icon: Target,          color: "bg-indigo-100 text-indigo-600" },
  "open-bank-account":          { icon: CreditCard,      color: "bg-emerald-100 text-emerald-600" },
  // BUILD
  "build-app":                  { icon: Laptop2,         color: "bg-violet-100 text-violet-600" },
  "add-auth":                   { icon: KeyRound,        color: "bg-amber-100 text-amber-600" },
  "set-up-transactional-email": { icon: Mail,            color: "bg-red-100 text-red-600" },
  "build-marketing-website":    { icon: LayoutTemplate,  color: "bg-indigo-100 text-indigo-600" },
  "setup-outbound-email":       { icon: SendHorizontal,  color: "bg-sky-100 text-sky-600" },
  "connect-postiz":             { icon: CalendarDays,    color: "bg-orange-100 text-orange-600" },
  "gather-prospects":           { icon: Users2,          color: "bg-blue-100 text-blue-600" },
  "setup-bookkeeping":          { icon: Receipt,         color: "bg-green-100 text-green-600" },
  // GTM
  "write-blog-posts":           { icon: BookOpen,        color: "bg-lime-100 text-lime-700" },
  "grow-social-presence":       { icon: TrendingUp,      color: "bg-cyan-100 text-cyan-600" },
  "send-cold-outreach":         { icon: MailCheck,       color: "bg-green-100 text-green-600" },
  "run-paid-acquisition":       { icon: Megaphone,       color: "bg-rose-100 text-rose-600" },
  // LAUNCH
  "deploy":                     { icon: Rocket,          color: "bg-blue-100 text-blue-600" },
  "expand-content-engine":      { icon: Layers,          color: "bg-purple-100 text-purple-600" },
  "launch-website":             { icon: Monitor,         color: "bg-indigo-100 text-indigo-600" },
  "qualify-opportunities":      { icon: Filter,          color: "bg-teal-100 text-teal-600" },
  // SCALE
  "add-monitoring":             { icon: Activity,        color: "bg-red-100 text-red-600" },
  "optimize-seo":               { icon: Search,          color: "bg-amber-100 text-amber-600" },
  "start-community":            { icon: MessageCircle,   color: "bg-violet-100 text-violet-600" },
  "close-deals":                { icon: Handshake,       color: "bg-emerald-100 text-emerald-600" },
  "onboard-accounts":           { icon: UserPlus,        color: "bg-blue-100 text-blue-600" },
  "add-billing":                { icon: DollarSign,      color: "bg-green-100 text-green-600" },
  "setup-support-agent":        { icon: Headphones,      color: "bg-sky-100 text-sky-600" },
  // MATURE
  "launch-referral-program":    { icon: Gift,            color: "bg-pink-100 text-pink-600" },
  "legal-compliance":           { icon: Scale,           color: "bg-slate-100 text-slate-600" },
  "integrate-chat-widget":      { icon: MessageSquare,   color: "bg-teal-100 text-teal-600" },
};

export const FALLBACK: IconMeta = { icon: Folder, color: "bg-gray-100 text-gray-600" };
