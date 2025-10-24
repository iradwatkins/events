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
    // Stripe fields
    stripeCustomerId: v.optional(v.string()),
    stripeConnectedAccountId: v.optional(v.string()),
    stripeAccountSetupComplete: v.optional(v.boolean()),
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  events: defineTable({
    // Basic info
    name: v.string(),
    description: v.string(),
    organizerId: v.id("users"),
    organizerName: v.string(),

    // Event type
    eventType: v.union(
      v.literal("SAVE_THE_DATE"),
      v.literal("FREE_EVENT"),
      v.literal("TICKETED_EVENT")
    ),

    // Date/time
    startDate: v.number(),
    endDate: v.optional(v.number()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    timezone: v.string(),

    // Location
    location: v.object({
      venueName: v.optional(v.string()),
      address: v.optional(v.string()),
      city: v.string(),
      state: v.string(),
      zipCode: v.optional(v.string()),
      country: v.string(),
    }),

    // Media
    images: v.array(v.id("_storage")),
    imageUrl: v.optional(v.string()), // Temporary: external image URLs (e.g., Unsplash)

    // Categories
    categories: v.array(v.string()),

    // Status
    status: v.union(
      v.literal("DRAFT"),
      v.literal("PUBLISHED"),
      v.literal("CANCELLED"),
      v.literal("COMPLETED")
    ),

    // Payment & ticketing visibility
    ticketsVisible: v.boolean(),
    paymentModelSelected: v.boolean(),

    // Settings
    allowWaitlist: v.boolean(),
    allowTransfers: v.boolean(),
    maxTicketsPerOrder: v.number(),
    minTicketsPerOrder: v.number(),

    // Free event specific
    doorPrice: v.optional(v.string()),

    // Social
    socialShareCount: v.number(),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organizer", ["organizerId"])
    .index("by_status", ["status"])
    .index("by_event_type", ["eventType"])
    .index("by_start_date", ["startDate"])
    .index("by_published", ["status", "startDate"]),

  // Organizer credit balance for pre-purchase model
  organizerCredits: defineTable({
    organizerId: v.id("users"),
    creditsTotal: v.number(),
    creditsUsed: v.number(),
    creditsRemaining: v.number(),
    firstEventFreeUsed: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_organizer", ["organizerId"]),

  // Credit purchase transactions
  creditTransactions: defineTable({
    organizerId: v.id("users"),
    ticketsPurchased: v.number(),
    amountPaid: v.number(), // in cents
    pricePerTicket: v.number(), // in cents
    stripePaymentIntentId: v.string(),
    status: v.union(v.literal("PENDING"), v.literal("COMPLETED"), v.literal("FAILED")),
    purchasedAt: v.number(),
  })
    .index("by_organizer", ["organizerId"])
    .index("by_status", ["status"]),

  // Payment configuration per event
  eventPaymentConfig: defineTable({
    eventId: v.id("events"),
    organizerId: v.id("users"),

    // Payment model
    paymentModel: v.union(v.literal("PRE_PURCHASE"), v.literal("PAY_AS_SELL")),

    // Status
    isActive: v.boolean(),
    activatedAt: v.optional(v.number()),

    // Stripe Connect (for pay-as-sell)
    stripeConnectAccountId: v.optional(v.string()),

    // Pre-purchase specific
    ticketsAllocated: v.optional(v.number()),

    // Pay-as-sell fee structure
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
    price: v.number(), // in cents
    quantity: v.number(), // total available
    sold: v.number(), // number sold
    saleStart: v.optional(v.number()),
    saleEnd: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_event", ["eventId"]),

  // Order items (links orders to ticket tiers)
  orderItems: defineTable({
    orderId: v.id("orders"),
    ticketTierId: v.id("ticketTiers"),
    priceCents: v.number(),
    createdAt: v.number(),
  })
    .index("by_order", ["orderId"]),

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
    status: v.optional(v.union(
      v.literal("VALID"),
      v.literal("SCANNED"),
      v.literal("CANCELLED"),
      v.literal("REFUNDED")
    )),
    scannedAt: v.optional(v.number()),
    scannedBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),

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
    .index("by_status", ["status"]),

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

    // Role and permissions
    role: v.union(v.literal("SELLER"), v.literal("SCANNER"), v.literal("ASSISTANT")),

    // Commission
    commissionType: v.optional(v.union(v.literal("PERCENTAGE"), v.literal("FIXED"))),
    commissionValue: v.optional(v.number()),
    commissionPercent: v.optional(v.number()),
    commissionEarned: v.number(), // total in cents

    // Status
    isActive: v.boolean(),
    invitedAt: v.optional(v.number()),
    acceptedAt: v.optional(v.number()),

    // Tracking
    ticketsSold: v.number(),
    referralCode: v.string(), // unique code for tracking sales

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organizer", ["organizerId"])
    .index("by_staff_user", ["staffUserId"])
    .index("by_event", ["eventId"])
    .index("by_referral_code", ["referralCode"]),

  // Staff sales tracking
  staffSales: defineTable({
    orderId: v.id("orders"),
    eventId: v.id("events"),
    staffId: v.id("eventStaff"),
    staffUserId: v.id("users"),
    ticketsSold: v.number(),
    saleAmount: v.number(), // in cents
    commissionAmount: v.number(), // in cents
    commissionPercent: v.number(),
    soldAt: v.number(),
  })
    .index("by_staff", ["staffId"])
    .index("by_event", ["eventId"])
    .index("by_staff_user", ["staffUserId"])
    .index("by_order", ["orderId"]),

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
    paymentMethod: v.optional(v.union(v.literal("SQUARE"), v.literal("STRIPE"))),
    paidAt: v.optional(v.number()),
    stripePaymentIntentId: v.optional(v.string()),

    // Staff referral
    staffReferralCode: v.optional(v.string()),
    staffCommission: v.optional(v.number()),

    // Legacy fields for backward compatibility
    userId: v.optional(v.id("users")),

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
});
