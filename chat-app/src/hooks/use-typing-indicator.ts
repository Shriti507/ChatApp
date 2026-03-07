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
  const lastUpdateRef = useRef(0);
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

    const now = Date.now();
    // Set typing status if not already typing OR if it's been more than 3 seconds since last update
    if (!isTyping || (now - lastUpdateRef.current > 3000)) {
      setIsTyping(true);
      lastUpdateRef.current = now;
      setTypingStatus({
        conversationId,
        isTyping: true,
        clerkId: user.id,
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
      lastUpdateRef.current = 0;
      setTypingStatus({
        conversationId,
        isTyping: false,
        clerkId: user.id,
      });
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      stopTyping();
    };
  }, [currentUser, conversationId]);

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
