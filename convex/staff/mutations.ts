import { v } from "convex/values";
import { mutation } from "../_generated/server";

/**
 * Generate a unique referral code for a staff member
 */
function generateReferralCode(name: string): string {
  const namePart = name
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 6)
    .toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${namePart}${randomPart}`;
}

/**
 * Add a new staff member to an event
 */
export const addStaffMember = mutation({
  args: {
    eventId: v.id("events"),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    role: v.union(v.literal("SELLER"), v.literal("SCANNER")),
    canScan: v.optional(v.boolean()), // Sellers can also scan if approved
    commissionType: v.optional(v.union(v.literal("PERCENTAGE"), v.literal("FIXED"))),
    commissionValue: v.optional(v.number()),
    allocatedTickets: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    // TESTING MODE: Use test user if not authenticated
    let currentUser;
    if (!identity) {
      console.warn("[addStaffMember] TESTING MODE - Using test user");
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
      throw new Error("User not found. Please log in.");
    }

    // Verify user is the event organizer
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.organizerId !== currentUser._id && currentUser.role !== "admin") {
      throw new Error("Only the event organizer can add staff members");
    }

    // Check if staff user exists, create if not
    let staffUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!staffUser) {
      // Create new user for this staff member
      const newUserId = await ctx.db.insert("users", {
        email: args.email,
        name: args.name,
        role: "user",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      staffUser = await ctx.db.get(newUserId);
    }

    // Generate unique referral code
    let referralCode = generateReferralCode(args.name);
    let attempts = 0;
    while (attempts < 10) {
      const existing = await ctx.db
        .query("eventStaff")
        .withIndex("by_referral_code", (q) => q.eq("referralCode", referralCode))
        .first();

      if (!existing) break;
      referralCode = generateReferralCode(args.name);
      attempts++;
    }

    // Create staff member record
    const staffId = await ctx.db.insert("eventStaff", {
      eventId: args.eventId,
      organizerId: currentUser._id,
      staffUserId: staffUser!._id,
      email: args.email,
      name: args.name,
      phone: args.phone,
      role: args.role,
      canScan: args.canScan || (args.role === "SCANNER"), // Scanners can always scan, sellers only if approved
      commissionType: args.commissionType,
      commissionValue: args.commissionValue,
      commissionPercent: args.commissionType === "PERCENTAGE" ? args.commissionValue : undefined,
      commissionEarned: 0,
      allocatedTickets: args.allocatedTickets,
      cashCollected: 0,
      isActive: true,
      ticketsSold: 0,
      referralCode,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      staffId,
      referralCode,
    };
  },
});

/**
 * Update staff member details
 */
export const updateStaffMember = mutation({
  args: {
    staffId: v.id("eventStaff"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    canScan: v.optional(v.boolean()), // Allow updating scan permissions
    commissionType: v.optional(v.union(v.literal("PERCENTAGE"), v.literal("FIXED"))),
    commissionValue: v.optional(v.number()),
    allocatedTickets: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    // TESTING MODE: Use test user if not authenticated
    let currentUser;
    if (!identity) {
      console.warn("[updateStaffMember] TESTING MODE - Using test user");
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
      throw new Error("User not found. Please log in.");
    }

    const staffMember = await ctx.db.get(args.staffId);
    if (!staffMember) {
      throw new Error("Staff member not found");
    }

    // Verify user is the organizer
    if (staffMember.organizerId !== currentUser._id && currentUser.role !== "admin") {
      throw new Error("Only the organizer can update staff members");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.phone !== undefined) updates.phone = args.phone;
    if (args.canScan !== undefined) updates.canScan = args.canScan;
    if (args.commissionType !== undefined) updates.commissionType = args.commissionType;
    if (args.commissionValue !== undefined) {
      updates.commissionValue = args.commissionValue;
      if (args.commissionType === "PERCENTAGE") {
        updates.commissionPercent = args.commissionValue;
      }
    }
    if (args.allocatedTickets !== undefined) updates.allocatedTickets = args.allocatedTickets;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.staffId, updates);

    return { success: true };
  },
});

/**
 * Register a cash sale for a staff member
 */
export const registerCashSale = mutation({
  args: {
    ticketCode: v.string(),
    staffId: v.id("eventStaff"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    // TESTING MODE: Use test user if not authenticated
    let currentUser;
    if (!identity) {
      console.warn("[registerCashSale] TESTING MODE - Using test user");
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
      throw new Error("User not found. Please log in.");
    }

    const staffMember = await ctx.db.get(args.staffId);
    if (!staffMember) {
      throw new Error("Staff member not found");
    }

    // Verify current user is the staff member or organizer
    if (staffMember.staffUserId !== currentUser._id && staffMember.organizerId !== currentUser._id) {
      throw new Error("Unauthorized to register cash sales for this staff member");
    }

    // Find the ticket
    const ticket = await ctx.db
      .query("tickets")
      .withIndex("by_ticket_code", (q) => q.eq("ticketCode", args.ticketCode))
      .first();

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    if (ticket.paymentMethod) {
      throw new Error("This ticket has already been paid for");
    }

    // Get ticket tier for pricing
    const tier = ticket.ticketTierId ? await ctx.db.get(ticket.ticketTierId) : null;
    const ticketPrice = tier?.price || 0;

    // Calculate commission
    let commissionAmount = 0;
    if (staffMember.commissionType === "PERCENTAGE" && staffMember.commissionPercent) {
      commissionAmount = Math.round((ticketPrice * staffMember.commissionPercent) / 100);
    } else if (staffMember.commissionType === "FIXED" && staffMember.commissionValue) {
      commissionAmount = staffMember.commissionValue;
    }

    // Update ticket with staff and payment info
    await ctx.db.patch(ticket._id, {
      soldByStaffId: args.staffId,
      staffCommissionAmount: commissionAmount,
      paymentMethod: "CASH",
      updatedAt: Date.now(),
    });

    // Update staff member's cash collected and commission earned
    await ctx.db.patch(args.staffId, {
      cashCollected: (staffMember.cashCollected || 0) + ticketPrice,
      commissionEarned: staffMember.commissionEarned + commissionAmount,
      ticketsSold: staffMember.ticketsSold + 1,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      ticketPrice,
      commissionAmount,
      cashCollected: (staffMember.cashCollected || 0) + ticketPrice,
    };
  },
});

/**
 * Create a new cash/in-person sale
 */
export const createCashSale = mutation({
  args: {
    staffId: v.id("eventStaff"),
    eventId: v.id("events"),
    ticketTierId: v.id("ticketTiers"),
    quantity: v.number(),
    buyerName: v.string(),
    buyerEmail: v.optional(v.string()),
    paymentMethod: v.union(v.literal("CASH"), v.literal("CASH_APP")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    // TESTING MODE: Use test user if not authenticated
    let currentUser;
    if (!identity) {
      console.warn("[createCashSale] TESTING MODE - Using test user");
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
      throw new Error("User not found. Please log in.");
    }

    // Verify staff member exists
    const staffMember = await ctx.db.get(args.staffId);
    if (!staffMember) {
      throw new Error("Staff member not found");
    }

    // Verify current user is the staff member or organizer
    if (staffMember.staffUserId !== currentUser._id && staffMember.organizerId !== currentUser._id) {
      throw new Error("Unauthorized to create sales for this staff member");
    }

    // Verify event exists
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Verify ticket tier exists
    const ticketTier = await ctx.db.get(args.ticketTierId);
    if (!ticketTier) {
      throw new Error("Ticket tier not found");
    }

    // Check if enough tickets available
    const available = ticketTier.quantity - ticketTier.sold;
    if (available < args.quantity) {
      throw new Error(`Only ${available} tickets available`);
    }

    // Calculate totals
    const subtotalCents = ticketTier.price * args.quantity;

    // Create order
    const orderId = await ctx.db.insert("orders", {
      eventId: args.eventId,
      buyerId: currentUser._id,
      buyerName: args.buyerName,
      buyerEmail: args.buyerEmail || `cash-${Date.now()}@stepperslife.com`,
      status: "COMPLETED",
      subtotalCents,
      platformFeeCents: 0, // No platform fee for cash sales
      processingFeeCents: 0, // No processing fee for cash sales
      totalCents: subtotalCents,
      paymentMethod: "TEST", // Mark as test since it's manual entry
      paidAt: Date.now(),
      soldByStaffId: args.staffId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Calculate commission
    let commissionPerTicket = 0;
    if (staffMember.commissionType === "PERCENTAGE") {
      commissionPerTicket = Math.round((ticketTier.price * (staffMember.commissionValue || 0)) / 100);
    } else if (staffMember.commissionType === "FIXED") {
      commissionPerTicket = staffMember.commissionValue || 0;
    }
    const totalCommission = commissionPerTicket * args.quantity;

    // Generate tickets with 4-digit activation codes for cash sales
    const ticketIds = [];
    const activationCodes = [];

    for (let i = 0; i < args.quantity; i++) {
      // Generate unique 4-digit activation code
      let activationCode: string = "";
      let isUnique = false;

      while (!isUnique) {
        // Generate random 4-digit code (0000-9999)
        activationCode = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

        // Check if code already exists
        const existing = await ctx.db
          .query("tickets")
          .withIndex("by_activation_code", (q) => q.eq("activationCode", activationCode))
          .first();

        if (!existing) {
          isUnique = true;
        }
      }

      const ticketId = await ctx.db.insert("tickets", {
        orderId,
        eventId: args.eventId,
        ticketTierId: args.ticketTierId,
        attendeeId: currentUser._id,
        attendeeEmail: args.buyerEmail || `cash-${Date.now()}@stepperslife.com`,
        attendeeName: args.buyerName,
        activationCode, // Store 4-digit code
        ticketCode: undefined, // Will be generated upon activation
        status: "PENDING_ACTIVATION", // Customer must activate first
        soldByStaffId: args.staffId,
        paymentMethod: args.paymentMethod,
        staffCommissionAmount: commissionPerTicket,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      ticketIds.push(ticketId);
      activationCodes.push(activationCode);
    }

    // Update ticket tier sold count
    await ctx.db.patch(args.ticketTierId, {
      sold: ticketTier.sold + args.quantity,
      updatedAt: Date.now(),
    });

    // Update staff member statistics
    const cashAmount = args.paymentMethod === "CASH" ? subtotalCents : 0;
    await ctx.db.patch(args.staffId, {
      ticketsSold: staffMember.ticketsSold + args.quantity,
      commissionEarned: staffMember.commissionEarned + totalCommission,
      cashCollected: (staffMember.cashCollected || 0) + cashAmount,
      updatedAt: Date.now(),
    });

    // Create staff sale record
    await ctx.db.insert("staffSales", {
      staffId: args.staffId,
      staffUserId: staffMember.staffUserId,
      eventId: args.eventId,
      orderId,
      ticketCount: args.quantity,
      commissionAmount: totalCommission,
      paymentMethod: args.paymentMethod,
      createdAt: Date.now(),
    });

    return {
      success: true,
      orderId,
      ticketIds,
      activationCodes, // Return 4-digit codes for staff to give to customer
      totalPrice: subtotalCents,
      commission: totalCommission,
    };
  },
});

/**
 * Delete/deactivate a staff member
 */
export const removeStaffMember = mutation({
  args: {
    staffId: v.id("eventStaff"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    // TESTING MODE: Use test user if not authenticated
    let currentUser;
    if (!identity) {
      console.warn("[removeStaffMember] TESTING MODE - Using test user");
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
      throw new Error("User not found. Please log in.");
    }

    const staffMember = await ctx.db.get(args.staffId);
    if (!staffMember) {
      throw new Error("Staff member not found");
    }

    // Verify user is the organizer
    if (staffMember.organizerId !== currentUser._id && currentUser.role !== "admin") {
      throw new Error("Only the organizer can remove staff members");
    }

    // Deactivate instead of delete to preserve sales history
    await ctx.db.patch(args.staffId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
