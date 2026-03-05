"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Image, File, X, Download } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatMessageTimestamp } from "../utils/format-timestamp";
import { uploadFile, formatFileForMessage, getFileEmoji, formatFileSize } from "../utils/file-upload";
import { Id } from "../../convex/_generated/dataModel";


interface ChatAreaProps {
  conversationId: string;
}

export function ChatArea({ conversationId }: ChatAreaProps) {
  const { user } = useUser();
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sendMessage = useMutation(api.functions.sendMessage);
  
  const currentUser = useQuery(api.functions.getUserByClerkId, user ? { clerkId: user.id } : "skip");
  
  
    const conversation = useQuery(api.functions.getConversationWithDetails, { conversationId: conversationId as Id<"conversations"> });
  const messages = useQuery(api.functions.getMessages, { conversationId: conversationId as Id<"conversations"> });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if ((!message.trim() && selectedFiles.length === 0) || !currentUser) return;
    
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
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File "${file.name}" is too large. Maximum size is 10MB.`);
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
    // Create a temporary link to download the file
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleFileDownload(attachment)}
              >
                <div className="flex-shrink-0">
                  {attachment.type.startsWith('image/') ? (
                    <Image className="w-4 h-4 text-blue-500" />
                  ) : (
                    <File className="w-4 h-4 text-gray-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {attachment.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(attachment.size)}
                  </p>
                </div>
                <Download className="w-3 h-3 text-gray-400" />
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
          <div className="flex flex-col items-center justify-center h-full py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Send className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
            <p className="text-sm text-gray-500 text-center max-w-md">
              Start the conversation! Send a message to begin chatting with {otherUser?.username}
            </p>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700">
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
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {renderMessageContent(msg)}
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
        {/* File Preview */}
        {selectedFiles.length > 0 && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-300 text-sm"
                >
                  {getFileIcon(file)}
                  <span className="truncate max-w-[150px]">{file.name}</span>
                  <span className="text-gray-500 text-xs">({formatFileSize(file.size)})</span>
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
          />
          
          <button
            onClick={handleFileInputClick}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          
          <div
            className={`flex-1 px-4 py-2 border rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-colors ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={selectedFiles.length > 0 ? "Add a message (optional)..." : "Type a message..."}
              className="w-full bg-transparent outline-none placeholder-gray-500"
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
          <div className="mt-2 text-center text-sm text-blue-600">
            Drop files here to attach
          </div>
        )}
      </div>
    </div>
  );
}
