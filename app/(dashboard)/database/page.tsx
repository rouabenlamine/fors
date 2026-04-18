"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getTableNames, getTableSchema, getTableData } from "@/app/actions";
import { 
  Database, Download, Search, ChevronLeft, ChevronRight, 
  Table2, RefreshCcw, Filter, 
  DatabaseBackup, DatabaseZap, ListTree
} from "lucide-react";

const PAGE_SIZE = 10;

function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function exportCSV(columns: string[], data: Record<string, unknown>[], filename: string) {
  const header = columns.join(",");
  const rows = data.map((row) => columns.map((c) => escapeCSV(row[c])).join(","));
  const content = [header, ...rows].join("\n");
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function DatabaseExplorerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tableParam = searchParams.get("table");

  const [tables, setTables] = useState<string[]>(["menus", "transactions"]);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [schema, setSchema] = useState<any[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [search, setSearch] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [page, setPage] = useState(1);

  // Initial fetch of table names (restricted to specific tables)
  useEffect(() => {
    getTableNames().then(res => {
      const allowed = ["menus", "transactions"];
      const filtered = res.filter(t => allowed.includes(t.toLowerCase())).sort();
      setTables(filtered.length > 0 ? filtered : allowed);
    });
  }, []);

  // Synchronize selectedTable with tableParam
  useEffect(() => {
    if (tables.length === 0) return;

    if (tableParam) {
      const match = tables.find(t => t.toLowerCase() === tableParam.toLowerCase());
      if (match) {
        if (match !== selectedTable) setSelectedTable(match);
      } else {
        if (!selectedTable) setSelectedTable(tables[0]);
      }
    } else if (!selectedTable) {
      setSelectedTable(tables[0]);
    }
  }, [tableParam, tables, selectedTable]);

  // Fetch data
  useEffect(() => {
    if (!selectedTable) return;
    setLoading(true);
    setPage(1);
    Promise.all([
      getTableSchema(selectedTable),
      getTableData(selectedTable)
    ]).then(([s, d]) => {
      setSchema(s);
      setData(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [selectedTable]);

  const columns = useMemo(() => schema.map(s => s.Field), [schema]);

  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((c) => String(row[c] ?? "").toLowerCase().includes(q))
    );
  }, [data, columns, search]);

  const filteredTables = useMemo(() => {
    if (!tableSearch.trim()) return tables;
    return tables.filter(t => t.toLowerCase().includes(tableSearch.toLowerCase()));
  }, [tables, tableSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageData = filteredData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleTableSelect(t: string) {
    setSelectedTable(t);
    const params = new URLSearchParams(searchParams.toString());
    params.set("table", t);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white rounded-2xl border border-slate-200/60 shadow-xl shadow-blue-900/5 overflow-hidden backdrop-blur-sm bg-white/90">
      {/* Dynamic Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">FORS Explorer</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Live Node: <span className="text-white">Prod_FORS_01</span></p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white/10 rounded-lg p-1 border border-white/5 backdrop-blur-md">
            <button className="p-1.5 hover:bg-white/10 rounded-md transition-all text-slate-300 hover:text-white" title="Refresh Sync">
              <RefreshCcw className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <button className="p-1.5 hover:bg-white/10 rounded-md transition-all text-slate-300 hover:text-white" title="Column Config">
              <Filter className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => exportCSV(columns, filteredData, `${selectedTable}_export.csv`)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 group"
          >
            <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Explorer Sidebar */}
        <div className="w-64 border-r border-slate-200 bg-slate-50/50 flex flex-col shrink-0">
          <div className="p-4 bg-white/40 border-b border-slate-200/50 backdrop-blur-sm">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search Tables"
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
            {filteredTables.map(t => (
              <button
                key={t}
                onClick={() => handleTableSelect(t)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all duration-200 relative group overflow-hidden ${
                  selectedTable === t 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 translate-x-1" 
                    : "text-slate-600 hover:bg-white hover:shadow-sm hover:translate-x-1"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  selectedTable === t 
                    ? "bg-white/20" 
                    : "bg-slate-100 group-hover:bg-blue-50 border border-slate-200 group-hover:border-blue-200"
                }`}>
                  <Table2 className={`w-4 h-4 ${selectedTable === t ? "text-white" : "text-slate-500 group-hover:text-blue-600"}`} />
                </div>
                <div className="flex items-col items-start min-w-0">
                  <span className="truncate w-full text-xs uppercase tracking-wide">{t}</span>
                </div>
                {selectedTable === t && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/30 rounded-full my-3 mr-1" />
                )}
              </button>
            ))}
          </div>
          <div className="p-4 bg-slate-100/50 border-t border-slate-200/60 mt-auto">
             <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200/60">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                   <DatabaseBackup className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex flex-col">
                   <p className="text-[10px] text-slate-500 font-bold">RECORDS</p>
                   <p className="text-xs font-bold text-slate-900">{filteredData.length}</p>
                </div>
             </div>
          </div>
        </div>

        {/* Dynamic Data Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          <div className="px-6 py-4 flex items-center gap-4 bg-white/50 border-b border-slate-100 backdrop-blur-md sticky top-0 z-20">
            <div className="relative flex-1 max-w-sm group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder={`Search records in ${selectedTable}...`}
                className="w-full border-none bg-slate-100/80 rounded-xl pl-10 pr-4 py-2 text-xs font-medium focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all outline-none"
              />
            </div>
            
            <div className="flex items-center gap-2 ml-auto">
              {columns.length > 0 && (
                <span className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border border-blue-100">
                  <ListTree className="w-3.5 h-3.5" />
                  {columns.length} Fields
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-30">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin" />
                    <Database className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="text-sm font-bold text-slate-800">Synchronizing Data</p>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Querying MySQL Source...</p>
                  </div>
                </div>
              </div>
            ) : null}

            <table className="w-full border-separate border-spacing-0">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50/90 backdrop-blur-md">
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 select-none whitespace-nowrap min-w-[120px]"
                    >
                      <div className="flex items-center gap-2 group cursor-pointer hover:text-slate-600 transition-colors">
                        <span>{col}</span>
                        <div className="w-px h-3 bg-slate-200" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageData.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-32 text-center">
                      <div className="flex flex-col items-center gap-6 py-12">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                           <DatabaseZap className="w-10 h-10 text-slate-300" />
                        </div>
                        <div className="max-w-xs mx-auto">
                          <p className="text-lg font-bold text-slate-900">No matching records</p>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">No data corresponds to your current search parameters. Try adjusting filters or selecting a different table.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pageData.map((row, i) => (
                    <tr key={i} className="hover:bg-blue-50/20 transition-all group">
                      {columns.map((col) => (
                        <td key={col} className="px-4 py-2.5 text-[11px] font-medium text-slate-600 border-b border-slate-50 group-last:border-none">
                          {row[col] === null || row[col] === undefined ? (
                            <span className="text-slate-300 font-mono italic text-[10px]">null</span>
                          ) : (
                            <div className="max-w-[300px] truncate" title={String(row[col])}>
                              <span className="text-slate-800 group-hover:text-blue-700 transition-colors">
                                {String(row[col])}
                              </span>
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Premium Pagination */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 backdrop-blur-md flex items-center justify-between shrink-0">
            <div className="flex flex-col">
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Selection</p>
               <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-bold text-slate-900">Page {currentPage}</span>
                  <span className="text-slate-300 font-light">/</span>
                  <span className="text-sm font-bold text-slate-400">{totalPages}</span>
               </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-90"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700" />
              </button>
              
              <div className="hidden sm:flex items-center gap-2 mx-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p = i + 1;
                  if (totalPages > 5 && currentPage > 3) p = Math.min(currentPage - 2 + i, totalPages - 4 + i);
                  if (p > totalPages || p < 1) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all ${
                        p === currentPage
                          ? "bg-slate-900 text-white shadow-xl shadow-slate-900/10 scale-110"
                          : "bg-white border border-slate-200 text-slate-500 hover:border-blue-500 hover:text-blue-600 hover:scale-105"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-90"
              >
                <ChevronRight className="w-5 h-5 text-slate-700" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}

export default function DatabasePage() {
  return (
    <Suspense fallback={
      <div className="p-6 flex items-center justify-center h-full">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin" />
          <Database className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    }>
      <div className="h-full flex flex-col pt-1 pb-4">
        <DatabaseExplorerContent />
      </div>
    </Suspense>
  );
}
