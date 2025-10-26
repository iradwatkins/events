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
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
    // Legacy fields
    userId: v.optional(v.string()), // Legacy Clerk user ID
    stripeConnectId: v.optional(v.string()), // Legacy field (renamed to stripeConnectedAccountId)
    isAdmin: v.optional(v.boolean()), // Legacy field (migrated to role field)
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  events: defineTable({
    // Basic info
    name: v.string(),
    description: v.string(),
    organizerId: v.optional(v.id("users")),
    organizerName: v.optional(v.string()),

    // Event type
    eventType: v.optional(v.union(
      v.literal("SAVE_THE_DATE"),
      v.literal("FREE_EVENT"),
      v.literal("TICKETED_EVENT")
    )),

    // Date/time
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    timezone: v.optional(v.string()),

    // Location (supports both object and legacy string format)
    location: v.optional(v.union(
      v.object({
        venueName: v.optional(v.string()),
        address: v.optional(v.string()),
        city: v.string(),
        state: v.string(),
        zipCode: v.optional(v.string()),
        country: v.string(),
      }),
      v.string() // Legacy format: plain string address
    )),

    // Media
    images: v.optional(v.array(v.id("_storage"))),
    imageUrl: v.optional(v.string()), // Temporary: external image URLs (e.g., Unsplash)

    // Categories
    categories: v.optional(v.array(v.string())),

    // Status
    status: v.optional(v.union(
      v.literal("DRAFT"),
      v.literal("PUBLISHED"),
      v.literal("CANCELLED"),
      v.literal("COMPLETED")
    )),

    // Payment & ticketing visibility
    ticketsVisible: v.optional(v.boolean()),
    paymentModelSelected: v.optional(v.boolean()),

    // Settings
    allowWaitlist: v.optional(v.boolean()),
    allowTransfers: v.optional(v.boolean()),
    maxTicketsPerOrder: v.optional(v.number()),
    minTicketsPerOrder: v.optional(v.number()),

    // Free event specific
    doorPrice: v.optional(v.string()),

    // Social
    socialShareCount: v.optional(v.number()),

    // Timestamps
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),

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

    // Staff tracking
    soldByStaffId: v.optional(v.id("eventStaff")), // Which staff member sold this ticket
    staffCommissionAmount: v.optional(v.number()), // Commission earned on this ticket in cents
    paymentMethod: v.optional(v.union(
      v.literal("ONLINE"),
      v.literal("CASH"),
      v.literal("CASH_APP"),
      v.literal("SQUARE"),
      v.literal("STRIPE")
    )),

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

    // Role and permissions
    role: v.union(v.literal("SELLER"), v.literal("SCANNER"), v.literal("ASSISTANT")),

    // Commission
    commissionType: v.optional(v.union(v.literal("PERCENTAGE"), v.literal("FIXED"))),
    commissionValue: v.optional(v.number()),
    commissionPercent: v.optional(v.number()),
    commissionEarned: v.number(), // total in cents

    // Ticket allocation
    allocatedTickets: v.optional(v.number()), // Number of tickets allocated to this staff member

    // Cash tracking
    cashCollected: v.optional(v.number()), // Total cash collected by staff in cents

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
    ticketCount: v.number(), // Number of tickets in this sale
    ticketsSold: v.optional(v.number()), // Legacy field
    saleAmount: v.optional(v.number()), // in cents - Legacy field
    commissionAmount: v.number(), // in cents
    commissionPercent: v.optional(v.number()), // Legacy field
    paymentMethod: v.optional(v.union(
      v.literal("ONLINE"),
      v.literal("CASH"),
      v.literal("CASH_APP"),
      v.literal("SQUARE"),
      v.literal("STRIPE")
    )),
    createdAt: v.number(),
    soldAt: v.optional(v.number()), // Legacy field
  })
    .index("by_staff", ["staffId"])
    .index("by_event", ["eventId"])
    .index("by_staff_user", ["staffUserId"])
    .index("by_order", ["orderId"])
    .index("by_payment_method", ["staffId", "paymentMethod"]),

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

    // Legacy fields for backward compatibility
    userId: v.optional(v.id("users")),

    // Seat selection (for reserved seating events)
    selectedSeats: v.optional(v.array(v.object({
      sectionId: v.string(),
      sectionName: v.string(),
      rowId: v.string(),
      rowLabel: v.string(),
      seatId: v.string(),
      seatNumber: v.string(),
    }))),

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

    // Venue image overlay (NEW - for visual seating chart placement)
    venueImageId: v.optional(v.id("_storage")), // Uploaded floor plan/venue image
    venueImageUrl: v.optional(v.string()), // Temporary URL for external images
    imageScale: v.optional(v.number()), // Zoom level (1.0 = 100%)
    imageRotation: v.optional(v.number()), // Rotation in degrees

    // Chart configuration
    sections: v.array(v.object({
      id: v.string(),
      name: v.string(), // e.g., "Section A", "VIP", "Balcony"
      color: v.optional(v.string()), // Hex color for visualization
      // Visual positioning (NEW - for drag-drop placement on venue image)
      x: v.optional(v.number()), // X coordinate on canvas
      y: v.optional(v.number()), // Y coordinate on canvas
      width: v.optional(v.number()), // Section width
      height: v.optional(v.number()), // Section height
      rotation: v.optional(v.number()), // Section rotation in degrees
      rows: v.array(v.object({
        id: v.string(),
        label: v.string(), // e.g., "A", "B", "1", "2"
        curved: v.optional(v.boolean()), // For curved theater rows
        seats: v.array(v.object({
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
          status: v.union(v.literal("AVAILABLE"), v.literal("RESERVED"), v.literal("UNAVAILABLE")),
        })),
      })),
      ticketTierId: v.optional(v.id("ticketTiers")), // Link section to tier pricing
    })),

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

    // Seat location
    sectionId: v.string(),
    rowId: v.string(),
    seatId: v.string(),
    seatNumber: v.string(), // Full seat identifier e.g., "Section A, Row 1, Seat 5"

    // Reservation status
    status: v.union(
      v.literal("RESERVED"),
      v.literal("RELEASED"),
      v.literal("CANCELLED")
    ),

    // Timestamps
    reservedAt: v.number(),
    releasedAt: v.optional(v.number()),
  })
    .index("by_event", ["eventId"])
    .index("by_seating_chart", ["seatingChartId"])
    .index("by_ticket", ["ticketId"])
    .index("by_order", ["orderId"])
    .index("by_seat", ["seatingChartId", "sectionId", "rowId", "seatId"])
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
});
