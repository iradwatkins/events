import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Complete schema for SteppersLife Event Ticketing Platform
export default defineSchema({
  users: defineTable({
    name: v.optional(v.string()),
    email: v.string(),
    emailVerified: v.optional(v.boolean()),
    image: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("organizer"), v.literal("user"))),
    // Authentication
    passwordHash: v.optional(v.string()), // bcrypt hash for classic login
    googleId: v.optional(v.string()), // Google OAuth user ID
    authProvider: v.optional(
      v.union(v.literal("password"), v.literal("magic_link"), v.literal("google"))
    ), // Which auth method was used
    // Magic Link fields
    magicLinkToken: v.optional(v.string()), // Hashed token for magic link login
    magicLinkExpiry: v.optional(v.number()), // Expiration timestamp (15 minutes)
    // Password Reset
    passwordResetToken: v.optional(v.string()), // Hashed token for password reset
    passwordResetExpiry: v.optional(v.number()), // Expiration timestamp (1 hour)
    // Permissions
    canCreateTicketedEvents: v.optional(v.boolean()), // Restrict organizers to only Save The Date/Free events
    // Stripe fields (for receiving ticket payments from customers)
    stripeCustomerId: v.optional(v.string()),
    stripeConnectedAccountId: v.optional(v.string()),
    stripeAccountSetupComplete: v.optional(v.boolean()),
    // PayPal fields (for receiving ticket payments from customers)
    paypalMerchantId: v.optional(v.string()),
    paypalAccountSetupComplete: v.optional(v.boolean()),
    // Payment processor preferences (which processors organizer accepts for ticket sales)
    acceptsStripePayments: v.optional(v.boolean()),
    acceptsPaypalPayments: v.optional(v.boolean()),
    acceptsCashPayments: v.optional(v.boolean()),
    // Onboarding
    welcomePopupShown: v.optional(v.boolean()), // Track if user has seen the 1000 free tickets welcome popup on event creation
    firstEventTicketPopupShown: v.optional(v.boolean()), // Track if user has seen the "Add Tickets" congratulations popup
    // Timestamps
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
    // Legacy fields
    userId: v.optional(v.string()), // Legacy Clerk user ID
    stripeConnectId: v.optional(v.string()), // Legacy field (renamed to stripeConnectedAccountId)
    isAdmin: v.optional(v.boolean()), // Legacy field (migrated to role field)
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_googleId", ["googleId"])
    .index("by_magicLinkToken", ["magicLinkToken"])
    .index("by_passwordResetToken", ["passwordResetToken"]),

  events: defineTable({
    // Basic info
    name: v.string(),
    description: v.string(),
    organizerId: v.optional(v.id("users")),
    organizerName: v.optional(v.string()),

    // Event type
    eventType: v.optional(
      v.union(
        v.literal("SAVE_THE_DATE"),
        v.literal("FREE_EVENT"),
        v.literal("TICKETED_EVENT"),
        v.literal("SEATED_EVENT")
      )
    ),

    // Date/time - Literal Storage (NO TIMEZONE CONVERSIONS)
    // These fields store EXACTLY what the user enters
    eventDateLiteral: v.optional(v.string()), // Literal date string "2025-03-15" or "March 15, 2025"
    eventTimeLiteral: v.optional(v.string()), // Literal time string "8:00 PM" or "8:00 PM - 2:00 AM"
    eventTimezone: v.optional(v.string()), // Timezone "America/New_York", "EST", etc.

    // Legacy date/time fields (kept for backward compatibility and sorting)
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    timezone: v.optional(v.string()),

    // Location (supports both object and legacy string format)
    location: v.optional(
      v.union(
        v.object({
          venueName: v.optional(v.string()),
          address: v.optional(v.string()),
          city: v.string(),
          state: v.string(),
          zipCode: v.optional(v.string()),
          country: v.string(),
        }),
        v.string() // Legacy format: plain string address
      )
    ),

    // Media
    images: v.optional(v.array(v.id("_storage"))),
    imageUrl: v.optional(v.string()), // Temporary: external image URLs (e.g., Unsplash)

    // Categories
    categories: v.optional(v.array(v.string())),

    // Status
    status: v.optional(
      v.union(
        v.literal("DRAFT"),
        v.literal("PUBLISHED"),
        v.literal("CANCELLED"),
        v.literal("COMPLETED")
      )
    ),

    // Payment & ticketing visibility
    ticketsVisible: v.optional(v.boolean()),
    paymentModelSelected: v.optional(v.boolean()),

    // Ticket stats (calculated fields)
    ticketsSold: v.optional(v.number()),
    ticketTierCount: v.optional(v.number()),

    // Settings
    allowWaitlist: v.optional(v.boolean()),
    allowTransfers: v.optional(v.boolean()),
    maxTicketsPerOrder: v.optional(v.number()),
    minTicketsPerOrder: v.optional(v.number()),
    capacity: v.optional(v.number()), // Event capacity (max attendees/tickets)

    // Free event specific
    doorPrice: v.optional(v.string()),

    // Social
    socialShareCount: v.optional(v.number()),

    // Timestamps
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),

    // Claiming system (for admin-created events that organizers can claim)
    isClaimable: v.optional(v.boolean()),
    claimCode: v.optional(v.string()),
    claimedAt: v.optional(v.number()),

    // Legacy fields (for backward compatibility with old event schema)
    eventDate: v.optional(v.number()),
    imageStorageId: v.optional(v.id("_storage")),
    price: v.optional(v.number()),
    totalTickets: v.optional(v.number()),
    userId: v.optional(v.string()), // Legacy Clerk user ID
  })
    .index("by_organizer", ["organizerId"])
    .index("by_status", ["status"])
    .index("by_event_type", ["eventType"])
    .index("by_start_date", ["startDate"])
    .index("by_published", ["status", "startDate"])
    .index("by_claimable", ["isClaimable"]),

  // Organizer credit balance for pre-purchase model
  organizerCredits: defineTable({
    organizerId: v.id("users"),
    creditsTotal: v.number(),
    creditsUsed: v.number(),
    creditsRemaining: v.number(),
    firstEventFreeUsed: v.boolean(),
    firstEventId: v.optional(v.id("events")), // Track which event the free 1000 credits are for
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_organizer", ["organizerId"]),

  // Credit purchase transactions
  creditTransactions: defineTable({
    organizerId: v.id("users"),
    ticketsPurchased: v.number(),
    amountPaid: v.number(), // in cents
    pricePerTicket: v.number(), // in cents
    stripePaymentIntentId: v.optional(v.string()),
    squarePaymentId: v.optional(v.string()),
    paypalOrderId: v.optional(v.string()),
    status: v.union(v.literal("PENDING"), v.literal("COMPLETED"), v.literal("FAILED")),
    purchasedAt: v.number(),
  })
    .index("by_organizer", ["organizerId"])
    .index("by_status", ["status"]),

  // Payment configuration per event
  eventPaymentConfig: defineTable({
    eventId: v.id("events"),
    organizerId: v.id("users"),

    // Payment model - Updated with clearer names (includes legacy for migration)
    paymentModel: v.union(
      v.literal("PREPAY"), // Formerly PRE_PURCHASE - Pay upfront for tickets
      v.literal("CONSIGNMENT"), // NEW - Float tickets, settle day-of/morning-of
      v.literal("CREDIT_CARD"), // Formerly PAY_AS_SELL - Standard online payments
      v.literal("PRE_PURCHASE"), // Legacy - will be migrated to PREPAY
      v.literal("PAY_AS_SELL") // Legacy - will be migrated to CREDIT_CARD
    ),

    // Status
    isActive: v.boolean(),
    activatedAt: v.optional(v.number()),

    // Stripe Connect (for CREDIT_CARD model)
    stripeConnectAccountId: v.optional(v.string()),

    // PREPAY specific (formerly Pre-purchase)
    ticketsAllocated: v.optional(v.number()),

    // CONSIGNMENT specific fields (NEW)
    consignmentSettlementDue: v.optional(v.number()), // When settlement is due (event date or morning of)
    consignmentSettled: v.optional(v.boolean()), // Whether consignment has been settled
    consignmentSettledAt: v.optional(v.number()), // When settlement was completed
    consignmentSettlementAmount: v.optional(v.number()), // Amount owed in cents
    consignmentFloatedTickets: v.optional(v.number()), // Number of tickets floated
    consignmentSoldTickets: v.optional(v.number()), // Number of consignment tickets sold
    consignmentNotes: v.optional(v.string()), // Settlement notes

    // CREDIT_CARD fee structure (formerly Pay-as-sell)
    platformFeePercent: v.number(), // 3.7% or discounted
    platformFeeFixed: v.number(), // $1.79 in cents
    processingFeePercent: v.number(), // 2.9%

    // Discounts
    charityDiscount: v.boolean(),
    lowPriceDiscount: v.boolean(),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_organizer", ["organizerId"])
    .index("by_payment_model", ["paymentModel"]),

  // Ticket tiers/types for events
  ticketTiers: defineTable({
    eventId: v.id("events"),
    name: v.string(), // "General Admission", "VIP", etc.
    description: v.optional(v.string()),
    price: v.number(), // Base price in cents (used if no pricingTiers)

    // Early Bird Pricing - time-based pricing tiers
    pricingTiers: v.optional(
      v.array(
        v.object({
          name: v.string(), // "Early Bird", "Regular", "Last Chance"
          price: v.number(), // Price in cents for this tier
          availableFrom: v.number(), // Start timestamp
          availableUntil: v.optional(v.number()), // End timestamp (optional for last tier)
        })
      )
    ),
    // If pricingTiers exists, system uses current tier price based on date
    // Otherwise falls back to base price field

    quantity: v.number(), // total available (for individual mode or legacy support)
    sold: v.number(), // number sold (for individual mode or legacy support)
    version: v.optional(v.number()), // PRODUCTION: Version number for optimistic locking to prevent race conditions
    saleStart: v.optional(v.number()),
    saleEnd: v.optional(v.number()),
    isActive: v.boolean(),

    // Table Package - Sell entire tables as single units
    isTablePackage: v.optional(v.boolean()), // LEGACY: True if this tier sells whole tables
    tableCapacity: v.optional(v.number()), // Number of seats per table (4, 6, 8, 10, etc.)
    // When isTablePackage=true, price is for entire table, not per seat

    // Mixed Allocation - Support both tables AND individual tickets in same tier
    allocationMode: v.optional(
      v.union(
        v.literal("individual"), // Default: sell individual tickets only
        v.literal("table"), // Sell entire tables only
        v.literal("mixed") // Sell BOTH tables AND individual tickets
      )
    ),
    tableQuantity: v.optional(v.number()), // LEGACY: Number of tables available (for table/mixed mode)
    tableSold: v.optional(v.number()), // Number of tables sold (for table/mixed mode)
    individualQuantity: v.optional(v.number()), // Individual tickets available (for mixed mode)
    individualSold: v.optional(v.number()), // Individual tickets sold (for mixed mode)
    // Multiple Table Groups - Support different table sizes in same tier
    tableGroups: v.optional(
      v.array(
        v.object({
          seatsPerTable: v.number(), // Seats in this table size (e.g., 4, 8)
          numberOfTables: v.number(), // How many tables of this size (e.g., 5)
          sold: v.optional(v.number()), // How many tables of this group sold
        })
      )
    ),
    // Total capacity = sum(each group: numberOfTables × seatsPerTable) + individualQuantity

    // First sale tracking - used to determine when tickets go "live"
    firstSaleAt: v.optional(v.number()), // Timestamp of first ticket sale for this tier

    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_event", ["eventId"]),

  // Ticket Bundles - Package multiple tickets together
  ticketBundles: defineTable({
    // Bundle type: single event or multi-event
    bundleType: v.optional(v.union(v.literal("SINGLE_EVENT"), v.literal("MULTI_EVENT"))), // Default: SINGLE_EVENT for backward compatibility

    // For single-event bundles (legacy & new)
    eventId: v.optional(v.id("events")), // Primary event (required for single-event, optional for multi-event)

    // For multi-event bundles
    eventIds: v.optional(v.array(v.id("events"))), // All events included in this bundle

    name: v.string(), // "3-Day Weekend Pass", "VIP Package", "Summer Series Bundle"
    description: v.optional(v.string()),
    price: v.number(), // Bundle price in cents

    // Which ticket tiers are included in this bundle
    includedTiers: v.array(
      v.object({
        tierId: v.id("ticketTiers"),
        tierName: v.string(), // Cache tier name for display
        quantity: v.number(), // Usually 1, but could be multiple
        // For multi-event bundles: track which event this tier belongs to
        eventId: v.optional(v.id("events")),
        eventName: v.optional(v.string()), // Cache event name for display
      })
    ),

    totalQuantity: v.number(), // Total bundles available
    sold: v.number(), // Number of bundles sold

    // Calculated savings (for display)
    regularPrice: v.optional(v.number()), // Sum of included tier prices
    savings: v.optional(v.number()), // How much saved vs buying separately

    saleStart: v.optional(v.number()),
    saleEnd: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .searchIndex("search_bundles", {
      searchField: "name",
      filterFields: ["bundleType", "isActive"],
    }),

  // Order items (links orders to ticket tiers)
  orderItems: defineTable({
    orderId: v.id("orders"),
    ticketTierId: v.id("ticketTiers"),
    priceCents: v.number(),
    createdAt: v.number(),
  }).index("by_order", ["orderId"]),

  // Individual ticket instances (generated after payment)
  tickets: defineTable({
    // New schema fields
    orderId: v.optional(v.id("orders")),
    orderItemId: v.optional(v.id("orderItems")),
    eventId: v.id("events"),
    ticketTierId: v.optional(v.id("ticketTiers")),
    attendeeId: v.optional(v.id("users")),
    attendeeEmail: v.optional(v.string()),
    attendeeName: v.optional(v.string()),
    ticketCode: v.optional(v.string()), // unique code for this ticket
    status: v.optional(
      v.union(
        v.literal("VALID"),
        v.literal("SCANNED"),
        v.literal("CANCELLED"),
        v.literal("REFUNDED"),
        v.literal("PENDING_ACTIVATION") // For cash sales awaiting customer activation
      )
    ),
    scannedAt: v.optional(v.number()),
    scannedBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),

    // PRODUCTION: Secure activation system for cash sales
    activationCode: v.optional(v.string()), // DEPRECATED: Legacy 4-digit codes
    activationCodeHash: v.optional(v.string()), // SHA-256 hash of 8-char activation code
    activationCodeExpiry: v.optional(v.number()), // Expiry timestamp (48 hours)
    activationAttempts: v.optional(v.number()), // Failed activation attempts (rate limiting)
    activationLastAttempt: v.optional(v.number()), // Last attempt timestamp
    activatedAt: v.optional(v.number()), // When customer activated their ticket

    // Staff tracking
    soldByStaffId: v.optional(v.id("eventStaff")), // Which staff member sold this ticket
    staffCommissionAmount: v.optional(v.number()), // Commission earned on this ticket in cents
    paymentMethod: v.optional(
      v.union(
        v.literal("ONLINE"),
        v.literal("CASH"),
        v.literal("CASH_APP"),
        v.literal("SQUARE"),
        v.literal("STRIPE")
      )
    ),

    // Bundle support for grouping tickets
    bundleId: v.optional(v.string()), // ID for grouping tickets together
    bundleName: v.optional(v.string()), // Name of the bundle

    // Legacy fields from old schema (for migration)
    ticketType: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    quantityTotal: v.optional(v.number()),
    quantitySold: v.optional(v.number()),
    quantityReserved: v.optional(v.number()),
    salesStart: v.optional(v.number()),
    salesEnd: v.optional(v.number()),
    maxPerOrder: v.optional(v.number()),
    minPerOrder: v.optional(v.number()),
    active: v.optional(v.boolean()),
  })
    .index("by_order", ["orderId"])
    .index("by_event", ["eventId"])
    .index("by_attendee", ["attendeeId"])
    .index("by_ticket_code", ["ticketCode"])
    .index("by_activation_code", ["activationCode"])
    .index("by_status", ["status"])
    .index("by_staff", ["soldByStaffId"]),

  // Event staff and sellers
  eventStaff: defineTable({
    eventId: v.optional(v.id("events")), // null = all events for this organizer
    organizerId: v.id("users"),
    staffUserId: v.id("users"),
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),

    // Legacy fields for backward compatibility
    staffEmail: v.optional(v.string()),
    staffName: v.optional(v.string()),

    // Hierarchy fields for multi-level delegation
    assignedByStaffId: v.optional(v.id("eventStaff")), // null = assigned by organizer, otherwise ID of parent staff
    hierarchyLevel: v.optional(v.number()), // 1 = organizer-assigned, 2 = staff-assigned, 3 = sub-seller assigned, etc.
    canAssignSubSellers: v.optional(v.boolean()), // Permission to assign their own sub-sellers
    maxSubSellers: v.optional(v.number()), // Max number of sub-sellers this staff can assign (null = unlimited)
    autoAssignToNewEvents: v.optional(v.boolean()), // Auto-assign this staff/sub-seller to new events created by organizer or when parent joins new event

    // Role and permissions
    role: v.union(v.literal("STAFF"), v.literal("TEAM_MEMBERS"), v.literal("ASSOCIATES")),
    canScan: v.optional(v.boolean()), // Team members and associates can also scan if approved by organizer

    // Commission
    commissionType: v.optional(v.union(v.literal("PERCENTAGE"), v.literal("FIXED"))),
    commissionValue: v.optional(v.number()),
    commissionPercent: v.optional(v.number()),
    commissionEarned: v.number(), // total in cents

    // Commission split for hierarchical assignments (when this staff assigns sub-sellers)
    parentCommissionPercent: v.optional(v.number()), // What % parent (this staff) keeps from sub-seller sales
    subSellerCommissionPercent: v.optional(v.number()), // What % sub-seller gets from their own sales

    // Ticket allocation
    allocatedTickets: v.optional(v.number()), // Number of tickets allocated to this staff member

    // Cash tracking
    cashCollected: v.optional(v.number()), // Total cash collected by staff in cents
    acceptCashInPerson: v.optional(v.boolean()), // Whether this staff accepts cash payments in-person

    // Status
    isActive: v.boolean(),
    invitedAt: v.optional(v.number()),
    acceptedAt: v.optional(v.number()),

    // Tracking
    ticketsSold: v.number(),
    referralCode: v.string(), // unique code for tracking sales

    // Settlement tracking
    settlementStatus: v.optional(v.union(v.literal("PENDING"), v.literal("PAID"))),
    settlementPaidAt: v.optional(v.number()), // When organizer marked as paid
    settlementNotes: v.optional(v.string()), // Payment notes or receipt info

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organizer", ["organizerId"])
    .index("by_staff_user", ["staffUserId"])
    .index("by_event", ["eventId"])
    .index("by_referral_code", ["referralCode"])
    .index("by_assigned_by", ["assignedByStaffId"]) // Query all sub-sellers assigned by a staff member
    .index("by_hierarchy_level", ["hierarchyLevel"]), // Query staff by level

  // Staff sales tracking
  staffSales: defineTable({
    orderId: v.id("orders"),
    eventId: v.id("events"),
    staffId: v.id("eventStaff"),
    staffUserId: v.id("users"),
    ticketCount: v.number(), // Number of tickets in this sale
    ticketsSold: v.optional(v.number()), // Legacy field
    saleAmount: v.optional(v.number()), // in cents - Legacy field
    commissionAmount: v.number(), // in cents
    commissionPercent: v.optional(v.number()), // Legacy field
    paymentMethod: v.optional(
      v.union(
        v.literal("ONLINE"),
        v.literal("CASH"),
        v.literal("CASH_APP"),
        v.literal("SQUARE"),
        v.literal("STRIPE")
      )
    ),
    createdAt: v.number(),
    soldAt: v.optional(v.number()), // Legacy field
  })
    .index("by_staff", ["staffId"])
    .index("by_event", ["eventId"])
    .index("by_staff_user", ["staffUserId"])
    .index("by_order", ["orderId"])
    .index("by_payment_method", ["staffId", "paymentMethod"]),

  // Staff to staff ticket transfers
  staffTicketTransfers: defineTable({
    // Transfer parties
    fromStaffId: v.id("eventStaff"),
    fromUserId: v.id("users"),
    fromName: v.string(),
    toStaffId: v.id("eventStaff"),
    toUserId: v.id("users"),
    toName: v.string(),

    // Event and tickets
    eventId: v.id("events"),
    organizerId: v.id("users"),
    ticketQuantity: v.number(), // Number of ticket credits being transferred

    // Transfer status
    status: v.union(
      v.literal("PENDING"), // Waiting for recipient to accept
      v.literal("ACCEPTED"), // Transfer completed
      v.literal("REJECTED"), // Recipient declined
      v.literal("CANCELLED"), // Sender cancelled
      v.literal("AUTO_EXPIRED") // System expired after timeout
    ),

    // Transfer details
    reason: v.optional(v.string()), // Why the transfer is being made
    notes: v.optional(v.string()), // Additional notes from sender
    rejectionReason: v.optional(v.string()), // Why recipient rejected

    // Audit trail
    requestedAt: v.number(),
    respondedAt: v.optional(v.number()),
    expiresAt: v.number(), // Auto-expire after 48 hours

    // Balance tracking (for audit purposes)
    fromStaffBalanceBefore: v.number(),
    fromStaffBalanceAfter: v.optional(v.number()),
    toStaffBalanceBefore: v.optional(v.number()),
    toStaffBalanceAfter: v.optional(v.number()),
  })
    .index("by_from_staff", ["fromStaffId"])
    .index("by_to_staff", ["toStaffId"])
    .index("by_event", ["eventId"])
    .index("by_status", ["status"])
    .index("by_expiry", ["expiresAt", "status"]),

  // Orders
  orders: defineTable({
    eventId: v.id("events"),
    buyerId: v.id("users"),
    buyerName: v.string(),
    buyerEmail: v.string(),
    buyerPhone: v.optional(v.string()),

    // Status
    status: v.union(
      v.literal("PENDING"),
      v.literal("COMPLETED"),
      v.literal("CANCELLED"),
      v.literal("FAILED"),
      v.literal("REFUNDED")
    ),

    // Pricing
    subtotalCents: v.number(),
    platformFeeCents: v.number(),
    processingFeeCents: v.number(),
    totalCents: v.number(),

    // Payment
    paymentId: v.optional(v.string()), // Square or Stripe payment ID
    paymentMethod: v.optional(v.union(v.literal("SQUARE"), v.literal("STRIPE"), v.literal("TEST"))),
    paidAt: v.optional(v.number()),
    stripePaymentIntentId: v.optional(v.string()),

    // Staff referral
    soldByStaffId: v.optional(v.id("eventStaff")), // Staff member who made the sale
    referralCode: v.optional(v.string()), // Referral code used
    staffReferralCode: v.optional(v.string()), // Legacy field
    staffCommission: v.optional(v.number()),

    // Bundle purchase tracking
    bundleId: v.optional(v.id("ticketBundles")), // If this is a bundle purchase
    isBundlePurchase: v.optional(v.boolean()), // Quick flag for filtering

    // Discount tracking
    discountCodeId: v.optional(v.id("discountCodes")),
    discountAmountCents: v.optional(v.number()),

    // Legacy fields for backward compatibility
    userId: v.optional(v.id("users")),

    // Seat selection (for reserved seating events)
    selectedSeats: v.optional(
      v.array(
        v.object({
          sectionId: v.string(),
          sectionName: v.string(),
          // Row-based seating (optional)
          rowId: v.optional(v.string()),
          rowLabel: v.optional(v.string()),
          // Table-based seating (optional)
          tableId: v.optional(v.string()),
          tableNumber: v.optional(v.union(v.string(), v.number())),
          // Common fields
          seatId: v.string(),
          seatNumber: v.string(),
        })
      )
    ),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_buyer", ["buyerId"])
    .index("by_user", ["userId"])
    .index("by_event", ["eventId"])
    .index("by_status", ["status"])
    .index("by_referral", ["staffReferralCode"]),

  // Individual ticket instances
  ticketInstances: defineTable({
    orderId: v.id("orders"),
    eventId: v.id("events"),
    ticketId: v.id("tickets"),
    ticketNumber: v.string(),

    // QR code
    qrCode: v.string(), // base64 data URL
    qrHash: v.string(), // HMAC signature

    // Status
    status: v.union(
      v.literal("VALID"),
      v.literal("SCANNED"),
      v.literal("CANCELLED"),
      v.literal("REFUNDED")
    ),

    // Scan info
    scannedAt: v.optional(v.number()),
    scannedBy: v.optional(v.id("users")),

    // Timestamps
    createdAt: v.number(),
  })
    .index("by_order", ["orderId"])
    .index("by_event", ["eventId"])
    .index("by_ticket_number", ["ticketNumber"])
    .index("by_status", ["status"]),

  // Discount codes for events
  discountCodes: defineTable({
    code: v.string(), // The actual discount code (e.g., "EARLYBIRD2024")
    eventId: v.id("events"),
    organizerId: v.id("users"),

    // Discount details
    discountType: v.union(
      v.literal("PERCENTAGE"), // e.g., 20% off
      v.literal("FIXED_AMOUNT") // e.g., $10 off
    ),
    discountValue: v.number(), // Percentage (20) or cents (1000 for $10)

    // Usage limits
    maxUses: v.optional(v.number()), // Total times code can be used
    usedCount: v.number(), // Times code has been used
    maxUsesPerUser: v.optional(v.number()), // Max uses per email/user

    // Validity period
    validFrom: v.optional(v.number()), // When code becomes valid
    validUntil: v.optional(v.number()), // When code expires

    // Restrictions
    minPurchaseAmount: v.optional(v.number()), // Minimum order value in cents
    applicableToTierIds: v.optional(v.array(v.id("ticketTiers"))), // Specific tiers only, or null for all

    // Status
    isActive: v.boolean(),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_organizer", ["organizerId"])
    .index("by_code", ["code"])
    .index("by_status", ["isActive"]),

  // Discount code usage tracking
  discountCodeUsage: defineTable({
    discountCodeId: v.id("discountCodes"),
    orderId: v.id("orders"),
    userEmail: v.string(),
    discountAmountCents: v.number(), // How much was saved
    createdAt: v.number(),
  })
    .index("by_code", ["discountCodeId"])
    .index("by_order", ["orderId"])
    .index("by_user_email", ["userEmail"]),

  // Ticket transfers
  ticketTransfers: defineTable({
    ticketId: v.id("tickets"),
    eventId: v.id("events"),

    // Original owner
    fromUserId: v.id("users"),
    fromEmail: v.string(),
    fromName: v.string(),

    // New owner
    toEmail: v.string(),
    toName: v.string(),
    toUserId: v.optional(v.id("users")), // Set when transfer is accepted

    // Transfer status
    status: v.union(
      v.literal("PENDING"),
      v.literal("ACCEPTED"),
      v.literal("CANCELLED"),
      v.literal("EXPIRED")
    ),

    // Transfer token for secure acceptance
    transferToken: v.string(),

    // Timestamps
    initiatedAt: v.number(),
    completedAt: v.optional(v.number()),
    expiresAt: v.number(), // Transfers expire after 7 days
  })
    .index("by_ticket", ["ticketId"])
    .index("by_from_user", ["fromUserId"])
    .index("by_to_email", ["toEmail"])
    .index("by_token", ["transferToken"])
    .index("by_status", ["status"]),

  // Seating charts for reserved seating events
  seatingCharts: defineTable({
    eventId: v.id("events"),
    name: v.string(), // e.g., "Main Hall", "VIP Section"

    // Seating style (NEW - for table-based vs row-based layouts)
    seatingStyle: v.optional(
      v.union(
        v.literal("ROW_BASED"), // Traditional theater/stadium rows
        v.literal("TABLE_BASED"), // Tables for weddings/galas/banquets
        v.literal("MIXED") // Hybrid: both rows and tables
      )
    ),

    // Venue image overlay (NEW - for visual seating chart placement)
    venueImageId: v.optional(v.id("_storage")), // Uploaded floor plan/venue image
    venueImageUrl: v.optional(v.string()), // Temporary URL for external images
    imageScale: v.optional(v.number()), // Zoom level (1.0 = 100%)
    imageRotation: v.optional(v.number()), // Rotation in degrees

    // Chart configuration
    sections: v.array(
      v.object({
        id: v.string(),
        name: v.string(), // e.g., "Section A", "VIP", "Balcony"
        color: v.optional(v.string()), // Hex color for visualization
        // Visual positioning (NEW - for drag-drop placement on venue image)
        x: v.optional(v.number()), // X coordinate on canvas
        y: v.optional(v.number()), // Y coordinate on canvas
        width: v.optional(v.number()), // Section width
        height: v.optional(v.number()), // Section height
        rotation: v.optional(v.number()), // Section rotation in degrees

        // Container type (NEW - determines if section uses rows or tables)
        containerType: v.optional(
          v.union(
            v.literal("ROWS"), // Traditional row-based seating
            v.literal("TABLES") // Table-based seating
          )
        ),

        // ROW-BASED: Rows with seats (existing)
        rows: v.optional(
          v.array(
            v.object({
              id: v.string(),
              label: v.string(), // e.g., "A", "B", "1", "2"
              curved: v.optional(v.boolean()), // For curved theater rows
              seats: v.array(
                v.object({
                  id: v.string(),
                  number: v.string(), // e.g., "1", "2", "A1"
                  type: v.union(
                    v.literal("STANDARD"),
                    v.literal("WHEELCHAIR"),
                    v.literal("COMPANION"),
                    v.literal("VIP"),
                    v.literal("BLOCKED"),
                    v.literal("STANDING"),
                    v.literal("PARKING"),
                    v.literal("TENT")
                  ),
                  status: v.union(
                    v.literal("AVAILABLE"),
                    v.literal("RESERVED"),
                    v.literal("UNAVAILABLE"),
                    v.literal("BLOCKED")
                  ),
                  // Session-based temporary holds (for shopping cart)
                  sessionId: v.optional(v.string()), // Temporary session holding this seat
                  sessionExpiry: v.optional(v.number()), // Unix timestamp when hold expires
                })
              ),
            })
          )
        ),

        // TABLE-BASED: Tables with seats (NEW)
        tables: v.optional(
          v.array(
            v.object({
              id: v.string(),
              number: v.union(v.string(), v.number()), // Table number or name (e.g., 1, "VIP 1", "Head Table")
              shape: v.union(
                v.literal("ROUND"),
                v.literal("RECTANGULAR"),
                v.literal("SQUARE"),
                v.literal("CUSTOM")
              ),
              // Position on canvas
              x: v.number(),
              y: v.number(),
              // Table dimensions
              width: v.number(), // Diameter for round, width for rect/square
              height: v.number(), // Same as width for round, height for rect/square
              rotation: v.optional(v.number()), // Rotation in degrees
              // Custom polygon points (for CUSTOM shape)
              customPath: v.optional(v.string()), // SVG path data
              // Seat arc configuration (for crescent/cabaret seating on round tables)
              seatArc: v.optional(
                v.object({
                  startAngle: v.optional(v.number()), // Starting angle in degrees (0-360)
                  arcDegrees: v.optional(v.number()), // Arc span in degrees (e.g., 180 for half circle, 135 for crescent)
                })
              ),
              // Capacity and seats
              capacity: v.number(), // Max seats at this table
              seats: v.array(
                v.object({
                  id: v.string(),
                  number: v.string(), // Seat number at table (e.g., "1", "2", "3")
                  type: v.union(
                    v.literal("STANDARD"),
                    v.literal("WHEELCHAIR"),
                    v.literal("COMPANION"),
                    v.literal("VIP"),
                    v.literal("BLOCKED"),
                    v.literal("STANDING"),
                    v.literal("PARKING"),
                    v.literal("TENT")
                  ),
                  status: v.union(
                    v.literal("AVAILABLE"),
                    v.literal("RESERVED"),
                    v.literal("UNAVAILABLE"),
                    v.literal("BLOCKED")
                  ),
                  // Seat position relative to table (for visual rendering)
                  position: v.optional(
                    v.object({
                      angle: v.optional(v.number()), // Angle around table (0-360) for round/custom tables
                      side: v.optional(v.string()), // "top", "bottom", "left", "right" for rectangular tables
                      offset: v.optional(v.number()), // Distance from table edge
                    })
                  ),
                  // Session-based temporary holds (for shopping cart)
                  sessionId: v.optional(v.string()), // Temporary session holding this seat
                  sessionExpiry: v.optional(v.number()), // Unix timestamp when hold expires
                })
              ),
            })
          )
        ),

        ticketTierId: v.optional(v.id("ticketTiers")), // Link section to tier pricing
      })
    ),

    // Total capacity
    totalSeats: v.number(),
    reservedSeats: v.number(),

    // Status
    isActive: v.boolean(),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_event", ["eventId"]),

  // Seat reservations
  seatReservations: defineTable({
    eventId: v.id("events"),
    seatingChartId: v.id("seatingCharts"),
    ticketId: v.id("tickets"),
    orderId: v.id("orders"),

    // Seat location (supports both row-based and table-based)
    sectionId: v.string(),

    // ROW-BASED fields (optional, only for row-based seating)
    rowId: v.optional(v.string()),
    rowLabel: v.optional(v.string()), // e.g., "A", "B", "1"

    // TABLE-BASED fields (optional, only for table-based seating)
    tableId: v.optional(v.string()),
    tableNumber: v.optional(v.union(v.string(), v.number())), // e.g., 5, "Head Table", "VIP 1"

    // Common fields
    seatId: v.string(),
    seatNumber: v.string(), // Full seat identifier e.g., "Section A, Row 1, Seat 5" or "Table 5, Seat 3"

    // Reservation status
    status: v.union(v.literal("RESERVED"), v.literal("RELEASED"), v.literal("CANCELLED")),

    // Timestamps
    reservedAt: v.number(),
    releasedAt: v.optional(v.number()),
  })
    .index("by_event", ["eventId"])
    .index("by_seating_chart", ["seatingChartId"])
    .index("by_ticket", ["ticketId"])
    .index("by_order", ["orderId"])
    .index("by_seat", ["seatingChartId", "sectionId", "seatId"])
    .index("by_table", ["seatingChartId", "sectionId", "tableId"])
    .index("by_status", ["status"]),

  // Waitlist for sold-out events
  eventWaitlist: defineTable({
    eventId: v.id("events"),
    ticketTierId: v.optional(v.id("ticketTiers")), // Specific tier, or null for any ticket

    // User info
    userId: v.optional(v.id("users")),
    email: v.string(),
    name: v.string(),
    quantity: v.number(), // Number of tickets desired

    // Status
    status: v.union(
      v.literal("ACTIVE"),
      v.literal("NOTIFIED"),
      v.literal("CONVERTED"), // User purchased tickets
      v.literal("EXPIRED"),
      v.literal("CANCELLED")
    ),

    // Notification tracking
    notifiedAt: v.optional(v.number()),
    expiresAt: v.number(), // Waitlist entry expires if not converted

    // Timestamps
    joinedAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_user", ["userId"])
    .index("by_email", ["email"])
    .index("by_tier", ["ticketTierId"])
    .index("by_status", ["status"])
    .index("by_event_and_status", ["eventId", "status"]),

  // Room/Seating Templates - Reusable room layouts
  roomTemplates: defineTable({
    // Basic info
    name: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("theater"),
      v.literal("stadium"),
      v.literal("concert"),
      v.literal("conference"),
      v.literal("outdoor"),
      v.literal("wedding"),
      v.literal("gala"),
      v.literal("banquet"),
      v.literal("custom")
    ),

    // Creator info
    createdBy: v.optional(v.id("users")), // null for system templates
    isPublic: v.boolean(), // Public templates visible to all users
    isSystemTemplate: v.optional(v.boolean()), // Built-in templates (cannot be deleted)

    // Seating configuration
    seatingStyle: v.union(v.literal("ROW_BASED"), v.literal("TABLE_BASED"), v.literal("MIXED")),
    estimatedCapacity: v.number(),

    // Template data (JSON structure matching seating chart sections)
    sections: v.array(v.any()), // Flexible array to store both row and table configurations

    // Optional preview image
    thumbnailUrl: v.optional(v.string()),

    // Usage statistics
    timesUsed: v.optional(v.number()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_creator", ["createdBy"])
    .index("by_category", ["category"])
    .index("by_public", ["isPublic"])
    .index("by_creator_and_category", ["createdBy", "category"]),

  // Uploaded Event Flyers - For bulk uploads and AI extraction
  uploadedFlyers: defineTable({
    // File info
    filename: v.string(),
    fileHash: v.string(), // SHA-256 hash for duplicate detection
    filepath: v.string(), // Path on server
    originalSize: v.number(), // Original file size in bytes
    optimizedSize: v.number(), // Optimized file size in bytes

    // Upload info
    uploadedBy: v.id("users"), // Admin who uploaded
    uploadedAt: v.number(),

    // AI extraction status
    aiProcessed: v.boolean(), // Has AI extracted data?
    aiProcessedAt: v.optional(v.number()),

    // Extracted event data (from AI) - accepts any structure
    extractedData: v.optional(v.any()),

    // Event creation status
    eventCreated: v.boolean(), // Has event been created from this flyer?
    eventId: v.optional(v.id("events")), // Link to created event
    eventCreatedAt: v.optional(v.number()),

    // Status
    status: v.union(
      v.literal("UPLOADED"), // Just uploaded
      v.literal("PROCESSING"), // AI is processing
      v.literal("EXTRACTED"), // Data extracted, pending review
      v.literal("EVENT_CREATED"), // Event created
      v.literal("ERROR") // Processing error
    ),
    errorMessage: v.optional(v.string()),
  })
    .index("by_uploader", ["uploadedBy"])
    .index("by_hash", ["fileHash"])
    .index("by_status", ["status"])
    .index("by_event", ["eventId"])
    .index("by_upload_date", ["uploadedAt"]),

  // Event Contacts - CRM System for managing event contacts
  eventContacts: defineTable({
    // Basic contact info
    name: v.string(),
    phoneNumber: v.optional(v.string()),
    email: v.optional(v.string()),

    // Social media
    socialMedia: v.optional(
      v.object({
        instagram: v.optional(v.string()),
        facebook: v.optional(v.string()),
        twitter: v.optional(v.string()),
      })
    ),

    // Professional info
    role: v.optional(v.string()), // "Event Coordinator", "Promoter", "DJ", etc.
    organization: v.optional(v.string()), // Company or organization name

    // Links to events/flyers
    eventId: v.optional(v.id("events")),
    flyerId: v.optional(v.id("uploadedFlyers")),

    // Metadata
    extractedFrom: v.union(v.literal("FLYER"), v.literal("MANUAL")),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_flyer", ["flyerId"])
    .index("by_name", ["name"])
    .index("by_phone", ["phoneNumber"])
    .index("by_email", ["email"])
    .index("by_created", ["createdAt"]),

  // Products - Merchandise and items for sale
  products: defineTable({
    // Basic info
    name: v.string(),
    description: v.string(),

    // Pricing
    price: v.number(), // Price in cents
    compareAtPrice: v.optional(v.number()), // Original price (for showing discounts)

    // Inventory
    sku: v.optional(v.string()), // Stock Keeping Unit
    inventoryQuantity: v.number(), // Available quantity
    trackInventory: v.boolean(), // Whether to track inventory
    allowBackorder: v.optional(v.boolean()), // Allow orders when out of stock

    // Product details
    category: v.optional(v.string()), // "Apparel", "Accessories", "Digital", etc.
    tags: v.optional(v.array(v.string())),

    // Images
    images: v.optional(v.array(v.string())), // Array of image URLs
    primaryImage: v.optional(v.string()), // Main product image

    // Variants (e.g., sizes, colors)
    hasVariants: v.boolean(),
    variants: v.optional(
      v.array(
        v.object({
          id: v.string(), // Unique variant ID
          name: v.string(), // "Size: M, Color: Blue"
          options: v.object({
            // e.g., { size: "M", color: "Blue" }
            size: v.optional(v.string()),
            color: v.optional(v.string()),
          }),
          price: v.optional(v.number()), // Override base price
          sku: v.optional(v.string()),
          inventoryQuantity: v.number(),
        })
      )
    ),

    // Shipping
    requiresShipping: v.boolean(),
    weight: v.optional(v.number()), // Weight in grams
    shippingPrice: v.optional(v.number()), // Shipping cost in cents

    // Status
    status: v.union(v.literal("ACTIVE"), v.literal("DRAFT"), v.literal("ARCHIVED")),

    // SEO
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),

    // Created by
    createdBy: v.id("users"), // Admin who created

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_sku", ["sku"])
    .index("by_created_by", ["createdBy"]),

  // Product Orders - Customer orders for products
  productOrders: defineTable({
    // Order number
    orderNumber: v.string(), // e.g., "ORD-2025-0001"

    // Customer info
    customerId: v.optional(v.id("users")), // Registered user (optional)
    customerEmail: v.string(),
    customerName: v.string(),
    customerPhone: v.optional(v.string()),

    // Shipping address
    shippingAddress: v.object({
      name: v.string(),
      address1: v.string(),
      address2: v.optional(v.string()),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      country: v.string(),
      phone: v.optional(v.string()),
    }),

    // Billing address (if different)
    billingAddress: v.optional(
      v.object({
        name: v.string(),
        address1: v.string(),
        address2: v.optional(v.string()),
        city: v.string(),
        state: v.string(),
        zipCode: v.string(),
        country: v.string(),
      })
    ),

    // Order items
    items: v.array(
      v.object({
        productId: v.id("products"),
        productName: v.string(),
        variantId: v.optional(v.string()),
        variantName: v.optional(v.string()),
        quantity: v.number(),
        price: v.number(), // Price per item in cents
        totalPrice: v.number(), // quantity * price
      })
    ),

    // Pricing
    subtotal: v.number(), // Sum of all items in cents
    shippingCost: v.number(), // Shipping cost in cents
    taxAmount: v.number(), // Tax amount in cents
    totalAmount: v.number(), // subtotal + shipping + tax

    // Payment
    paymentMethod: v.optional(v.string()), // "credit_card", "paypal", etc.
    paymentStatus: v.union(
      v.literal("PENDING"),
      v.literal("PAID"),
      v.literal("FAILED"),
      v.literal("REFUNDED")
    ),
    stripePaymentIntentId: v.optional(v.string()),
    paidAt: v.optional(v.number()),

    // Fulfillment
    fulfillmentStatus: v.union(
      v.literal("PENDING"),
      v.literal("PROCESSING"),
      v.literal("SHIPPED"),
      v.literal("DELIVERED"),
      v.literal("CANCELLED")
    ),
    trackingNumber: v.optional(v.string()),
    trackingUrl: v.optional(v.string()),
    shippedAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),

    // Notes
    customerNote: v.optional(v.string()),
    internalNote: v.optional(v.string()), // Admin notes

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_customer", ["customerId"])
    .index("by_email", ["customerEmail"])
    .index("by_order_number", ["orderNumber"])
    .index("by_payment_status", ["paymentStatus"])
    .index("by_fulfillment_status", ["fulfillmentStatus"])
    .index("by_created_at", ["createdAt"]),
});
