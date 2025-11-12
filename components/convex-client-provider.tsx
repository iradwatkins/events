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
        const response = await fetch('/api/auth/me', {
          credentials: 'same-origin',
        });

        if (response.ok) {
          const data = await response.json();
          // Return user info as the auth token (Convex will receive this in ctx.auth.getUserIdentity())
          return JSON.stringify(data.user);
        }
        // Return null when not authenticated (401) - this is expected and not an error
        if (response.status === 401) {
          return null;
        }
        throw new Error(`Auth check failed with status ${response.status}`);
      } catch (error) {
        // Only log actual errors in development, not expected 401s
        if (process.env.NODE_ENV === 'development' && error instanceof Error && !error.message.includes('401')) {
          console.error('[ConvexAuth] Failed to get auth token:', error);
        }
        return null;
      }
    });
  }, [convex]);

  return (
    <ConvexProvider client={convex}>
      {children}
    </ConvexProvider>
  );
}
