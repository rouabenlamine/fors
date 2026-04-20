"use client";

import React, { useState } from "react";
import { Database, Search, Package, Table, Layers, FileJson2 } from "lucide-react";

export default function SuperadminDatabaseExplorer() {
  const [activeTab, setActiveTab] = useState("schemas");

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400 flex items-center gap-3">
            <Database className="w-8 h-8 text-teal-400" />
            Global Database Explorer
          </h1>
          <p className="text-slate-400 text-sm mt-2 max-w-2xl">
            Superadmin level access: High-level visual inspection of all schemas, relationships, and raw data layers without bounds.
          </p>
        </div>
        <div className="relative">
           <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
           <input type="text" placeholder="Global search..." className="bg-slate-900 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500/50 w-64 shadow-xl" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-px">
        {[
          { id: "schemas", label: "Schemas & Tables", icon: Table },
          { id: "relationships", label: "Foreign Keys & Metrics", icon: Layers },
          { id: "raw", label: "Raw JSON Inspection", icon: FileJson2 }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === t.id 
                ? "border-teal-400 text-teal-300 bg-teal-400/5 rounded-t-lg" 
                : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-t-lg"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-6 min-h-[500px] shadow-2xl flex items-center justify-center flex-col gap-4 text-center">
         <Package className="w-16 h-16 text-slate-700" />
         <div>
           <p className="text-slate-400 font-medium">Explorer module initializing...</p>
           <p className="text-sm text-slate-600 mt-1">This panel connects to the global information_schema.</p>
         </div>
      </div>
    </div>
  );
}
