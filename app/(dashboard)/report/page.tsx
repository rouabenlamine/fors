"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { getTickets } from "@/app/actions";
import type { Ticket } from "@/lib/types";
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_COLORS } from "@/lib/constants";
import {
  BarChart3, FileText, Download, TrendingUp, CheckCircle,
  XCircle, AlertTriangle, Bot, Printer, Calendar, CheckCheck,
} from "lucide-react";

type DateRange = "7d" | "30d" | "90d" | "all";

const DATE_RANGES: { key: DateRange; label: string }[] = [
  { key: "7d",  label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "all", label: "All time" },
];

const AI_TREND = [
  { month: "Oct", approvalRate: 62, avgConf: 71 },
  { month: "Nov", approvalRate: 68, avgConf: 74 },
  { month: "Dec", approvalRate: 71, avgConf: 76 },
  { month: "Jan", approvalRate: 75, avgConf: 79 },
  { month: "Feb", approvalRate: 80, avgConf: 82 },
  { month: "Mar", approvalRate: 84, avgConf: 87 },
];

type Report = { id: string; name: string; type: string; date: string; size: string };

const BASE_REPORTS: Report[] = [
  { id: "R-001", name: "Monthly Incident Summary",   type: "PDF",   date: "2025-03-31", size: "1.2 MB" },
  { id: "R-002", name: "SLA Breach Report — March",  type: "Excel", date: "2025-03-30", size: "845 KB" },
  { id: "R-003", name: "GOST AI Analysis Report",    type: "PDF",   date: "2025-03-28", size: "2.1 MB" },
  { id: "R-004", name: "Team Performance Q1 2025",   type: "Excel", date: "2025-03-25", size: "1.7 MB" },
  { id: "R-005", name: "Database Incident Log",      type: "CSV",   date: "2025-03-20", size: "320 KB" },
];

function StatCard({ label, value, icon, color, sub }: {
  label: string; value: string | number; icon: React.ReactNode; color: string; sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
        {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function escapeCSV(v: unknown): string {
  const s = String(v ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function ReportPage() {
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>(BASE_REPORTS);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getTickets().then(data => {
      setAllTickets(data);
      setLoading(false);
    });
  }, []);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  const tickets = useMemo(() => {
    if (dateRange === "all") return allTickets;
    const cutoff = daysAgo(dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90);
    return allTickets.filter((t) => new Date(t.createdAt) >= cutoff);
  }, [dateRange, allTickets]);

  const total        = tickets.length || 1;
  const approved     = tickets.filter((t) => t.status === "approved").length;
  const rejected     = tickets.filter((t) => t.status === "rejected").length;
  const pending      = tickets.filter((t) => t.status === "pending").length;
  const sqlProposed  = tickets.filter((t) => t.status === "sql_proposed").length;
  const avgConfidence = tickets.length
    ? Math.round(tickets.reduce((s, t) => s + t.aiConfidence, 0) / tickets.length) : 0;
  const approvalRate = Math.round((approved / total) * 100);

  const teamData = useMemo(() => {
    const map: Record<string, number> = {};
    tickets.forEach((t) => { map[t.team] = (map[t.team] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [tickets]);
  const maxTeam = teamData[0]?.[1] ?? 1;

  const byPriority = (p: string) => tickets.filter((t) => t.priority === p).length;

  const maxRate = Math.max(...AI_TREND.map((d) => d.approvalRate));
  const maxConf = Math.max(...AI_TREND.map((d) => d.avgConf));

  function exportPDF() {
    window.print();
    showToast("Print / Save as PDF dialog opened");
  }

  function exportCSV() {
    const cols = ["ID", "Title", "Status", "Priority", "Team", "AI Confidence", "Created At"];
    const rows = tickets.map((t) => [
      t.id, t.title, STATUS_LABELS[t.status] ?? t.status,
      t.priority, t.team, `${t.aiConfidence}%`,
      new Date(t.createdAt).toLocaleDateString(),
    ]);
    const content = [cols, ...rows].map((r) => r.map(escapeCSV).join(",")).join("\n");
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `fors_report_${dateRange}.csv`; a.click();
    URL.revokeObjectURL(url);
    showToast(`CSV exported — ${tickets.length} tickets`);
  }

  function generateReport() {
    const newId = `R-${String(reports.length + 1).padStart(3, "0")}`;
    const today = new Date().toISOString().slice(0, 10);
    const rangeLabel = dateRange === "all" ? "All Time" :
      dateRange === "7d" ? "7 Days" : dateRange === "30d" ? "30 Days" : "90 Days";
    const newReport: Report = {
      id: newId,
      name: `Incident Summary — ${rangeLabel} (${today})`,
      type: "PDF",
      date: today,
      size: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`,
    };
    setReports((prev) => [newReport, ...prev]);
    showToast(`Report "${newReport.name}" generated`);
  }

  function downloadReport(r: Report) {
    if (r.type === "CSV") {
      exportCSV();
      return;
    }
    showToast(`Downloading ${r.name} (${r.size})…`);
    setTimeout(() => showToast(`${r.name} downloaded successfully`), 1200);
  }

  return (
    <div ref={printRef} className="p-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium z-50 transition-all ${
          toast.ok ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>
          <CheckCheck className="w-4 h-4 shrink-0" />
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-sm">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">IT Report Dashboard</h2>
            <p className="text-sm text-slate-400">Reporting &amp; statistics for all incidents</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2" />
            {DATE_RANGES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setDateRange(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  dateRange === key
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 text-xs font-semibold px-4 py-2 rounded-xl shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Export PDF
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Tickets" value={tickets.length}
          icon={<FileText className="w-5 h-5 text-white" />}
          color="bg-gradient-to-br from-blue-500 to-blue-700"
          sub={`Last ${dateRange === "all" ? "all time" : dateRange}`} />
        <StatCard label="Approved" value={approved}
          icon={<CheckCircle className="w-5 h-5 text-white" />}
          color="bg-gradient-to-br from-green-500 to-emerald-700"
          sub={`${approvalRate}% approval rate`} />
        <StatCard label="Rejected" value={rejected}
          icon={<XCircle className="w-5 h-5 text-white" />}
          color="bg-gradient-to-br from-red-500 to-red-700"
          sub={`${Math.round((rejected / total) * 100)}% rejection rate`} />
        <StatCard label="Avg AI Confidence" value={`${avgConfidence}%`}
          icon={<TrendingUp className="w-5 h-5 text-white" />}
          color="bg-gradient-to-br from-purple-500 to-purple-700"
          sub="GOST analysis score" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Status breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <div className="w-1.5 h-4 rounded-full bg-blue-500" />
            Ticket Status Breakdown
          </h3>
          {tickets.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No tickets in this period</p>
          ) : (
            <div className="space-y-3">
              {[
                { label: "Pending Validation", count: pending,     bg: "bg-yellow-500" },
                { label: "SQL Proposed",        count: sqlProposed, bg: "bg-blue-500" },
                { label: "Approved",            count: approved,    bg: "bg-green-500" },
                { label: "Rejected",            count: rejected,    bg: "bg-red-500" },
              ].map(({ label, count, bg }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-600 font-medium">{label}</span>
                    <span className="text-xs font-bold text-slate-700">{count} / {tickets.length}</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${bg} transition-all`}
                      style={{ width: `${Math.round((count / total) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Priority + Team */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <div className="w-1.5 h-4 rounded-full bg-red-500" />
            Priority Distribution
          </h3>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {["P1", "P2", "P3"].map((p) => {
              const count = byPriority(p);
              const pct = Math.round((count / total) * 100);
              const cfg = p === "P1"
                ? { bg: "bg-red-100",    text: "text-red-700",    ring: "border-red-300" }
                : p === "P2"
                ? { bg: "bg-orange-100", text: "text-orange-700", ring: "border-orange-300" }
                : { bg: "bg-slate-100",  text: "text-slate-600",  ring: "border-slate-300" };
              return (
                <div key={p} className={`rounded-xl border-2 p-4 text-center ${cfg.bg} ${cfg.ring}`}>
                  <p className={`text-3xl font-bold ${cfg.text}`}>{count}</p>
                  <p className={`text-xs font-semibold ${cfg.text} mt-1`}>{p}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{pct}%</p>
                </div>
              );
            })}
          </div>

          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <div className="w-1.5 h-4 rounded-full bg-indigo-500" />
            Tickets by Team
          </h3>
          {teamData.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-3">No data</p>
          ) : (
            <div className="space-y-2">
              {teamData.map(([team, count]) => (
                <div key={team} className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-600 w-36 shrink-0 truncate">{team}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${Math.round((count / maxTeam) * 100)}%` }} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 w-4 shrink-0">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Performance */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            GOST AI Performance Trend
          </h3>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-purple-500 inline-block" />Approval Rate</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-200 inline-block" />Avg Confidence</span>
          </div>
        </div>
        <div className="flex items-end gap-3 h-36">
          {AI_TREND.map((d) => (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end gap-0.5 h-28">
                <div className="flex-1 rounded-t-md bg-purple-500 transition-all"
                  style={{ height: `${Math.round((d.approvalRate / maxRate) * 100)}%` }} />
                <div className="flex-1 rounded-t-md bg-indigo-200 transition-all"
                  style={{ height: `${Math.round((d.avgConf / maxConf) * 100)}%` }} />
              </div>
              <span className="text-[10px] text-slate-400 font-medium">{d.month}</span>
              <span className="text-[10px] font-bold text-purple-600">{d.approvalRate}%</span>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-lg font-bold text-purple-600">{approvalRate}%</p>
            <p className="text-[10px] text-slate-400">Current approval rate</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-indigo-600">{avgConfidence}%</p>
            <p className="text-[10px] text-slate-400">Avg AI confidence</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-green-600">+22pp</p>
            <p className="text-[10px] text-slate-400">Improvement (6 months)</p>
          </div>
        </div>
      </div>

      {/* Ticket table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Tickets Summary
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{tickets.length} tickets</span>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1 text-[11px] text-purple-600 hover:text-purple-800 font-semibold px-2 py-1 rounded-lg hover:bg-purple-50 transition-colors"
            >
              <Download className="w-3 h-3" />
              CSV
            </button>
          </div>
        </div>
        {tickets.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">No tickets in this date range</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-gray-100">
                  <th className="text-left px-5 py-2.5">ID</th>
                  <th className="text-left px-5 py-2.5">Title</th>
                  <th className="text-left px-4 py-2.5">Status</th>
                  <th className="text-left px-4 py-2.5">Priority</th>
                  <th className="text-left px-4 py-2.5">Team</th>
                  <th className="text-right px-5 py-2.5">AI Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-xs font-mono text-slate-400">#{t.id}</td>
                    <td className="px-5 py-3 text-xs font-medium text-slate-800 max-w-xs truncate">{t.title}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[t.status]}`}>
                        {STATUS_LABELS[t.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${PRIORITY_COLORS[t.priority]}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{t.team}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`text-xs font-bold ${
                        t.aiConfidence >= 85 ? "text-green-600" : t.aiConfidence >= 70 ? "text-blue-600" : "text-orange-600"
                      }`}>{t.aiConfidence}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reports list */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-500" />
            Generated Reports
          </h3>
          <button
            onClick={generateReport}
            className="text-xs flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors"
          >
            <Download className="w-3 h-3" />
            Generate New
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {reports.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${
                  r.type === "PDF" ? "bg-red-500" : r.type === "Excel" ? "bg-green-600" : "bg-blue-500"
                }`}>{r.type}</div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">{r.name}</p>
                  <p className="text-[10px] text-slate-400">{r.id} · {r.date} · {r.size}</p>
                </div>
              </div>
              <button
                onClick={() => downloadReport(r)}
                className="text-slate-400 hover:text-purple-600 transition-colors p-1.5 rounded-lg hover:bg-purple-50"
                title={`Download ${r.name}`}
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
