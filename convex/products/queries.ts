import { query } from "../_generated/server";
import { v } from "convex/values";

// Get all products (for admin)
export const getAllProducts = query({
  args: {
    status: v.optional(v.union(v.literal("ACTIVE"), v.literal("DRAFT"), v.literal("ARCHIVED"))),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      const products = await ctx.db
        .query("products")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
      return products;
    }

    const products = await ctx.db.query("products").order("desc").collect();
    return products;
  },
});

// Get active products only (for customers)
export const getActiveProducts = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_status", (q) => q.eq("status", "ACTIVE"))
      .order("desc")
      .collect();

    return products;
  },
});

// Get single product by ID
export const getProductById = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    return product;
  },
});

// Get products by category
export const getProductsByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => q.eq(q.field("status"), "ACTIVE"))
      .order("desc")
      .collect();

    return products;
  },
});
