import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Generate an upload URL for file uploads (images, etc.)
 */
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

/**
 * Get a public URL for a stored file
 */
export const getImageUrl = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

/**
 * Get a public URL for a stored file (query version)
 */
export const getImageUrlQuery = query({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
