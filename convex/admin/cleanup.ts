/**
 * Admin Cleanup Utilities
 *
 * DANGER: These mutations will permanently delete data!
 */

import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

/**
 * Delete all users except the specified one
 */
export const deleteAllUsersExcept = internalMutation({
  args: {
    keepEmail: v.string(),
  },
  handler: async (ctx, args) => {

    const allUsers = await ctx.db.query("users").collect();
    let deletedCount = 0;

    for (const user of allUsers) {
      if (user.email !== args.keepEmail) {
        await ctx.db.delete(user._id);
        deletedCount++;
      }
    }

    return { deletedCount, kept: args.keepEmail };
  },
});

/**
 * Delete all events
 */
export const deleteAllEvents = internalMutation({
  args: {},
  handler: async (ctx) => {

    const allEvents = await ctx.db.query("events").collect();
    let deletedCount = 0;

    for (const event of allEvents) {
      await ctx.db.delete(event._id);
      deletedCount++;
    }

    return { deletedCount };
  },
});

/**
 * Delete all tickets
 */
export const deleteAllTickets = internalMutation({
  args: {},
  handler: async (ctx) => {

    const allTickets = await ctx.db.query("tickets").collect();
    let deletedCount = 0;

    for (const ticket of allTickets) {
      await ctx.db.delete(ticket._id);
      deletedCount++;
    }

    return { deletedCount };
  },
});

/**
 * Delete all orders
 */
export const deleteAllOrders = internalMutation({
  args: {},
  handler: async (ctx) => {

    const allOrders = await ctx.db.query("orders").collect();
    let deletedCount = 0;

    for (const order of allOrders) {
      await ctx.db.delete(order._id);
      deletedCount++;
    }

    return { deletedCount };
  },
});

/**
 * Delete all event staff
 */
export const deleteAllEventStaff = internalMutation({
  args: {},
  handler: async (ctx) => {

    const allStaff = await ctx.db.query("eventStaff").collect();
    let deletedCount = 0;

    for (const staff of allStaff) {
      await ctx.db.delete(staff._id);
      deletedCount++;
    }

    return { deletedCount };
  },
});

/**
 * Delete all event bundles
 */
export const deleteAllBundles = internalMutation({
  args: {},
  handler: async (ctx) => {

    const allBundles = await ctx.db.query("eventBundles").collect();
    let deletedCount = 0;

    for (const bundle of allBundles) {
      await ctx.db.delete(bundle._id);
      deletedCount++;
    }

    return { deletedCount };
  },
});

/**
 * Delete all settlements
 */
export const deleteAllSettlements = internalMutation({
  args: {},
  handler: async (ctx) => {

    const allSettlements = await ctx.db.query("settlements").collect();
    let deletedCount = 0;

    for (const settlement of allSettlements) {
      await ctx.db.delete(settlement._id);
      deletedCount++;
    }

    return { deletedCount };
  },
});

/**
 * Complete database reset - DELETE EVERYTHING except products and one user
 */
export const completeReset = internalMutation({
  args: {
    keepUserEmail: v.string(),
  },
  handler: async (ctx, args) => {

    const results = {
      users: 0,
      events: 0,
      tickets: 0,
      orders: 0,
      staff: 0,
      bundles: 0,
      settlements: 0,
    };

    // Delete tickets
    const allTickets = await ctx.db.query("tickets").collect();
    for (const ticket of allTickets) {
      await ctx.db.delete(ticket._id);
      results.tickets++;
    }

    // Delete orders
    const allOrders = await ctx.db.query("orders").collect();
    for (const order of allOrders) {
      await ctx.db.delete(order._id);
      results.orders++;
    }

    // Delete event staff
    const allStaff = await ctx.db.query("eventStaff").collect();
    for (const staff of allStaff) {
      await ctx.db.delete(staff._id);
      results.staff++;
    }

    // Delete bundles
    const allBundles = await ctx.db.query("eventBundles").collect();
    for (const bundle of allBundles) {
      await ctx.db.delete(bundle._id);
      results.bundles++;
    }

    // Delete settlements
    const allSettlements = await ctx.db.query("settlements").collect();
    for (const settlement of allSettlements) {
      await ctx.db.delete(settlement._id);
      results.settlements++;
    }

    // Delete events
    const allEvents = await ctx.db.query("events").collect();
    for (const event of allEvents) {
      await ctx.db.delete(event._id);
      results.events++;
    }

    // Delete users except the one to keep
    const allUsers = await ctx.db.query("users").collect();
    for (const user of allUsers) {
      if (user.email !== args.keepUserEmail) {
        await ctx.db.delete(user._id);
        results.users++;
      }
    }


    return results;
  },
});
