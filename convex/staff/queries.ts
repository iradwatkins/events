import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get all staff for a specific event
 */
export const getEventStaff = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const staff = await ctx.db
      .query("eventStaff")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    return staff;
  },
});

/**
 * Get all staff for an organizer
 */
export const getOrganizerStaff = query({
  args: {
    organizerId: v.id("users"),
    eventId: v.optional(v.id("events")),
  },
  handler: async (ctx, args) => {
    let staffQuery = ctx.db
      .query("eventStaff")
      .withIndex("by_organizer", (q) => q.eq("organizerId", args.organizerId));

    const allStaff = await staffQuery.collect();

    // Filter by event if specified
    const filtered = args.eventId
      ? allStaff.filter((s) => s.eventId === args.eventId || !s.eventId)
      : allStaff;

    return filtered;
  },
});

/**
 * Get current user's staff assignments
 */
export const getMyStaffAssignments = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) return [];

    const staffAssignments = await ctx.db
      .query("eventStaff")
      .withIndex("by_staff_user", (q) => q.eq("staffUserId", user._id))
      .collect();

    // Enrich with event and organizer details
    const enriched = await Promise.all(
      staffAssignments.map(async (staff) => {
        const organizer = await ctx.db.get(staff.organizerId);
        const event = staff.eventId ? await ctx.db.get(staff.eventId) : null;

        return {
          ...staff,
          organizer,
          event,
        };
      })
    );

    return enriched;
  },
});

/**
 * Get staff member by referral code
 */
export const getStaffByReferralCode = query({
  args: {
    referralCode: v.string(),
  },
  handler: async (ctx, args) => {
    const staff = await ctx.db
      .query("eventStaff")
      .withIndex("by_referral_code", (q) => q.eq("referralCode", args.referralCode))
      .first();

    if (!staff) return null;

    const organizer = await ctx.db.get(staff.organizerId);
    const event = staff.eventId ? await ctx.db.get(staff.eventId) : null;

    return {
      ...staff,
      organizer,
      event,
    };
  },
});

/**
 * Get staff sales for a staff member
 */
export const getStaffSales = query({
  args: {
    staffId: v.id("eventStaff"),
  },
  handler: async (ctx, args) => {
    const sales = await ctx.db
      .query("staffSales")
      .withIndex("by_staff", (q) => q.eq("staffId", args.staffId))
      .order("desc")
      .collect();

    // Enrich with event details
    const enriched = await Promise.all(
      sales.map(async (sale) => {
        const event = await ctx.db.get(sale.eventId);
        const order = await ctx.db.get(sale.orderId);
        return {
          ...sale,
          event,
          order,
        };
      })
    );

    return enriched;
  },
});

/**
 * Get staff leaderboard for event
 */
export const getStaffLeaderboard = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const allStaff = await ctx.db
      .query("eventStaff")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    // Include all-events staff for this organizer
    const event = await ctx.db.get(args.eventId);
    if (!event) return [];

    const globalStaff = await ctx.db
      .query("eventStaff")
      .withIndex("by_organizer", (q) => q.eq("organizerId", event.organizerId))
      .filter((q) => q.eq(q.field("eventId"), undefined))
      .collect();

    const combinedStaff = [...allStaff, ...globalStaff];

    // Get sales for each staff member for this event
    const leaderboard = await Promise.all(
      combinedStaff.map(async (staff) => {
        const sales = await ctx.db
          .query("staffSales")
          .withIndex("by_staff", (q) => q.eq("staffId", staff._id))
          .filter((q) => q.eq(q.field("eventId"), args.eventId))
          .collect();

        const totalSales = sales.reduce((sum, s) => sum + s.saleAmount, 0);
        const totalCommission = sales.reduce((sum, s) => sum + s.commissionAmount, 0);
        const totalTickets = sales.reduce((sum, s) => sum + s.ticketsSold, 0);

        return {
          ...staff,
          stats: {
            totalSales,
            totalSalesDollars: (totalSales / 100).toFixed(2),
            totalCommission,
            totalCommissionDollars: (totalCommission / 100).toFixed(2),
            totalTickets,
            salesCount: sales.length,
          },
        };
      })
    );

    // Sort by tickets sold
    return leaderboard.sort((a, b) => b.stats.totalTickets - a.stats.totalTickets);
  },
});

/**
 * Get staff analytics for organizer
 */
export const getStaffAnalytics = query({
  args: {
    organizerId: v.id("users"),
    eventId: v.optional(v.id("events")),
  },
  handler: async (ctx, args) => {
    // Get all staff for organizer
    let staffQuery = ctx.db
      .query("eventStaff")
      .withIndex("by_organizer", (q) => q.eq("organizerId", args.organizerId));

    const allStaff = await staffQuery.collect();

    // Get all sales
    let allSales;
    if (args.eventId) {
      const eventId = args.eventId; // TypeScript type narrowing
      allSales = await ctx.db
        .query("staffSales")
        .withIndex("by_event", (q) => q.eq("eventId", eventId))
        .collect();
    } else {
      allSales = await ctx.db.query("staffSales").collect();
    }

    // Filter sales by organizer's staff
    const staffIds = new Set(allStaff.map((s) => s._id));
    const relevantSales = allSales.filter((s) => staffIds.has(s.staffId));

    // Calculate totals
    const totalSales = relevantSales.reduce((sum, s) => sum + s.saleAmount, 0);
    const totalCommission = relevantSales.reduce((sum, s) => sum + s.commissionAmount, 0);
    const totalTickets = relevantSales.reduce((sum, s) => sum + s.ticketsSold, 0);

    // Active vs inactive staff
    const activeStaff = allStaff.filter((s) => s.isActive).length;
    const inactiveStaff = allStaff.filter((s) => !s.isActive).length;

    // Staff with sales
    const staffWithSales = new Set(relevantSales.map((s) => s.staffId)).size;

    return {
      totalStaff: allStaff.length,
      activeStaff,
      inactiveStaff,
      staffWithSales,
      totalSales,
      totalSalesDollars: (totalSales / 100).toFixed(2),
      totalCommission,
      totalCommissionDollars: (totalCommission / 100).toFixed(2),
      totalTickets,
      averageCommissionPercent:
        allStaff.length > 0
          ? allStaff.reduce((sum, s) => sum + s.commissionPercent, 0) / allStaff.length
          : 0,
    };
  },
});

/**
 * Get my staff performance (for staff member view)
 */
export const getMyPerformance = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) return null;

    // Get all my staff assignments
    const staffAssignments = await ctx.db
      .query("eventStaff")
      .withIndex("by_staff_user", (q) => q.eq("staffUserId", user._id))
      .collect();

    if (staffAssignments.length === 0) return null;

    // Get all my sales
    const allSales = await ctx.db
      .query("staffSales")
      .withIndex("by_staff_user", (q) => q.eq("staffUserId", user._id))
      .collect();

    // Calculate totals
    const totalTickets = allSales.reduce((sum, s) => sum + s.ticketsSold, 0);
    const totalSales = allSales.reduce((sum, s) => sum + s.saleAmount, 0);
    const totalCommission = allSales.reduce((sum, s) => sum + s.commissionAmount, 0);

    // Group by event
    const salesByEvent = new Map<string, typeof allSales>();
    allSales.forEach((sale) => {
      const eventId = sale.eventId;
      if (!salesByEvent.has(eventId)) {
        salesByEvent.set(eventId, []);
      }
      salesByEvent.get(eventId)!.push(sale);
    });

    const eventStats = await Promise.all(
      Array.from(salesByEvent.entries()).map(async ([eventId, sales]) => {
        const event = await ctx.db.get(eventId as any);
        const eventTotal = sales.reduce((sum, s) => sum + s.saleAmount, 0);
        const eventCommission = sales.reduce((sum, s) => sum + s.commissionAmount, 0);
        const eventTickets = sales.reduce((sum, s) => sum + s.ticketsSold, 0);

        return {
          event,
          totalSales: eventTotal,
          totalCommission: eventCommission,
          totalTickets: eventTickets,
          salesCount: sales.length,
        };
      })
    );

    return {
      totalAssignments: staffAssignments.length,
      totalTickets,
      totalSales,
      totalSalesDollars: (totalSales / 100).toFixed(2),
      totalCommission,
      totalCommissionDollars: (totalCommission / 100).toFixed(2),
      salesCount: allSales.length,
      eventStats,
    };
  },
});

/**
 * Validate referral code
 */
export const validateReferralCode = query({
  args: {
    referralCode: v.string(),
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const staff = await ctx.db
      .query("eventStaff")
      .withIndex("by_referral_code", (q) => q.eq("referralCode", args.referralCode))
      .first();

    if (!staff) {
      return { valid: false, reason: "Invalid referral code" };
    }

    if (!staff.isActive) {
      return { valid: false, reason: "Staff member is not active" };
    }

    // If staff is event-specific, verify event match
    if (staff.eventId && staff.eventId !== args.eventId) {
      return { valid: false, reason: "Referral code not valid for this event" };
    }

    return {
      valid: true,
      staff: {
        name: staff.staffName,
        commissionPercent: staff.commissionPercent,
      },
    };
  },
});
