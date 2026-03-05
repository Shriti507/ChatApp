"use client";

import { UserButton } from "@clerk/nextjs";
import { Plus } from "lucide-react";

export function ChatSidebar() {
  return (
    <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Chat App</h1>
          <UserButton />
        </div>
      </div>
      
      <div className="p-4">
        <button className="w-full flex items-center gap-2 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          <Plus className="w-4 h-4" />
          New Conversation
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-sm font-medium text-gray-500 mb-3">Recent Chats</h2>
          <div className="space-y-2">
            <div className="p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
              <div className="font-medium">General Chat</div>
              <div className="text-sm text-gray-500 truncate">Last message...</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
