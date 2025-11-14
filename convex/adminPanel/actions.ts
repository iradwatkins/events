"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";

/**
 * Refund order (admin action - calls Square API + updates database)
 */
export const refundOrder = action({
  args: {
    orderId: v.id("orders"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; ticketsRefunded: number }> => {
    // Get order details
    const order = await ctx.runQuery(internal.adminPanel.queries.getOrderForRefund, {
      orderId: args.orderId,
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status !== "COMPLETED") {
      throw new Error("Can only refund completed orders");
    }

    // Process actual refund via Square API if payment exists
    if (order.paymentMethod === "SQUARE" && order.paymentId) {
      const refundResult = await ctx.runAction(
        (internal as any).payments.actions.processSquareRefund,
        {
          paymentId: order.paymentId,
          amountCents: order.totalCents,
          orderId: args.orderId,
          reason: args.reason,
        }
      );

      if (!refundResult.success) {
        throw new Error(`Refund processing failed: ${refundResult.error}`);
      }
    } else if (!order.paymentId) {
      console.warn("[Refund] No payment ID found - marking as refunded without processing payment");
    }

    // Update database to mark order and tickets as refunded
    const result = await ctx.runMutation(internal.adminPanel.mutations.markOrderRefunded, {
      orderId: args.orderId,
    });

    return result;
  },
});
