import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions } from "./lib/session-config";
import type { SessionData } from "./lib/session-config";
import type { UserRole } from "./lib/types";

const PUBLIC_PATHS = ["/login", "/admin/login", "/fors/auth/login", "/fors/auth/logout"];

// New updated VALID_ROLES include admin and superadmin
const VALID_ROLES = ["agent", "reporter", "manager", "admin", "superadmin", "user", "it_support"];

// Default homes based on role
const ROLE_HOME: Record<string, string> = {
  agent: "/tickets",
  reporter: "/report",
  manager: "/tables",
  admin: "/admin/dashboard",
  superadmin: "/superadmin/integrations",
  user: "/tickets",
  it_support: "/tickets"
};

const RESTRICTED: { prefix: string; roles: string[] }[] = [
  { prefix: "/report", roles: ["reporter"] },
  { prefix: "/tables", roles: ["manager", "admin", "superadmin"] },
  { prefix: "/database", roles: ["manager", "agent", "superadmin"] },
  { prefix: "/users", roles: ["manager", "admin", "superadmin"] },
  { prefix: "/kpi-config", roles: ["manager", "admin", "superadmin"] },
  { prefix: "/admin/view-control", roles: ["admin", "superadmin"] },
];

const AGENT_ONLY_PREFIXES = ["/tickets", "/analysis", "/lab", "/chat"];

function redirectToLogin(req: NextRequest): NextResponse {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get("fors-token")?.value;
  if (!token) {
    return redirectToLogin(req);
  }

  const res = NextResponse.next();
  let session: any;

  try {
    session = await getIronSession<SessionData>(req, res, sessionOptions);
  } catch {
    return redirectToLogin(req);
  }

  if (!session.isLoggedIn || !session.user) {
    return redirectToLogin(req);
  }

  const role = session.user.role as string;

  // Admin access validation
  if (pathname.startsWith("/admin") && !["admin", "superadmin"].includes(role)) {
    const url = req.nextUrl.clone();
    url.pathname = ROLE_HOME[role] || "/tickets";
    return NextResponse.redirect(url);
  }

  // Superadmin access validation
  if (pathname.startsWith("/superadmin") && role !== "superadmin") {
    const url = req.nextUrl.clone();
    // Redirect Admins trying to reach superadmin back to admin
    url.pathname = role === "admin" ? "/admin/dashboard" : (ROLE_HOME[role] || "/tickets");
    return NextResponse.redirect(url);
  }

  // General Role-Based Routing
  for (const { prefix, roles } of RESTRICTED) {
    if (pathname.startsWith(prefix) && !roles.includes(role)) {
      const url = req.nextUrl.clone();
      url.pathname = ROLE_HOME[role] || "/tickets";
      return NextResponse.redirect(url);
    }
  }

  if (AGENT_ONLY_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (["reporter", "manager"].includes(role)) {
      const url = req.nextUrl.clone();
      url.pathname = ROLE_HOME[role] || "/tickets";
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
