import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ChatBubble } from "@/components/layout/ChatBubble";
import { getSession } from "@/lib/auth";

const ROLE_TITLES: Record<string, string> = {
  agent:    "Incident Dashboard",
  reporter: "Reporting Dashboard",
  manager:  "IT Manager Workspace",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const user = session.user;
  const title = ROLE_TITLES[user?.role ?? "agent"] ?? "Incident Dashboard";

  return (
    <div className="min-h-screen bg-slate-50 flex w-full overflow-hidden">
      <Sidebar role={user?.role} />
      <div className="flex-1 ml-56 flex flex-col h-screen relative min-w-0">
        {/* Colorful Background Accents */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-rose-500/5 blur-[100px] rounded-full -ml-32 -mb-32 pointer-events-none" />
        
        <Header title={title} user={user} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col relative z-10 px-4 pb-2">
          {children}
        </main>
      </div>
      <ChatBubble user={user} />
    </div>
  );
}
