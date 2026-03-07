"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useConvexAuth } from "convex/react";

/**
 * Logs Clerk → Convex auth state and token availability once when signed in.
 * Helps debug "No identity" by showing whether the client has a Convex token.
 * Only runs in development.
 */
export function AuthDiagnostic() {
  const { isSignedIn, getToken } = useAuth();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const logged = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development" || logged.current) return;
    if (!isSignedIn) return;

    let cancelled = false;
    logged.current = true;

    // Try multiple token approaches
    Promise.all([
      getToken({ template: "convex" }),
      getToken(), // Try without template
    ])
      .then(([convexToken, defaultToken]) => {
        if (cancelled) return;
        console.log("[AuthDiagnostic] Clerk signed in:", isSignedIn);
        console.log("[AuthDiagnostic] Convex isAuthenticated:", isAuthenticated, "isLoading:", isLoading);
        console.log("[AuthDiagnostic] getToken({ template: 'convex' }):", convexToken ? `present (${convexToken.length} chars)` : "null or undefined");
        console.log("[AuthDiagnostic] getToken() (default):", defaultToken ? `present (${defaultToken.length} chars)` : "null or undefined");
        
        if (!convexToken && !defaultToken) {
          console.warn("[AuthDiagnostic] No Convex token — activate the Convex integration in Clerk Dashboard (Configure → Integrations → Convex).");
        } else if (!isLoading && !isAuthenticated) {
          console.warn("[AuthDiagnostic] Token present but Convex not authenticated — set CLERK_JWT_ISSUER_DOMAIN in Convex Dashboard (Settings → Environment Variables) to your Clerk Frontend API URL.");
        }
      })
      .catch((err) => {
        if (!cancelled) console.error("[AuthDiagnostic] getToken failed:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, isAuthenticated, isLoading, getToken]);

  return null;
}
