import React from "react";
import { Users, UserPlus, FileText, Database, Shield } from "lucide-react";
import { getUsers } from "@/app/actions";

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" />
            User Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Create, update, and manage role-based access for system users.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 text-sm font-semibold rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all">
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Users", icon: Users, val: users.length, color: "text-blue-400" },
          { label: "Administrators", icon: Shield, val: users.filter(u => u.role === "manager" || u.role === "admin").length, color: "text-indigo-400" },
          { label: "Active Roles", icon: FileText, val: new Set(users.map(u => u.role)).size, color: "text-rose-400" },
        ].map((s, i) => (
          <div key={i} className="bg-slate-800/50 border border-white/5 rounded-xl p-5 flex items-center gap-4">
            <div className={`p-3 bg-slate-900 rounded-lg ${s.color} shadow-inner`}>
              <s.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{s.label}</p>
              <p className="text-2xl font-bold text-white">{s.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-slate-800/80 border border-white/10 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Matricule</th>
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((user) => (
                <tr key={user.matricule} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-200">
                    {user.matricule}
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    <div className="flex gap-2 items-center">
                      <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                        {user.name[0]}{user.surname?.[0] || ""}
                      </div>
                      <span className="font-semibold">{user.name} {user.surname}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${
                      user.role === 'manager' || user.role === 'admin' 
                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                        : user.role === 'reporter' 
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-white px-2 py-1 text-xs transition-colors">Edit</button>
                    <button className="text-slate-400 hover:text-red-400 px-2 py-1 text-xs transition-colors">Revoke</button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
