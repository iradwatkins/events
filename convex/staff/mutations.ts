import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { HIERARCHY_CONFIG, STAFF_ROLES } from "../lib/roles";

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
 * Get authenticated user - requires valid authentication
 * @throws Error if not authenticated
 */
async function getAuthenticatedUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();

  // PRODUCTION: Authentication is required
  if (!identity?.email) {
    throw new Error("Authentication required. Please sign in to continue.");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q: any) => q.eq("email", identity.email))
    .first();

  if (!user) {
    throw new Error("User account not found. Please contact support.");
  }

  return user;
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
    role: v.union(v.literal("TEAM_MEMBERS"), v.literal("STAFF"), v.literal("ASSOCIATES")),
    canScan: v.optional(v.boolean()), // Team members can also scan if approved
    commissionType: v.optional(v.union(v.literal("PERCENTAGE"), v.literal("FIXED"))),
    commissionValue: v.optional(v.number()),
    allocatedTickets: v.optional(v.number()),
    assignedByStaffId: v.optional(v.id("eventStaff")), // For Associates assigned by Team Members
  },
  handler: async (ctx, args) => {
    // Get event first
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // PRODUCTION: Require authentication and verify ownership
    const currentUser = await getAuthenticatedUser(ctx);

    if (!currentUser) {
      throw new Error("User not found");
    }

    // Verify user is the event organizer or admin
    if (event.organizerId !== currentUser._id && currentUser.role !== "admin") {
      throw new Error("Not authorized. Only the event organizer can add staff members.");
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

    // Determine hierarchy level based on assignment
    const hierarchyLevel = args.assignedByStaffId ? 2 : 1; // Associates are level 2, others are level 1

    // Create staff member record
    const staffId = await ctx.db.insert("eventStaff", {
      eventId: args.eventId,
      organizerId: currentUser._id,
      staffUserId: staffUser!._id,
      email: args.email,
      name: args.name,
      phone: args.phone,
      role: args.role,
      canScan: args.canScan || args.role === STAFF_ROLES.STAFF, // Staff can always scan, team members only if approved
      commissionType: args.commissionType,
      commissionValue: args.commissionValue,
      commissionPercent: args.commissionType === "PERCENTAGE" ? args.commissionValue : undefined,
      commissionEarned: 0,
      allocatedTickets: args.allocatedTickets,
      cashCollected: 0,
      isActive: true,
      ticketsSold: 0,
      referralCode,
      // Hierarchy fields
      assignedByStaffId: args.assignedByStaffId,
      hierarchyLevel,
      canAssignSubSellers: false, // Default disabled, organizer can enable
      maxSubSellers: undefined,
      parentCommissionPercent: undefined,
      subSellerCommissionPercent: undefined,
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
    // Get staff member first to access organizerId
    const staffMember = await ctx.db.get(args.staffId);
    if (!staffMember) {
      throw new Error("Staff member not found");
    }

    // Get authenticated user or use organizer in TESTING MODE
    const identity = await ctx.auth.getUserIdentity();
    let currentUser;

    if (!identity?.email) {
      // TESTING MODE: Use the staff's organizer
      console.warn("[updateStaffMember] TESTING MODE - Using staff organizer");
      currentUser = await ctx.db.get(staffMember.organizerId);
    } else {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();
    }

    if (!currentUser) {
      throw new Error("User not found. Please log in.");
    }

    // Check permissions: organizer, admin, OR parent staff member (support staff managing their sub-sellers)
    let hasPermission = false;

    // In TESTING MODE, always grant permission
    if (!identity?.email) {
      hasPermission = true;
    } else {
      // Check if user is organizer or admin
      if (staffMember.organizerId === currentUser._id || currentUser.role === "admin") {
        hasPermission = true;
      }

      // Check if user is the parent staff member (can edit their own sub-sellers)
      if (staffMember.assignedByStaffId) {
        const parentStaff = await ctx.db.get(staffMember.assignedByStaffId);
        if (parentStaff && parentStaff.staffUserId === currentUser._id) {
          hasPermission = true;
        }
      }
    }

    if (!hasPermission) {
      throw new Error("You don't have permission to update this staff member");
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
        .withIndex("by_email", (q) => q.eq("email", "iradwatkins@gmail.com"))
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
    if (
      staffMember.staffUserId !== currentUser._id &&
      staffMember.organizerId !== currentUser._id
    ) {
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
        .withIndex("by_email", (q) => q.eq("email", "iradwatkins@gmail.com"))
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
    if (
      staffMember.staffUserId !== currentUser._id &&
      staffMember.organizerId !== currentUser._id
    ) {
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
      commissionPerTicket = Math.round(
        (ticketTier.price * (staffMember.commissionValue || 0)) / 100
      );
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
        activationCode = Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0");

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

    // Update staff member statistics (sub-seller gets their commission)
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

    // HIERARCHICAL COMMISSION: If this staff has a parent, distribute parent commission
    if (staffMember.assignedByStaffId) {
      let currentStaff = staffMember;

      // Walk up the hierarchy and give each parent their commission
      while (currentStaff.assignedByStaffId) {
        const parentStaff = await ctx.db.get(currentStaff.assignedByStaffId);

        if (!parentStaff || !parentStaff.isActive) {
          break; // Stop if parent not found or inactive
        }

        // Calculate parent's commission (their percentage of the child's commission)
        const parentCommissionPercent = currentStaff.parentCommissionPercent || 0;
        let parentCommission = 0;

        if (currentStaff.commissionType === "PERCENTAGE") {
          // Parent gets their % of the ticket price per ticket
          parentCommission = Math.round(
            ((ticketTier.price * parentCommissionPercent) / 100) * args.quantity
          );
        } else if (currentStaff.commissionType === "FIXED") {
          // Parent gets their % of the fixed commission
          const childCommissionValue = currentStaff.commissionValue || 0;
          parentCommission = Math.round(
            ((childCommissionValue * parentCommissionPercent) / 100) * args.quantity
          );
        }

        // Add commission to parent
        await ctx.db.patch(parentStaff._id, {
          commissionEarned: parentStaff.commissionEarned + parentCommission,
          updatedAt: Date.now(),
        });

        // Create a sales record for the parent (so they can track their sub-seller's performance)
        await ctx.db.insert("staffSales", {
          staffId: parentStaff._id,
          staffUserId: parentStaff.staffUserId,
          eventId: args.eventId,
          orderId,
          ticketCount: args.quantity,
          commissionAmount: parentCommission,
          paymentMethod: args.paymentMethod,
          createdAt: Date.now(),
        });

        // Move up to the next level
        currentStaff = parentStaff;
      }
    }

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
        .withIndex("by_email", (q) => q.eq("email", "iradwatkins@gmail.com"))
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

    // Check permissions: organizer, admin, OR parent staff member (support staff managing their sub-sellers)
    let hasPermission = false;

    // Check if user is organizer or admin
    if (staffMember.organizerId === currentUser._id || currentUser.role === "admin") {
      hasPermission = true;
    }

    // Check if user is the parent staff member (can remove their own sub-sellers)
    if (staffMember.assignedByStaffId) {
      const parentStaff = await ctx.db.get(staffMember.assignedByStaffId);
      if (parentStaff && parentStaff.staffUserId === currentUser._id) {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      throw new Error("You don't have permission to remove this staff member");
    }

    // Deactivate instead of delete to preserve sales history
    // NOTE: This only removes from THIS EVENT - global roster is separate
    await ctx.db.patch(args.staffId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update permissions for a staff member (organizer only)
 * Allows organizers to enable/disable sub-seller assignment capability
 */
export const updateStaffPermissions = mutation({
  args: {
    staffId: v.id("eventStaff"),
    canAssignSubSellers: v.optional(v.boolean()),
    maxSubSellers: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get staff member first to access organizerId
    const staff = await ctx.db.get(args.staffId);
    if (!staff) {
      throw new Error("Staff member not found");
    }

    // Get authenticated user or use organizer in TESTING MODE
    const identity = await ctx.auth.getUserIdentity();
    let currentUser;

    if (!identity?.email) {
      // TESTING MODE: Use the staff's organizer
      console.warn("[updateStaffPermissions] TESTING MODE - Using staff organizer");
      currentUser = await ctx.db.get(staff.organizerId);
    } else {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();
    }

    if (!currentUser) {
      throw new Error("User not found");
    }

    // Verify user is the organizer or admin (skip check in TESTING MODE)
    if (identity?.email && staff.organizerId !== currentUser._id && currentUser.role !== "admin") {
      throw new Error("Only the event organizer can update staff permissions");
    }

    // Update permissions
    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.canAssignSubSellers !== undefined) {
      updates.canAssignSubSellers = args.canAssignSubSellers;
    }

    if (args.maxSubSellers !== undefined) {
      updates.maxSubSellers = args.maxSubSellers;
    }

    await ctx.db.patch(args.staffId, updates);

    return { success: true };
  },
});

/**
 * Assign a sub-seller for testing - allows specifying parent staff directly
 * TESTING MODE ONLY
 */
export const assignSubSellerForTesting = mutation({
  args: {
    parentStaffId: v.id("eventStaff"),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    allocatedTickets: v.optional(v.number()),
    commissionType: v.union(v.literal("PERCENTAGE"), v.literal("FIXED")),
    commissionValue: v.number(),
  },
  handler: async (ctx, args) => {
    // Get parent staff
    const parentStaff = await ctx.db.get(args.parentStaffId);
    if (!parentStaff) {
      throw new Error("Parent staff not found");
    }

    // Verify parent has permission to assign sub-sellers
    if (!parentStaff.canAssignSubSellers) {
      throw new Error("Parent staff does not have permission to assign sub-sellers");
    }

    // Verify parent has enough allocated tickets if allocating
    if (args.allocatedTickets) {
      const currentBalance = (parentStaff.allocatedTickets || 0) - (parentStaff.ticketsSold || 0);
      if (currentBalance < args.allocatedTickets) {
        throw new Error(
          `Insufficient tickets. Parent has ${currentBalance} tickets available, but tried to allocate ${args.allocatedTickets}`
        );
      }

      // Deduct from parent's allocation
      await ctx.db.patch(parentStaff._id, {
        allocatedTickets: (parentStaff.allocatedTickets || 0) - args.allocatedTickets,
        updatedAt: Date.now(),
      });
    }

    // Check if sub-seller user exists, create if not
    let subSellerUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!subSellerUser) {
      const newUserId = await ctx.db.insert("users", {
        email: args.email,
        name: args.name,
        role: "user",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      subSellerUser = await ctx.db.get(newUserId);
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

    // Calculate hierarchy level
    const hierarchyLevel = (parentStaff.hierarchyLevel || 1) + 1;

    if (hierarchyLevel > HIERARCHY_CONFIG.MAX_DEPTH) {
      throw new Error(`Maximum hierarchy depth of ${HIERARCHY_CONFIG.MAX_DEPTH} levels reached`);
    }

    // Create sub-seller record
    const subSellerId = await ctx.db.insert("eventStaff", {
      eventId: parentStaff.eventId,
      organizerId: parentStaff.organizerId,
      staffUserId: subSellerUser!._id,
      email: args.email,
      name: args.name,
      phone: args.phone,
      role: "ASSOCIATES",
      canScan: false,
      commissionType: args.commissionType,
      commissionValue: args.commissionValue,
      commissionPercent: args.commissionType === "PERCENTAGE" ? args.commissionValue : undefined,
      commissionEarned: 0,
      allocatedTickets: args.allocatedTickets || 0,
      cashCollected: 0,
      isActive: true,
      ticketsSold: 0,
      referralCode,
      assignedByStaffId: parentStaff._id,
      hierarchyLevel,
      canAssignSubSellers: false,
      maxSubSellers: undefined,
      parentCommissionPercent: 0,
      subSellerCommissionPercent: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      subSellerId,
      referralCode,
      hierarchyLevel,
    };
  },
});

/**
 * Assign a sub-seller (staff member can assign their own sellers)
 * This creates a hierarchical relationship where support staff can delegate ticket selling
 */
export const assignSubSeller = mutation({
  args: {
    eventId: v.id("events"),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    role: v.union(v.literal("TEAM_MEMBERS"), v.literal("STAFF")),
    canScan: v.optional(v.boolean()),
    allocatedTickets: v.optional(v.number()), // Tickets allocated from parent's balance
    parentCommissionPercent: v.number(), // What % parent keeps from sub-seller sales
    subSellerCommissionPercent: v.number(), // What % sub-seller gets from their sales
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    // TESTING MODE: Use test user if not authenticated
    let currentUser;
    if (!identity) {
      console.warn("[assignSubSeller] TESTING MODE - Using test user");
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", "iradwatkins@gmail.com"))
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

    // Find the parent staff record (current user as staff for this event)
    const parentStaff = await ctx.db
      .query("eventStaff")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) =>
        q.and(q.eq(q.field("staffUserId"), currentUser._id), q.eq(q.field("isActive"), true))
      )
      .first();

    if (!parentStaff) {
      throw new Error("You are not assigned as staff for this event");
    }

    // Verify parent has permission to assign sub-sellers
    if (!parentStaff.canAssignSubSellers) {
      throw new Error(
        "You do not have permission to assign sub-sellers. Contact the event organizer."
      );
    }

    // Check if parent has reached their max sub-sellers limit
    if (parentStaff.maxSubSellers !== undefined && parentStaff.maxSubSellers !== null) {
      const existingSubSellers = await ctx.db
        .query("eventStaff")
        .withIndex("by_assigned_by", (q) => q.eq("assignedByStaffId", parentStaff._id))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();

      if (existingSubSellers.length >= parentStaff.maxSubSellers) {
        throw new Error(`You have reached the maximum of ${parentStaff.maxSubSellers} sub-sellers`);
      }
    }

    // Verify commission split is valid
    if (args.parentCommissionPercent < 0 || args.subSellerCommissionPercent < 0) {
      throw new Error("Commission percentages cannot be negative");
    }

    if (args.parentCommissionPercent + args.subSellerCommissionPercent > 100) {
      throw new Error("Total commission split cannot exceed 100%");
    }

    // Verify parent has enough allocated tickets if allocating
    if (args.allocatedTickets) {
      const currentBalance = (parentStaff.allocatedTickets || 0) - (parentStaff.ticketsSold || 0);

      if (currentBalance < args.allocatedTickets) {
        throw new Error(
          `Insufficient tickets. You have ${currentBalance} tickets available, but tried to allocate ${args.allocatedTickets}`
        );
      }

      // Deduct from parent's allocation
      await ctx.db.patch(parentStaff._id, {
        allocatedTickets: (parentStaff.allocatedTickets || 0) - args.allocatedTickets,
        updatedAt: Date.now(),
      });
    }

    // Check if sub-seller user exists, create if not
    let subSellerUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!subSellerUser) {
      // Create new user for this sub-seller
      const newUserId = await ctx.db.insert("users", {
        email: args.email,
        name: args.name,
        role: "user",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      subSellerUser = await ctx.db.get(newUserId);
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

    // Calculate hierarchy level (parent level + 1)
    const hierarchyLevel = (parentStaff.hierarchyLevel || 1) + 1;

    // HIERARCHY DEPTH LIMIT: Prevent unlimited depth for performance
    if (hierarchyLevel > HIERARCHY_CONFIG.MAX_DEPTH) {
      throw new Error(
        `Cannot assign sub-seller: Maximum hierarchy depth of ${HIERARCHY_CONFIG.MAX_DEPTH} levels reached. ` +
          `Current level would be ${hierarchyLevel}. This limit prevents performance issues with deep hierarchies.`
      );
    }

    // Calculate commission values based on parent's commission
    // Sub-seller gets their percentage of parent's commission
    const parentCommissionValue = parentStaff.commissionValue || 0;
    const parentCommissionType = parentStaff.commissionType || "PERCENTAGE";

    // Sub-seller's commission is a portion of parent's
    let subSellerCommissionValue: number;
    if (parentCommissionType === "PERCENTAGE") {
      // If parent gets 10% and sub-seller gets 60% of that, sub-seller commission = 6%
      subSellerCommissionValue = (parentCommissionValue * args.subSellerCommissionPercent) / 100;
    } else {
      // Fixed commission: sub-seller gets their percentage of parent's fixed amount
      subSellerCommissionValue = (parentCommissionValue * args.subSellerCommissionPercent) / 100;
    }

    // Create sub-seller record
    const subSellerId = await ctx.db.insert("eventStaff", {
      eventId: args.eventId,
      organizerId: parentStaff.organizerId, // Inherit from parent
      staffUserId: subSellerUser!._id,
      email: args.email,
      name: args.name,
      phone: args.phone,
      role: args.role,
      canScan: args.canScan || args.role === STAFF_ROLES.STAFF,
      commissionType: parentCommissionType,
      commissionValue: subSellerCommissionValue,
      commissionPercent:
        parentCommissionType === "PERCENTAGE" ? subSellerCommissionValue : undefined,
      commissionEarned: 0,
      allocatedTickets: args.allocatedTickets || 0,
      cashCollected: 0,
      isActive: true,
      ticketsSold: 0,
      referralCode,
      // Hierarchy fields
      assignedByStaffId: parentStaff._id, // Link to parent
      hierarchyLevel,
      canAssignSubSellers: false, // Default disabled, but can be enabled to allow unlimited depth
      maxSubSellers: undefined,
      parentCommissionPercent: args.parentCommissionPercent,
      subSellerCommissionPercent: args.subSellerCommissionPercent,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      subSellerId,
      referralCode,
      hierarchyLevel,
    };
  },
});

/**
 * Add a global staff member (eventId = null) that auto-assigns to new events
 * Only organizers can create global staff
 */
export const addGlobalStaff = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    role: v.union(v.literal("TEAM_MEMBERS"), v.literal("STAFF")),
    canScan: v.optional(v.boolean()),
    commissionType: v.optional(v.union(v.literal("PERCENTAGE"), v.literal("FIXED"))),
    commissionValue: v.optional(v.number()),
    autoAssignToNewEvents: v.optional(v.boolean()), // Default true for global staff
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    // TESTING MODE
    let currentUser;
    if (!identity) {
      console.warn("[addGlobalStaff] TESTING MODE - Using test user");
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", "iradwatkins@gmail.com"))
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

    // Only organizers can create global staff
    if (currentUser.role !== "organizer" && currentUser.role !== "admin") {
      throw new Error("Only organizers can create global staff");
    }

    // Check if staff user exists, create if not
    let staffUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!staffUser) {
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

    // Create global staff record (eventId = undefined/null)
    const staffId = await ctx.db.insert("eventStaff", {
      eventId: undefined, // Global staff - works across all events
      organizerId: currentUser._id,
      staffUserId: staffUser!._id,
      email: args.email,
      name: args.name,
      phone: args.phone,
      role: args.role,
      canScan: args.canScan || args.role === STAFF_ROLES.STAFF,
      commissionType: args.commissionType,
      commissionValue: args.commissionValue,
      commissionPercent: args.commissionType === "PERCENTAGE" ? args.commissionValue : undefined,
      commissionEarned: 0,
      allocatedTickets: 0, // Global staff start with 0, gets allocated per event
      cashCollected: 0,
      isActive: true,
      ticketsSold: 0,
      referralCode,
      // Hierarchy fields
      assignedByStaffId: undefined,
      hierarchyLevel: 1,
      canAssignSubSellers: false,
      maxSubSellers: undefined,
      parentCommissionPercent: undefined,
      subSellerCommissionPercent: undefined,
      autoAssignToNewEvents:
        args.autoAssignToNewEvents !== undefined ? args.autoAssignToNewEvents : true,
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
 * Toggle auto-assign for staff or sub-sellers
 * Can be used by organizers for their staff, or by staff for their sub-sellers
 */
export const toggleStaffAutoAssign = mutation({
  args: {
    staffId: v.id("eventStaff"),
    autoAssignToNewEvents: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    // TESTING MODE
    let currentUser;
    if (!identity) {
      console.warn("[toggleStaffAutoAssign] TESTING MODE - Using test user");
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", "iradwatkins@gmail.com"))
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

    const staff = await ctx.db.get(args.staffId);
    if (!staff) {
      throw new Error("Staff member not found");
    }

    // Permission check: must be organizer (for their staff) or parent staff (for their sub-sellers)
    const isOrganizer = staff.organizerId === currentUser._id;
    const isParentStaff =
      staff.assignedByStaffId &&
      (await ctx.db.get(staff.assignedByStaffId))?.staffUserId === currentUser._id;

    if (!isOrganizer && !isParentStaff && currentUser.role !== "admin") {
      throw new Error("You don't have permission to modify this staff member");
    }

    await ctx.db.patch(args.staffId, {
      autoAssignToNewEvents: args.autoAssignToNewEvents,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Add a global sub-seller (eventId = null) for support staff
 * Allows support staff to build their default sub-seller roster
 */
export const addGlobalSubSeller = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    role: v.union(v.literal("TEAM_MEMBERS"), v.literal("STAFF")),
    canScan: v.optional(v.boolean()),
    parentCommissionPercent: v.number(), // What % parent keeps
    subSellerCommissionPercent: v.number(), // What % sub-seller gets
    autoAssignToNewEvents: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    // TESTING MODE
    let currentUser;
    if (!identity) {
      console.warn("[addGlobalSubSeller] TESTING MODE - Using test user");
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", "iradwatkins@gmail.com"))
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

    // Find the current user's global staff record
    const myStaffRecord = await ctx.db
      .query("eventStaff")
      .filter((q) =>
        q.and(
          q.eq(q.field("staffUserId"), currentUser._id),
          q.eq(q.field("eventId"), undefined), // Global staff only
          q.eq(q.field("isActive"), true)
        )
      )
      .first();

    if (!myStaffRecord) {
      throw new Error("You must be a global staff member to add global sub-sellers");
    }

    if (!myStaffRecord.canAssignSubSellers) {
      throw new Error("You don't have permission to assign sub-sellers");
    }

    // Check max sub-sellers limit
    if (myStaffRecord.maxSubSellers !== undefined && myStaffRecord.maxSubSellers !== null) {
      const existingSubSellers = await ctx.db
        .query("eventStaff")
        .withIndex("by_assigned_by", (q) => q.eq("assignedByStaffId", myStaffRecord._id))
        .filter((q) => q.and(q.eq(q.field("eventId"), undefined), q.eq(q.field("isActive"), true)))
        .collect();

      if (existingSubSellers.length >= myStaffRecord.maxSubSellers) {
        throw new Error(`You can only assign up to ${myStaffRecord.maxSubSellers} sub-sellers`);
      }
    }

    // Validate commission splits
    if (args.parentCommissionPercent + args.subSellerCommissionPercent > 100) {
      throw new Error("Commission percentages cannot exceed 100%");
    }

    // Create or get staff user
    let staffUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!staffUser) {
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

    // Create global sub-seller record
    const hierarchyLevel = (myStaffRecord.hierarchyLevel || 1) + 1;

    const subSellerId = await ctx.db.insert("eventStaff", {
      eventId: undefined, // Global sub-seller
      organizerId: myStaffRecord.organizerId,
      staffUserId: staffUser!._id,
      email: args.email,
      name: args.name,
      phone: args.phone,
      role: args.role,
      canScan: args.canScan || args.role === STAFF_ROLES.STAFF,
      referralCode,
      isActive: true,
      ticketsSold: 0,
      commissionEarned: 0,
      cashCollected: 0,
      // Hierarchy fields
      assignedByStaffId: myStaffRecord._id,
      hierarchyLevel,
      canAssignSubSellers: false, // Can be enabled by parent or organizer later
      // Commission structure (inherits from parent)
      commissionType: myStaffRecord.commissionType || "PERCENTAGE",
      commissionValue: 0, // Will be calculated based on parent's commission
      commissionPercent: args.subSellerCommissionPercent,
      parentCommissionPercent: args.parentCommissionPercent,
      subSellerCommissionPercent: args.subSellerCommissionPercent,
      autoAssignToNewEvents: args.autoAssignToNewEvents ?? true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      subSellerId,
      referralCode,
      hierarchyLevel,
    };
  },
});

/**
 * Update staff member's cash payment acceptance settings
 */
export const updateCashSettings = mutation({
  args: {
    staffId: v.id("eventStaff"),
    acceptCashInPerson: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // Verify staff member exists
    const staffMember = await ctx.db.get(args.staffId);
    if (!staffMember) {
      throw new Error("Staff member not found");
    }

    // Verify the current user owns this staff record
    if (staffMember.staffUserId !== user._id) {
      throw new Error("You can only update your own settings");
    }

    // Update settings
    await ctx.db.patch(args.staffId, {
      acceptCashInPerson: args.acceptCashInPerson,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Copy entire staff roster from one event to another
 * Includes hierarchy relationships and optional allocation copying
 */
export const copyRosterFromEvent = mutation({
  args: {
    sourceEventId: v.id("events"),
    targetEventId: v.id("events"),
    copyAllocations: v.boolean(), // If true, copy allocatedTickets; if false, set to 0
  },
  handler: async (ctx, args) => {
    // Get target event to access organizer
    const targetEvent = await ctx.db.get(args.targetEventId);
    if (!targetEvent) {
      throw new Error("Target event not found");
    }

    // Get authenticated user or use organizer in TESTING MODE
    const identity = await ctx.auth.getUserIdentity();
    let currentUser;

    if (!identity?.email) {
      console.warn("[copyRosterFromEvent] TESTING MODE - Using event organizer");
      currentUser = await ctx.db.get(targetEvent.organizerId);
    } else {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();
    }

    if (!currentUser) {
      throw new Error("User not found");
    }

    // Verify user is the organizer or admin
    if (
      identity?.email &&
      targetEvent.organizerId !== currentUser._id &&
      currentUser.role !== "admin"
    ) {
      throw new Error("Only the event organizer can copy staff rosters");
    }

    // Get source event to verify same organizer
    const sourceEvent = await ctx.db.get(args.sourceEventId);
    if (!sourceEvent) {
      throw new Error("Source event not found");
    }

    if (sourceEvent.organizerId !== targetEvent.organizerId) {
      throw new Error("Can only copy roster between your own events");
    }

    // Prevent copying to the same event
    if (args.sourceEventId === args.targetEventId) {
      throw new Error("Cannot copy roster to the same event");
    }

    // Get all staff from source event
    const sourceStaff = await ctx.db
      .query("eventStaff")
      .withIndex("by_event", (q) => q.eq("eventId", args.sourceEventId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    if (sourceStaff.length === 0) {
      throw new Error("Source event has no active staff members");
    }

    // Check if target event already has staff
    const existingStaff = await ctx.db
      .query("eventStaff")
      .withIndex("by_event", (q) => q.eq("eventId", args.targetEventId))
      .collect();

    if (existingStaff.length > 0) {
      throw new Error(
        `Target event already has ${existingStaff.length} staff members. Remove them first or add manually.`
      );
    }

    // Map old staff IDs to new staff IDs for hierarchy preservation
    const staffIdMap = new Map<string, string>();

    // First pass: Clone all staff (without hierarchy links yet)
    for (const staff of sourceStaff) {
      const newStaffId = await ctx.db.insert("eventStaff", {
        eventId: args.targetEventId,
        organizerId: staff.organizerId,
        staffUserId: staff.staffUserId,
        email: staff.email,
        name: staff.name,
        phone: staff.phone,
        role: staff.role,
        canScan: staff.canScan,
        commissionType: staff.commissionType,
        commissionValue: staff.commissionValue,
        commissionPercent: staff.commissionPercent,
        commissionEarned: 0, // Reset earnings for new event
        allocatedTickets: args.copyAllocations ? staff.allocatedTickets : 0,
        cashCollected: 0,
        isActive: true,
        ticketsSold: 0,
        referralCode: staff.referralCode, // Keep same referral code
        // Hierarchy will be set in second pass
        assignedByStaffId: undefined,
        hierarchyLevel: staff.hierarchyLevel,
        canAssignSubSellers: staff.canAssignSubSellers,
        maxSubSellers: staff.maxSubSellers,
        parentCommissionPercent: staff.parentCommissionPercent,
        subSellerCommissionPercent: staff.subSellerCommissionPercent,
        acceptCashInPerson: staff.acceptCashInPerson,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      staffIdMap.set(staff._id, newStaffId);
    }

    // Second pass: Update hierarchy relationships
    for (const staff of sourceStaff) {
      if (staff.assignedByStaffId) {
        const newStaffId = staffIdMap.get(staff._id);
        const newParentId = staffIdMap.get(staff.assignedByStaffId);

        if (newStaffId && newParentId) {
          await ctx.db.patch(newStaffId as any, {
            assignedByStaffId: newParentId as any,
          });
        }
      }
    }

    return {
      success: true,
      staffCopied: sourceStaff.length,
      message: `Successfully copied ${sourceStaff.length} staff members to target event`,
    };
  },
});
