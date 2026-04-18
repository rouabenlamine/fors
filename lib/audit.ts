import { query, execute } from "./db";
import { getSession } from "./auth";
import { revalidatePath } from "next/cache";

export type AuditAction = 
  | "SQL_EXECUTED" 
  | "AI_ANALYSIS_GENERATED" 
  | "TICKET_VALIDATED" 
  | "TICKET_REJECTED" 
  | "CHAT_MESSAGE_SENT" 
  | "CONVERSATION_DELETED"
  | "LOGIN"
  | "LOGOUT";

interface LogOptions {
  ticketId?: string;
  details?: any;
  userMatricule?: string;
}

/**
 * Centrally manages all audit logging for the FORS platform.
 * Logs are stored in the audit_logs table with JSON details.
 */
export async function logActivity(action: AuditAction, options: LogOptions = {}) {
  try {
    let { ticketId, details = {}, userMatricule } = options;

    // 1. Resolve user if not provided
    if (!userMatricule) {
      try {
        const session = await getSession();
        userMatricule = session.user?.matricule || "SYSTEM";
      } catch (e) {
        userMatricule = "SYSTEM";
      }
    }

    // 2. Standardize details JSON
    const logDetails = {
      ...details,
      ticketId: ticketId || details.ticketId,
      timestamp: new Date().toISOString(),
    };

    // 3. Persist to DB
    await execute(
      "INSERT INTO audit_logs (user_matricule, action, details) VALUES (?, ?, ?)",
      [userMatricule, action, JSON.stringify(logDetails)]
    );

    // 4. Revalidate activity page
    revalidatePath("/activity");
    
    console.log(`[Audit] ${action} logged for ${userMatricule}`);
    return { success: true };
  } catch (err) {
    console.error("[Audit] Failed to log activity:", err);
    return { success: false, error: err };
  }
}
