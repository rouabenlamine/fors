"use server";

import { query, execute } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/audit";
import { User, UserRole } from "@/lib/types";
import { revalidatePath } from "next/cache";

// ===============================
// Core User Management
// ===============================

export async function createAdminOrUserAction(userData: Partial<User>) {
  const session = await getSession();
  const creatorRole = session.user?.role;
  const creatorMatricule = session.user?.matricule || "SYSTEM";

  // Only Admin/Superadmin can create users/admins
  if (!["admin", "superadmin"].includes(creatorRole as string)) {
    throw new Error("Unauthorized to manage users.");
  }

  // Admin cannot create Superadmin
  if (userData.role === "superadmin" && creatorRole !== "superadmin") {
    throw new Error("Only a Superadmin can create a Superadmin account.");
  }

  const { matricule, name, surname, role, permissions } = userData;

  const permissionsJson = permissions ? JSON.stringify(permissions) : null;

  await execute(`
    INSERT INTO users (matricule, name, prenom, role, permissions, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, 1, NOW())
  `, [matricule, name, surname, role, permissionsJson]);

  await logActivity("USER_CREATED", {
    userMatricule: creatorMatricule,
    details: { message: `Created user ${matricule} with role ${role}` }
  });

  revalidatePath("/admin/users");
  revalidatePath("/superadmin/users");
  return { success: true };
}

export async function updateUserPermissionsAction(matricule: string, permissions: any) {
  const session = await getSession();
  const role = session.user?.role;
  const adminMatricule = session.user?.matricule || "SYSTEM";

  if (role !== "superadmin") {
    throw new Error("Only superadmins can modify permissions JSON.");
  }

  await execute(
    "UPDATE users SET permissions = ? WHERE matricule = ?",
    [JSON.stringify(permissions), matricule]
  );

  await logActivity("PERMISSIONS_UPDATED", {
    userMatricule: adminMatricule,
    details: { message: `Updated permissions for ${matricule}` }
  });

  revalidatePath("/superadmin/admin-management");
  return { success: true };
}

export async function getAdminsList() {
  const rows = await query<any>("SELECT matricule, name, prenom, role, permissions FROM users WHERE role IN ('admin', 'superadmin')");
  return rows.map((r: any) => ({
    matricule: r.matricule,
    name: r.name + (r.prenom ? ' ' + r.prenom : ''),
    role: r.role,
    limits: typeof r.permissions === 'string' ? JSON.parse(r.permissions || '{}') : (r.permissions || {})
  }));
}

// ===============================
// Integration Management (Superadmin Only)
// ===============================

export async function updateIntegrationSettingsAction(serviceName: string, config: any) {
  const session = await getSession();
  if (session.user?.role !== "superadmin") {
    throw new Error("Unauthorized: Superadmin access required.");
  }

  // In a robust implementation, these would be saved to a `system_configurations` table.
  // For the sake of this task, we will mock the save log.
  
  await logActivity("INTEGRATION_UPDATED", {
    userMatricule: session.user.matricule,
    details: { message: `Updated integration settings for ${serviceName}` }
  });

  revalidatePath("/superadmin/integrations");
  return { success: true };
}

// ===============================
// KPI Configuration (Admin & Superadmin)
// ===============================

export async function updateKpiConfigAction(kpiId: string, updates: any) {
  const session = await getSession();
  if (!["admin", "superadmin"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized.");
  }

  // Logic to update `kpi_configs` table
  await execute(`
    UPDATE kpi_configs
    SET isEnabled = COALESCE(?, isEnabled),
        name = COALESCE(?, name),
        sql_query = COALESCE(?, sql_query)
    WHERE id = ?
  `, [updates.isEnabled, updates.name, updates.sql_query, kpiId]);

  await logActivity("KPI_UPDATED", {
    userMatricule: session.user?.matricule || "SYSTEM",
    details: { message: `Updated KPI ${kpiId}` }
  });

  revalidatePath("/admin/kpi-config");
  return { success: true };
}

export async function getKpiConfigs() {
  const rows = await query<any>("SELECT id, name, category, isEnabled, description, sql_query FROM kpi_configs ORDER BY \`order\` ASC");
  return JSON.parse(JSON.stringify(rows));
}

// ===============================
// Admin Dashboard Stats
// ===============================

export async function getAdminDashboardStats() {
  // Count active sessions
  const [sessionsRes] = await query<any>("SELECT COUNT(*) as count FROM sessions WHERE expires_at > NOW()");
  const activeConnections = sessionsRes?.count || 0;

  // Count SQL executions today
  const [sqlRunsRes] = await query<any>("SELECT COUNT(*) as count FROM audit_logs WHERE action = 'RAW_SQL_EXECUTED' AND DATE(created_at) = CURDATE()");
  const sqlRuns = sqlRunsRes?.count || 0;

  // Get recent anomalies (like failed SQL or rejected analysis)
  const anomalies = await query<any>("SELECT * FROM audit_logs WHERE action IN ('RAW_SQL_FAILED', 'TICKET_REJECTED') ORDER BY created_at DESC LIMIT 5");

  return { activeConnections, sqlRuns, anomalies };
}

// ===============================
// Raw SQL Execution (Admin & Superadmin)
// ===============================

export async function executeRawSqlAction(sqlQuery: string) {
  const session = await getSession();
  const role = session.user?.role as string;
  const userMatricule = session.user?.matricule || "SYSTEM";

  if (!["admin", "superadmin"].includes(role)) {
    throw new Error("Unauthorized to run RAW SQL.");
  }

  // Basic sanitization
  const isDestructive = /drop|delete|truncate|alter/i.test(sqlQuery);
  if (isDestructive && role !== "superadmin") {
    throw new Error("Only Superadmin can execute destructive queries. Action locked.");
  }

  try {
    const results = await query<any>(sqlQuery);
    
    await logActivity("RAW_SQL_EXECUTED", {
      ticketId: null,
      userMatricule,
      details: { message: `Executed query: ${sqlQuery}`, status: 'success' }
    });

    return { success: true, count: results.length, data: results.slice(0, 100) }; // limit output for safety
  } catch (err: any) {

    await logActivity("RAW_SQL_FAILED", {
      ticketId: null,
      userMatricule,
      details: { message: `Query failed: ${sqlQuery}`, error: err.message }
    });

    throw new Error(`SQL Execution Error: ${err.message}`);
  }
}
