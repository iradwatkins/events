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
    shippingPrice: v.optional(v.number()),
    status: v.union(v.literal("ACTIVE"), v.literal("DRAFT"), v.literal("ARCHIVED")),
  },
  handler: async (ctx, args) => {
    // PRODUCTION: Require admin authentication for creating products
    const identity = await ctx.auth.getUserIdentity();

    if (!identity?.email) {
      throw new Error("Authentication required. Please sign in to create products.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .unique();

    if (!user) {
      throw new Error("User account not found. Please contact support.");
    }

    // Only admins can create products
    if (user.role !== "admin") {
      throw new Error("Admin access required. Only administrators can create products.");
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
    shippingPrice: v.optional(v.number()),
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

// Duplicate a product
export const duplicateProduct = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    // Get the original product
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    let user;
    if (!identity) {
      console.warn("[duplicateProduct] TESTING MODE - No authentication, using admin user");
      user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("role"), "admin"))
        .first();

      if (!user) {
        throw new Error("No admin user found for testing");
      }
    } else {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .unique();

      if (!user) {
        throw new Error("User not found");
      }
    }

    // Create a duplicate with modified name and SKU
    const duplicatedProductId = await ctx.db.insert("products", {
      name: `${product.name} (Copy)`,
      description: product.description,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      sku: product.sku ? `${product.sku}-COPY` : undefined,
      inventoryQuantity: product.inventoryQuantity,
      trackInventory: product.trackInventory,
      allowBackorder: product.allowBackorder,
      category: product.category,
      tags: product.tags,
      images: product.images,
      primaryImage: product.primaryImage,
      hasVariants: product.hasVariants,
      variants: product.variants, // Copy variants too
      requiresShipping: product.requiresShipping,
      weight: product.weight,
      status: "DRAFT", // Always create duplicates as drafts
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return duplicatedProductId;
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

// ============================================
// VARIANT MUTATIONS
// ============================================

// Generate all variant combinations from colors and sizes
export const generateVariantCombinations = mutation({
  args: {
    productId: v.id("products"),
    colors: v.array(v.string()), // ["Red", "Blue", "Green"]
    sizes: v.array(v.string()), // ["S", "M", "L"]
    basePrice: v.number(), // Price in cents
    baseSku: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    const variants = [];
    for (const color of args.colors) {
      for (const size of args.sizes) {
        const variantId = `${color.toLowerCase()}-${size.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        variants.push({
          id: variantId,
          name: `${color} / ${size}`,
          options: {
            color,
            size,
          },
          price: args.basePrice, // Each variant gets independent price (can be edited later)
          sku: args.baseSku
            ? `${args.baseSku}-${color.toUpperCase()}-${size.toUpperCase()}`
            : undefined,
          inventoryQuantity: 0, // Default to 0, can be set later
          image: undefined, // No image by default
        });
      }
    }

    await ctx.db.patch(args.productId, {
      hasVariants: true,
      variants,
      updatedAt: Date.now(),
    });

    return { success: true, variantsCreated: variants.length, variants };
  },
});

// Add a single variant to a product
export const addProductVariant = mutation({
  args: {
    productId: v.id("products"),
    variant: v.object({
      name: v.string(),
      options: v.object({
        size: v.optional(v.string()),
        color: v.optional(v.string()),
      }),
      price: v.number(),
      sku: v.optional(v.string()),
      inventoryQuantity: v.number(),
      image: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    const variantId = `${args.variant.options.color?.toLowerCase()}-${args.variant.options.size?.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newVariant = {
      id: variantId,
      ...args.variant,
    };

    const currentVariants = product.variants || [];
    await ctx.db.patch(args.productId, {
      hasVariants: true,
      variants: [...currentVariants, newVariant],
      updatedAt: Date.now(),
    });

    return { success: true, variantId };
  },
});

// Update an existing variant
export const updateProductVariant = mutation({
  args: {
    productId: v.id("products"),
    variantId: v.string(),
    updates: v.object({
      name: v.optional(v.string()),
      price: v.optional(v.number()),
      sku: v.optional(v.string()),
      inventoryQuantity: v.optional(v.number()),
      image: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    if (!product.variants) {
      throw new Error("Product has no variants");
    }

    const updatedVariants = product.variants.map((variant) => {
      if (variant.id === args.variantId) {
        return {
          ...variant,
          ...args.updates,
        };
      }
      return variant;
    });

    await ctx.db.patch(args.productId, {
      variants: updatedVariants,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Delete a variant
export const deleteProductVariant = mutation({
  args: {
    productId: v.id("products"),
    variantId: v.string(),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    if (!product.variants) {
      throw new Error("Product has no variants");
    }

    const updatedVariants = product.variants.filter((v) => v.id !== args.variantId);

    await ctx.db.patch(args.productId, {
      variants: updatedVariants.length > 0 ? updatedVariants : undefined,
      hasVariants: updatedVariants.length > 0,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Update variant inventory
export const updateVariantInventory = mutation({
  args: {
    productId: v.id("products"),
    variantId: v.string(),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    if (!product.variants) {
      throw new Error("Product has no variants");
    }

    const updatedVariants = product.variants.map((variant) => {
      if (variant.id === args.variantId) {
        return {
          ...variant,
          inventoryQuantity: args.quantity,
        };
      }
      return variant;
    });

    await ctx.db.patch(args.productId, {
      variants: updatedVariants,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ============================================
// PRODUCT OPTIONS MUTATIONS
// ============================================

// Add a product option
export const addProductOption = mutation({
  args: {
    productId: v.id("products"),
    option: v.object({
      name: v.string(),
      description: v.optional(v.string()),
      type: v.union(
        v.literal("text"),
        v.literal("textarea"),
        v.literal("number"),
        v.literal("select"),
        v.literal("radio"),
        v.literal("checkbox"),
        v.literal("color"),
        v.literal("date"),
        v.literal("file"),
        v.literal("image_swatch")
      ),
      required: v.boolean(),
      choices: v.optional(
        v.array(
          v.object({
            label: v.string(),
            priceModifier: v.number(),
            image: v.optional(v.string()),
            default: v.optional(v.boolean()),
          })
        )
      ),
      priceModifier: v.optional(v.number()),
      minLength: v.optional(v.number()),
      maxLength: v.optional(v.number()),
      minValue: v.optional(v.number()),
      maxValue: v.optional(v.number()),
      placeholder: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    const optionId = `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const currentOptions = product.options || [];
    const displayOrder = currentOptions.length;

    // Process choices to add IDs
    const choices = args.option.choices?.map((choice, index) => ({
      id: `choice-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      ...choice,
    }));

    const newOption = {
      id: optionId,
      ...args.option,
      choices,
      displayOrder,
    };

    await ctx.db.patch(args.productId, {
      options: [...currentOptions, newOption],
      updatedAt: Date.now(),
    });

    return { success: true, optionId };
  },
});

// Update a product option
export const updateProductOption = mutation({
  args: {
    productId: v.id("products"),
    optionId: v.string(),
    updates: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      required: v.optional(v.boolean()),
      choices: v.optional(
        v.array(
          v.object({
            id: v.optional(v.string()),
            label: v.string(),
            priceModifier: v.number(),
            image: v.optional(v.string()),
            default: v.optional(v.boolean()),
          })
        )
      ),
      priceModifier: v.optional(v.number()),
      minLength: v.optional(v.number()),
      maxLength: v.optional(v.number()),
      minValue: v.optional(v.number()),
      maxValue: v.optional(v.number()),
      placeholder: v.optional(v.string()),
      displayOrder: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    if (!product.options) {
      throw new Error("Product has no options");
    }

    const updatedOptions = product.options.map((option) => {
      if (option.id === args.optionId) {
        // Process choices if updated
        let choices = option.choices;
        if (args.updates.choices) {
          choices = args.updates.choices.map((choice, index) => ({
            id:
              choice.id ||
              `choice-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
            label: choice.label,
            priceModifier: choice.priceModifier,
            image: choice.image,
            default: choice.default,
          }));
        }

        return {
          ...option,
          ...args.updates,
          choices,
        };
      }
      return option;
    });

    await ctx.db.patch(args.productId, {
      options: updatedOptions,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Delete a product option
export const deleteProductOption = mutation({
  args: {
    productId: v.id("products"),
    optionId: v.string(),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    if (!product.options) {
      throw new Error("Product has no options");
    }

    const updatedOptions = product.options.filter((opt) => opt.id !== args.optionId);

    await ctx.db.patch(args.productId, {
      options: updatedOptions.length > 0 ? updatedOptions : undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Reorder product options
export const reorderProductOptions = mutation({
  args: {
    productId: v.id("products"),
    optionIds: v.array(v.string()), // Array of option IDs in new order
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    if (!product.options) {
      throw new Error("Product has no options");
    }

    // Create a map for quick lookup
    const optionsMap = new Map(product.options.map((opt) => [opt.id, opt]));

    // Reorder based on the provided array
    const reorderedOptions = args.optionIds.map((id, index) => {
      const option = optionsMap.get(id);
      if (!option) {
        throw new Error(`Option ${id} not found`);
      }
      return {
        ...option,
        displayOrder: index,
      };
    });

    await ctx.db.patch(args.productId, {
      options: reorderedOptions,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
