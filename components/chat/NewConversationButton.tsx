"use client";

import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { useRouter } from "next/navigation";

export function NewConversationButton() {
  const router = useRouter();

  function handleNew() {
    const ticketId = prompt("Enter the Ticket ID (e.g. INC001) for this new conversation:", "INC");
    if (ticketId && ticketId.trim() !== "") {
      router.push(`/chat/${ticketId.trim()}`);
    }
  }

  return (
    <button
      onClick={handleNew}
      className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95"
    >
      <MessageSquarePlus className="w-4 h-4" />
      New Conversation
    </button>
  );
}
