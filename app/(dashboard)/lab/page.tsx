"use client";

import { useState, useRef, useEffect } from "react";
import {
  FlaskConical, Send, CheckCircle, XCircle, Bot, RefreshCw, Sparkles,
  ChevronDown, ChevronUp, Copy, Check, Hash, FileText, AlertCircle,
  Search, Info, Users, Calendar, Upload, FileCode, X, ArrowRight, User,
  Zap, MessageSquare, Tag
} from "lucide-react";
import {
  analyzeTicketAction, chatWithGostAction, createTicket,
  createTicketFromXmlAction, getChatMessagesForTicketAction,
  validateAnalysisAction, rejectAnalysisAction
} from "@/app/actions";
import { useRouter, useSearchParams } from "next/navigation";
import { parseServiceNowXml, type XmlDbFields } from "@/lib/xml-parser";
import type { TicketPriority } from "@/lib/types";

// ─── Reusable Components ───────────────────────────────────────────────────

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-2 text-[12px] font-semibold tracking-[0.08em] text-slate-500 uppercase">
    {children}
  </p>
);

const FormInput = ({
  label, icon: Icon, value, onChange, placeholder, readOnly, className = ""
}: {
  label: string; icon?: any; value: string; onChange: (e: any) => void;
  placeholder?: string; readOnly?: boolean; className?: string
}) => {
  return (
    <div className={className}>
      <SectionLabel>{label}</SectionLabel>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
        )}
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`
            w-full h-[46px] rounded-full border border-slate-200 bg-slate-50/50 text-slate-700 
            placeholder:text-slate-400 text-[14px] transition-all
            focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white
            ${Icon ? 'pl-12 pr-5' : 'px-5'}
            ${readOnly ? 'opacity-60 cursor-not-allowed' : 'hover:border-slate-300'}
          `}
        />
      </div>
    </div>
  );
};

const FormSelect = ({
  label, value, onChange, options, disabled, colorClass = "", icon: Icon, className = ""
}: {
  label: string; value: string; onChange: (e: any) => void;
  options: { value: string; label: string }[]; disabled?: boolean;
  colorClass?: string; icon?: any; className?: string
}) => {
  return (
    <div className={className}>
      <SectionLabel>{label}</SectionLabel>
      <div className="relative group">
        {Icon && (
          <Icon className="absolute left-5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 z-10" />
        )}
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`
            appearance-none w-full h-[46px] rounded-full border border-slate-200 text-slate-700 
            text-[14px] transition-all cursor-pointer relative z-0
            focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400
            ${Icon ? 'pl-12 pr-10' : 'px-5 pr-10'}
            ${colorClass || 'bg-slate-50/50 hover:border-slate-300 focus:bg-white'}
            ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
          `}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-white text-slate-700">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
      </div>
    </div>
  );
};

const FormTextarea = ({
  label, value, onChange, placeholder, readOnly, className = "", innerClassName = ""
}: {
  label: string; value: string; onChange: (e: any) => void;
  placeholder?: string; readOnly?: boolean; className?: string; innerClassName?: string
}) => {
  return (
    <div className={className}>
      <SectionLabel>{label}</SectionLabel>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`
          w-full min-h-[90px] px-5 py-4 rounded-[20px] border border-slate-200 bg-slate-50/50 
          text-slate-700 placeholder:text-slate-400 text-[14px] transition-all resize-none
          focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white
          ${readOnly ? 'opacity-60 cursor-not-allowed' : 'hover:border-slate-300'}
          ${innerClassName}
        `}
      />
    </div>
  );
};

const ActionButton = ({
  onClick, disabled, variant = "primary", icon: Icon, children, loading, className = ""
}: {
  onClick?: () => void; disabled?: boolean; variant?: "primary" | "secondary" | "danger" | "ghost";
  icon?: any; children: React.ReactNode; loading?: boolean; className?: string
}) => {
  const styles = {
    primary: "bg-slate-800 bg-gradient-to-b from-slate-700 to-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_4px_14px_rgba(15,23,42,0.4)] border border-slate-800 text-white hover:brightness-110",
    secondary: "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50",
    danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm",
    ghost: "bg-slate-100 text-slate-600 hover:bg-slate-200",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full font-semibold 
        text-[12px] uppercase tracking-wide transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
        ${styles[variant]}
        ${className}
      `}
    >
      {loading ? (
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
      ) : Icon && (
        <Icon className="w-3.5 h-3.5" />
      )}
      {children}
    </button>
  );
};

// ─── Helpers ─────────────────────────────────────────────────────────────

const getUrgencyColor = (val: string) => {
  if (!val) return "";
  const v = val.toLowerCase();
  if (v.includes("low")) return "bg-emerald-500 text-white font-semibold border-transparent";
  if (v.includes("medium")) return "bg-amber-500 text-white font-semibold border-transparent";
  if (v.includes("high")) return "bg-red-500 text-white font-semibold border-transparent";
  if (v.includes("critical")) return "bg-rose-600 text-white font-semibold border-transparent";
  return "bg-slate-50/50";
};

const getStateColor = (val: string) => {
  if (!val) return "";
  if (val === "New") return "bg-sky-500 text-white font-semibold border-transparent";
  if (val === "In Progress") return "bg-indigo-500 text-white font-semibold border-transparent";
  if (val === "On Hold") return "bg-violet-500 text-white font-semibold border-transparent";
  if (val === "Resolved" || val === "Closed") return "bg-slate-500 text-white font-semibold border-transparent";
  return "bg-slate-50/50";
};

const getPriorityColor = (val: string) => {
  if (!val) return "";
  const v = val.toLowerCase();
  if (v.includes("low") || v.includes("planning")) return "bg-slate-500 text-white font-semibold border-transparent";
  if (v.includes("moderate") || v.includes("medium")) return "bg-amber-500 text-white font-semibold border-transparent";
  if (v.includes("high")) return "bg-slate-800 text-white font-semibold border-transparent";
  if (v.includes("critical")) return "bg-rose-600 text-white font-semibold border-transparent";
  return "bg-slate-50/50";
};

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

export default function LabPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ticketId, setTicketId] = useState(searchParams.get("id") || "");
  const [shouldAutoAnalyze, setShouldAutoAnalyze] = useState(searchParams.get("auto") === "true");
  const [openedBy, setOpenedBy] = useState("");
  const [openedAt, setOpenedAt] = useState("");
  const [closedAt, setClosedAt] = useState("");
  const [urgency, setUrgency] = useState("");
  const [state, setState] = useState("");
  const [stakeholders, setStakeholders] = useState("");
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDesc, setTicketDesc] = useState("");
  const [comments, setComments] = useState("");
  const [priority, setPriority] = useState<TicketPriority | "">("");
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
  const [xmlDbFields, setXmlDbFields] = useState<XmlDbFields | null>(null);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [isImported, setIsImported] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatTyping]);

  useEffect(() => {
    if (shouldAutoAnalyze && ticketTitle && ticketId) {
      setShouldAutoAnalyze(false);
      handleAnalyse();
    }
  }, [shouldAutoAnalyze, ticketTitle, ticketId]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (ticketId && ticketId.startsWith("INC")) {
        try {
          const { getTicketById } = await import("@/app/actions");
          const existing = await getTicketById(ticketId);
          if (existing) {
            setTicketTitle(existing.title);
            setTicketDesc(existing.description);
            setPriority(existing.priority as TicketPriority);
            setUrgency(existing.priority.includes("Critical") || existing.priority.includes("High") ? "1 - High" : "3 - Low");
            setOpenedBy(existing.openedBy || "");
            setOpenedAt(existing.openedAt || "");
            setClosedAt(existing.closedAt || "");
            setState(existing.state || "");
            setComments(existing.comments || "");
            setResult(null);
            setDecision("idle");
          }
        } catch (e) {
          console.error("Failed to sync ticket:", e);
        }
      }
    }, 1000);
    return () => clearTimeout(delayDebounceFn);
  }, [ticketId]);

  function handleXmlFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const xmlText = ev.target?.result as string;
        const parsed = parseServiceNowXml(xmlText);
        setTicketId(parsed.ui.number);
        setOpenedBy(parsed.ui.opened_by);
        setOpenedAt(parsed.ui.opened_at);
        setClosedAt(parsed.ui.closed_at);
        setUrgency(parsed.ui.urgency);
        setState(parsed.ui.state);
        setStakeholders(parsed.ui.stakeholders);
        setTicketTitle(parsed.ui.short_description);
        setTicketDesc(parsed.ui.description);
        setComments(parsed.ui.comments);
        setPriority(parsed.ui.analysis_priority as TicketPriority);
        setXmlDbFields(parsed.db);
        setImportWarnings(parsed.warnings);
        setIsImported(true);
        setResult(null);
        setDecision("idle");
        setError("");
      } catch (err: any) {
        setError(err.message || "Failed to parse XML file.");
        setImportWarnings([]);
        setXmlDbFields(null);
        setIsImported(false);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleAnalyse() {
    if (!ticketId.trim() || !ticketTitle.trim()) {
      setError("Please fill in Number and Short Description.");
      return;
    }
    setError("");
    setIsAnalysing(true);
    try {
      if (isImported && xmlDbFields) {
        const mergedDb = {
          ...xmlDbFields,
          number: ticketId,
          short_description: ticketTitle,
          description: ticketDesc || xmlDbFields.description,
          comments: comments || xmlDbFields.comments,
          opened_by: openedBy,
          opened_at: openedAt,
          closed_at: closedAt,
          state: state,
          priority: priority,
        };
        await createTicketFromXmlAction(mergedDb);
      } else {
        await createTicket({
          id: ticketId,
          title: ticketTitle,
          description: (ticketDesc || "") + (comments ? "\n\nComments: " + comments : ""),
          priority: priority as any
        });
      }
      const analysis = await analyzeTicketAction(ticketId, ticketTitle, ticketDesc || "");
      setResult({ ...analysis, incidentId: ticketId });
      setIsAnalysing(false);
      const history = await getChatMessagesForTicketAction(ticketId);
      setChatMessages(history.map((h: any) => ({
        role: h.role === "AI" ? "AI" : "User",
        content: h.content,
        time: new Date(h.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      })));
    } catch (err) {
      setError("Database error or AI service offline.");
      setIsAnalysing(false);
    }
  }

  async function handleValidate() {
    if (!result) return;
    try {
      const res = await validateAnalysisAction(ticketId, result);
      if (!res.success) throw new Error(res.error);
      setDecision("validated");
      setShowRejectInput(false);
    } catch (err: any) {
      setError(err.message || "Failed to validate analysis via server.");
    }
  }

  async function handleReject() {
    if (!showRejectInput) {
      setShowRejectInput(true);
      return;
    }
    try {
      const res = await rejectAnalysisAction(ticketId, rejectReason);
      if (!res.success) throw new Error(res.error);
      setDecision("rejected");
      setShowRejectInput(false);
    } catch (err: any) {
      setError(err.message || "Failed to reject analysis via server.");
    }
  }

  function handleReset() {
    setTicketId("");
    setOpenedBy("");
    setOpenedAt("");
    setClosedAt("");
    setUrgency("");
    setState("");
    setStakeholders("");
    setTicketTitle("");
    setTicketDesc("");
    setComments("");
    setPriority("");
    setResult(null);
    setDecision("idle");
    setShowRejectInput(false);
    setRejectReason("");
    setChatOpen(false);
    setChatMessages([]);
    setXmlDbFields(null);
    setImportWarnings([]);
    setIsImported(false);
    setError("");
  }

  async function sendChat() {
    if (!chatInput.trim()) return;
    const msg: ChatMessage = { role: "User", content: chatInput, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setChatMessages((p) => [...p, msg]);
    setChatInput("");
    setChatTyping(true);
    try {
      const gHistory = chatMessages.map(m => ({ role: m.role === 'AI' ? 'assistant' : 'user', content: m.content }));
      const reply = await chatWithGostAction(ticketId, chatInput, gHistory);
      setChatTyping(false);
      setChatMessages((p) => [...p, { role: "AI", content: reply, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    } catch (err) {
      setChatTyping(false);
      setChatMessages((p) => [...p, { role: "AI", content: "Service error. Please check if Ollama is running.", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
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
    <div className="min-h-screen bg-[#f7f9fa] bg-gradient-to-br from-white via-sky-50/40 to-[#eef2f6] flex flex-col font-sans selection:bg-blue-100 selection:text-blue-700 relative">
      <div className="max-w-4xl w-full mx-auto px-6 py-8 relative z-10">

        {/* Out-of-card Title */}
        <div className="mb-6 flex items-center gap-3 ml-2">
          <FlaskConical className="w-6 h-6 text-slate-500" />
          <div>
            <h1 className="text-[22px] leading-tight font-bold text-slate-800">
              Analysis Lab
            </h1>
            <p className="text-[13px] font-medium text-slate-500 mt-0.5">
              Explore how AI would diagnose and resolve incidents
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-[28px] border border-slate-100 shadow-[0_15px_40px_rgba(30,41,59,0.08)] overflow-hidden">

          {/* Inner Card Header */}
          <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-[13px] tracking-wide">
              <Sparkles className="w-4 h-4" />
              NEW TICKET ANALYSIS REQUEST
            </div>
            <div className="flex items-center gap-3">
              <ActionButton
                onClick={() => fileInputRef.current?.click()}
                icon={Upload}
                variant="primary"
                className="shadow-md shadow-blue-500/20"
              >
                IMPORT XML
              </ActionButton>
              <ActionButton
                onClick={handleReset}
                variant="ghost"
              >
                EMPTY
              </ActionButton>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xml,text/xml,application/xml"
            className="hidden"
            onChange={handleXmlFileSelect}
          />

          {/* Warnings Panel */}
          {importWarnings.length > 0 && (
            <div className="mx-8 mt-6 bg-amber-50/50 border border-amber-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <SectionLabel>Import Warnings</SectionLabel>
              </div>
              <ul className="grid grid-cols-2 gap-x-6 gap-y-1">
                {importWarnings.map((w, i) => (
                  <li key={i} className="text-[12px] text-amber-700 font-medium flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Form Body Top Section */}
          <div className="px-8 pt-7 pb-6">
            <div className="grid grid-cols-12 gap-x-6 gap-y-5">
              {/* Row 1 */}
              <div className="col-span-4">
                <label className="mb-2 block text-[12px] font-semibold tracking-[0.08em] text-slate-500">
                  INCIDENT NUMBER
                </label>

                <div className="relative">
                  {/* Prefix */}
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                    INC
                  </span>

                  {/* Input */}
                  <input
                    type="text"
                    value={ticketId.replace(/^INC/, "")}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, ""); // only numbers
                      setTicketId(`INC${value}`);
                    }}
                    placeholder="0000000"
                    readOnly={isImported}
                    className="w-full h-14 pl-14 pr-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 focus:bg-white"
                  />
                </div>
              </div>
              <FormInput
                className="col-span-4"
                label="OPENED AT"
                icon={Calendar}
                value={openedAt}
                onChange={(e) => setOpenedAt(e.target.value)}
                placeholder=""
                readOnly={isImported}
              />
              <FormInput
                className="col-span-4"
                label="CLOSED AT"
                icon={Calendar}
                value={closedAt}
                onChange={(e) => setClosedAt(e.target.value)}
                placeholder=""
                readOnly={isImported}
              />

              {/* Row 2 */}
              <FormInput
                className="col-span-4"
                label="CALLER"
                icon={Search}
                value={openedBy}
                onChange={(e) => setOpenedBy(e.target.value)}
                placeholder=""
                readOnly={isImported}
              />
              <FormSelect
                className="col-span-4"
                label="URGENCY"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                disabled={isImported}
                colorClass={getUrgencyColor(urgency)}
                options={[
                  { value: "", label: "Select Urgency" },
                  { value: "1 - High", label: "High" },
                  { value: "2 - Medium", label: "Medium" },
                  { value: "3 - Low", label: "Low" },
                ]}
              />
              <FormSelect
                className="col-span-4"
                label="STATE"
                value={state}
                onChange={(e) => setState(e.target.value)}
                disabled={isImported}
                colorClass={getStateColor(state)}
                options={[
                  { value: "", label: "Select State" },
                  { value: "New", label: "New" },
                  { value: "In Progress", label: "In Progress" },
                  { value: "On Hold", label: "On Hold" },
                  { value: "Resolved", label: "Resolved" },
                  { value: "Closed", label: "Closed" },
                  { value: "Canceled", label: "Canceled" },
                ]}
              />

              {/* Row 3 */}
              <FormInput
                className="col-span-6"
                label="WATCH LIST"
                icon={User}
                value={stakeholders}
                onChange={(e) => setStakeholders(e.target.value)}
                placeholder="Additional stakeholders..."
                readOnly={isImported}
              />
              <FormSelect
                className="col-span-6"
                label="ANALYSIS PRIORITY"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                disabled={isImported}
                colorClass={getPriorityColor(priority)}
                options={[
                  { value: "", label: "Select Priority" },
                  { value: "1 - Critical", label: "Critical" },
                  { value: "2 - High", label: "High" },
                  { value: "3 - Moderate", label: "Moderate" },
                  { value: "4 - Low", label: "Low" },
                  { value: "5 - Planning", label: "Planning" },
                ]}
              />

              {/* Advanced Descriptions matching the image structure */}
              <div className="col-span-12 mt-3">
                <div className="flex items-center gap-2 text-slate-800 mb-2 pointer-events-none">
                  <Tag className="w-[14px] h-[14px]" />
                  <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-slate-800">SHORT DESCRIPTION (TITLE)</span>
                </div>
                <div className="relative">
                  <FileText className="absolute left-5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
                  <input
                    type="text"
                    value={ticketTitle}
                    onChange={(e) => { setTicketTitle(e.target.value); setResult(null); setDecision("idle"); }}
                    placeholder="Unable to access the shared folder."
                    readOnly={isImported}
                    className="w-full h-[46px] rounded-full border border-slate-200 bg-slate-50/50 text-slate-700 text-[14px] pl-12 pr-5 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                  />
                </div>
              </div>

              <div className="col-span-12 grid grid-cols-12 gap-x-6 gap-y-2 mt-3">
                <div className="col-span-6 flex items-center gap-2 text-slate-800 mb-1">
                  <MessageSquare className="w-[14px] h-[14px]" />
                  <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-slate-800">INTERNAL DESCRIPTION</span>
                </div>
                <div className="col-span-6 mb-1 flex items-center">
                  <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500">COMMENTS</span>
                </div>

                <div className="col-span-6">
                  <textarea
                    value={ticketDesc}
                    onChange={(e) => { setTicketDesc(e.target.value); setResult(null); setDecision("idle"); }}
                    placeholder="Please provide access. Changed the priority of the Incident."
                    readOnly={isImported}
                    className="w-full min-h-[90px] px-5 py-4 rounded-[20px] border border-slate-200 bg-slate-50/50 text-slate-700 text-[14px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                  />
                </div>
                <div className="col-span-6">
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Notes visible to the end user..."
                    readOnly={isImported}
                    className="w-full min-h-[90px] px-5 py-4 rounded-[20px] border border-emerald-100 bg-[#effdf4] text-slate-700 text-[14px] resize-none focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 placeholder:italic placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-6 p-4 bg-rose-50 border border-rose-100 rounded-[20px] flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <p className="text-sm font-semibold text-rose-700">{error}</p>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="mt-8 flex justify-end gap-3">
              <ActionButton
                onClick={handleReset}
                variant="secondary"
                className="px-8 h-[46px] border border-slate-200 bg-white"
              >
                RESET
              </ActionButton>
              <ActionButton
                onClick={handleAnalyse}
                disabled={isAnalysing || decision === "validated"}
                loading={isAnalysing}
                variant="primary"
                icon={Zap}
                className="px-8 h-[46px]"
              >
                {decision === "validated" ? "VALIDATED" : "TRIGGER AI ANALYSIS"}
              </ActionButton>
            </div>
          </div>
        </div>

        {/* ─── Result Section ─── */}
        {result && (
          <div className="mt-12 space-y-8 animate-in slide-in-from-bottom-6 duration-700">
            {/* Analysis Dashboard Card */}
            <div className="bg-white/95 backdrop-blur-sm rounded-[28px] border border-slate-200/70 shadow-[0_30px_70px_rgba(15,23,42,0.1)] overflow-hidden">
              <div className="px-8 pt-10 pb-8">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                      <Bot className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-[28px] font-semibold text-slate-800 tracking-tight">Diagnostic Report</h2>
                      <div className="flex items-center gap-2.5 mt-1">
                        <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 px-3 py-1 rounded-lg">ID: {result.incidentId}</span>
                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" />
                        <p className="text-[12px] font-medium text-blue-600 uppercase tracking-wider">Neural Link Synchronized</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1 opacity-60">AI Confidence</p>
                      <p className="text-3xl font-semibold text-blue-600 tracking-tight">{result.confidence}%</p>
                    </div>
                    <div className={`
                      h-14 px-6 rounded-2xl flex items-center justify-center text-[13px] font-semibold uppercase tracking-wider border shadow-sm transition-all
                      ${result.urgency === 'critical' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                        result.urgency === 'high' ? 'bg-orange-50 border-orange-100 text-orange-600' :
                          result.urgency === 'medium' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                            'bg-emerald-50 border-emerald-100 text-emerald-600'}
                    `}>
                      {result.urgency}
                    </div>
                  </div>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-3 mb-10 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-1000 relative"
                    style={{ width: `${result.confidence}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
                    <SectionLabel>Diagnostic Root Cause</SectionLabel>
                    <p className="text-[15px] text-slate-700 leading-relaxed font-medium mt-1">
                      {result.rootCause}
                    </p>
                  </div>
                  <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
                    <SectionLabel>Structural Impact</SectionLabel>
                    <div className="space-y-4 mt-2">
                      {result.impactedTables.map((t) => (
                        <div key={t.name} className="flex items-center justify-between group/table">
                          <span className="text-[13px] font-semibold font-mono text-slate-600 group-hover/table:text-blue-600 transition-colors uppercase tracking-tight">
                            {t.name}
                          </span>
                          <div className="flex items-center gap-3">
                            <div className="w-24 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${t.confidence}%` }} />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-400 w-8">{t.confidence}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50/20 rounded-2xl p-6 border border-blue-100 mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-4 h-4 text-blue-500" />
                    <SectionLabel>Step-by-Step Resolution</SectionLabel>
                  </div>
                  <p className="text-[15px] text-slate-800 leading-relaxed italic font-medium">
                    {result.recommendation}
                  </p>
                </div>

                <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-sm transition-all duration-300">
                  <div
                    className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-750 transition-colors border-b border-white/5"
                    onClick={() => setSqlExpanded(!sqlExpanded)}
                  >
                    <div className="flex items-center gap-3 text-white">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                      <span className="text-xs font-semibold uppercase tracking-[0.15em]">Automated SQL Recovery</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); copySQL(); }}
                        className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 hover:text-white transition-colors uppercase tracking-widest bg-white/[0.04] px-3 py-1.5 rounded-xl border border-white/10"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? "COPIED" : "COPY"}
                      </button>
                      {sqlExpanded ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                    </div>
                  </div>
                  {sqlExpanded && (
                    <div className="p-6 bg-slate-900 font-mono text-[13px] text-blue-300 leading-relaxed overflow-x-auto selection:bg-blue-500/30">
                      <pre>{result.sqlProposal}</pre>
                    </div>
                  )}
                </div>

                {/* Execution Actions */}
                <div className="mt-10 flex items-center gap-4 pt-8 border-t border-slate-100">
                  <ActionButton
                    onClick={() => setChatOpen((o) => !o)}
                    disabled={isAnalysing}
                    variant="secondary"
                    icon={MessageSquare}
                    className="px-6 h-[46px] border border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    Chat with AI
                  </ActionButton>
                  {decision === "idle" && (
                    <>
                      <ActionButton
                        onClick={handleValidate}
                        variant="primary"
                        icon={CheckCircle}
                        className="px-8 h-14 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/10 rounded-2xl text-[15px] font-semibold"
                      >
                         VALIDATE &amp; COMMIT FIX
                      </ActionButton>
                      <ActionButton
                        onClick={handleReject}
                        variant="ghost"
                        icon={XCircle}
                        className="px-8 h-14 bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 rounded-2xl text-[15px] font-semibold"
                      >
                        {showRejectInput ? "CONFIRM REJECT" : "REJECT PROPOSAL"}
                      </ActionButton>
                      <ActionButton
                        onClick={() => setChatOpen(!chatOpen)}
                        variant="secondary"
                        icon={Bot}
                        className="ml-auto h-14 px-8 bg-slate-800 text-white hover:bg-slate-900 border-none rounded-2xl text-[15px] font-semibold shadow-lg shadow-slate-200"
                      >
                        SYNC WITH AI
                      </ActionButton>
                    </>
                  )}
                </div>

                {showRejectInput && decision === "idle" && (
                  <div className="mt-6 p-6 bg-rose-50 border border-rose-100 rounded-2xl animate-in slide-in-from-top-4 duration-400">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                      <SectionLabel>Improvement Feedback</SectionLabel>
                    </div>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Describe why this solution is inaccurate. Your feedback retrains our neural networks."
                      className="w-full bg-white rounded-xl p-4 text-[14px] text-slate-700 placeholder:text-slate-300 border border-rose-100 focus:outline-none focus:ring-4 focus:ring-rose-100 focus:border-rose-300 transition-all italic resize-none"
                      rows={2}
                    />
                  </div>
                )}

                {decision === 'validated' && (
                  <div className="mt-10 p-7 bg-emerald-50 border border-emerald-100 rounded-[28px] flex items-center gap-5">
                    <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-emerald-900 tracking-tight">Diagnostic Validated</h3>
                      <p className="text-[14px] text-emerald-700 font-medium opacity-80">The resolution logic has been stored in the global solution vault for {result.incidentId}.</p>
                    </div>
                  </div>
                )}

                {decision === 'rejected' && (
                  <div className="mt-10 p-7 bg-rose-50 border border-rose-100 rounded-[28px] flex items-center gap-5">
                    <div className="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                      <XCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-rose-900 tracking-tight">Diagnostic Rejected</h3>
                      <p className="text-[14px] text-rose-700 font-medium opacity-80">{rejectReason || "Feedback has been flagged for neural retraining."}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── AI Chat Panel ─── */}
        {chatOpen && (
          <div className="mt-8 bg-white rounded-[28px] shadow-[0_30px_70px_rgba(15,23,42,0.15)] overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-6 duration-400">
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                </div>
                <div>
                  <h3 className="text-[13px] font-semibold text-slate-800 uppercase tracking-wider">Mistral Node</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Active Analysis Protocol</p>
                </div>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="h-[420px] overflow-y-auto p-8 space-y-6 bg-slate-50/30">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "User" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`
                    max-w-[80%] px-5 py-3.5 rounded-2xl text-[14px] leading-relaxed shadow-sm border
                    ${msg.role === "User" ?
                      "bg-blue-600 text-white border-blue-500 rounded-tr-none" :
                      "bg-white text-slate-700 border-slate-200 rounded-tl-none"}
                  `}>
                    {msg.content}
                    <p className={`text-[9px] mt-2 font-semibold uppercase tracking-widest ${msg.role === "User" ? "text-blue-200" : "text-slate-400"}`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
              {chatTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 px-5 py-4 rounded-2xl rounded-tl-none shadow-sm">
                    <div className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            <div className="p-6 border-t border-slate-100 bg-white">
              <div className="relative">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChat()}
                  placeholder="Inquire about resolution logic or specific data tables..."
                  className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-5 pr-14 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all"
                />
                <button
                  onClick={sendChat}
                  disabled={!chatInput.trim() || chatTyping}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white hover:bg-blue-700 transition-all disabled:opacity-30"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
