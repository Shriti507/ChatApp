"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { Search, Users, Circle } from "lucide-react";
import { useDebounce } from "../hooks/use-debounce";
import { HighlightText } from "./highlight-text";

export function UserDiscovery() {
  const { user } = useUser();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const createOrGetConversation = useMutation(api.functions.createOrGetConversation);
  
  const otherUsers = useQuery(api.functions.getOtherUsers, user ? { currentClerkId: user.id } : "skip");
  const currentUser = useQuery(api.functions.getUserByClerkId, user ? { clerkId: user.id } : "skip");

  if (!otherUsers || !currentUser) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">Discover Users</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  const filteredUsers = otherUsers.filter((user: any) =>
    user.username.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
  );

  const handleUserClick = async (clickedUser: any) => {
    try {
      const conversationId = await createOrGetConversation({
        user1Id: currentUser._id,
        user2Id: clickedUser._id,
      });
      router.push(`/chat/${conversationId}`);
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  const formatLastSeen = (lastSeen?: number) => {
    if (!lastSeen) return "Never";
    const now = Date.now();
    const diff = now - lastSeen;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Discover Users</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
          {otherUsers.length}
        </span>
      </div>
      
      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white"
        />
      </div>

      {/* User List */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          {debouncedSearchQuery ? (
            <>
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No users found</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
                We couldn't find any users matching "{debouncedSearchQuery}"
              </p>
              <div className="w-full space-y-3">
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Try: Check spelling, use different keywords, or browse all users below
                  </p>
                </div>
                <button
                  onClick={() => setSearchQuery("")}
                  className="w-full p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                >
                  Clear search and show all users
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No other users</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
                Be the first to invite friends and start conversations!
              </p>
              <div className="w-full space-y-3">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-xs text-green-700 dark:text-green-300">
                    Invite: Share your chat link to bring friends to the conversation
                  </p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Tip: More users will appear as they join the chat app
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-1 max-h-80 min-h-0 overflow-y-auto">
          {filteredUsers.map((user: any) => (
            <div
              key={user._id}
              onClick={() => handleUserClick(user)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors group"
            >
              {/* Avatar with online status */}
              <div className="relative">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user.imageUrl} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium">
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              {/* User info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                    <HighlightText text={user.username} highlight={debouncedSearchQuery} />
                  </div>
                  <span className={`text-[10px] font-medium uppercase tracking-wider flex-shrink-0 ${
                    user.isOnline 
                      ? "text-green-600 dark:text-green-400" 
                      : "text-gray-400 dark:text-gray-600"
                  }`}>
                    {user.isOnline ? "Online" : "Offline"}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Last seen {formatLastSeen(user.lastSeen)}
                  </span>
                </div>
              </div>
              
              {/* Hover indicator */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Search className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
