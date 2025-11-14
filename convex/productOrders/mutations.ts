import { mutation } from "../_generated/server";
import { v } from "convex/values";

// Create a new product order
export const createProductOrder = mutation({
  args: {
    items: v.array(
      v.object({
        productId: v.id("products"),
        productName: v.string(),
        variantId: v.optional(v.string()),
        variantName: v.optional(v.string()),
        quantity: v.number(),
        price: v.number(),
      })
    ),
    customerEmail: v.string(),
    customerName: v.string(),
    customerPhone: v.optional(v.string()),
    shippingMethod: v.union(v.literal("PICKUP"), v.literal("DELIVERY")),
    shippingAddress: v.object({
      name: v.string(),
      address1: v.string(),
      address2: v.optional(v.string()),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      country: v.string(),
      phone: v.optional(v.string()),
    }),
    pickupLocation: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Generate order number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const orderNumber = `ORD-${timestamp}-${random}`;

    // Calculate totals
    const subtotal = args.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Calculate shipping cost
    let shippingCost = 0;
    if (args.shippingMethod === "DELIVERY") {
      // Sum up shipping costs from all products
      for (const item of args.items) {
        const product = await ctx.db.get(item.productId);
        if (product && product.shippingPrice) {
          shippingCost += product.shippingPrice * item.quantity;
        }
      }
    }

    const taxAmount = 0; // TODO: Calculate tax based on location
    const totalAmount = subtotal + shippingCost + taxAmount;

    // Update inventory for each item
    for (const item of args.items) {
      const product = await ctx.db.get(item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      // Check and update inventory
      if (product.trackInventory) {
        if (item.variantId && product.variants) {
          // Update variant inventory
          const variantIndex = product.variants.findIndex((v) => v.id === item.variantId);
          if (variantIndex >= 0) {
            const variant = product.variants[variantIndex];
            if (variant.inventoryQuantity < item.quantity) {
              throw new Error(
                `Insufficient inventory for ${item.productName} - ${item.variantName}`
              );
            }
            const updatedVariants = [...product.variants];
            updatedVariants[variantIndex] = {
              ...variant,
              inventoryQuantity: variant.inventoryQuantity - item.quantity,
            };
            await ctx.db.patch(item.productId, {
              variants: updatedVariants,
              updatedAt: Date.now(),
            });
          }
        } else {
          // Update main product inventory
          if (product.inventoryQuantity < item.quantity) {
            throw new Error(`Insufficient inventory for ${item.productName}`);
          }
          await ctx.db.patch(item.productId, {
            inventoryQuantity: product.inventoryQuantity - item.quantity,
            updatedAt: Date.now(),
          });
        }
      }
    }

    // Create order
    const orderId = await ctx.db.insert("productOrders", {
      orderNumber,
      customerEmail: args.customerEmail,
      customerName: args.customerName,
      customerPhone: args.customerPhone,
      shippingAddress: args.shippingAddress,
      items: args.items.map((item) => ({
        ...item,
        totalPrice: item.price * item.quantity,
      })),
      subtotal,
      shippingCost,
      taxAmount,
      totalAmount,
      paymentStatus: "PENDING",
      fulfillmentStatus: "PENDING",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { orderId, orderNumber };
  },
});

// Update order fulfillment status
export const updateFulfillmentStatus = mutation({
  args: {
    orderId: v.id("productOrders"),
    fulfillmentStatus: v.union(
      v.literal("PENDING"),
      v.literal("PROCESSING"),
      v.literal("SHIPPED"),
      v.literal("DELIVERED"),
      v.literal("CANCELLED")
    ),
    trackingNumber: v.optional(v.string()),
    trackingUrl: v.optional(v.string()),
    internalNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { orderId, fulfillmentStatus, trackingNumber, trackingUrl, internalNote } = args;

    const updateData: any = {
      fulfillmentStatus,
      updatedAt: Date.now(),
    };

    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }

    if (trackingUrl) {
      updateData.trackingUrl = trackingUrl;
    }

    if (fulfillmentStatus === "SHIPPED") {
      updateData.shippedAt = Date.now();
    }

    if (fulfillmentStatus === "DELIVERED") {
      updateData.deliveredAt = Date.now();
    }

    if (internalNote) {
      updateData.internalNote = internalNote;
    }

    await ctx.db.patch(orderId, updateData);

    return { success: true };
  },
});

// Update payment status
export const updatePaymentStatus = mutation({
  args: {
    orderId: v.id("productOrders"),
    paymentStatus: v.union(
      v.literal("PENDING"),
      v.literal("PAID"),
      v.literal("FAILED"),
      v.literal("REFUNDED")
    ),
    paymentMethod: v.optional(v.string()),
    stripePaymentIntentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { orderId, paymentStatus, paymentMethod, stripePaymentIntentId } = args;

    const updateData: any = {
      paymentStatus,
      updatedAt: Date.now(),
    };

    if (paymentStatus === "PAID") {
      updateData.paidAt = Date.now();
    }

    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    }

    if (stripePaymentIntentId) {
      updateData.stripePaymentIntentId = stripePaymentIntentId;
    }

    await ctx.db.patch(orderId, updateData);

    return { success: true };
  },
});

// Cancel order
export const cancelOrder = mutation({
  args: {
    orderId: v.id("productOrders"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Restore inventory
    for (const item of order.items) {
      const product = await ctx.db.get(item.productId);
      if (product && product.trackInventory) {
        if (item.variantId && product.variants) {
          // Restore variant inventory
          const variantIndex = product.variants.findIndex((v) => v.id === item.variantId);
          if (variantIndex >= 0) {
            const variant = product.variants[variantIndex];
            const updatedVariants = [...product.variants];
            updatedVariants[variantIndex] = {
              ...variant,
              inventoryQuantity: variant.inventoryQuantity + item.quantity,
            };
            await ctx.db.patch(item.productId, {
              variants: updatedVariants,
              updatedAt: Date.now(),
            });
          }
        } else {
          // Restore main product inventory
          await ctx.db.patch(item.productId, {
            inventoryQuantity: product.inventoryQuantity + item.quantity,
            updatedAt: Date.now(),
          });
        }
      }
    }

    // Update order status
    await ctx.db.patch(args.orderId, {
      fulfillmentStatus: "CANCELLED",
      internalNote: args.reason || order.internalNote,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
