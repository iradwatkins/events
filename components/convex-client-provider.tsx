"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithAuth, useMutation } from "convex/react";
import { SessionProvider, useSession } from "next-auth/react";
import { ReactNode, useMemo, useEffect, useRef } from "react";
import { api } from "@/convex/_generated/api";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

function useNextAuthConvex() {
  const { data: session, status } = useSession();

  return useMemo(() => {
    const isLoading = status === "loading";
    const isAuthenticated = status === "authenticated" && !!session?.user?.email;

    return {
      isLoading,
      isAuthenticated,
      // Convex will use this in ctx.auth.getUserIdentity()
      fetchAccessToken: async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
        if (!isAuthenticated || !session?.user?.email) {
          return null;
        }
        // Return user info as token
        return JSON.stringify({
          email: session.user.email,
          name: session.user.name,
          image: session.user.image,
          subject: session.user.email, // Used as unique identifier
        });
      },
    };
  }, [session, status]);
}

// Auto-sync authenticated user to Convex database
function UserSync() {
  const { data: session, status } = useSession();
  const upsertUser = useMutation(api.users.mutations.upsertUserFromAuth);
  const syncedRef = useRef(false);

  useEffect(() => {
    const syncUser = async () => {
      if (status === "authenticated" && session?.user?.email && !syncedRef.current) {
        try {
          await upsertUser({
            email: session.user.email,
            name: session.user.name || undefined,
            image: session.user.image || undefined,
          });
          syncedRef.current = true;
          console.log("[UserSync] User synced to Convex database:", session.user.email);
        } catch (error) {
          console.error("[UserSync] Failed to sync user:", error);
        }
      } else if (status === "unauthenticated") {
        syncedRef.current = false;
      }
    };

    syncUser();
  }, [status, session, upsertUser]);

  return null;
}

function ConvexProviderWithNextAuth({ children }: { children: ReactNode }) {
  const convex = useMemo(() => new ConvexReactClient(convexUrl), []);

  return (
    <ConvexProviderWithAuth client={convex} useAuth={useNextAuthConvex}>
      <UserSync />
      {children}
    </ConvexProviderWithAuth>
  );
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ConvexProviderWithNextAuth>
        {children}
      </ConvexProviderWithNextAuth>
    </SessionProvider>
  );
}
