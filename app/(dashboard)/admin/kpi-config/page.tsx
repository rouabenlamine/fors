"use client";

import React, { useState, useEffect } from "react";
import { Settings, Check, Clock, TrendingUp, AlertCircle, Save } from "lucide-react";
import { updateKpiConfigAction, getKpiConfigs } from "@/app/actions/admin-actions";

export default function KpiConfigPage() {
  const [loading, setLoading] = useState(false);
  const [kpis, setKpis] = useState<any[]>([]);

  useEffect(() => {
    getKpiConfigs().then(setKpis);
  }, []);

  async function handleSave() {
    setLoading(true);
    await updateKpiConfigAction("SLA_BREACH", { isEnabled: true });
    setTimeout(() => setLoading(false), 500);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 drop-shadow-sm flex items-center gap-3">
            <Settings className="w-8 h-8 text-blue-400" />
            KPI Configuration Matrix
          </h1>
          <p className="text-slate-400 text-sm">
            Define system-wide targets and thresholds matching SLA obligations.
          </p>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all font-semibold"
        >
          <Save className="w-4 h-4" />
          {loading ? "Committing..." : "Commit Changes"}
        </button>
      </div>

      <div className="bg-slate-900 border border-white/5 rounded-2xl shadow-xl overflow-hidden mt-6">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-semibold">Metric Reference</th>
              <th className="px-6 py-4 font-semibold">Target Threshold</th>
              <th className="px-6 py-4 font-semibold">Priority Level</th>
              <th className="px-6 py-4 text-center font-semibold">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {kpis.map((kpi, idx) => (
              <tr key={idx} className="hover:bg-white/[0.02]">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3 text-slate-200 font-semibold">
                    <div className="p-2 bg-slate-800 rounded-lg text-indigo-400 border border-white/5">
                      <Settings className="w-4 h-4" />
                    </div>
                    {kpi.name}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <input type="text" defaultValue={kpi.threshold || 'N/A'} className="bg-black/30 border border-white/10 rounded-md px-3 py-1.5 w-24 text-center text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500" />
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded border ${
                    kpi.category === 'sla' || kpi.category === 'quality' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 
                    kpi.category === 'performance' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 
                    'text-amber-400 bg-amber-500/10 border-amber-500/20'
                  }`}>
                    {kpi.category || 'monitoring'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                   <input type="checkbox" defaultChecked={kpi.isEnabled} className="w-4 h-4 accent-indigo-500 bg-slate-800 border-white/10 rounded cursor-pointer" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
