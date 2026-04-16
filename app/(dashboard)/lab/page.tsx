"use client";

import { useState, useRef, useEffect } from "react";
import { FlaskConical, Send, CheckCircle, XCircle, Bot, RefreshCw, Sparkles, ChevronDown, ChevronUp, Copy, Check, Hash, FileText, AlertCircle, Search, Info, Users, Calendar } from "lucide-react";
import { analyzeTicketAction, chatWithGostAction, createTicket, getChatMessagesForTicketAction, validateAnalysisAction, rejectAnalysisAction } from "@/app/actions";
import { useRouter, useSearchParams } from "next/navigation";
import type { TicketPriority } from "@/lib/types";

interface AnalysisResult {
  incidentId: string;
  rootCause: string;
  confidence: number;
  urgency: "critical" | "high" | "medium" | "low";
  impactedTables: { name: string; confidence: number }[];
  sqlProposal: string;
  recommendation: string;
  gostSummary: string;
}

interface ChatMessage {
  role: "User" | "AI";
  content: string;
  time: string;
}

type DecisionState = "idle" | "validated" | "rejected";

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const URGENCY_COLORS = {
  critical: "bg-rose-500/15 text-rose-600 border border-rose-200/50 shadow-[0_0_10px_rgba(244,63,94,0.1)]",
  high: "bg-orange-500/15 text-orange-600 border border-orange-200/50 shadow-[0_0_10px_rgba(249,115,22,0.1)]",
  medium: "bg-amber-500/15 text-amber-600 border border-amber-200/50 shadow-[0_0_10px_rgba(245,158,11,0.1)]",
  low: "bg-emerald-500/15 text-emerald-600 border border-emerald-200/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
};

const GOST_CHAT_REPLIES = [
  "Based on the incident pattern I've analysed, the most likely cause is a data integrity issue in the affected table. Would you like me to generate an alternative SQL query?",
  "I recommend reviewing the transaction logs from the past 24 hours to confirm the root cause. I can also cross-reference with similar past incidents.",
  "The confidence score reflects the match rate against known incident patterns in the FORS knowledge base. A score above 80% typically leads to automatic resolution.",
  "If you reject this proposal, I can regenerate the analysis using a different detection strategy. Would you like me to try a schema-based approach?",
  "This incident matches INC4560052942 from March 2026, which was successfully resolved using a similar SQL pattern.",
];

function generateAnalysis(incident: string): AnalysisResult {
  const lower = incident.toLowerCase();
  const isDatabase = lower.includes("database") || lower.includes("sql") || lower.includes("table") || lower.includes("data");
  const isKanban = lower.includes("kanban") || lower.includes("kb");
  const isTransfer = lower.includes("transfer") || lower.includes("anot") || lower.includes("harness");
  const isArchive = lower.includes("archive") || lower.includes("arjo");

  const num = Math.floor(Math.random() * 9000000) + 1000000;

  if (isKanban) {
    return {
      incidentId: `INC${num}`,
      rootCause: "KANBAN control parameter mismatch detected — PA-Control system (KANBAN) reporting inconsistency between ldwvkk configuration and actual production queue state.",
      confidence: 87,
      urgency: "high",
      impactedTables: [
        { name: "ldwvkk", confidence: 87 },
        { name: "ldwkbz", confidence: 74 },
        { name: "pasy", confidence: 61 },
      ],
      sqlProposal: `SELECT t.name, t.pgmType, t.tables\nFROM transactions t\nWHERE t.tables LIKE '%pasy%'\n   OR t.tables LIKE '%kanban%'\nORDER BY t.name\nLIMIT 50;`,
      recommendation: "1. Verify KANBAN parameter configuration in ABBZ.\n2. Check pseudo procurement status in ldwpbk.\n3. Restart KANBAN processing batch if queue is stalled.",
      gostSummary: "KANBAN processing disruption detected. PA-Control system showing queue inconsistency. High confidence root cause identified in ldwvkk configuration.",
    };
  }
  if (isTransfer || isArchive) {
    return {
      incidentId: `INC${num}`,
      rootCause: "Transfer record anomaly in anot table — harness assembly time accumulation showing deviation from expected baseline.",
      confidence: 91,
      urgency: "critical",
      impactedTables: [
        { name: "anot", confidence: 91 },
        { name: "arjo", confidence: 78 },
        { name: "fext", confidence: 65 },
      ],
      sqlProposal: `SELECT\n  harnes,\n  COUNT(*) AS transfer_count,\n  SUM(timass) AS total_assembly_time,\n  MAX(datcre) AS last_transfer\nFROM anot\nGROUP BY harnes\nORDER BY transfer_count DESC\nLIMIT 50;`,
      recommendation: "1. Review the last 100 anot transfers for anomalous records.\n2. Compare against baseline assembly times.\n3. Check ALJC batch job status for completeness.",
      gostSummary: "Transfer anomaly detected in anot table. Harness assembly time deviation confirmed. Critical — immediate review required.",
    };
  }
  if (isDatabase) {
    return {
      incidentId: `INC${num}`,
      rootCause: "Deadlock detected on a core data table blocking report generation pipeline. Transaction isolation conflict identified between concurrent batch jobs.",
      confidence: 84,
      urgency: "critical",
      impactedTables: [
        { name: "apag", confidence: 84 },
        { name: "appk", confidence: 71 },
        { name: "aptx", confidence: 58 },
      ],
      sqlProposal: `SELECT\n  firmnr, plwerk, teilnr, ferweg,\n  arbgnr, aendat, aenuhr\nFROM apag\nWHERE aenben IS NULL OR aenben = ''\nORDER BY aendat DESC, aenuhr DESC\nLIMIT 200;`,
      recommendation: "1. Identify blocking transactions using AGUE (Change history display).\n2. Run APDA batch to re-print affected route sheets.\n3. Adjust transaction isolation level to READ COMMITTED.",
      gostSummary: "Critical database deadlock detected. Blocking route sheet generation. SQL proposal ready for immediate review.",
    };
  }
  return {
    incidentId: `INC${num}`,
    rootCause: "Anomaly detected in FORS system data — schema detection matched against known incident patterns with moderate confidence.",
    confidence: 72,
    urgency: "medium",
    impactedTables: [
      { name: "dfau", confidence: 72 },
      { name: "magd", confidence: 58 },
    ],
    sqlProposal: `SELECT * FROM dfau\nWHERE created_at > NOW() - INTERVAL 24 HOUR\nORDER BY id DESC\nLIMIT 100;`,
    recommendation: "1. Review data in the affected table using the SQL query below.\n2. Check for anomalies or missing records.\n3. Verify data integrity and user permissions.\n4. Escalate if the issue persists.",
    gostSummary: "Incident analysed with moderate confidence. Anomaly detected — manual review recommended before applying SQL proposal.",
  };
}

function LabField({
  label,
  children,
  icon: Icon
}: {
  label: string;
  children: React.ReactNode;
  icon?: any;
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
        {label}
      </label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />}
        {children}
      </div>
    </div>
  );
}



export default function LabPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialId = searchParams?.get("id") || "INC0010001";
  
  const [ticketId, setTicketId] = useState(initialId);
  const [caller, setCaller] = useState("System Administrator");
  const [openedAt, setOpenedAt] = useState(new Date().toISOString().replace('T', ' ').split('.')[0]);
  const [closedAt, setClosedAt] = useState("");
  const [urgency, setUrgency] = useState("3 - Low");
  const [state, setState] = useState("New");
  const [watchList, setWatchList] = useState("");
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDesc, setTicketDesc] = useState("");
  const [comments, setComments] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("3 - Moderate");
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [decision, setDecision] = useState<DecisionState>("idle");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatTyping, setChatTyping] = useState(false);
  const [sqlExpanded, setSqlExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const chatReplyIdx = useRef(0);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatTyping]);

  useEffect(() => {
    const saved = localStorage.getItem("lab_workspace_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.result && parsed.decision === "idle") {
          if (parsed.ticketId) setTicketId(parsed.ticketId);
          if (parsed.ticketTitle) setTicketTitle(parsed.ticketTitle);
          if (parsed.ticketDesc) setTicketDesc(parsed.ticketDesc);
          if (parsed.comments) setComments(parsed.comments);
          if (parsed.result) setResult(parsed.result);
          if (parsed.decision) setDecision(parsed.decision);
          if (parsed.chatMessages) setChatMessages(parsed.chatMessages);
        }
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (result && decision === "idle") {
      localStorage.setItem("lab_workspace_state", JSON.stringify({
        ticketId, ticketTitle, ticketDesc, comments, result, decision, chatMessages
      }));
    } else if (decision !== "idle" || !result) {
      localStorage.removeItem("lab_workspace_state");
    }
  }, [result, decision, ticketId, ticketTitle, ticketDesc, comments, chatMessages]);

  // Sync with DB if ticketId exists
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (ticketId && ticketId.startsWith("INC")) {
        try {
          const { getTicketById, getAnalyses } = await import("@/app/actions");
          const existing = await getTicketById(ticketId);
          if (existing) {
            setTicketTitle(existing.title);
            setTicketDesc(existing.description);
            setPriority(existing.priority);
            setUrgency(existing.priority.includes("Critical") ? "1 - High" : "3 - Low");
            
            const analyses = await getAnalyses();
            const foundAnalysis = analyses.find(a => a.ticketId === ticketId);
            if (foundAnalysis) {
              setResult({
                incidentId: ticketId,
                rootCause: foundAnalysis.rootCause,
                confidence: existing.aiConfidence || 85,
                urgency: foundAnalysis.urgency,
                impactedTables: foundAnalysis.impactedTables || [],
                sqlProposal: foundAnalysis.sqlProposal || "",
                recommendation: foundAnalysis.recommendation,
                gostSummary: foundAnalysis.gostSummary
              });
              setDecision(existing.status === 'validated' ? 'validated' : existing.status === 'rejected' ? 'rejected' : 'idle');
            }
          }
        } catch (e) {
          console.error("Failed to sync ticket:", e);
        }
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [ticketId]);

  const playSuccessSound = () => {
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
    audio.volume = 0.5;
    audio.play().catch(() => { });
  };

  async function handleAnalyse() {
    if (!ticketId.trim() || !ticketTitle.trim()) {
      setError("Please fill in Number and Short Description.");
      return;
    }
    setError("");
    setIsAnalysing(true);

    try {
      await createTicket({
        id: ticketId,
        title: ticketTitle,
        description: (ticketDesc || "") + (comments ? "\n\nComments: " + comments : ""),
        priority: priority
      });

      const analysis = await analyzeTicketAction(ticketId, ticketTitle, ticketDesc || "");
      setResult({ 
        ...analysis, 
        incidentId: ticketId
      });
      setIsAnalysing(false);
      playSuccessSound();

      // Load history
      const history = await getChatMessagesForTicketAction(ticketId);
      setChatMessages(history.map((h: any) => ({
        role: h.role === "AI" ? "AI" : "User",
        content: h.content,
        time: new Date(h.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      })));
    } catch (err) {
      setError("Database error or AI service offline.");
      console.error(err);
      setIsAnalysing(false);
    }
  }

  async function handleValidate() {
    if (!result) return;
    try {
      await validateAnalysisAction(ticketId);
      setDecision("validated");
      setShowRejectInput(false);
      playSuccessSound();
    } catch (err) {
      setError("Failed to validate analysis via server.");
    }
  }

  async function handleReject() {
    if (!showRejectInput) {
      setShowRejectInput(true);
      return;
    }
    try {
      await rejectAnalysisAction(ticketId, rejectReason);
      setDecision("rejected");
      setShowRejectInput(false);
    } catch (err) {
      setError("Failed to reject analysis via server.");
    }
  }

  function handleReset() {
    setTicketId("INC0010001");
    setCaller("System Administrator");
    setOpenedAt(new Date().toISOString().replace('T', ' ').split('.')[0]);
    setClosedAt("");
    setUrgency("3 - Low");
    setState("New");
    setWatchList("");
    setTicketTitle("");
    setTicketDesc("");
    setComments("");
    setResult(null);
    setDecision("idle");
    setShowRejectInput(false);
    setRejectReason("");
    setChatOpen(false);
    setChatMessages([]);
  }

  async function sendChat() {
    if (!chatInput.trim()) return;
    const msg: ChatMessage = { role: "User", content: chatInput, time: now() };
    setChatMessages((p) => [...p, msg]);
    setChatInput("");
    setChatTyping(true);

    try {
      const gHistory = chatMessages.map(m => ({ role: m.role === 'AI' ? 'assistant' : 'user', content: m.content }));
      const reply = await chatWithGostAction(ticketId, chatInput, gHistory);
      setChatTyping(false);
      setChatMessages((p) => [...p, { role: "AI", content: reply, time: now() }]);
    } catch (err) {
      setChatTyping(false);
      setChatMessages((p) => [...p, { role: "AI", content: "Service error. Please check if Ollama is running.", time: now() }]);
    }
  }

  function copySQL() {
    if (result) {
      navigator.clipboard.writeText(result.sqlProposal);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <FlaskConical className="w-5 h-5 text-slate-600" />
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Analysis Lab</h2>
          <p className="text-sm text-slate-500 font-medium opacity-70">Register and simulate AI resolution flows</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden mb-6">
        <div className="p-8 border-b border-gray-50 bg-slate-50/30 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide text-xs">
            <Sparkles className="w-4 h-4 text-blue-600" />
            New Incident Analysis Request
          </h3>
          <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">READY</span>
        </div>

        <div className="p-8 space-y-8">
          {/* Main Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <LabField label="Incident Number" icon={Hash}>
                <input
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all font-mono"
                />
              </LabField>

              <LabField label="Caller" icon={Search}>
                <input
                  value={caller}
                  onChange={(e) => setCaller(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all font-semibold"
                />
              </LabField>

              <LabField label="Watch List" icon={Users}>
                <input
                  value={watchList}
                  onChange={(e) => setWatchList(e.target.value)}
                  placeholder="Additional stakeholders..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all"
                />
              </LabField>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <LabField label="Opened At" icon={Calendar}>
                  <input
                    value={openedAt}
                    onChange={(e) => setOpenedAt(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-800 focus:outline-none transition-all font-mono"
                  />
                </LabField>
                <LabField label="Closed At" icon={Calendar}>
                  <input
                    value={closedAt}
                    onChange={(e) => setClosedAt(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-800 focus:outline-none transition-all font-mono"
                  />
                </LabField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <LabField label="Urgency">
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all font-bold appearance-none"
                  >
                    <option value="1 - High">1 - High</option>
                    <option value="2 - Medium">2 - Medium</option>
                    <option value="3 - Low">3 - Low</option>
                  </select>
                </LabField>
                <LabField label="State">
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 text-sm text-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-400 transition-all font-bold appearance-none shadow-sm"
                  >
                    <option value="New">New</option>
                    <option value="In Progress">In Progress</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                    <option value="Canceled">Canceled</option>
                  </select>
                </LabField>
              </div>

              <LabField label="Analysis Priority">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TicketPriority)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all font-bold appearance-none"
                >
                  <option value="1 - Critical">1 - Critical</option>
                  <option value="2 - High">2 - High</option>
                  <option value="3 - Moderate">3 - Moderate</option>
                  <option value="4 - Low">4 - Low</option>
                  <option value="5 - Planning">5 - Planning</option>
                </select>
              </LabField>
            </div>
          </div>

          <div className="space-y-6 border-t border-gray-50 pt-8">
            <LabField label="Short Description (Title)" icon={FileText}>
              <input
                value={ticketTitle}
                onChange={(e) => setTicketTitle(e.target.value)}
                placeholder="Briefly summarize the incident..."
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-3.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all"
              />
            </LabField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <LabField label="Internal Description">
                <textarea
                  value={ticketDesc}
                  onChange={(e) => setTicketDesc(e.target.value)}
                  placeholder="Describe technical details, symptoms, and environment..."
                  rows={4}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all resize-none shadow-inner"
                />
              </LabField>

              <LabField label="Comments">
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Notes visible to the end user..."
                  rows={4}
                  className="w-full bg-amber-50/30 border border-amber-100 rounded-2xl px-4 py-3.5 text-sm text-slate-700 focus:outline-none focus:ring-4 focus:ring-amber-100 focus:border-amber-300 transition-all resize-none shadow-inner italic"
                />
              </LabField>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-2xl px-5 py-4 text-rose-600 text-sm font-semibold">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              onClick={handleReset}
              className="px-6 py-3 rounded-2xl text-sm font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest"
            >
              Reset
            </button>
            <button
              onClick={handleAnalyse}
              disabled={isAnalysing || decision === "validated"}
              className="flex items-center gap-3 px-10 py-3.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 rounded-2xl text-sm font-black text-white transition-all active:scale-95 uppercase tracking-wider disabled:cursor-not-allowed"
            >
              {isAnalysing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating Analysis...
                </>
              ) : decision === "validated" ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Validated
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-blue-300" />
                  Trigger GOST Analysis
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {result && (
        <div className="mt-12 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Generated Analysis ID</p>
                <p className="text-2xl font-black text-slate-800 font-mono tracking-tight">{result.incidentId}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">AI Confidence</p>
                  <p className="text-2xl font-black text-blue-600 italic">{result.confidence}%</p>
                </div>
                <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase border tracking-widest shadow-sm ${URGENCY_COLORS[result.urgency]}`}>
                  {result.urgency}
                </div>
              </div>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-3 mb-8 shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all duration-1000"
                style={{ width: `${result.confidence}%` }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-1 h-3 bg-red-400 rounded-full" />
                  Primary Root Cause
                </p>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">{result.rootCause}</p>
              </div>
              <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-1 h-3 bg-blue-400 rounded-full" />
                  Impacted Database Tables
                </p>
                <div className="space-y-3">
                  {result.impactedTables.map((t) => (
                    <div key={t.name} className="flex items-center justify-between group">
                      <span className="text-xs font-mono font-bold text-blue-600 group-hover:text-blue-700 transition-colors">{t.name}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div className="h-full rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.3)]" style={{ width: `${t.confidence}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 w-10 text-right">{t.confidence}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-indigo-50/20 p-6 rounded-3xl border border-indigo-100/50 mb-8">
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3">AI Recommendation</p>
              <p className="text-sm text-slate-800 leading-relaxed italic">{result.recommendation}</p>
            </div>

            <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
              <div
                className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-slate-800 transition-colors border-b border-white/5"
                onClick={() => setSqlExpanded((v) => !v)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                  <p className="text-xs font-black text-white uppercase tracking-[0.2em]">Automated SQL Proposal</p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={(e) => { e.stopPropagation(); copySQL(); }}
                    className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-white transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? "COPIED" : "COPY TO CLIPBOARD"}
                  </button>
                  {sqlExpanded ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                </div>
              </div>
              {sqlExpanded && (
                <div className="p-6 bg-slate-950 font-mono text-xs text-blue-300 leading-loose overflow-x-auto selection:bg-blue-500/30">
                  <code className="whitespace-pre">{result.sqlProposal}</code>
                </div>
              )}
            </div>
          </div>

          {decision === "idle" && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Expert Validation</p>
              <div className="flex items-start gap-4">
                <button
                  onClick={handleValidate}
                  className="flex items-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/20 rounded-2xl text-xs font-black text-white transition-all uppercase tracking-wider"
                >
                  <CheckCircle className="w-4 h-4" />
                  Validate & Apply Fix
                </button>
                <button
                  onClick={handleReject}
                  className="flex items-center gap-3 px-8 py-4 bg-rose-500 hover:bg-rose-600 hover:shadow-lg hover:shadow-rose-500/20 rounded-2xl text-xs font-black text-white transition-all uppercase tracking-wider"
                >
                  <XCircle className="w-4 h-4" />
                  {showRejectInput ? "Confirm Reject" : "Reject Proposal"}
                </button>
                <button
                  onClick={() => setChatOpen((v) => !v)}
                  className="flex items-center gap-3 px-8 py-4 bg-slate-50 hover:bg-white border border-slate-100 rounded-2xl text-xs font-black text-slate-800 transition-all ml-auto uppercase tracking-wider shadow-sm"
                >
                  <Bot className="w-4 h-4 text-blue-600" />
                  Ask GOSTmistral
                </button>
              </div>

              {showRejectInput && (
                <div className="mt-6 animate-in slide-in-from-top-2 duration-300">
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Provide feedback for AI retraining..."
                    rows={2}
                    className="w-full bg-rose-50/30 border border-rose-100 rounded-2xl px-5 py-4 text-sm text-slate-800 placeholder-rose-300 focus:outline-none focus:ring-4 focus:ring-rose-50 transition-all resize-none italic"
                  />
                </div>
              )}
            </div>
          )}

          {decision === "validated" && (
            <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-100 rounded-3xl px-8 py-6 shadow-sm">
              <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-black text-emerald-900 uppercase tracking-wide">Analysis Validated</p>
                <p className="text-xs text-emerald-700 font-medium mt-1">SQL solution approved. Logged in audit history for {result.incidentId}.</p>
              </div>
            </div>
          )}

          {decision === "rejected" && (
            <div className="flex items-center gap-4 bg-rose-50 border border-rose-100 rounded-3xl px-8 py-6 shadow-sm">
              <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                <XCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-black text-rose-900 uppercase tracking-wide">Analysis Rejected</p>
                {rejectReason && <p className="text-xs text-rose-700 font-medium mt-1">Reason: {rejectReason}</p>}
                <p className="text-xs text-rose-600 font-medium mt-1 italic">Flagged for GOST model adjustment.</p>
              </div>
            </div>
          )}

          {chatOpen && (
            <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden mt-6 animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-3 px-6 py-4 bg-slate-800/50 border-b border-white/5">
                <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                <Bot className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-black text-white uppercase tracking-widest">GOST Node — mistral:latest</span>
              </div>

              <div className="p-6 space-y-4 max-h-80 overflow-y-auto custom-scrollbar bg-slate-950/20">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "User" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-5 py-3.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${msg.role === "User" ? "bg-blue-600 text-white font-medium" : "bg-white/5 text-slate-300 border border-white/5"
                      }`}>
                      {msg.content}
                      <p className={`text-[9px] mt-2 font-bold uppercase tracking-tighter ${msg.role === "User" ? "text-blue-200 text-right" : "text-slate-500"}`}>{msg.time}</p>
                    </div>
                  </div>
                ))}
                {chatTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 px-5 py-4 rounded-2xl border border-white/5">
                      <div className="flex gap-1.5">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              <div className="flex items-center gap-3 px-6 py-5 border-t border-white/5 bg-slate-900/50">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChat()}
                  placeholder="Ask GOST about the mistral:latest analysis..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                />
                <button
                  onClick={sendChat}
                  disabled={!chatInput.trim()}
                  className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center hover:bg-blue-700 transition-all disabled:opacity-30 shadow-lg shadow-blue-500/20 active:scale-95"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
