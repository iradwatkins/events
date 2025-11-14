/**
 * Cash Payment Cron Jobs
 * Internal mutations called by scheduled cron jobs
 */

import { internalMutation } from "../_generated/server";

/**
 * Expire cash orders that have passed their 30-minute hold
 * Called by cron job every 5 minutes
 */
export const expireCashOrders = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();


    // Find all pending cash orders with expired holds
    const allPendingOrders = await ctx.db
      .query("orders")
      .filter((q) => q.eq(q.field("status"), "PENDING_CASH_PAYMENT"))
      .collect();

    // Filter by expired hold time
    const expiredOrders = allPendingOrders.filter(
      (order) => order.holdExpiresAt && order.holdExpiresAt < now
    );


    let expiredCount = 0;
    let ticketsReleasedCount = 0;

    for (const order of expiredOrders) {
      // Update order status to EXPIRED
      await ctx.db.patch(order._id, {
        status: "EXPIRED",
        updatedAt: now,
      });

      // Update all tickets to EXPIRED status
      const tickets = await ctx.db
        .query("tickets")
        .withIndex("by_order", (q) => q.eq("orderId", order._id))
        .collect();

      for (const ticket of tickets) {
        await ctx.db.patch(ticket._id, {
          status: "EXPIRED",
          updatedAt: now,
        });
      }

      ticketsReleasedCount += tickets.length;
      expiredCount++;

    }


    return {
      success: true,
      expiredCount,
      ticketsReleasedCount,
    };
  },
});
