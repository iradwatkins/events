import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get all staff members for an event
 */
export const getEventStaff = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    // TESTING MODE: Return all staff for testing
    if (!identity) {
      console.warn("[getEventStaff] TESTING MODE - Returning all staff");
    }

    const staffMembers = await ctx.db
      .query("eventStaff")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    return staffMembers.map((staff) => ({
      ...staff,
      ticketsRemaining: (staff.allocatedTickets || 0) - staff.ticketsSold,
      netPayout: staff.commissionEarned - (staff.cashCollected || 0),
    }));
  },
});

/**
 * Get staff member details with sales statistics
 */
export const getStaffMemberDetails = query({
  args: {
    staffId: v.id("eventStaff"),
  },
  handler: async (ctx, args) => {
    const staffMember = await ctx.db.get(args.staffId);
    if (!staffMember) {
      throw new Error("Staff member not found");
    }

    // Get sales breakdown by payment method
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_staff", (q) => q.eq("soldByStaffId", args.staffId))
      .collect();

    const onlineSales = tickets.filter((t) => t.paymentMethod === "ONLINE" || t.paymentMethod === "SQUARE" || t.paymentMethod === "STRIPE").length;
    const cashSales = tickets.filter((t) => t.paymentMethod === "CASH").length;
    const cashAppSales = tickets.filter((t) => t.paymentMethod === "CASH_APP").length;

    const ticketsRemaining = (staffMember.allocatedTickets || 0) - staffMember.ticketsSold;
    const netPayout = staffMember.commissionEarned - (staffMember.cashCollected || 0);

    return {
      ...staffMember,
      ticketsRemaining,
      netPayout,
      salesBreakdown: {
        online: onlineSales,
        cash: cashSales,
        cashApp: cashAppSales,
        total: staffMember.ticketsSold,
      },
    };
  },
});

/**
 * Get staff sales history
 */
export const getStaffSales = query({
  args: {
    staffId: v.id("eventStaff"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const sales = await ctx.db
      .query("staffSales")
      .withIndex("by_staff", (q) => q.eq("staffId", args.staffId))
      .order("desc")
      .take(limit);

    return sales;
  },
});

/**
 * Get staff dashboard data for a staff member
 */
export const getStaffDashboard = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    // TESTING MODE: Use test user if not authenticated
    let currentUser;
    if (!identity) {
      console.warn("[getStaffDashboard] TESTING MODE - Using test user");
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", "test@stepperslife.com"))
        .first();
    } else {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();
    }

    if (!currentUser) {
      return [];
    }

    // Get all staff positions for this user
    const staffPositions = await ctx.db
      .query("eventStaff")
      .withIndex("by_staff_user", (q) => q.eq("staffUserId", currentUser._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Enrich with event details
    const enrichedPositions = await Promise.all(
      staffPositions.map(async (staff) => {
        const event = staff.eventId ? await ctx.db.get(staff.eventId) : null;
        
        return {
          _id: staff._id,
          event: event ? {
            _id: event._id,
            name: event.name,
            startDate: event.startDate,
            imageUrl: event.imageUrl,
          } : null,
          role: staff.role,
          allocatedTickets: staff.allocatedTickets || 0,
          ticketsSold: staff.ticketsSold,
          ticketsRemaining: (staff.allocatedTickets || 0) - staff.ticketsSold,
          commissionEarned: staff.commissionEarned,
          cashCollected: staff.cashCollected || 0,
          netPayout: staff.commissionEarned - (staff.cashCollected || 0),
          referralCode: staff.referralCode,
          commissionType: staff.commissionType,
          commissionValue: staff.commissionValue,
        };
      })
    );

    return enrichedPositions.filter((p) => p.event !== null);
  },
});

/**
 * Get staff member by referral code (for tracking sales)
 */
export const getStaffByReferralCode = query({
  args: {
    referralCode: v.string(),
  },
  handler: async (ctx, args) => {
    const staffMember = await ctx.db
      .query("eventStaff")
      .withIndex("by_referral_code", (q) => q.eq("referralCode", args.referralCode))
      .first();

    if (!staffMember || !staffMember.isActive) {
      return null;
    }

    return {
      _id: staffMember._id,
      eventId: staffMember.eventId,
      name: staffMember.name,
      commissionType: staffMember.commissionType,
      commissionValue: staffMember.commissionValue,
    };
  },
});

/**
 * Get organizer's staff performance summary
 */
export const getOrganizerStaffSummary = query({
  args: {
    eventId: v.optional(v.id("events")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    // TESTING MODE: Use test user if not authenticated
    let currentUser;
    if (!identity) {
      console.warn("[getOrganizerStaffSummary] TESTING MODE - Using test user");
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", "test@stepperslife.com"))
        .first();
    } else {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();
    }

    if (!currentUser) {
      throw new Error("User not found");
    }

    let staffQuery = ctx.db
      .query("eventStaff")
      .withIndex("by_organizer", (q) => q.eq("organizerId", currentUser._id));

    if (args.eventId) {
      // Get staff for specific event
      staffQuery = ctx.db
        .query("eventStaff")
        .withIndex("by_event", (q) => q.eq("eventId", args.eventId));
    }

    const allStaff = await staffQuery.collect();

    const activeStaff = allStaff.filter((s) => s.isActive);
    const totalCommissionEarned = activeStaff.reduce((sum, s) => sum + s.commissionEarned, 0);
    const totalCashCollected = activeStaff.reduce((sum, s) => sum + (s.cashCollected || 0), 0);
    const totalTicketsSold = activeStaff.reduce((sum, s) => sum + s.ticketsSold, 0);

    return {
      totalStaff: activeStaff.length,
      totalTicketsSold,
      totalCommissionEarned,
      totalCashCollected,
      netPayoutOwed: totalCommissionEarned - totalCashCollected,
      topPerformers: activeStaff
        .sort((a, b) => b.ticketsSold - a.ticketsSold)
        .slice(0, 5)
        .map((s) => ({
          name: s.name,
          ticketsSold: s.ticketsSold,
          commissionEarned: s.commissionEarned,
        })),
    };
  },
});
