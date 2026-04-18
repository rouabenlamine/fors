"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTicketById, getAnalyses, analyzeTicketAction } from "@/app/actions";
import type { Ticket, TicketAnalysis as TicketAnalysisType } from "@/lib/types";
import { TicketAnalysis } from "@/components/tickets/TicketAnalysis";
import { SQLProposal } from "@/components/tickets/SQLProposal";
import { ApproveRejectBar } from "@/components/tickets/ApproveRejectBar";
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_COLORS } from "@/lib/constants";
import { ArrowLeft, Calendar, Zap, RefreshCw, MessageSquare, CheckCircle, Bot } from "lucide-react";
import Link from "next/link";

/** Parse a validated close_notes string into structured analysis sections */
function parseCloseNotes(notes: string) {
  const result: { rootCause?: string; resolutionSteps?: string; suggestedSql?: string; validatedBy?: string; confidence?: string } = {};
  if (!notes || !notes.startsWith("=== AI Analysis Report ===")) return null;
  const validatedByMatch = notes.match(/^Validated by: (.+)$/m);
  const confidenceMatch  = notes.match(/^Confidence: (.+)$/m);
  const rootCauseMatch   = notes.match(/--- Root Cause ---\n([\s\S]+?)(?=\n---|\n===|$)/);
  const resolutionMatch  = notes.match(/--- Resolution Steps ---\n([\s\S]+?)(?=\n---|\n===|$)/);
  const sqlMatch         = notes.match(/--- Suggested SQL ---\n([\s\S]+?)(?=\n---|\n===|$)/);
  if (validatedByMatch)  result.validatedBy    = validatedByMatch[1].trim();
  if (confidenceMatch)   result.confidence     = confidenceMatch[1].trim();
  if (rootCauseMatch)    result.rootCause      = rootCauseMatch[1].trim();
  if (resolutionMatch)   result.resolutionSteps = resolutionMatch[1].trim();
  if (sqlMatch)          result.suggestedSql   = sqlMatch[1].trim();
  return result;
}

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? "";
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [analysis, setAnalysis] = useState<TicketAnalysisType | null>(null);
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const fetchedTicket = await getTicketById(id);
      setTicket(fetchedTicket);
      if (fetchedTicket) setStatus(fetchedTicket.status);

      const allAnalyses = await getAnalyses();
      setAnalysis(allAnalyses.find((a) => a.ticketId === id) ?? null);
      setLoading(false);
    }
    loadData();
  }, [id]);

  if (loading) {
    return <div className="p-6 text-slate-400 text-center"><p>Loading ticket...</p></div>;
  }

  if (!ticket) {
    return (
      <div className="p-6 text-slate-400 text-center">
        <p>Ticket not found.</p>
      </div>
    );
  }

  // Parse validation analysis snapshot from close_notes (set when ticket was validated)
  const parsedValidation = ticket.closeNotes ? parseCloseNotes(ticket.closeNotes) : null;
  const isValidated = ticket.status === "validated" || ticket.state?.toLowerCase() === "validated";

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/tickets" className="w-8 h-8 flex items-center justify-center bg-white border border-gray-100 rounded-lg text-slate-400 hover:text-slate-800 hover:border-gray-200 transition-all shadow-sm">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-xl font-bold text-slate-800">{ticket.id}</h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${STATUS_COLORS[ticket.status as keyof typeof STATUS_COLORS]}`}>
                {STATUS_LABELS[ticket.status as keyof typeof STATUS_LABELS]}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${PRIORITY_COLORS[ticket.priority as keyof typeof PRIORITY_COLORS]}`}>
                {ticket.priority}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">{ticket.sysClassName} — {ticket.team}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {ticket.aiConfidence !== undefined && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl">
              <Zap className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-tight">AI Confidence</p>
                <p className="text-sm font-bold text-blue-700">{ticket.aiConfidence}%</p>
              </div>
            </div>
          )}
          {/* Chat with AI button */}
          <Link
            href={`/lab?id=${ticket.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Chat with AI
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden border-t-4 border-t-blue-500">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-blue-50/10">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.4)]" />
                Ticket Information
              </h3>
              <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(ticket.createdAt).toLocaleString()}</span>
              </div>
            </div>
            <div className="p-6">
              <h4 className="text-xl font-black text-slate-800 mb-4 tracking-tight">{ticket.title}</h4>
              <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-100 rounded-2xl p-6 mb-8 shadow-inner">
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-10">
                <div>
                  <h5 className="text-[11px] font-black text-blue-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="w-1 h-3 bg-blue-400/50 rounded-full" />
                    Request Details
                  </h5>
                  <div className="space-y-4">
                    <DetailItem label="Opened By" value={ticket.openedBy} />
                    <DetailItem label="Opened At" value={ticket.openedAt} />
                    <DetailItem label="Business Service" value={ticket.businessService} />
                    <DetailItem label="sys_class_name" value={ticket.sysClassName} />
                  </div>
                </div>
                <div>
                  <h5 className="text-[11px] font-black text-violet-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="w-1 h-3 bg-violet-400/50 rounded-full" />
                    Assignment
                  </h5>
                  <div className="space-y-4">
                    <DetailItem label="Assignment Group" value={ticket.team} />
                    <DetailItem label="Assigned To" value={ticket.assignedTo} />
                    <DetailItem label="Updated By" value="System" />
                    <DetailItem label="Target SLA" value="8h (Response)" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Validation / AI Analysis Report (from close_notes) ─── */}
          {isValidated && parsedValidation && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden border-t-4 border-t-emerald-500">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-emerald-50/10">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                  AI Analysis Report
                </h3>
                <div className="flex items-center gap-2">
                  {parsedValidation.confidence && (
                    <span className="text-[10px] font-bold bg-emerald-100 px-2 py-0.5 rounded text-emerald-700 uppercase tracking-tighter">
                      Confidence: {parsedValidation.confidence}
                    </span>
                  )}
                  <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded uppercase tracking-tighter flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Validated
                  </span>
                </div>
              </div>
              <div className="p-6 space-y-5">
                {parsedValidation.validatedBy && (
                  <p className="text-[11px] text-slate-400 font-medium italic">Validated by: {parsedValidation.validatedBy}</p>
                )}
                {parsedValidation.rootCause && (
                  <div>
                    <p className="text-[11px] font-black text-blue-600 uppercase mb-2 tracking-widest">Root Cause</p>
                    <div className="bg-blue-50/30 border border-blue-100/50 rounded-2xl p-4 text-sm text-slate-700 leading-relaxed">
                      {parsedValidation.rootCause}
                    </div>
                  </div>
                )}
                {parsedValidation.resolutionSteps && (
                  <div>
                    <p className="text-[11px] font-black text-violet-600 uppercase mb-2 tracking-widest">Resolution Steps</p>
                    <div className="bg-violet-50/30 border border-violet-100/50 rounded-2xl p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {parsedValidation.resolutionSteps}
                    </div>
                  </div>
                )}
                {parsedValidation.suggestedSql && (
                  <div>
                    <p className="text-[11px] font-black text-slate-500 uppercase mb-2 tracking-widest">Suggested SQL</p>
                    <div className="bg-slate-800 rounded-2xl p-4 font-mono text-xs text-blue-300 overflow-x-auto">
                      <pre>{parsedValidation.suggestedSql}</pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── Resolution Summary (close_notes for non-validated closed tickets) ─── */}
          {(ticket.status === 'closed' || (ticket.closeNotes && !isValidated)) && !parsedValidation && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden border-t-4 border-t-emerald-500">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-emerald-50/10">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                  Resolution Summary
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <p className="text-[11px] font-black text-emerald-600 uppercase mb-3 px-1 tracking-widest">Internal Close Notes</p>
                  <div className="bg-emerald-500/5 border border-emerald-100/50 rounded-2xl p-5 text-sm text-slate-700 leading-relaxed italic shadow-inner">
                    {ticket.closeNotes || "No detailed close notes provided."}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-10">
                  <DetailItem label="Closed By" value={ticket.closedBy} />
                  <DetailItem label="Closed At" value={ticket.closedAt} />
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden border-t-4 border-t-amber-500">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-amber-50/10">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
                Comments &amp; Interaction
              </h3>
              <span className="text-[10px] font-bold bg-amber-100 px-2 py-0.5 rounded text-amber-700 uppercase tracking-tighter">HISTORY</span>
            </div>
            <div className="p-6">
              <div className="bg-amber-50/20 border border-amber-100/30 rounded-2xl p-6 shadow-inner">
                <p className="text-sm text-slate-500 leading-relaxed italic">{ticket.comments || "No comments yet for this ticket."}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {analysis && ticket.aiConfidence !== undefined ? (
            <div className="space-y-6">
              <TicketAnalysis analysis={analysis} />
              {analysis.sqlProposal && <SQLProposal sql={analysis.sqlProposal} />}
              <ApproveRejectBar
                ticketId={ticket.id}
                status={status}
                onApprove={() => setStatus("approved")}
                onReject={() => setStatus("rejected")}
                onReanalyze={() => {
                  router.push(`/lab?id=${ticket.id}&auto=true`);
                }}
              />
            </div>
          ) : (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
              {isValidated ? (
                <>
                  <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    Ticket Validated
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-6">
                    This ticket has been validated and the analysis has been stored. View the AI Analysis Report on the left.
                  </p>
                  <Link
                    href={`/lab?id=${ticket.id}`}
                    className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-lg"
                  >
                    <Bot className="w-4 h-4" />
                    Open in Analysis Lab
                  </Link>
                </>
              ) : (
                <>
                  <h4 className="font-bold text-lg mb-2">No AI Analysis yet</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-6">
                    This ticket has not been processed by the GOST assistant. AI insights and automated SQL proposals are generated upon request.
                  </p>
                  <button 
                    onClick={async () => {
                      setLoadingAnalysis(true);
                      try {
                        const newAnalysis = await analyzeTicketAction(ticket.id, ticket.title, ticket.description);
                        setAnalysis({
                          ticketId: ticket.id,
                          rootCause: newAnalysis.rootCause,
                          impactedTables: newAnalysis.impactedTables || [],
                          recommendation: newAnalysis.recommendation,
                          sqlProposal: newAnalysis.sqlProposal,
                          gostSummary: newAnalysis.gostSummary,
                          urgency: newAnalysis.urgency
                        });
                        setTicket(prev => prev ? { ...prev, aiConfidence: newAnalysis.confidence } : null);
                      } catch (err) {
                        console.error("Analysis failed:", err);
                        alert("Analysis request failed.");
                      } finally {
                        setLoadingAnalysis(false);
                      }
                    }}
                    disabled={loadingAnalysis}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingAnalysis ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : "Trigger Analysis Request"}
                  </button>
                </>
              )}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">System Event Log</h4>
            <div className="space-y-4">
              {[
                { time: ticket.updatedAt || "", action: "Last modification recorded", status: "success" },
                { time: ticket.createdAt || "", action: "Initial ticket ingest", status: "default" },
              ].map((entry, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${entry.status === 'success' ? 'bg-green-500' : 'bg-slate-300'}`} />
                    {i === 0 && <div className="w-px flex-1 bg-slate-100 mt-1" />}
                  </div>
                  <div>
                    <p className="text-xs text-slate-800 font-medium">{entry.action}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{entry.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="group">
      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tight group-hover:text-slate-400 transition-colors">{label}</p>
      <p className="text-xs font-semibold text-slate-700 mt-0.5">{value || "—"}</p>
    </div>
  );
}
