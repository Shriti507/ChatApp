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
          <Users className="w-5 h-5 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-900">Discover Users</h3>
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
        <Users className="w-5 h-5 text-gray-500" />
        <h3 className="text-sm font-medium text-gray-900">Discover Users</h3>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
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
          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-500"
        />
      </div>

      {/* User List */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-8">
          {debouncedSearchQuery ? (
            <>
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 font-medium">No users found</p>
              <p className="text-xs text-gray-400 mt-1">
                Try searching for a different name
              </p>
            </>
          ) : (
            <>
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 font-medium">No other users</p>
              <p className="text-xs text-gray-400 mt-1">
                Be the first to start a conversation!
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {filteredUsers.map((user: any) => (
            <div
              key={user._id}
              onClick={() => handleUserClick(user)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
            >
              {/* Avatar with online status */}
              <div className="relative">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user.imageUrl} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium">
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {/* Online status indicator */}
                <div className="absolute -bottom-0.5 -right-0.5">
                  {user.isOnline ? (
                    <Circle className="w-3 h-3 fill-green-500 text-green-500" />
                  ) : (
                    <Circle className="w-3 h-3 fill-gray-400 text-gray-400" />
                  )}
                </div>
              </div>
              
              {/* User info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-medium text-sm text-gray-900 truncate">
                    <HighlightText text={user.username} highlight={debouncedSearchQuery} />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  {user.isOnline ? (
                    <>
                      <Circle className="w-1.5 h-1.5 fill-green-500 text-green-500" />
                      <span className="text-xs text-green-600 font-medium">Online</span>
                    </>
                  ) : (
                    <span className="text-xs text-gray-500">
                      {formatLastSeen(user.lastSeen)}
                    </span>
                  )}
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
