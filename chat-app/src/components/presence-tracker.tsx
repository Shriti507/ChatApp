"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useRef } from "react";

export function PresenceTracker() {
  const { user } = useUser();
  const updateStatus = useMutation(api.functions.updateUserStatus);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) return;

    // 1. Initial online status
    updateStatus({ clerkId: user.id, isOnline: true });

    // 2. Heartbeat every 30 seconds to keep lastSeen updated
    heartbeatRef.current = setInterval(() => {
      updateStatus({ clerkId: user.id, isOnline: true });
    }, 30000);

    // 3. Page visibility tracking
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === "visible";
      updateStatus({ clerkId: user.id, isOnline: isVisible });
    };

    // 4. Cleanup/Offline status when leaving
    const handleBeforeUnload = () => {
      // Use navigator.sendBeacon or a robust way if needed, 
      // but for Convex mutation it's best effort on unload
      updateStatus({ clerkId: user.id, isOnline: false });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      
      // Set offline when component unmounts (logout or tab close)
      updateStatus({ clerkId: user.id, isOnline: false });
    };
  }, [user, updateStatus]);

  return null; // This component doesn't render anything
}
