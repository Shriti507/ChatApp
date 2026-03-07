"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { MessageCircle, Circle } from "lucide-react";
import { formatMessageTimestamp } from "../utils/format-timestamp";

export function ConversationList() {
  const { user } = useUser();
  const router = useRouter();
  const currentUser = useQuery(api.functions.getUserByClerkId, user ? { clerkId: user.id } : "skip");
  const conversations = useQuery(api.functions.getUserConversationsWithDetails, currentUser ? { userId: currentUser._id } : "skip");

  if (!conversations || !currentUser) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">Conversations</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  const handleConversationClick = (conversationId: string) => {
    router.push(`/chat/${conversationId}`);
  };

  const formatMessageTime = (timestamp?: number) => {
    if (!timestamp) return "";
    return formatMessageTimestamp(timestamp);
  };

  const truncateMessage = (message: string, maxLength: number = 35) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + "...";
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Conversations</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
          {conversations.length}
        </span>
      </div>

      {/* Conversation List */}
      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <MessageCircle className="w-6 h-6 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No conversations yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
            Start chatting! Find users in the discovery section and send your first message
          </p>
          <div className="w-full space-y-3">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                📝 Note: Conversations appear here after you send at least one message
              </p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                💡 Tip: Scroll down to discover users and start conversations
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-1 max-h-80 min-h-0 overflow-y-auto">
          {conversations
            .sort((a: any, b: any) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0))
            .map((conversation: any) => (
              <div
                key={conversation._id}
                onClick={() => handleConversationClick(conversation._id)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors group"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <Avatar className="w-10 h-10">
                    <AvatarImage 
                      src={conversation.otherUser?.imageUrl} 
                      className="object-cover" 
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium">
                      {conversation.otherUser?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online status indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5">
                    {conversation.otherUser?.isOnline ? (
                      <Circle className="w-3 h-3 fill-green-500 text-green-500" />
                    ) : (
                      <Circle className="w-3 h-3 fill-gray-400 text-gray-400" />
                    )}
                  </div>
                </div>
                
                {/* Conversation info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {conversation.otherUser?.username}
                    </div>
                    {conversation.lastMessageTime && (
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatMessageTime(conversation.lastMessageTime)}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {conversation.lastMessage ? (
                      truncateMessage(conversation.lastMessage.content)
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 italic">No messages yet</span>
                    )}
                  </div>
                </div>


                {conversation.unreadCount > 0 && (
                  <div className="flex-shrink-0 flex items-center justify-center h-5 min-w-5 rounded-full bg-blue-500 text-white text-xs font-medium">
                    {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
