"use client";

import { UserButton, useUser, useClerk } from "@clerk/nextjs";
import { Plus, LogOut } from "lucide-react";
import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { UserDiscovery } from "./user-discovery";
import { ConversationList } from "./conversation-list";

export function ChatSidebar() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const createUser = useMutation(api.functions.createUser);

  useEffect(() => {
    if (user) {
      createUser({
        clerkId: user.id,
        username: user.username || user.firstName || "Unknown",
        imageUrl: user.imageUrl,
      });
    }
  }, [user, createUser]);

  const handleSignOut = async () => {
    await signOut({ redirectUrl: "/sign-up" });
  };

  return (
    <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Chat App</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {user?.firstName || user?.username}
            </span>
            <div className="flex items-center gap-2">
              <UserButton />
              <button
                onClick={handleSignOut}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <button className="w-full flex items-center gap-2 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          <Plus className="w-4 h-4" />
          New Conversation
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <ConversationList />
        <UserDiscovery />
      </div>
    </div>
  );
}
