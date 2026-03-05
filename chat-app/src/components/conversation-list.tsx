"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { MessageCircle, Circle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function ConversationList() {
  const { user } = useUser();
  const router = useRouter();
  const currentUser = useQuery(api.functions.getUserByClerkId, user ? { clerkId: user.id } : "skip");
  const conversations = useQuery(api.functions.getUserConversationsWithDetails, currentUser ? { userId: currentUser._id } : "skip");

  if (!conversations || !currentUser) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-5 h-5 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-900">Conversations</h3>
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
    return formatDistanceToNow(timestamp, { addSuffix: true });
  };

  const truncateMessage = (message: string, maxLength: number = 35) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + "...";
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-gray-500" />
        <h3 className="text-sm font-medium text-gray-900">Conversations</h3>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {conversations.length}
        </span>
      </div>

      {/* Conversation List */}
      {conversations.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-medium">No conversations with messages</p>
          <p className="text-xs text-gray-400 mt-1">
            Start a conversation and send a message to see it here
          </p>
        </div>
      ) : (
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {conversations
            .sort((a: any, b: any) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0))
            .map((conversation: any) => (
              <div
                key={conversation._id}
                onClick={() => handleConversationClick(conversation._id)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
              >
                {/* Avatar */}
                <div className="relative">
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
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {conversation.otherUser?.username}
                    </div>
                    {conversation.lastMessageTime && (
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {formatMessageTime(conversation.lastMessageTime)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <div className="text-sm text-gray-500 truncate">
                      {conversation.lastMessage ? (
                        truncateMessage(conversation.lastMessage.content)
                      ) : (
                        <span className="text-gray-400 italic">No messages yet</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
