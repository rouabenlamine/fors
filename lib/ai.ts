import { retrieveRagContext } from "@/lib/rag";
import pool from "@/lib/db";

export interface AnalysisResult {
  rootCause: string;
  confidence: number;
  urgency: "critical" | "high" | "medium" | "low";
  impactedTables: { name: string; confidence: number }[];
  sqlProposal: string;
  recommendation: string;
  gostSummary: string;
}

// ─── Shared Ollama fetch helper ───────────────────────────────────────────────

async function ollamaFetch(path: string, body: object, timeoutMs = 120000): Promise<Response> {
  const urls = [
    `http://127.0.0.1:11434${path}`,
    `http://localhost:11434${path}`,
  ];

  let lastErr: unknown;
  for (const url of urls) {
    try {
      console.log(`[Ollama] Trying ${url}...`);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      if (res.ok) return res;
      console.warn(`[Ollama] ${url} returned ${res.status}`);
    } catch (e: any) {
      console.warn(`[Ollama] ${url} failed: ${e.message}`);
      lastErr = e;
    }
  }
  throw lastErr || new Error("[Ollama] All connection attempts failed");
}

// ─── Safe JSON extractor ─────────────────────────────────────────────────────

function extractJson<T>(raw: string): T {
  // Strip markdown fences if present
  const cleaned = raw.replace(/```json|```/g, '').trim();
  // Extract first {...} block
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object found in response");
  return JSON.parse(match[0]) as T;
}

// ─── Dataset Schema Loader ───────────────────────────────────────────────────

/**
 * Fetches the target dataset schema from the `database_tables` metadata table.
 * This ensures the AI reasons about the actual data model being analyzed
 * and NOT the IT Support platform's internal system tables.
 */
async function getTargetDatasetSchema(): Promise<string> {
  try {
    const [rows] = await pool.execute(`
      SELECT t.id, t.name, t.description,
             GROUP_CONCAT(DISTINCT CONCAT(f.name, ' (', IFNULL(f.type,''), ')') ORDER BY f.position SEPARATOR ', ') as fields,
             GROUP_CONCAT(DISTINCT idx.name SEPARATOR ', ') as indexes
      FROM database_tables t
      LEFT JOIN database_fields f ON f.tableId = t.id
      LEFT JOIN database_indexes idx ON idx.tableId = t.id
      GROUP BY t.id, t.name, t.description
      ORDER BY t.name
    `) as any;

    if (!rows || (rows as any[]).length === 0) {
      return 'No dataset schema metadata available.';
    }

    return (rows as any[]).map((row: any) => {
      const fields = row.fields ? `Fields: ${row.fields}` : 'Fields: none listed';
      const indexes = row.indexes ? `Indexes: ${row.indexes}` : '';
      return `• ${row.name}: ${row.description || 'No description'} | ${fields}${indexes ? ' | ' + indexes : ''}`;
    }).join('\n');
  } catch (err) {
    console.warn('[Schema] Failed to load dataset schema:', err);
    return 'Schema metadata unavailable.';
  }
}

// ─── Incident Analysis ───────────────────────────────────────────────────────

export async function generateAnalysisWithOllama(
  incidentTitle: string,
  description: string,
): Promise<AnalysisResult> {
  try {
    const [context, datasetSchema] = await Promise.all([
      retrieveRagContext(`${incidentTitle} ${description}`),
      getTargetDatasetSchema(),
    ]);

    const prompt = `You are GOST (General Operating Simulation Terminal) AI for FORS (Flexible Operating & Reporting System).
You are analyzing incidents related to the TARGET DATASET described below.

IMPORTANT: The tables listed in TARGET DATASET SCHEMA are the actual data tables you must reference.
Do NOT reference the application's internal system tables (e.g. tickets, ai_analysis, audit_logs, sessions, users, Conversations, Messages).
Only reference tables from the TARGET DATASET SCHEMA in your impactedTables and sqlProposal.
EXTREMELY IMPORTANT: DO NOT output any internal "Thinking Process", reasoning, or thought steps. Provide ONLY the requested JSON output directly.

TARGET DATASET SCHEMA:
${datasetSchema}

RETRIEVED CONTEXT (past resolutions & knowledge):
${context.text}

NEW INCIDENT:
Title: ${incidentTitle}
Description: ${description}

Required JSON format:
{
  "rootCause": "Brief technical explanation backed by context",
  "confidence": 0-100,
  "urgency": "critical" | "high" | "medium" | "low",
  "impactedTables": [{"name": "table_name_from_TARGET_DATASET_SCHEMA", "confidence": 0-100}],
  "sqlProposal": "SQL query referencing only TARGET DATASET tables to investigate or fix",
  "recommendation": "Step-by-step resolution advice",
  "gostSummary": "Concise summary mentioning if past cases were matched"
}

Respond ONLY with the JSON object.`;

    const response = await ollamaFetch("/api/generate", {
      model: "qwen3.5:4b",
      prompt,
      stream: false,
      format: "json",
      options: {
        num_ctx: 4096, // Cap context window to reduce RAM usage and speed up response
        temperature: 0.1 // Lower temperature for more direct, concise structural output
      }
    });

    const data = await response.json();
    console.log("[Ollama] Raw snippet:", data.response?.substring(0, 100));

    return extractJson<AnalysisResult>(data.response);
  } catch (error: any) {
    console.error("[generateAnalysis] Error:", error.message);
    return {
      rootCause: `Local AI analysis failed: ${error.message}.`,
      confidence: 0,
      urgency: "medium",
      impactedTables: [],
      sqlProposal: "-- AI Communication Error",
      recommendation: JSON.stringify([
        "1. Ensure Ollama is running: `ollama serve`",
        "2. Verify model is pulled: `ollama pull mistral`",
        "3. Check database connectivity for RAG context.",
      ]),
      gostSummary: "Deep analysis node returned an error or was unreachable.",
    };
  }
}

// ─── GOST Chat Response ──────────────────────────────────────────────────────

export async function getGostChatResponse(
  userMessage: string,
  history: { role: string; content: string }[] = [],
): Promise<string> {
  const [context, datasetSchema] = await Promise.all([
    retrieveRagContext(userMessage),
    getTargetDatasetSchema(),
  ]);

const systemPrompt = `You are GOST, the FORS automated support assistant.
Use the context below to answer accurately. If you don't know, say you'll escalate to an engineer.
When referring to tables, use the TARGET DATASET SCHEMA below — these are the actual data tables the user is working with.
Do NOT reference internal platform tables (tickets, ai_analysis, audit_logs, sessions, users, Conversations, Messages).

EXTREMELY IMPORTANT: DO NOT output any internal "Thinking Process", internal thought tracking, or <think> tags. Provide your final response directly to the user immediately. Keep your answer fast and concise.

TARGET DATASET SCHEMA:
${datasetSchema}

KNOWLEDGE CONTEXT:
${context.text}`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: userMessage },
  ];

  try {
    const response = await ollamaFetch("/api/chat", {
      model: "qwen3.5:4b",
      messages,
      stream: false,
      options: {
        num_ctx: 4096, // Saves RAM and avoids extreme generation lengths for history
        temperature: 0.3
      }
    });

    const data = await response.json();
    let reply = data.message?.content || "No response generated.";

    // Guard: Remove <think> XML tags if the model injects them anyway
    reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

    // Guard: Remove numbered "Thinking Process:" steps if generated
    if (reply.includes("Thinking Process:")) {
      const parts = reply.split(/(?:Final Answer:|Refine the Response:|---\n)/i);
      if (parts.length > 1) {
        reply = parts[parts.length - 1].replace(/^[\s*"-]+/, "").trim();
      } else {
        // Just strip the common 'Thinking Process:' prefix text
        reply = reply.replace(/Thinking Process:[\s\S]*?(?=\n\n|\n[A-Z_])/i, "").trim();
      }
    }

    return reply;
  } catch (err: any) {
    console.error("[getGostChatResponse] Error:", err.message);
    return "GOST offline. Please check your local AI server (run `ollama serve`).";
  }
}