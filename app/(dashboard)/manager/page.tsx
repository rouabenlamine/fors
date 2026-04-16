"use client";

import { useState, useRef, useEffect } from "react";
import { getMenus, getTransactions } from "@/app/actions";
import {
  Database, Search, Bot, Send, Shield, ChevronRight,
  Table, Hash, Clock, CheckCircle, XCircle, History,
} from "lucide-react";

type ActiveTab = "tables" | "chat" | "history";
type TableName = "menus" | "transactions";

const SELECT_REPLIES: Record<string, string> = {
  "show all":     "SELECT * FROM menus LIMIT 50;",
  "count":        "SELECT COUNT(*) AS total FROM transactions WHERE status = 'completed';",
  "pending":      "SELECT id, title, status FROM menus WHERE parentId IS NULL ORDER BY \"order\" ASC;",
  "transactions": "SELECT t.id, t.amount, t.status, t.createdAt FROM transactions t ORDER BY t.createdAt DESC LIMIT 20;",
  "search":       "SELECT * FROM menus WHERE title ILIKE '%keyword%' OR description ILIKE '%keyword%';",
  "join":         "SELECT m.id, m.title, t.amount, t.status FROM menus m LEFT JOIN transactions t ON t.menuId = m.id WHERE t.status = 'pending';",
  "sum":          "SELECT SUM(amount) AS total_amount, COUNT(*) AS count FROM transactions WHERE status = 'completed';",
};

const DEFAULT_REPLIES = [
  "Here's a SELECT query for that: SELECT * FROM menus WHERE parentId IS NULL ORDER BY \"order\";",
  "For read-only access, use: SELECT id, title, description FROM menus LIMIT 10;",
  "To filter transactions: SELECT * FROM transactions WHERE status = 'pending' ORDER BY createdAt DESC;",
  "Use this query to aggregate: SELECT status, COUNT(*) FROM transactions GROUP BY status;",
];

interface ChatMsg {
  role: "user" | "bot";
  content: string;
  time: string;
}

interface QueryHistory {
  id: string;
  query: string;
  table: string;
  rows: number;
  duration: string;
  status: "success" | "error";
  time: string;
  user: string;
}

const MOCK_HISTORY: QueryHistory[] = [
  { id: "Q-018", query: "SELECT * FROM menus LIMIT 50;", table: "menus", rows: 39, duration: "12ms", status: "success", time: "14:03", user: "Omar Khalil" },
  { id: "Q-017", query: "SELECT COUNT(*) AS total FROM transactions WHERE status = 'completed';", table: "transactions", rows: 1, duration: "8ms", status: "success", time: "13:58", user: "Omar Khalil" },
  { id: "Q-016", query: "SELECT m.id, m.title, t.amount FROM menus m LEFT JOIN transactions t ON t.menuId = m.id;", table: "menus + transactions", rows: 30, duration: "21ms", status: "success", time: "13:45", user: "Omar Khalil" },
  { id: "Q-015", query: "SELECT SUM(amount) AS total FROM transactions WHERE status = 'completed';", table: "transactions", rows: 1, duration: "9ms", status: "success", time: "13:30", user: "Omar Khalil" },
  { id: "Q-014", query: "SELECT * FROM menus WHERE title ILIKE '%payroll%';", table: "menus", rows: 3, duration: "14ms", status: "success", time: "12:17", user: "Omar Khalil" },
  { id: "Q-013", query: "SELECT * FROM transactions WHERE status = 'pending' ORDER BY createdAt DESC;", table: "transactions", rows: 8, duration: "11ms", status: "success", time: "11:54", user: "Omar Khalil" },
  { id: "Q-012", query: "SELECT id, title, description FROM menus LIMIT 10;", table: "menus", rows: 10, duration: "7ms", status: "success", time: "11:20", user: "Omar Khalil" },
  { id: "Q-011", query: "SELECT status, COUNT(*) FROM transactions GROUP BY status;", table: "transactions", rows: 3, duration: "10ms", status: "success", time: "10:45", user: "Omar Khalil" },
  { id: "Q-010", query: "SELECT * FROM menus WHERE parentId IS NULL ORDER BY \"order\" ASC;", table: "menus", rows: 12, duration: "13ms", status: "success", time: "09:38", user: "Omar Khalil" },
  { id: "Q-009", query: "UPDATE transactions SET status = 'completed' WHERE id = 5;", table: "transactions", rows: 0, duration: "–", status: "error", time: "09:12", user: "Omar Khalil" },
];

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ManagerPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("tables");
  const [activeTable, setActiveTable] = useState<TableName>("menus");
  const [search, setSearch] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([
    {
      role: "bot",
      content: "Hello, IT Manager. I can help you build SELECT queries for your tables. What data would you like to retrieve?",
      time: now(),
    },
  ]);
  const [typing, setTyping] = useState(false);
  const [history, setHistory] = useState<QueryHistory[]>(MOCK_HISTORY);
  
  const [menusData, setMenusData] = useState<any[]>([]);
  const [transactionsData, setTransactionsData] = useState<any[]>([]);

  useEffect(() => {
    getMenus().then(setMenusData);
    getTransactions().then(setTransactionsData);
  }, []);

  const replyIdx = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs, typing]);

  const tableData = activeTable === "menus" ? menusData : transactionsData;
  const columns = tableData.length > 0 ? Object.keys(tableData[0]) : [];
  const filtered = search
    ? tableData.filter((row) =>
        Object.values(row).some((v) => String(v).toLowerCase().includes(search.toLowerCase()))
      )
    : tableData;

  function sendChat() {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatMsgs((prev) => [...prev, { role: "user", content: msg, time: now() }]);
    setChatInput("");
    setTyping(true);

    setTimeout(() => {
      const lower = msg.toLowerCase();
      let reply = DEFAULT_REPLIES[replyIdx.current % DEFAULT_REPLIES.length];
      for (const [key, sql] of Object.entries(SELECT_REPLIES)) {
        if (lower.includes(key)) { reply = sql; break; }
      }
      replyIdx.current++;
      setTyping(false);
      setChatMsgs((prev) => [...prev, { role: "bot", content: reply, time: now() }]);
      // Add to history
      const newEntry: QueryHistory = {
        id: `Q-0${20 + history.length}`,
        query: reply,
        table: reply.toLowerCase().includes("transaction") ? "transactions" : "menus",
        rows: Math.floor(Math.random() * 30) + 1,
        duration: `${Math.floor(Math.random() * 20) + 5}ms`,
        status: "success",
        time: now(),
        user: "Omar Khalil",
      };
      setHistory((prev) => [newEntry, ...prev]);
    }, 1200);
  }

  const TABS: { key: ActiveTab; label: string; icon: React.ElementType }[] = [
    { key: "tables",  label: "Table Explorer",     icon: Table },
    { key: "chat",    label: "SQL Assistant",       icon: Bot },
    { key: "history", label: "Query History",       icon: History },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-700 flex items-center justify-center shadow-sm">
          <Database className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">IT Manager Workspace</h2>
          <p className="text-sm text-slate-400">Table management & read-only SQL assistant</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-full">
          <Shield className="w-3.5 h-3.5" />
          SELECT queries only
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === key
                ? "bg-teal-600 text-white shadow-sm"
                : "bg-white border border-gray-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {key === "history" && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === "history" ? "bg-white/20 text-white" : "bg-teal-100 text-teal-700"
              }`}>
                {history.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "tables" && (
        <div className="space-y-4">
          {/* Table selector + search */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-2">
              {(["menus", "transactions"] as TableName[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setActiveTable(t); setSearch(""); }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTable === t
                      ? "bg-teal-100 text-teal-800 border border-teal-300"
                      : "bg-white border border-gray-200 text-slate-600 hover:bg-gray-50"
                  }`}
                >
                  <Hash className="w-3 h-3" />
                  {t}
                  <span className="text-[10px] bg-white border border-current/20 px-1 rounded">
                    {t === "menus" ? menusData.length : transactionsData.length}
                  </span>
                </button>
              ))}
            </div>
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search in ${activeTable}...`}
                className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100"
              />
            </div>
            <span className="text-xs text-slate-400">
              {filtered.length} of {tableData.length} rows
            </span>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-teal-50 border-b border-teal-100">
                    {columns.map((col) => (
                      <th key={col} className="text-left px-4 py-2.5 text-[10px] font-bold text-teal-700 uppercase tracking-wider whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.slice(0, 15).map((row, i) => (
                    <tr key={i} className="hover:bg-teal-50/40 transition-colors">
                      {columns.map((col) => {
                        const cell = (row as unknown as Record<string, unknown>)[col];
                        return (
                        <td key={col} className={`px-4 py-2.5 whitespace-nowrap ${
                          col === "id" ? "font-mono text-teal-600 font-semibold" :
                          cell === null ? "text-slate-300 italic" :
                          "text-slate-700"
                        }`}>
                          {cell === null
                            ? "null"
                            : String(cell).length > 35
                            ? String(cell).slice(0, 35) + "…"
                            : String(cell)}
                        </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length > 15 && (
              <div className="px-4 py-2.5 border-t border-gray-100 text-xs text-slate-400 bg-slate-50">
                Showing 15 of {filtered.length} rows
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "chat" && (
        <div className="flex gap-4 h-[520px]">
          {/* Quick queries sidebar */}
          <div className="w-56 shrink-0 space-y-2">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Quick Queries</p>
            {[
              { label: "Show all menus",       hint: "show all" },
              { label: "Count transactions",    hint: "count" },
              { label: "Pending items",         hint: "pending" },
              { label: "Recent transactions",   hint: "transactions" },
              { label: "Search by keyword",     hint: "search" },
              { label: "JOIN tables",           hint: "join" },
              { label: "Sum amounts",           hint: "sum" },
            ].map(({ label, hint }) => (
              <button
                key={hint}
                onClick={() => setChatInput(`How do I ${label.toLowerCase()}?`)}
                className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-600 bg-white border border-gray-200 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 transition-all"
              >
                <ChevronRight className="w-3 h-3 shrink-0" />
                {label}
              </button>
            ))}
          </div>

          {/* Chat panel */}
          <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
            {/* Chat header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3"
              style={{ background: "linear-gradient(135deg, #0f766e 0%, #0891b2 100%)" }}>
              <Bot className="w-4 h-4 text-teal-200" />
              <div>
                <p className="text-sm font-bold text-white">SQL Assistant</p>
                <p className="text-[10px] text-teal-200">Generates SELECT queries only · Read-only access</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5 text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full">
                <Shield className="w-3 h-3" />
                Read-only
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {chatMsgs.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "bot" && (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mr-2 mt-0.5"
                      style={{ background: "linear-gradient(135deg, #0f766e, #0891b2)" }}>
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className="max-w-[80%]">
                    <div className={`px-3 py-2 rounded-xl text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "text-white rounded-br-sm"
                        : "bg-white border border-gray-200 text-slate-700 rounded-bl-sm shadow-sm font-mono"
                    }`}
                      style={msg.role === "user" ? { background: "linear-gradient(135deg, #0f766e, #0891b2)" } : {}}
                    >
                      {msg.content}
                    </div>
                    <p className={`text-[9px] text-slate-400 mt-0.5 ${msg.role === "user" ? "text-right" : ""}`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex items-end gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg, #0f766e, #0891b2)" }}>
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-white border border-gray-200 px-3 py-2.5 rounded-xl shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-gray-100 flex gap-2 bg-white">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
                placeholder="Ask for a SELECT query… e.g. 'Show all menus'"
                className="flex-1 bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100"
              />
              <button
                onClick={sendChat}
                disabled={!chatInput.trim()}
                className="w-9 h-9 rounded-lg flex items-center justify-center disabled:opacity-40 hover:scale-105 transition-all"
                style={{ background: "linear-gradient(135deg, #0f766e, #0891b2)" }}
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-4">
          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
                <History className="w-4.5 h-4.5 text-teal-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-800">{history.length}</p>
                <p className="text-[10px] text-slate-400">Total queries</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                <CheckCircle className="w-4.5 h-4.5 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-800">{history.filter((h) => h.status === "success").length}</p>
                <p className="text-[10px] text-slate-400">Successful</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                <XCircle className="w-4.5 h-4.5 text-red-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-800">{history.filter((h) => h.status === "error").length}</p>
                <p className="text-[10px] text-slate-400">Blocked (non-SELECT)</p>
              </div>
            </div>
          </div>

          {/* History table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <History className="w-4 h-4 text-teal-600" />
                Query Execution Log
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full">
                <Shield className="w-3 h-3" />
                SELECT-only enforced
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-gray-100">
                    <th className="text-left px-5 py-2.5">ID</th>
                    <th className="text-left px-4 py-2.5">Query</th>
                    <th className="text-left px-4 py-2.5">Table</th>
                    <th className="text-left px-4 py-2.5">Rows</th>
                    <th className="text-left px-4 py-2.5">Duration</th>
                    <th className="text-left px-4 py-2.5">Time</th>
                    <th className="text-left px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {history.map((h) => (
                    <tr key={h.id} className={`hover:bg-slate-50 transition-colors ${h.status === "error" ? "bg-red-50/30" : ""}`}>
                      <td className="px-5 py-3 font-mono text-[11px] text-slate-400">{h.id}</td>
                      <td className="px-4 py-3 max-w-xs">
                        <code className={`text-[10px] font-mono block truncate ${
                          h.status === "error" ? "text-red-500" : "text-teal-700"
                        }`}>
                          {h.query}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] px-2 py-0.5 bg-teal-50 text-teal-700 rounded font-medium border border-teal-100">
                          {h.table}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">{h.status === "error" ? "–" : h.rows}</td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{h.duration}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3 h-3" />
                          {h.time}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {h.status === "success" ? (
                          <span className="flex items-center gap-1 text-green-600 text-[10px] font-semibold">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Success
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-500 text-[10px] font-semibold">
                            <XCircle className="w-3.5 h-3.5" />
                            Blocked
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
