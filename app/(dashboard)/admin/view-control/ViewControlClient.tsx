"use client";

import React, { useState, useTransition } from "react";
import {
  Settings2,
  Eye,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Users,
  BarChart3,
  Code2,
  Activity,
  MessageSquare,
  Bell,
  Database,
  FileDown,
  FlaskConical,
  Settings,
} from "lucide-react";
import {
  updateViewPermissionsAction,
  type RolePermissions,
} from "@/app/actions/view-permissions-actions";
import {
  VIEW_COMPONENTS,
  type ComponentId,
} from "@/lib/view-components";

// ── Role configuration ────────────────────────────────────────────────────────

interface RoleConfig {
  id: string;
  label: string;
  description: string;
  accent: string;
  badgeClass: string;
  superadminOnly?: boolean;
}

const ROLES: RoleConfig[] = [
  {
    id: "it_support",
    label: "IT Support",
    description: "Front-line support agents handling incident tickets.",
    accent: "border-blue-500/40 bg-blue-500/5",
    badgeClass: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  },
  {
    id: "it_manager",
    label: "IT Manager",
    description: "Managers overseeing team performance and KPI targets.",
    accent: "border-teal-500/40 bg-teal-500/5",
    badgeClass: "bg-teal-500/20 text-teal-300 border border-teal-500/30",
  },
  {
    id: "it_report",
    label: "IT Report",
    description: "Reporter-level users focused on data analytics and exports.",
    accent: "border-purple-500/40 bg-purple-500/5",
    badgeClass: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
  },
  {
    id: "admin",
    label: "Admin",
    description: "Regional admins with elevated access. Editable by Superadmin only.",
    accent: "border-rose-500/40 bg-rose-500/5",
    badgeClass: "bg-rose-500/20 text-rose-300 border border-rose-500/30",
    superadminOnly: true,
  },
];

// ── Component icon map ────────────────────────────────────────────────────────

const COMPONENT_ICONS: Record<ComponentId, React.ElementType> = {
  notification_button: Bell,
  chat_bubble: MessageSquare,
  kpi_widgets: BarChart3,
  sql_console: Code2,
  activity_logs: Activity,
  report_export: FileDown,
  incident_analysis: ShieldCheck,
  tickets_list: Database,
  analysis_lab: FlaskConical,
  fors_explorer: Database,
  user_management: Users,
  kpi_config: Settings,
};

const CATEGORY_ORDER = ["Header", "Dashboard", "Data", "Admin"] as const;

// ── Toggle Switch ─────────────────────────────────────────────────────────────

function Switch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-40 disabled:cursor-not-allowed ${
        checked ? "bg-blue-500" : "bg-slate-700"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ── Main page component ───────────────────────────────────────────────────────

interface Props {
  initialPermissions: Record<string, RolePermissions>;
  isSuperadmin: boolean;
}

export function ViewControlClient({ initialPermissions, isSuperadmin }: Props) {
  const visibleRoles = isSuperadmin
    ? ROLES
    : ROLES.filter((r) => !r.superadminOnly);

  const [activeRole, setActiveRole] = useState(visibleRoles[0].id);
  const [allPerms, setAllPerms] = useState(initialPermissions);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPerms: RolePermissions = allPerms[activeRole] ?? ({} as any);

  function handleToggle(componentId: ComponentId, value: boolean) {
    setAllPerms((prev) => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        [componentId]: value,
      },
    }));
  }

  function handleSave() {
    setSaved(false);
    setError(null);
    startTransition(async () => {
      const result = await updateViewPermissionsAction(
        activeRole,
        allPerms[activeRole]
      );
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(result.error || "Save failed.");
      }
    });
  }

  // Group components by category
  const byCategory = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: VIEW_COMPONENTS.filter((c) => c.category === cat),
  })).filter((g) => g.items.length > 0);

  const activeRoleConfig = ROLES.find((r) => r.id === activeRole)!;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
          <Settings2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-100">View Control</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Granularly toggle UI component visibility per user role. Changes take
            effect immediately for all active sessions.
          </p>
        </div>
      </div>

      {/* ── Role Tabs ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-slate-900 border border-white/5 rounded-xl p-1 w-full overflow-x-auto">
        {visibleRoles.map((role) => (
          <button
            key={role.id}
            onClick={() => {
              setActiveRole(role.id);
              setSaved(false);
              setError(null);
            }}
            className={`flex-1 min-w-[110px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
              activeRole === role.id
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <span>{role.label}</span>
            {role.superadminOnly && (
              <span className="text-[9px] font-black uppercase tracking-widest text-rose-400 border border-rose-400/30 rounded px-1 py-0.5 bg-rose-400/10">
                SA
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Role Description Banner ───────────────────────────────────────── */}
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${activeRoleConfig.accent}`}
      >
        <Users className="w-4 h-4 text-slate-300 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-slate-200">
            {activeRoleConfig.label}
          </p>
          <p className="text-xs text-slate-400">{activeRoleConfig.description}</p>
        </div>
        <span
          className={`ml-auto text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${activeRoleConfig.badgeClass}`}
        >
          {Object.values(currentPerms).filter(Boolean).length} /{" "}
          {VIEW_COMPONENTS.length} Visible
        </span>
      </div>

      {/* ── Component Toggles ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        {byCategory.map(({ category, items }) => (
          <div
            key={category}
            className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
          >
            {/* Category header */}
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {category}
              </span>
              <span className="ml-auto text-[10px] text-slate-300">
                {items.filter((c) => currentPerms[c.id] !== false).length}/
                {items.length} on
              </span>
            </div>

            {/* Rows with divide-y */}
            <div className="divide-y divide-gray-50">
              {items.map((comp) => {
                const Icon =
                  COMPONENT_ICONS[comp.id as ComponentId] ?? Eye;
                const isOn = currentPerms[comp.id as ComponentId] !== false;

                return (
                  <div
                    key={comp.id}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors group"
                  >
                    {/* Icon */}
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-slate-200 transition-colors">
                      <Icon className="w-4 h-4 text-slate-500" />
                    </div>

                    {/* Label + description */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">
                        {comp.label}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {comp.description}
                      </p>
                      <code className="text-[9px] font-mono text-slate-300 mt-0.5 block">
                        {comp.id}
                      </code>
                    </div>

                    {/* Status badge */}
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                        isOn
                          ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                          : "text-slate-400 bg-slate-50 border-slate-200"
                      }`}
                    >
                      {isOn ? "Visible" : "Hidden"}
                    </span>

                    {/* Toggle */}
                    <Switch
                      checked={isOn}
                      onChange={(v) =>
                        handleToggle(comp.id as ComponentId, v)
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Save Bar ──────────────────────────────────────────────────────── */}
      <div className="sticky bottom-4 flex items-center gap-4 bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 shadow-2xl backdrop-blur-xl">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-100">
            Save changes for{" "}
            <span className="text-blue-400">{activeRoleConfig.label}</span>
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            All active users with this role will see updated visibility on next
            page load.
          </p>
        </div>

        {/* Status feedback */}
        {saved && (
          <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4" />
            Saved!
          </div>
        )}
        {error && (
          <p className="text-red-400 text-sm font-medium truncate max-w-[200px]">
            {error}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={isPending}
          id="save-view-permissions-btn"
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Settings2 className="w-4 h-4" />
              Save Permissions
            </>
          )}
        </button>
      </div>
    </div>
  );
}
