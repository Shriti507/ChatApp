"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatMessageTimestamp } from "../utils/format-timestamp";
import { Id } from "../../convex/_generated/dataModel";


interface ChatAreaProps {
  conversationId: string;
}

export function ChatArea({ conversationId }: ChatAreaProps) {
  const { user } = useUser();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sendMessage = useMutation(api.functions.sendMessage);
  
  const currentUser = useQuery(api.functions.getUserByClerkId, user ? { clerkId: user.id } : "skip");
  
  
    const conversation = useQuery(api.functions.getConversationWithDetails, { conversationId: conversationId as Id<"conversations"> });
  const messages = useQuery(api.functions.getMessages, { conversationId: conversationId as Id<"conversations"> });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (message.trim() && currentUser) {
      try {
        await sendMessage({
          conversationId: conversationId as Id<"conversations">,
          content: message.trim(),
          senderId: currentUser._id,
        });
        setMessage("");
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: number) => {
    return formatMessageTimestamp(timestamp);
  };

  const getOtherUser = () => {
    if (!conversation || !currentUser) return null;
    return conversation.members?.find((member: any) => member._id !== currentUser._id);
  };

  const otherUser = getOtherUser();

  if (!conversation || !currentUser) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="w-8 h-8">
              <AvatarImage src={otherUser?.imageUrl} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium text-sm">
                {otherUser?.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5">
              {otherUser?.isOnline ? (
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
              ) : (
                <div className="w-2.5 h-2.5 bg-gray-400 rounded-full border-2 border-white"></div>
              )}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{otherUser?.username}</h2>
            <p className="text-xs text-gray-500">
              {otherUser?.isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages?.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages?.map((msg: any) => (
            <div
              key={msg._id}
              className={`flex ${msg.senderId === currentUser._id ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-xs lg:max-w-md xl:max-w-lg`}>
                <div
                  className={`px-4 py-2 rounded-lg ${
                    msg.senderId === currentUser._id
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
                <p className={`text-xs text-gray-500 mt-1 ${
                  msg.senderId === currentUser._id ? "text-right" : "text-left"
                }`}>
                  {formatMessageTime(msg.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
