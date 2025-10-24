import { mutation } from "./_generated/server";

/**
 * Clear all old test data that doesn't match the new schema
 * This is a one-time migration function
 */
export const clearAllData = mutation({
  args: {},
  handler: async (ctx) => {
    const results = {
      ticketsDeleted: 0,
      ordersDeleted: 0,
      orderItemsDeleted: 0,
      ticketTiersDeleted: 0,
      eventsDeleted: 0,
    };

    // Delete all tickets (old schema)
    const tickets = await ctx.db.query("tickets").collect();
    for (const ticket of tickets) {
      await ctx.db.delete(ticket._id);
      results.ticketsDeleted++;
    }

    // Delete all orderItems if any exist
    try {
      const orderItems = await ctx.db.query("orderItems").collect();
      for (const item of orderItems) {
        await ctx.db.delete(item._id);
        results.orderItemsDeleted++;
      }
    } catch (e) {
      // Table might not exist yet
    }

    // Delete all ticketTiers if any exist
    try {
      const tiers = await ctx.db.query("ticketTiers").collect();
      for (const tier of tiers) {
        await ctx.db.delete(tier._id);
        results.ticketTiersDeleted++;
      }
    } catch (e) {
      // Table might not exist yet
    }

    // Delete all orders
    const orders = await ctx.db.query("orders").collect();
    for (const order of orders) {
      await ctx.db.delete(order._id);
      results.ordersDeleted++;
    }

    // Delete all events (they reference old ticket structure)
    const events = await ctx.db.query("events").collect();
    for (const event of events) {
      await ctx.db.delete(event._id);
      results.eventsDeleted++;
    }

    return results;
  },
});
