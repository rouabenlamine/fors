"use client";

import React, { useState } from "react";
import { Cpu, Save, Plus, Cloud, Server, Database, Sparkles } from "lucide-react";
import { updateIntegrationSettingsAction } from "@/app/actions/admin-actions";

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    await updateIntegrationSettingsAction("all", {});
    setTimeout(() => setLoading(false), 800);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400 flex items-center gap-3">
            <Cpu className="w-8 h-8 text-rose-400" />
            Integration Hub
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Configure Webhooks, API Endpoints, and AI Engines. Superadmin only.
          </p>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all font-semibold"
        >
          <Save className="w-4 h-4" />
          {loading ? "Saving..." : "Save All Configurations"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* N8N Webhooks */}
        <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl shadow-xl hover:border-slate-700 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Cloud className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Automation (n8n)</h2>
              <p className="text-[11px] text-slate-500 uppercase font-semibold tracking-wider">Webhook Mappings</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Primary Webhook URL</label>
              <input type="text" placeholder="https://n8n.your-domain.com/webhook/..." className="w-full bg-black/40 border border-white/5 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 transition-all font-mono" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Fallback Target</label>
              <input type="text" placeholder="URL for manual escalations" className="w-full bg-black/40 border border-white/5 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-rose-500/50 transition-all font-mono" />
            </div>
          </div>
        </div>

        {/* AI Engine */}
        <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl shadow-xl hover:border-slate-700 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">LLM Engine</h2>
              <p className="text-[11px] text-slate-500 uppercase font-semibold tracking-wider">Ollama Integration</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Active Model</label>
              <select className="w-full bg-black/40 border border-white/5 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer">
                <option value="qwen3.5:4b">Qwen 3.5 (4B)</option>
                <option value="llama3">Llama 3 (8B)</option>
                <option value="mistral">Mistral (7B)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Ollama Endpoint</label>
              <input type="text" defaultValue="http://localhost:11434" className="w-full bg-black/40 border border-white/5 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 transition-all font-mono" />
            </div>
          </div>
        </div>

        {/* ITSM Service */}
        <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl shadow-xl hover:border-slate-700 transition-colors lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <Server className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">ITSM Synchronization</h2>
              <p className="text-[11px] text-slate-500 uppercase font-semibold tracking-wider">Primary System of Record</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Target Instance Name</label>
              <input type="text" placeholder="dev12345.service-now.com" className="w-full bg-black/40 border border-white/5 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500/50 transition-all font-mono" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Authentication Secret (OAuth / Basic)</label>
              <input type="password" placeholder="••••••••••••••••" className="w-full bg-black/40 border border-white/5 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500/50 transition-all font-mono" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
