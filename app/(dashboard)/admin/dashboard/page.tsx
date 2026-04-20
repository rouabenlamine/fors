import React from "react";
import { LayoutDashboard, Activity, Database, Zap, ShieldAlert, Cpu } from "lucide-react";
import { getAdminDashboardStats } from "@/app/actions/admin-actions";

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 drop-shadow-sm flex items-center gap-3">
          <LayoutDashboard className="w-8 h-8 text-indigo-400" />
          Admin Control Panel
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl">
          Welcome to the regional administrative overview. Here you can monitor system activities, handle specific SQL transactions, and configure reporting thresholds.
        </p>
      </div>

      {/* Grid Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { label: "Active Connections", icon: Activity, val: stats.activeConnections.toString(), desc: "Live user sessions", accent: "from-emerald-500 to-teal-400" },
          { label: "Query Invocations", icon: Database, val: stats.sqlRuns.toString(), desc: "Queries run today", accent: "from-blue-500 to-indigo-400" },
          { label: "System Load", icon: Cpu, val: "Normal", desc: "Current node stress", accent: "from-orange-500 to-amber-400" },
        ].map((s, i) => (
          <div key={i} className="group relative bg-slate-900 border border-white/5 p-6 rounded-2xl shadow-xl overflow-hidden hover:border-white/20 transition-all hover:-translate-y-1">
            <div className={`absolute inset-0 bg-gradient-to-br ${s.accent} opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none`} />
            <div className="relative z-10 flex flex-col gap-3">
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                <s.icon className="w-6 h-6 text-slate-300 group-hover:text-white transition-colors" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wide group-hover:text-slate-300">{s.label}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-extrabold text-white">{s.val}</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">{s.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Latest Alerts */}
      <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-3xl">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          Recent Security Anomalies
        </h2>
        {stats.anomalies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 border border-white/5 border-dashed rounded-xl bg-black/20">
            <Zap className="w-8 h-8 text-slate-600" />
            <p className="text-slate-500 text-sm font-medium">No recent anomalies detected.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.anomalies.map((a: any, i: number) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-rose-100">{a.action.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-slate-400 mt-1 font-mono">{a.details}</p>
                  <p className="text-[10px] text-slate-500 mt-2">{new Date(a.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
