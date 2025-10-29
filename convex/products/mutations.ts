import { mutation } from "../_generated/server";
import { v } from "convex/values";

// Create a new product
export const createProduct = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    price: v.number(),
    compareAtPrice: v.optional(v.number()),
    sku: v.optional(v.string()),
    inventoryQuantity: v.number(),
    trackInventory: v.boolean(),
    allowBackorder: v.optional(v.boolean()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    images: v.optional(v.array(v.string())),
    primaryImage: v.optional(v.string()),
    hasVariants: v.boolean(),
    requiresShipping: v.boolean(),
    weight: v.optional(v.number()),
    status: v.union(v.literal("ACTIVE"), v.literal("DRAFT"), v.literal("ARCHIVED")),
  },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Create product
    const productId = await ctx.db.insert("products", {
      ...args,
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return productId;
  },
});

// Update a product
export const updateProduct = mutation({
  args: {
    productId: v.id("products"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    compareAtPrice: v.optional(v.number()),
    sku: v.optional(v.string()),
    inventoryQuantity: v.optional(v.number()),
    trackInventory: v.optional(v.boolean()),
    allowBackorder: v.optional(v.boolean()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    images: v.optional(v.array(v.string())),
    primaryImage: v.optional(v.string()),
    hasVariants: v.optional(v.boolean()),
    requiresShipping: v.optional(v.boolean()),
    weight: v.optional(v.number()),
    status: v.optional(v.union(v.literal("ACTIVE"), v.literal("DRAFT"), v.literal("ARCHIVED"))),
  },
  handler: async (ctx, args) => {
    const { productId, ...updates } = args;

    // Get product
    const product = await ctx.db.get(productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Update product
    await ctx.db.patch(productId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return productId;
  },
});

// Delete a product
export const deleteProduct = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    await ctx.db.delete(args.productId);
    return { success: true };
  },
});

// Update inventory quantity
export const updateInventory = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    await ctx.db.patch(args.productId, {
      inventoryQuantity: args.quantity,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
