import { v } from "convex/values";
import { mutation } from "../_generated/server";

/**
 * Generate unique referral code
 */
function generateReferralCode(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomStr}`.toUpperCase();
}

/**
 * Add staff member to an event
 */
export const addStaffMember = mutation({
  args: {
    eventId: v.id("events"),
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    role: v.union(v.literal("SELLER"), v.literal("SCANNER"), v.literal("ASSISTANT")),
    commissionType: v.union(v.literal("PERCENTAGE"), v.literal("FIXED")),
    commissionValue: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const organizer = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!organizer) throw new Error("Organizer not found");

    // Verify event ownership
    const event = await ctx.db.get(args.eventId);
    if (!event || event.organizerId !== organizer._id) {
      throw new Error("Not authorized");
    }

    // Find or create staff user
    let staffUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!staffUser) {
      const userId = await ctx.db.insert("users", {
        email: args.email,
        name: args.name,
        role: "user",
        emailVerified: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      staffUser = await ctx.db.get(userId);
      if (!staffUser) throw new Error("Failed to create staff user");
    }

    // Check if staff already exists for this event
    const existing = await ctx.db
      .query("eventStaff")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("staffUserId"), staffUser!._id))
      .first();

    if (existing) {
      throw new Error("Staff member already added to this event");
    }

    // Create staff record
    const referralCode = generateReferralCode();

    const staffId = await ctx.db.insert("eventStaff", {
      eventId: args.eventId,
      organizerId: organizer._id,
      staffUserId: staffUser._id,
      email: args.email,
      name: args.name,
      phone: args.phone,
      role: args.role,
      commissionType: args.commissionType,
      commissionValue: args.commissionValue,
      commissionEarned: 0,
      isActive: true,
      ticketsSold: 0,
      referralCode,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { staffId, referralCode };
  },
});

/**
 * Remove staff member from event
 */
export const removeStaffMember = mutation({
  args: {
    staffId: v.id("eventStaff"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const staff = await ctx.db.get(args.staffId);
    if (!staff) throw new Error("Staff member not found");

    const organizer = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!organizer || staff.organizerId !== organizer._id) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.staffId);

    return { success: true };
  },
});

/**
 * Invite staff member to sell tickets
 */
export const inviteStaff = mutation({
  args: {
    eventId: v.optional(v.id("events")), // null for all events
    staffEmail: v.string(),
    staffName: v.string(),
    role: v.union(v.literal("SELLER"), v.literal("SCANNER"), v.literal("ASSISTANT")),
    commissionPercent: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const organizer = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!organizer) throw new Error("Organizer not found");

    // If event-specific, verify ownership
    if (args.eventId) {
      const event = await ctx.db.get(args.eventId);
      if (!event || event.organizerId !== organizer._id) {
        throw new Error("Not authorized");
      }
    }

    // Find or create staff user
    let staffUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.staffEmail))
      .first();

    if (!staffUser) {
      // Create basic user account for staff
      const userId = await ctx.db.insert("users", {
        email: args.staffEmail,
        name: args.staffName,
        role: "user",
        emailVerified: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      staffUser = await ctx.db.get(userId);
      if (!staffUser) throw new Error("Failed to create staff user");
    }

    // Check if staff already exists for this event/organizer combo
    const existing = await ctx.db
      .query("eventStaff")
      .withIndex("by_organizer", (q) => q.eq("organizerId", organizer._id))
      .filter((q) => {
        const eventMatch = args.eventId
          ? q.eq(q.field("eventId"), args.eventId)
          : q.eq(q.field("eventId"), undefined);
        const staffMatch = q.eq(q.field("staffUserId"), staffUser!._id);
        return q.and(eventMatch, staffMatch);
      })
      .first();

    if (existing) {
      throw new Error("Staff member already invited for this event");
    }

    // Create staff record
    const referralCode = generateReferralCode();

    const staffId = await ctx.db.insert("eventStaff", {
      eventId: args.eventId,
      organizerId: organizer._id,
      staffUserId: staffUser._id,
      email: args.staffEmail,
      name: args.staffName,
      staffEmail: args.staffEmail,
      staffName: args.staffName,
      role: args.role,
      commissionPercent: args.commissionPercent,
      commissionEarned: 0,
      isActive: true,
      invitedAt: Date.now(),
      ticketsSold: 0,
      referralCode,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // TODO: Send invitation email to staff

    return {
      staffId,
      referralCode,
      success: true,
    };
  },
});

/**
 * Accept staff invitation
 */
export const acceptStaffInvitation = mutation({
  args: {
    staffId: v.id("eventStaff"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    const staff = await ctx.db.get(args.staffId);
    if (!staff) throw new Error("Staff invitation not found");

    if (staff.staffUserId !== user._id) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.staffId, {
      acceptedAt: Date.now(),
      isActive: true,
    });

    return { success: true };
  },
});

/**
 * Update staff commission
 */
export const updateStaffCommission = mutation({
  args: {
    staffId: v.id("eventStaff"),
    commissionPercent: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    const staff = await ctx.db.get(args.staffId);
    if (!staff) throw new Error("Staff not found");

    if (staff.organizerId !== user._id) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.staffId, {
      commissionPercent: args.commissionPercent,
    });

    return { success: true };
  },
});

/**
 * Deactivate staff member
 */
export const deactivateStaff = mutation({
  args: {
    staffId: v.id("eventStaff"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    const staff = await ctx.db.get(args.staffId);
    if (!staff) throw new Error("Staff not found");

    if (staff.organizerId !== user._id) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.staffId, {
      isActive: false,
    });

    return { success: true };
  },
});

/**
 * Reactivate staff member
 */
export const reactivateStaff = mutation({
  args: {
    staffId: v.id("eventStaff"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    const staff = await ctx.db.get(args.staffId);
    if (!staff) throw new Error("Staff not found");

    if (staff.organizerId !== user._id) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.staffId, {
      isActive: true,
    });

    return { success: true };
  },
});

/**
 * Record staff sale (called when order is completed with referral code)
 */
export const recordStaffSale = mutation({
  args: {
    orderId: v.id("orders"),
    referralCode: v.string(),
    ticketsSold: v.number(),
    saleAmount: v.number(), // in cents
  },
  handler: async (ctx, args) => {
    // Find staff by referral code
    const staff = await ctx.db
      .query("eventStaff")
      .withIndex("by_referral_code", (q) => q.eq("referralCode", args.referralCode))
      .first();

    if (!staff) {
      throw new Error("Invalid referral code");
    }

    if (!staff.isActive) {
      throw new Error("Staff member is not active");
    }

    // Get order to verify event match
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    // If staff is event-specific, verify it matches
    if (staff.eventId && staff.eventId !== order.eventId) {
      throw new Error("Staff referral code not valid for this event");
    }

    // Calculate commission
    const commissionAmount = Math.round((args.saleAmount * (staff.commissionPercent || 0)) / 100);

    // Create staff sale record
    await ctx.db.insert("staffSales", {
      orderId: args.orderId,
      eventId: order.eventId,
      staffId: staff._id,
      staffUserId: staff.staffUserId,
      ticketsSold: args.ticketsSold,
      saleAmount: args.saleAmount,
      commissionAmount,
      commissionPercent: staff.commissionPercent || 0,
      soldAt: Date.now(),
    });

    // Update staff totals
    await ctx.db.patch(staff._id, {
      ticketsSold: staff.ticketsSold + args.ticketsSold,
      commissionEarned: staff.commissionEarned + commissionAmount,
    });

    // Update order with commission info
    await ctx.db.patch(args.orderId, {
      staffReferralCode: args.referralCode,
      staffCommission: commissionAmount,
    });

    return {
      success: true,
      commissionAmount,
      commissionDollars: (commissionAmount / 100).toFixed(2),
    };
  },
});

/**
 * Update staff role
 */
export const updateStaffRole = mutation({
  args: {
    staffId: v.id("eventStaff"),
    role: v.union(v.literal("SELLER"), v.literal("SCANNER"), v.literal("ASSISTANT")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    const staff = await ctx.db.get(args.staffId);
    if (!staff) throw new Error("Staff not found");

    if (staff.organizerId !== user._id) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.staffId, {
      role: args.role,
    });

    return { success: true };
  },
});
