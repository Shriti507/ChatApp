// Simple test to check typing indicator
console.log("Testing typing indicator...");


import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function TestTypingIndicator() {
  const setTypingStatus = useMutation(api.functions.setTypingStatus);
  
  const testTyping = () => {
    console.log("Test: Calling setTypingStatus");
    setTypingStatus({
      conversationId: "test123" as any,
      isTyping: true,
      clerkId: "test_user_123",
    });
  };
  
  return (
    <div>
      <button onClick={testTyping}>Test Typing</button>
    </div>
  );
}
