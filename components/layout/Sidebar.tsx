"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import {
  Ticket, MessageSquare, BarChart3, Activity,
  LogOut, Cpu, Database, FileText, Table, FlaskConical,
  LayoutDashboard, Users, Settings,
} from "lucide-react";
import type { UserRole } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const AGENT_NAV: NavItem[] = [
  { href: "/tickets",  label: "Tickets",            icon: Ticket },
  { href: "/analysis", label: "Analysis Workspace", icon: LayoutDashboard },
  { href: "/lab",      label: "Analysis Lab",        icon: FlaskConical },
  { href: "/chat",     label: "Chat History",        icon: MessageSquare },
  { href: "/database",   label: "Database Explorer",   icon: Database },
  { href: "/kpis",     label: "KPIs",                icon: BarChart3 },
  { href: "/activity", label: "Activity Log",        icon: Activity },
];

const REPORTER_NAV: NavItem[] = [
  { href: "/report",   label: "Report Dashboard",   icon: BarChart3 },
  { href: "/kpis",     label: "KPI Overview",        icon: FileText },
  { href: "/activity", label: "Activity Log",        icon: Activity },
];

const MANAGER_NAV: NavItem[] = [
  { href: "/tables",     label: "Table Manager",    icon: Table },
  { href: "/database",   label: "Database Explorer",icon: Database },
  { href: "/users",      label: "User Management",  icon: Users },
  { href: "/kpi-config", label: "KPI Config",       icon: Settings },
  { href: "/kpis",       label: "KPIs",             icon: BarChart3 },
  { href: "/activity",   label: "Activity Log",     icon: Activity },
];

const ROLE_META: Record<UserRole, { label: string; subtitle: string; accent: string }> = {
  agent:    { label: "LEONI", subtitle: "IT Support",  accent: "bg-blue-500" },
  reporter: { label: "LEONI", subtitle: "IT Report",   accent: "bg-purple-500" },
  manager:  { label: "LEONI", subtitle: "IT Manager",  accent: "bg-teal-500" },
};

function getNav(role?: string): NavItem[] {
  if (role === "reporter") return REPORTER_NAV;
  if (role === "manager")  return MANAGER_NAV;
  return AGENT_NAV;
}

export function Sidebar({ role }: { role?: UserRole }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const navItems = getNav(role);
  const meta = ROLE_META[role as UserRole] ?? ROLE_META["agent"];

  async function handleLogout() {
    try {
      await fetch("/fors/auth/logout", { method: "POST", redirect: "manual" });
    } catch { /* ignore */ }
    window.location.href = "/login";
  }

  return (
    <aside className="w-56 flex flex-col h-screen fixed left-0 top-0 z-30" style={{ backgroundColor: "#0f2140" }}>
      {/* Brand */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 ${meta.accent} rounded-lg flex items-center justify-center shadow-sm`}>
            <Cpu className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-wide">{meta.label}</p>
            <p className="text-[10px] text-blue-300">{meta.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Role badge */}
      <div className="px-3 py-2 border-b border-white/5">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full text-white ${meta.accent} inline-block`}>
          {meta.subtitle.toUpperCase()}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const [pathBase, queryPart] = href.split("?");
          const isPathActive = pathname ? pathname === pathBase || pathname.startsWith(pathBase + "/") : false;
          
          let isActive = isPathActive;
          if (queryPart && isPathActive) {
            const currentParams = searchParams;
            const targetParams = new URLSearchParams(queryPart);
            isActive = Array.from(targetParams.entries()).every(([k, v]) => currentParams?.get(k) === v);
          } else if (!queryPart && isPathActive) {
            if (pathBase === "/database") {
              isActive = !searchParams?.has("table");
            }
          }

          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-white/20 text-white shadow-sm"
                  : "text-blue-200/80 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className={clsx("w-4 h-4 shrink-0", isActive ? "text-blue-300" : "text-blue-400/70")} />
              <span>{label}</span>
              {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-2 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-blue-300/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4 text-blue-400/60" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
