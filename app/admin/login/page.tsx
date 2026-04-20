"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff, Lock, User, TerminalSquare } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [matricule, setMatricule] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!matricule.trim() || !password.trim()) {
      setError("Credentials required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/fors/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricule, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Authentication failed.");
      } else {
        const userRole = data.user?.role;
        // Strictly prevent normal users from logging in via this portal 
        if (!["admin", "superadmin"].includes(userRole)) {
          setError(`Active node rejected connection. Account '${userRole}' unauthorized for secure portal.`);
          await fetch("/fors/auth/logout", { method: "POST" });
          return;
        }

        // Direct routing based on exact clearance 
        const route = userRole === "superadmin" ? "/superadmin/integrations" : "/admin/dashboard";
        router.push(route);
      }
    } catch {
      setError("Network timeout communicating with auth server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Dark premium visual flair */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-indigo-500/20 to-transparent opacity-50 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-rose-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[400px]">
        {/* Brand Header */}
        <div className="flex items-center justify-center mb-8 gap-3">
          <TerminalSquare className="w-10 h-10 text-indigo-400" />
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 tracking-tight">
            FORS<span className="font-light">.sys</span>
          </h1>
        </div>

        {/* Console Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8 relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-rose-500 to-indigo-500" />
          
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-slate-950 border border-white/5 rounded-2xl flex items-center justify-center shadow-inner">
               <Shield className="w-6 h-6 text-rose-500" />
            </div>
            <div>
               <h2 className="text-lg font-bold text-white tracking-wide">Secure Terminal</h2>
               <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Clearance Required</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Operator ID
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  type="text"
                  value={matricule}
                  onChange={(e) => setMatricule(e.target.value.toUpperCase().slice(0, 10))}
                  placeholder="e.g. ADMIN01"
                  className="w-full bg-black/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Passphrase
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/50 border border-slate-700 rounded-xl pl-12 pr-12 py-3.5 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm font-mono tracking-widest"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-3 rounded-xl font-mono text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white font-bold rounded-xl py-3.5 mt-2 bg-gradient-to-r from-indigo-500 to-rose-500 hover:from-indigo-400 hover:to-rose-400 transition-all ${loading ? 'opacity-50 grayscale cursor-wait' : 'hover:scale-[1.02] shadow-xl shadow-indigo-500/20'}`}
            >
              {loading ? "AUTHENTICATING..." : "ACQUIRE UPLINK"}
            </button>
          </form>
        </div>
      </div>
      <p className="mt-8 text-slate-600 text-[10px] font-mono tracking-widest absolute bottom-4">FORS ADMINISTRATOR SUBSYSTEM V2.4</p>
    </div>
  );
}
