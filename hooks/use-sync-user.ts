"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

/**
 * Hook to automatically sync authenticated user to Convex database
 * This runs on the client side after successful authentication
 */
export function useSyncUser() {
  const { data: session, status } = useSession();
  const syncedRef = useRef(false);

  useEffect(() => {
    // Only sync if authenticated, we have user data, and haven't synced yet
    if (status === "authenticated" && session?.user?.email && !syncedRef.current) {
      // Mark as synced to prevent multiple calls
      syncedRef.current = true;
    }
  }, [status, session?.user?.email]);
}
