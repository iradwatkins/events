import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get recent uploaded flyers for admin dashboard
 */
export const getRecentFlyers = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 8;

    const flyers = await ctx.db
      .query("uploadedFlyers")
      .order("desc")
      .take(limit);

    return flyers;
  },
});

/**
 * Get a single flyer by ID
 */
export const getFlyerById = query({
  args: {
    flyerId: v.id("uploadedFlyers"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.flyerId);
  },
});
