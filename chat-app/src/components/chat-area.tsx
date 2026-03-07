"use client";

import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Image, File, X, Download } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatMessageTimestamp } from "../utils/format-timestamp";
import { uploadFile, formatFileSize, downloadFile } from "../utils/file-hosting";
import { Id } from "../../convex/_generated/dataModel";
import { useTypingIndicator } from "../hooks/use-typing-indicator";

const SCROLL_BOTTOM_THRESHOLD_PX = 80;

interface ChatAreaProps {
  conversationId: string;
}

export function ChatArea({ conversationId }: ChatAreaProps) {
  const { user } = useUser();
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAtBottomRef = useRef(true);
  const prevMessageCountRef = useRef(0);
  const sendMessage = useMutation(api.functions.sendMessage);
  const markConversationAsRead = useMutation(api.functions.markConversationAsRead);

  const { isAuthenticated } = useConvexAuth();
  const currentUser = useQuery(api.functions.getUserByClerkId, user ? { clerkId: user.id } : "skip");
  const conversation = useQuery(api.functions.getConversationWithDetails, { conversationId: conversationId as Id<"conversations"> });
  const messages = useQuery(api.functions.getMessages, { conversationId: conversationId as Id<"conversations"> });

  // Typing indicator functionality
  const { startTyping, stopTyping, otherUserTyping } = useTypingIndicator(conversationId as Id<"conversations">);

  // Reset scroll tracking when switching conversations.
  useEffect(() => {
    prevMessageCountRef.current = 0;
    isAtBottomRef.current = true;
    setIsAtBottom(true);
    setHasNewMessages(false);
  }, [conversationId]);

  // Mark as read when user opens conversation — only after Convex has validated Clerk token
  useEffect(() => {
    if (!isAuthenticated || !conversationId || !currentUser || !user) return;
    const id = conversationId as Id<"conversations">;
    markConversationAsRead({ conversationId: id, clerkId: user.id })
      .then((result) => {
        if (result && !result.ok) {
          console.warn("[markAsRead] Convex returned:", result.reason);
        }
      })
      .catch((err) => console.error("[markAsRead] Failed:", err));
  }, [isAuthenticated, conversationId, currentUser, user, markConversationAsRead]);

  // Also mark as read when user scrolls to bottom 
  useEffect(() => {
    if (!isAuthenticated || !conversationId || !currentUser || !messagesContainerRef.current || !messagesEndRef.current || !user) return;

    const container = messagesContainerRef.current;
    const sentinel = messagesEndRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          markConversationAsRead({ conversationId: conversationId as Id<"conversations">, clerkId: user.id });
        }
      },
      { root: container, rootMargin: "0px", threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isAuthenticated, conversationId, currentUser, user, markConversationAsRead]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
  };

  // Track whether the user is near the bottom of the scroll container.
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    let raf = 0;
    const update = () => {
      const atBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_BOTTOM_THRESHOLD_PX;
      isAtBottomRef.current = atBottom;
      setIsAtBottom(atBottom);
      if (atBottom) setHasNewMessages(false);
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };

    update();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll);
    };
  }, [conversationId]);

  const typingCount = otherUserTyping?.length || 0;
  const prevTypingCountRef = useRef(typingCount);

  // Smart auto-scroll behavior for real-time messages.
  useEffect(() => {
    const count = messages?.length ?? 0;
    const prev = prevMessageCountRef.current;
    prevMessageCountRef.current = count;

    const prevTyping = prevTypingCountRef.current;
    prevTypingCountRef.current = typingCount;

    // On first load (or when switching conversations), jump to bottom.
    if (count > 0 && prev === 0) {
      window.requestAnimationFrame(() => scrollToBottom("auto"));
      setHasNewMessages(false);
      return;
    }

    // When new messages arrive OR typing indicator appears, auto-scroll only if the user is already at the bottom.
    if (count > prev || (typingCount > prevTyping)) {
      if (isAtBottomRef.current) {
        scrollToBottom("smooth");
        setHasNewMessages(false);
      } else if (count > prev) {
        setHasNewMessages(true);
      }
    }
  }, [messages, conversationId, typingCount]);

  const handleSendMessage = async () => {
    if ((!message.trim() && selectedFiles.length === 0) || !currentUser) return;
    
    // Stop typing indicator when sending message
    stopTyping();
    
    try {
      // Upload files first
      const uploadedFiles = await Promise.all(
        selectedFiles.map(file => uploadFile(file))
      );
      
      await sendMessage({
        conversationId: conversationId as Id<"conversations">,
        content: message.trim() || (uploadedFiles.length > 0 ? "Shared files" : ""),
        senderId: currentUser._id,
        attachments: uploadedFiles,
      });
      
      setMessage("");
      setSelectedFiles([]);
      setHasNewMessages(false);
      scrollToBottom("smooth");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files).filter(file => {
      // Check file size (max 2MB )
      if (file.size > 2 * 1024 * 1024) {
        alert(`File "${file.name}" is too large. Maximum size is 2MB.`);
        return false;
      }
      return true;
    });
    
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const handleFileDownload = (attachment: any) => {
    downloadFile(attachment);
  };

  const renderMessageContent = (msg: any) => {
    return (
      <div>
        {msg.content && (
          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
        )}
        {msg.attachments && msg.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {msg.attachments.map((attachment: any, index: number) => (
              <div key={index}>
                {attachment.type.startsWith('image/') ? (
                  // Display images inline
                  <div className="space-y-2">
                    <img
                      src={attachment.url}
                      alt={attachment.name}
                      className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => handleFileDownload(attachment)}
                    />
                    <div className="flex items-center gap-2 text-xs opacity-70">
                      <Image className="w-3 h-3" />
                      <span>{attachment.name}</span>
                      <span>({formatFileSize(attachment.size)})</span>
                    </div>
                  </div>
                ) : (
                  // Display other files as download cards
                  <div
                    className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleFileDownload(attachment)}
                  >
                    <div className="flex-shrink-0">
                      {attachment.type.startsWith('video/') ? (
                        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/40 rounded flex items-center justify-center">
                          <span className="text-xs">🎥</span>
                        </div>
                      ) : attachment.type.startsWith('audio/') ? (
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/40 rounded flex items-center justify-center">
                          <span className="text-xs">🎵</span>
                        </div>
                      ) : (
                        <File className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                        {attachment.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(attachment.size)}
                      </p>
                    </div>
                    <Download className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
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
    <div className="flex-1 flex flex-col min-h-0" key={`chat-area-${conversationId}`}>
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="w-8 h-8">
              <AvatarImage src={otherUser?.imageUrl} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium text-sm">
                {otherUser?.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{otherUser?.username}</h2>
            <p className={`text-xs font-semibold ${
              otherUser?.isOnline 
                ? "text-green-600 dark:text-green-400" 
                : "text-gray-400 dark:text-gray-500"
            }`}>
              {otherUser?.isOnline ? "Active now" : "Offline"}
            </p>
          </div>
        </div>
      </div>
      
      {/* Messages Area */}
      <div
        key={`messages-${conversationId}`}
        ref={messagesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-white dark:bg-gray-900"
      >
        {messages?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Send className="w-6 h-6 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No messages yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
              Start the conversation! Send a message to begin chatting with {otherUser?.username}
            </p>
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Tip: Type your message below and press Enter or click the send button
              </p>
            </div>
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
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                  }`}
                >
                  {renderMessageContent(msg)}
                </div>
                <p className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${
                  msg.senderId === currentUser._id ? "text-right" : "text-left"
                }`}>
                  {formatMessageTime(msg.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
        
        {/* Typing Indicator */}
        {otherUserTyping && otherUserTyping.length > 0 && (
          <div key={`typing-${otherUserTyping[0]?.userId}`} className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 px-2 py-1">
            <div className="flex-shrink-0 flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-2xl rounded-bl-none shadow-sm border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex gap-1.5 pt-0.5">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
              </div>
            </div>
            <span className="text-xs font-medium text-gray-400 dark:text-gray-500 italic">
              {otherUserTyping[0]?.username}
              {otherUserTyping.length > 1 && ` and ${otherUserTyping.length - 1} other${otherUserTyping.length > 2 ? 's' : ''}`}
              {" is typing..."}
            </span>
          </div>
        )}

        {hasNewMessages && !isAtBottom && (
          <div className="sticky bottom-4 flex justify-end pointer-events-none">
            <button
              type="button"
              onClick={() => {
                setHasNewMessages(false);
                scrollToBottom("smooth");
              }}
              className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-blue-600 text-white px-3 py-2 text-sm shadow-lg hover:bg-blue-700 transition-colors"
            >
              <span className="text-base leading-none">↓</span>
              New messages
            </button>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
        {/* File Preview */}
        {selectedFiles.length > 0 && (
          <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-600 rounded-lg border border-gray-300 dark:border-gray-500 text-sm"
                >
                  {getFileIcon(file)}
                  <span className="truncate max-w-[150px] text-gray-900 dark:text-white">{file.name}</span>
                  <span className="text-gray-500 dark:text-gray-300 text-xs">({formatFileSize(file.size)})</span>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar"
            title="Maximum file size: 2MB"
          />
          
          <button
            onClick={handleFileInputClick}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          
          <div
            className={`flex-1 px-4 py-2 border rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-colors ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="text"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (e.target.value.trim()) {
                  startTyping();
                }
              }}
              onFocus={() => {
                if (message.trim()) {
                  startTyping();
                }
              }}
              onBlur={stopTyping}
              onKeyPress={handleKeyPress}
              placeholder={selectedFiles.length > 0 ? "Add a message (optional)..." : "Type a message..."}
              className="w-full bg-transparent outline-none placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white"
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() && selectedFiles.length === 0}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        {isDragging && (
          <div className="mt-2 text-center text-sm text-blue-600 dark:text-blue-400">
            Drop files here to attach
          </div>
        )}
      </div>
    </div>
  );
}
