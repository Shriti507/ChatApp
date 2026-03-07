import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Id } from "../../convex/_generated/dataModel";

interface TypingIndicator {
  userId: string;
  username: string;
  isTyping: boolean;
  lastSeen: number;
}

export function useTypingIndicator(conversationId: Id<"conversations">) {
  const { user } = useUser();
  const currentUser = useQuery(api.functions.getUserByClerkId, user ? { clerkId: user.id } : "skip");
  const setTypingStatus = useMutation(api.functions.setTypingStatus);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  // Get typing indicators for this conversation
  const typingIndicators = useQuery(
    api.functions.getTypingIndicators,
    currentUser && conversationId ? { conversationId } : "skip"
  ) || [];

  const startTyping = () => {
    if (!currentUser || !conversationId || !user) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set typing status
    if (!isTyping) {
      setIsTyping(true);
      setTypingStatus({
        conversationId,
        isTyping: true,
        clerkId: user.id, // Pass clerkId
      });
    }

    // Set timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  };

  const stopTyping = () => {
    if (!currentUser || !conversationId || !user) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (isTyping) {
      setIsTyping(false);
      setTypingStatus({
        conversationId,
        isTyping: false,
        clerkId: user.id, // Pass clerkId
      });
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      stopTyping();
    };
  }, [currentUser, conversationId]);

  // Filter out current user from typing indicators
  const otherUserTyping = typingIndicators?.filter(
    (indicator): indicator is NonNullable<typeof indicator> => 
      indicator !== null && indicator.userId !== currentUser?._id && indicator.isTyping
  ) || [];

  return {
    startTyping,
    stopTyping,
    isTyping,
    otherUserTyping: otherUserTyping || [],
  };
}
