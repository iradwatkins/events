import { mutation, query } from "./_generated/server";

/**
 * Debug mutation to test authentication
 */
export const testAuth = mutation({
  args: {},
  handler: async (ctx) => {
    try {
      console.log("[DEBUG] Starting auth test...");

      const identity = await ctx.auth.getUserIdentity();
      console.log("[DEBUG] Raw identity:", identity);
      console.log("[DEBUG] Identity type:", typeof identity);
      console.log("[DEBUG] Identity JSON:", JSON.stringify(identity, null, 2));

      if (!identity) {
        console.error("[DEBUG] ❌ No identity - user not authenticated");
        return {
          success: false,
          error: "Not authenticated",
          identity: null,
        };
      }

      // Try to parse if it's a string
      let userInfo;
      try {
        userInfo = typeof identity === "string" ? JSON.parse(identity) : identity;
        console.log("[DEBUG] Parsed userInfo:", JSON.stringify(userInfo, null, 2));
      } catch (e) {
        console.error("[DEBUG] Failed to parse identity:", e);
        userInfo = identity;
      }

      const email = userInfo.email || (identity as any).email;
      console.log("[DEBUG] Extracted email:", email);

      if (!email) {
        console.error("[DEBUG] ❌ No email found in identity");
        return {
          success: false,
          error: "No email in identity",
          identity: userInfo,
        };
      }

      // Try to find user
      console.log("[DEBUG] Looking up user with email:", email);
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first();

      console.log("[DEBUG] User found:", user ? "YES" : "NO");
      if (user) {
        console.log("[DEBUG] User ID:", user._id);
        console.log("[DEBUG] User email:", user.email);
      }

      console.log("[DEBUG] ✅ Auth test completed successfully");

      return {
        success: true,
        authenticated: true,
        email,
        userExists: !!user,
        userId: user?._id,
        rawIdentity: identity,
        parsedIdentity: userInfo,
      };
    } catch (error: any) {
      console.error("[DEBUG] ❌ Error in auth test:", error);
      console.error("[DEBUG] Error message:", error.message);
      console.error("[DEBUG] Error stack:", error.stack);

      return {
        success: false,
        error: error.message,
        errorStack: error.stack,
      };
    }
  },
});

/**
 * Debug query to test read access
 */
export const testQuery = query({
  args: {},
  handler: async (ctx) => {
    console.log("[DEBUG QUERY] Testing query access...");

    const identity = await ctx.auth.getUserIdentity();
    console.log("[DEBUG QUERY] Identity:", identity ? "EXISTS" : "NULL");

    return {
      hasIdentity: !!identity,
      timestamp: Date.now(),
    };
  },
});

/**
 * Debug query to list all events in database
 */
export const listAllEvents = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db.query("events").collect();

    console.log(`[DEBUG] Found ${events.length} total events in database`);

    const eventsSummary = events.map(e => ({
      id: e._id,
      name: e.name,
      status: e.status,
      organizerId: e.organizerId,
      createdAt: e.createdAt,
      hasImage: !!e.imageUrl || (e.images && e.images.length > 0),
    }));

    return {
      total: events.length,
      events: eventsSummary,
      byStatus: {
        DRAFT: events.filter(e => e.status === "DRAFT").length,
        PUBLISHED: events.filter(e => e.status === "PUBLISHED").length,
        CANCELLED: events.filter(e => e.status === "CANCELLED").length,
      }
    };
  },
});
