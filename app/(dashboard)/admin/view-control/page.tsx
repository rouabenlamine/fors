import { getSession } from "@/lib/auth";
import { getAllViewPermissions } from "@/app/actions/view-permissions-actions";
import { ViewControlClient } from "./ViewControlClient";
import { redirect } from "next/navigation";

export const metadata = {
  title: "View Control — FORS Admin",
  description:
    "Granularly toggle UI component visibility per user role in the FORS Simulator.",
};

export default async function ViewControlPage() {
  const session = await getSession();
  const user = session.user;

  // Guard: only admin/superadmin
  if (!user || !["admin", "superadmin"].includes(user.role)) {
    redirect("/login");
  }

  const allPermissions = await getAllViewPermissions();

  return (
    <ViewControlClient
      initialPermissions={allPermissions}
      isSuperadmin={user.role === "superadmin"}
    />
  );
}
