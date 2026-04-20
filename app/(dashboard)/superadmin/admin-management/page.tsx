"use client";

import React, { useState, useEffect } from "react";
import { Settings, BarChart, FileJson, Lock } from "lucide-react";
import { updateUserPermissionsAction, getAdminsList } from "@/app/actions/admin-actions";

export default function AdminManagementPage() {
  const [loading, setLoading] = useState(false);
  const [adminsList, setAdminsList] = useState<any[]>([]);

  useEffect(() => {
    getAdminsList().then(setAdminsList);
  }, []);

  async function handleUpdate(matricule: string) {
    setLoading(true);
    // Dummy payload for design display
    await updateUserPermissionsAction(matricule, {
      canDeleteUsers: false,
      viewAllTransactions: true,
      maxDailyQueries: 50
    });
    setAdminsList(await getAdminsList());
    setLoading(false);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-fuchsia-400 drop-shadow-sm flex items-center gap-3">
          <Lock className="w-8 h-8 text-rose-400" />
          Admin Guardrails
        </h1>
        <p className="text-slate-400 text-sm">
          Strictly define scopes and limits for regional IT Managers and Admins.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {adminsList.map((admin, idx) => (
          <div key={idx} className="bg-slate-900 border border-white/5 p-6 rounded-2xl shadow-xl hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300">
                  {admin.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-100">{admin.name}</h3>
                  <p className="text-xs text-slate-500">{admin.matricule}</p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20">
                {admin.role}
              </span>
            </div>

            <div className="space-y-4">
              <div className="bg-black/30 rounded-xl p-4 border border-white/5 font-mono text-xs text-slate-300 relative">
                <FileJson className="absolute top-3 right-3 w-4 h-4 text-slate-600" />
                <pre className="text-emerald-400">{JSON.stringify(admin.limits, null, 2)}</pre>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => handleUpdate(admin.matricule)}
                  disabled={loading}
                  className="flex-1 bg-white/5 hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 transition-colors py-2 rounded-lg text-sm font-semibold border border-transparent hover:border-rose-500/20"
                >
                  Edit JSON Limits
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
