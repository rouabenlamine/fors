"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Cpu, Eye, EyeOff, Lock, Hash, Users, ShieldAlert, BarChart3 } from "lucide-react";
import type { UserRole } from "@/lib/types";

const ROLE_REDIRECT: Record<UserRole, string> = {
  agent:    "/tickets",
  reporter: "/report",
  manager:  "/tables",
};

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole>("agent");
  const [matricule, setMatricule] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!matricule.trim()) {
      setError("Matricule is required.");
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
        setError(data.error || "Invalid credentials.");
      } else {
        const userRole: UserRole = data.user?.role;
        // Enforce that the user logging in matches the selected login option
        if (userRole !== selectedRole) {
          setError(`Invalid role. This user is not an ${selectedRole === "agent" ? "IT Support" : selectedRole === "manager" ? "IT Manager" : "IT Reporter"}.`);
          // OPTIONAL: Logout them immediately if they chose the wrong role tab?
          // For now, simple error message. Let's not redirect them yet.
          await fetch("/fors/auth/logout", { method: "POST" });
          return;
        }

        const redirect = ROLE_REDIRECT[userRole] ?? "/tickets";
        router.push(redirect);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const roleTabs = [
    { id: "agent", label: "IT Support", icon: Users, color: "text-blue-600", activeBg: "bg-blue-100", border: "border-blue-600" },
    { id: "manager", label: "IT Manager", icon: ShieldAlert, color: "text-violet-600", activeBg: "bg-violet-100", border: "border-violet-600" },
    { id: "reporter", label: "IT Reporter", icon: BarChart3, color: "text-emerald-600", activeBg: "bg-emerald-100", border: "border-emerald-600" },
  ] as const;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #dbeafe 0%, #ede9fe 40%, #e0f2fe 75%, #f0fdf4 100%)" }}
    >
      {/* Decorative blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, #93c5fd, #c4b5fd)" }} />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, #6ee7b7, #60a5fa)" }} />
      <div className="absolute top-1/2 -right-40 w-72 h-72 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #fde68a, #fb923c)" }} />
      <div className="absolute bottom-1/3 -left-20 w-56 h-56 rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle, #a5f3fc, #818cf8)" }} />

      <div className="w-full max-w-md relative z-10">
        {/* Brand */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Cpu className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">FORS Incident Module</h1>
          <p className="text-slate-500 text-sm mt-1">IT Support — LEONI</p>
        </div>

        {/* Login card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white shadow-xl p-7">
          
          {/* Role selector tabs */}
          <div className="flex p-1 bg-gray-100/80 rounded-xl mb-6">
            {roleTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = selectedRole === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSelectedRole(tab.id as UserRole);
                    setError("");
                  }}
                  className={`flex-1 flex flex-col items-center justify-center py-2.5 px-1 rounded-lg transition-all text-[11px] font-bold ${
                    isActive ? `bg-white shadow-sm ${tab.color} ${tab.border} border` : "text-slate-500 hover:bg-gray-200/50"
                  }`}
                >
                  <Icon className={`w-4 h-4 mb-1 ${isActive ? tab.color : "text-slate-400"}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100/50">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Secure Access</h2>
              <p className="text-[11px] text-slate-400">Enter your credentials to continue</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Matricule
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={matricule}
                  onChange={(e) => setMatricule(e.target.value.toUpperCase().slice(0, 10))}
                  placeholder="Enter your matricule"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-10 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white font-semibold rounded-xl py-3 mt-1 bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-98 shadow-sm`}
            >
              {loading ? "Signing in..." : `Sign In`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
