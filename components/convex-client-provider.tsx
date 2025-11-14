"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexProvider } from "convex/react";
import { ReactNode, useMemo, useEffect } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convex = useMemo(() => new ConvexReactClient(convexUrl), []);

  useEffect(() => {
    // Set up auth with an async function that fetches the token
    convex.setAuth(async () => {
      try {
        const response = await fetch("/api/auth/convex-token", {
          credentials: "same-origin",
        });


        if (response.ok) {
          const data = await response.json();
          // Return the JWT token that Convex can verify
          return data.token || null;
        }
        // Return null when not authenticated (401) - this is expected and not an error
        if (response.status === 401) {
          return null;
        }
        throw new Error(`Auth check failed with status ${response.status}`);
      } catch (error) {
        console.error("[ConvexAuth] Error getting auth token:", error);
        return null;
      }
    });
  }, [convex]);

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
