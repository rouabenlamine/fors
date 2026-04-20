"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import {
  Ticket, MessageSquare, BarChart3, Activity,
  LogOut, Cpu, Database, FileText, Table, FlaskConical,
  LayoutDashboard, Users, Settings, ChevronRight,
  Search, X, Menu, ArrowRight, Layers, BookOpen, Settings2,
} from "lucide-react";
import type { UserRole } from "@/lib/types";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  getExplorerMenus,
  getExplorerTables,
} from "@/app/actions";

// ─── Nav definitions ────────────────────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  sub?: { href: string; label: string }[];
}

const AGENT_NAV: NavItem[] = [
  { href: "/tickets",  label: "Tickets",            icon: Ticket },
  { href: "/analysis", label: "Analysis Workspace", icon: LayoutDashboard },
  { href: "/lab",      label: "Analysis Lab",        icon: FlaskConical },
  { href: "/chat",     label: "Chat History",        icon: MessageSquare },
  {
    href: "/database",
    label: "Fors Explorer",
    icon: Database,
    sub: [
      { href: "/database?view=menus",        label: "Menus"        },
      { href: "/database?view=transactions", label: "Transactions" },
      { href: "/database?view=tables",       label: "Tables"       },
    ],
  },
  { href: "/kpis",     label: "KPIs",               icon: BarChart3 },
  { href: "/activity", label: "Activity Log",        icon: Activity },
];

const REPORTER_NAV: NavItem[] = [
  { href: "/report",   label: "Report Dashboard",   icon: BarChart3 },
  { href: "/kpis",     label: "KPI Overview",        icon: FileText },
  { href: "/activity", label: "Activity Log",        icon: Activity },
];

const MANAGER_NAV: NavItem[] = [
  { href: "/tables",   label: "Table Manager",      icon: Table },
  {
    href: "/database",
    label: "Fors Explorer",
    icon: Database,
    sub: [
      { href: "/database?view=menus",        label: "Menus"        },
      { href: "/database?view=transactions", label: "Transactions" },
      { href: "/database?view=tables",       label: "Tables"       },
    ],
  },
  { href: "/users",      label: "User Management",  icon: Users },
  { href: "/kpi-config", label: "KPI Config",       icon: Settings },
  { href: "/kpis",       label: "KPIs",             icon: BarChart3 },
  { href: "/activity",   label: "Activity Log",     icon: Activity },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin/dashboard",  label: "Control Panel",     icon: LayoutDashboard },
  { href: "/admin/users",      label: "User Management",   icon: Users },
  { href: "/admin/kpi-config", label: "KPI Config",        icon: Settings },
  { href: "/admin/sql-console",label: "Raw SQL Console",   icon: Database },
  { href: "/admin/view-control",label: "View Control",     icon: Settings2 },
];

const SUPER_ADMIN_NAV: NavItem[] = [
  { href: "/superadmin/integrations",      label: "Integration Hub",    icon: Cpu },
  { href: "/superadmin/admin-management",  label: "Admin Management",   icon: Users },
  { href: "/superadmin/database-explorer", label: "Global DB Explorer", icon: Table },
];

const ROLE_META: Record<UserRole, { label: string; subtitle: string; accent: string }> = {
  agent:      { label: "LEONI", subtitle: "IT Support",  accent: "bg-blue-500" },
  reporter:   { label: "LEONI", subtitle: "IT Report",   accent: "bg-purple-500" },
  manager:    { label: "LEONI", subtitle: "IT Manager",  accent: "bg-teal-500" },
  admin:      { label: "LEONI", subtitle: "Admin",       accent: "bg-indigo-500" },
  superadmin: { label: "LEONI", subtitle: "Superadmin",  accent: "bg-rose-500" },
  user:       { label: "LEONI", subtitle: "User",        accent: "bg-slate-500" },
  it_support: { label: "LEONI", subtitle: "IT Support",  accent: "bg-blue-500" },
};

function getNav(role?: string): NavItem[] {
  if (role === "reporter") return REPORTER_NAV;
  if (role === "manager")  return MANAGER_NAV;
  if (role === "admin")    return ADMIN_NAV;
  if (role === "superadmin") return SUPER_ADMIN_NAV;
  return AGENT_NAV;
}

// ─── Search result type ──────────────────────────────────────────────────────

type SearchResult = {
  type: "menu" | "table" | "transaction" | "field";
  label: string;
  sublabel?: string;
  href: string;
};

// ─── Main Sidebar ────────────────────────────────────────────────────────────

export function Sidebar({ role }: { role?: UserRole }) {
  const pathname = usePathname();
  const searchParamsHook = useSearchParams();
  const router = useRouter();
  const navItems = getNav(role);
  const meta = ROLE_META[role as UserRole] ?? ROLE_META["agent"];

  // Global search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Explorer expanded state — open if on /database path
  const [explorerOpen, setExplorerOpen] = useState(false);
  useEffect(() => {
    setExplorerOpen(pathname?.startsWith("/database") ?? false);
  }, [pathname]);

  // Pre-fetched data for search
  const [allMenus, setAllMenus] = useState<any[]>([]);
  const [allTables, setAllTables] = useState<any[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Close search on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Lazy-load explorer data when search is first opened
  const ensureData = useCallback(async () => {
    if (dataLoaded) return;
    setSearchLoading(true);
    try {
      const [menus, tables] = await Promise.all([getExplorerMenus(), getExplorerTables()]);
      setAllMenus(menus);
      setAllTables(tables);
      // Transactions come from the tables list (no single "all transactions" action yet)
      setDataLoaded(true);
    } catch (e) {
      console.error("Search data load failed", e);
    } finally {
      setSearchLoading(false);
    }
  }, [dataLoaded]);

  // Run live search whenever query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    // Menus
    allMenus.forEach((m) => {
      if (m.title?.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q)) {
        results.push({
          type: "menu",
          label: m.title,
          sublabel: m.description || undefined,
          href: `/database?view=menus&id=${m.id}`,
        });
      }
    });

    // Tables + their fields
    allTables.forEach((t) => {
      if (t.name?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)) {
        results.push({
          type: "table",
          label: t.name,
          sublabel: t.description || undefined,
          href: `/database?view=tables&table=${encodeURIComponent(t.name)}`,
        });
      }
    });

    setSearchResults(results.slice(0, 12));
  }, [searchQuery, allMenus, allTables]);

  function handleSearchFocus() {
    setSearchOpen(true);
    ensureData();
  }

  function handleResultClick(href: string) {
    setSearchOpen(false);
    setSearchQuery("");
    router.push(href);
  }

  async function handleLogout() {
    try {
      await fetch("/fors/auth/logout", { method: "POST", redirect: "manual" });
    } catch { /* ignore */ }
    window.location.href = "/login";
  }

  const typeIcon: Record<SearchResult["type"], React.ReactNode> = {
    menu:        <BookOpen className="w-3.5 h-3.5 text-blue-400" />,
    table:       <Database className="w-3.5 h-3.5 text-emerald-400" />,
    transaction: <Layers className="w-3.5 h-3.5 text-purple-400" />,
    field:       <Menu className="w-3.5 h-3.5 text-amber-400" />,
  };

  return (
    <aside className="w-56 flex flex-col h-screen fixed left-0 top-0 z-30 bg-slate-900 shadow-2xl">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 ${meta.accent} rounded-xl flex items-center justify-center shadow-lg`}>
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-wide uppercase">{meta.label}</p>
            <p className="text-[10px] text-slate-400 font-medium">{meta.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Global Search */}
      <div className="px-3 pt-3 pb-1" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleSearchFocus}
            placeholder="Search everything…"
            className="w-full bg-slate-800 border border-white/5 rounded-lg pl-8 pr-7 py-2 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); setSearchResults([]); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown results */}
        {searchOpen && (searchQuery.trim() || searchLoading) && (
          <div className="absolute left-3 right-3 top-auto mt-1 bg-slate-800 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
            {searchLoading && !dataLoaded ? (
              <div className="px-4 py-3 text-xs text-slate-400 animate-pulse">Loading index…</div>
            ) : searchResults.length === 0 && searchQuery ? (
              <div className="px-4 py-3 text-xs text-slate-400">No results for "{searchQuery}"</div>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                {searchResults.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => handleResultClick(r.href)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 text-left transition-colors group"
                  >
                    <div className="shrink-0">{typeIcon[r.type]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate group-hover:text-white">{r.label}</p>
                      {r.sublabel && <p className="text-[10px] text-slate-500 truncate">{r.sublabel}</p>}
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 group-hover:text-slate-400 bg-white/5 px-1.5 py-0.5 rounded shrink-0">
                      {r.type}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-blue-400 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto custom-scrollbar">
        {navItems.map(({ href, label, icon: Icon, sub }) => {
          const pathBase = href.split("?")[0];
          const isPathActive = pathname ? pathname === pathBase || pathname.startsWith(pathBase + "/") : false;
          const hasExplorerSub = !!sub;
          const isOpen = hasExplorerSub ? (explorerOpen || isPathActive) : false;

          return (
            <div key={href}>
              <div
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer",
                  isPathActive
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
                )}
                onClick={() => {
                  if (hasExplorerSub) {
                    setExplorerOpen((v) => !v);
                  } else {
                    router.push(href);
                  }
                }}
              >
                <Icon className={clsx("w-4 h-4 shrink-0", isPathActive ? "text-blue-400" : "text-slate-500")} />
                <span className="flex-1">{label}</span>
                {hasExplorerSub ? (
                  <ChevronRight className={clsx("w-3.5 h-3.5 text-slate-500 transition-transform duration-200", isOpen && "rotate-90")} />
                ) : isPathActive ? (
                  <div className="w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                ) : null}
              </div>

              {/* Sub-items */}
              {hasExplorerSub && isOpen && (
                <div className="ml-7 mt-0.5 mb-1 space-y-0.5 border-l-2 border-slate-700/60 pl-3">
                  {sub!.map((s) => {
                    const subView = s.href.split("view=")[1]?.split("&")[0];
                    const isSubActive = !!(subView && searchParamsHook?.get("view") === subView && pathname?.startsWith("/database"));
                    return (
                      <Link
                        key={s.href}
                        href={s.href}
                        className={clsx(
                          "block px-2 py-1.5 rounded-md text-xs font-semibold transition-all duration-100",
                          isSubActive
                            ? "text-blue-400 bg-slate-800"
                            : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                        )}
                      >
                        {s.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-5 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>

      {/* eslint-disable-next-line react/no-unknown-property */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </aside>
  );
}
