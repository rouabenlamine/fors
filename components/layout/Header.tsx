"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, X, CheckCircle, AlertCircle, Info, Clock } from "lucide-react";
import type { User } from "@/lib/types";

interface HeaderProps {
  title: string;
  user?: User;
}

const MOCK_NOTIFICATIONS = [
  {
    id: "1",
    type: "alert",
    title: "P1 Ticket Escalated",
    message: "Ticket #TK-001 has been escalated — SAP data loss detected.",
    time: "2 min ago",
    read: false,
  },
  {
    id: "2",
    type: "success",
    title: "SQL Approved",
    message: "Your SQL proposal for TK-003 was approved by M. Dupont.",
    time: "14 min ago",
    read: false,
  },
  {
    id: "3",
    type: "info",
    title: "GOST Analysis Ready",
    message: "GOST has finished analysing TK-005 — confidence 91%.",
    time: "1 hr ago",
    read: true,
  },
  {
    id: "4",
    type: "warning",
    title: "SLA Approaching",
    message: "Ticket TK-002 SLA deadline in 45 minutes.",
    time: "2 hr ago",
    read: true,
  },
];

const notifIcon = {
  alert: <AlertCircle className="w-4 h-4 text-red-500" />,
  success: <CheckCircle className="w-4 h-4 text-green-500" />,
  info: <Info className="w-4 h-4 text-blue-500" />,
  warning: <Clock className="w-4 h-4 text-amber-500" />,
};

export function Header({ title, user }: HeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function dismiss(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  const initials = user ? `${user.name[0]}${user.surname[0]}` : "?";
  const displayName = user ? `${user.name} ${user.surname}` : null;
  const displayRole = user ? user.role.replace("_", " ") : null;

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-20">
      <h1 className="text-base font-semibold text-slate-800">{title}</h1>

      <div className="flex items-center gap-3">
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <Bell className="w-4 h-4 text-slate-500" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-10 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-sm font-semibold text-slate-800">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-sm">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors ${
                        !n.read ? "bg-blue-50/50" : ""
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {notifIcon[n.type as keyof typeof notifIcon]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-xs font-medium truncate ${!n.read ? "text-slate-800" : "text-slate-600"}`}>
                            {n.title}
                          </p>
                          <button
                            onClick={() => dismiss(n.id)}
                            className="shrink-0 text-slate-300 hover:text-slate-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {user ? (
          <div className="flex items-center gap-2.5 pl-3 border-l border-gray-100">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center text-[12px] font-bold text-white shadow-lg shadow-blue-500/20 shrink-0">
              {initials}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-800 mb-0.5">{displayName}</p>
              <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">{displayRole}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 pl-3 border-l border-gray-100">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-[12px] font-bold text-slate-400">
              ?
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
