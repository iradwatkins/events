import { mutation, query } from "./_generated/server";

/**
 * Debug mutation to test authentication
 */
export const testAuth = mutation({
  args: {},
  handler: async (ctx) => {
    try {

      const identity = await ctx.auth.getUserIdentity();

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
      } catch (e) {
        console.error("[DEBUG] Failed to parse identity:", e);
        userInfo = identity;
      }

      const email = userInfo.email || (identity as any).email;

      if (!email) {
        console.error("[DEBUG] ❌ No email found in identity");
        return {
          success: false,
          error: "No email in identity",
          identity: userInfo,
        };
      }

      // Try to find user
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first();

      if (user) {
      }


      return {
        success: true,
        authenticated: true,
        email,
        userExists: !!user,
        userId: user?._id,
        rawIdentity: identity,
        parsedIdentity: userInfo,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("[DEBUG] ❌ Error in auth test:", err);
      console.error("[DEBUG] Error message:", err.message);
      console.error("[DEBUG] Error stack:", err.stack);

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
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

    const identity = await ctx.auth.getUserIdentity();

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


    const eventsSummary = events.map((e) => ({
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
        DRAFT: events.filter((e) => e.status === "DRAFT").length,
        PUBLISHED: events.filter((e) => e.status === "PUBLISHED").length,
        CANCELLED: events.filter((e) => e.status === "CANCELLED").length,
      },
    };
  },
});
