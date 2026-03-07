"use client";

import { UserButton, useUser, useClerk } from "@clerk/nextjs";
import { Plus, Moon, Sun } from "lucide-react";
import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { UserDiscovery } from "./user-discovery";
import { ConversationList } from "./conversation-list";
import { useTheme } from "../contexts/theme-context";

export function ChatSidebar() {
  const { user } = useUser();
  const createUser = useMutation(api.functions.createUser);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (user) {
      createUser({
        clerkId: user.id,
        username: user.username || user.firstName || "Unknown",
        imageUrl: user.imageUrl,
      });
    }
  }, [user, createUser]);

  return (
    <div className="w-full md:w-80 flex-shrink-0 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Chat App</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Toggle theme"
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {user?.firstName || user?.username}
            </div>
            <div className="flex items-center gap-2">
              <UserButton />
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <button className="w-full flex items-center gap-2 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          New Conversation
        </button>
      </div>
      
      <div className="flex-1 min-h-0 overflow-y-auto">
        <ConversationList />
        <UserDiscovery />
      </div>
    </div>
  );
}
