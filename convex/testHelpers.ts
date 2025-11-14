/**
 * Test Helper Functions
 * Internal mutations for testing and cleanup
 */

import { internalMutation } from "./_generated/server";

/**
 * Delete all events and related data
 * WARNING: This is destructive and should only be used in testing
 */
export const deleteAllEvents = internalMutation({
  args: {},
  handler: async (ctx) => {

    // 1. Delete all tickets
    const tickets = await ctx.db.query("tickets").collect();
    for (const ticket of tickets) {
      await ctx.db.delete(ticket._id);
    }

    // 2. Delete all event staff
    const staff = await ctx.db.query("eventStaff").collect();
    for (const s of staff) {
      await ctx.db.delete(s._id);
    }

    // 3. Delete all ticket tiers
    const tiers = await ctx.db.query("ticketTiers").collect();
    for (const tier of tiers) {
      await ctx.db.delete(tier._id);
    }

    // 4. Delete all staff ticket transfers
    const transfers = await ctx.db.query("staffTicketTransfers").collect();
    for (const transfer of transfers) {
      await ctx.db.delete(transfer._id);
    }

    // 5. Delete all events
    const events = await ctx.db.query("events").collect();
    for (const event of events) {
      await ctx.db.delete(event._id);
    }


    return {
      success: true,
      deletedCounts: {
        tickets: tickets.length,
        staff: staff.length,
        ticketTiers: tiers.length,
        transfers: transfers.length,
        events: events.length,
      },
    };
  },
});

/**
 * Delete all orders (optional - use for complete reset)
 */
export const deleteAllOrders = internalMutation({
  args: {},
  handler: async (ctx) => {

    // Delete all orders
    const orders = await ctx.db.query("orders").collect();
    for (const order of orders) {
      await ctx.db.delete(order._id);
    }


    return {
      success: true,
      deletedCounts: {
        orders: orders.length,
      },
    };
  },
});
