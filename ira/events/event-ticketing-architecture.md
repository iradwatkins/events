# Technical Architecture Document: SteppersLife Event Ticketing System

**Version:** 1.0  
**Date:** October 24, 2025  
**Architect:** BMAD Architect Agent  
**Status:** Draft

---

## 1. Executive Summary

This document defines the technical architecture for the SteppersLife Event Ticketing System at events.stepperslife.com. The system leverages modern real-time technologies including Convex for backend-as-a-service, Next.js 16 with React 19 for the frontend, and Stripe Connect for marketplace payments. The architecture prioritizes real-time updates, scalability, and seamless user experience across event creation, ticket sales, and event entry management.

### Key Architectural Decisions
- **Real-time First**: Convex provides real-time subscriptions for live ticket inventory, sales tracking, and queue management
- **Serverless Backend**: Convex eliminates traditional backend infrastructure management
- **Marketplace Payments**: Stripe Connect enables split payments between platform and event organizers
- **Type Safety**: TypeScript throughout the stack ensures reliability
- **Modern React**: React 19 with Server Components for optimal performance

---

## 2. Technology Stack

### 2.1 Frontend Stack

```typescript
// Core Framework
Next.js: 16.0.0 (App Router, React Server Components)
React: 19.2.0
TypeScript: 5.x
Node.js: 22.19.0

// Styling & UI
Tailwind CSS: 4.x
PostCSS: Latest
Radix UI: Latest (Label, Slot, Dialog, Dropdown, etc.)
class-variance-authority: Latest (CVA for component variants)
clsx: Latest (className utility)
lucide-react: Latest (Icon library)
shadcn/ui: Latest (Component library built on Radix)

// State Management
Convex React: v1.28.0 (Built-in real-time subscriptions)
React Hooks: useState, useReducer, useContext

// Forms & Validation
React Hook Form: Latest
Zod: Latest (Schema validation)
```

### 2.2 Backend Stack

```typescript
// Backend-as-a-Service
Convex: v1.28.0
  - Deployment: expert-vulture-775.convex.cloud
  - Real-time database with subscriptions
  - Serverless functions
  - File storage
  - Scheduled functions (crons)

// Authentication
@convex-dev/auth: v0.0.90 (Better Auth integration)
  - Google OAuth configured
  - Email/password authentication
  - Session management
  - JWT tokens

// Payment Processing
Stripe: v19.1.0
@stripe/stripe-js: v8.1.0
Stripe Connect: Configured (needs key setup)
  - Split payments to event organizers
  - Platform fees
  - Instant payouts
```

### 2.3 Infrastructure & Deployment

```bash
# Process Management
PM2: Cluster mode
  - Port: 3004
  - Location: /root/websites/events-stepperslife
  - Environment: Production

# Build Tools
Next.js Turbopack: Development builds
ESLint 9: Code linting with Next.js config

# Deployment Strategy
- PM2 for process management
- Node.js 22.19.0 runtime
- Environment variables managed via .env.local
```

---

## 3. System Architecture

### 3.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Layer                               │
│  (Web Browser - Desktop & Mobile, PWA)                          │
└────────────────┬──────────────────────────────────┬─────────────┘
                 │                                    │
                 ▼                                    ▼
┌────────────────────────────────────┐  ┌──────────────────────────┐
│   Next.js 16 Frontend (Port 3004)  │  │  Mobile Scanner App      │
│   - App Router (React 19)          │  │  - PWA or Native         │
│   - Server Components              │  │  - Offline Support       │
│   - Client Components              │  │  - QR Scanner            │
│   - Middleware (Auth)              │  └──────────────────────────┘
└────────────────┬───────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              Convex Real-Time Backend (BaaS)                     │
│  expert-vulture-775.convex.cloud                                 │
│                                                                   │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐│
│  │  Database       │  │  Functions       │  │  File Storage   ││
│  │  (Real-time)    │  │  (Serverless)    │  │  (Images)       ││
│  │                 │  │                  │  │                 ││
│  │ - events        │  │ - mutations      │  │ - event_images  ││
│  │ - tickets       │  │ - queries        │  │ - qr_codes      ││
│  │ - orders        │  │ - actions        │  │                 ││
│  │ - users         │  │ - crons          │  │                 ││
│  │ - queue         │  │                  │  │                 ││
│  └─────────────────┘  └──────────────────┘  └─────────────────┘│
└────────────────┬──────────────────┬──────────────────────────────┘
                 │                  │
                 ▼                  ▼
┌────────────────────────────┐  ┌──────────────────────────────────┐
│  @convex-dev/auth          │  │  Stripe Connect                   │
│  - Google OAuth            │  │  - Payment Processing             │
│  - Email/Password          │  │  - Split Payments                 │
│  - Session Management      │  │  - Organizer Payouts              │
└────────────────────────────┘  └──────────────────────────────────┘
```

### 3.2 Data Flow Architecture

#### Event Creation Flow
```
User → Next.js Form → Convex Mutation → Database
                          ↓
                    Stripe Connect Account Setup (if ticketed)
                          ↓
                    Event Published (Real-time update to all clients)
```

#### Ticket Purchase Flow (Real-time Queue System)
```
1. User joins queue → Convex adds to waiting_list table
                        ↓
2. Real-time position updates via Convex subscription
                        ↓
3. User reaches front → Ticket offer created (5 min expiry)
                        ↓
4. User purchases → Stripe payment → Convex confirms
                        ↓
5. Ticket issued → QR code generated → Email sent
                        ↓
6. Real-time inventory update to all subscribers
```

#### Cash Payment Flow (Authorized Sellers)
```
1. Seller initiates sale → Convex reserves ticket (5 min TTL)
                            ↓
2. Seller verification code generated (4-digit, daily rotation)
                            ↓
3. Push notification to seller mobile → Seller collects cash
                            ↓
4. Seller enters code → Convex validates → Ticket issued
                            ↓
5. OR timeout (5 min) → Reservation released automatically
```

---

## 4. Convex Database Schema

### 4.1 Core Tables

```typescript
// convex/schema.ts

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table (synced with @convex-dev/auth)
  users: defineTable({
    email: v.string(),
    emailVerified: v.boolean(),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    profileImage: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .searchIndex("search_users", {
      searchField: "name",
      filterFields: ["email"],
    }),

  // Events table
  events: defineTable({
    name: v.string(),
    description: v.string(),
    organizerId: v.id("users"),
    organizerName: v.string(),
    eventType: v.union(
      v.literal("SAVE_THE_DATE"),
      v.literal("FREE_EVENT"),
      v.literal("TICKETED_EVENT")
    ),
    status: v.union(
      v.literal("DRAFT"),
      v.literal("PUBLISHED"),
      v.literal("CANCELLED")
    ),
    
    // Date/Time fields
    startDate: v.number(), // Unix timestamp
    endDate: v.optional(v.number()),
    timezone: v.string(),
    
    // Location
    location: v.object({
      address: v.string(),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      country: v.string(),
      latitude: v.optional(v.number()),
      longitude: v.optional(v.number()),
    }),
    
    // Event details
    images: v.array(v.string()), // Convex file storage IDs
    categories: v.array(v.string()), // Set, Workshop, Cruise, etc.
    doorPrice: v.optional(v.string()), // For FREE_EVENT type
    
    // Settings
    allowWaitlist: v.boolean(),
    allowTransfers: v.boolean(),
    maxTicketsPerOrder: v.number(),
    minTicketsPerOrder: v.number(),
    
    // Stripe Connect
    stripeConnectAccountId: v.optional(v.string()),
    stripeAccountSetupComplete: v.boolean(),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organizer", ["organizerId"])
    .index("by_status", ["status"])
    .index("by_start_date", ["startDate"])
    .index("by_category", ["categories"])
    .searchIndex("search_events", {
      searchField: "name",
      filterFields: ["status", "eventType", "categories"],
    }),

  // Event days (for multi-day events)
  eventDays: defineTable({
    eventId: v.id("events"),
    dayNumber: v.number(),
    date: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    locationOverride: v.optional(v.object({
      address: v.string(),
      city: v.string(),
      state: v.string(),
    })),
    descriptionOverride: v.optional(v.string()),
  })
    .index("by_event", ["eventId"])
    .index("by_date", ["date"]),

  // Tickets (ticket types/tiers)
  tickets: defineTable({
    eventId: v.id("events"),
    eventDayId: v.optional(v.id("eventDays")), // null for single-day events
    ticketType: v.string(), // "General Admission", "VIP", "Early Bird"
    description: v.optional(v.string()),
    price: v.number(), // In cents
    quantityTotal: v.number(),
    quantitySold: v.number(),
    quantityReserved: v.number(), // For active queue offers
    
    // Sales period
    salesStart: v.number(),
    salesEnd: v.number(),
    
    // Limits
    maxPerOrder: v.number(),
    minPerOrder: v.number(),
    
    // Status
    active: v.boolean(),
    
    createdAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_event_day", ["eventDayId"])
    .index("by_sales_period", ["salesStart", "salesEnd"]),

  // Ticket bundles (for multi-day events)
  bundles: defineTable({
    eventId: v.id("events"),
    name: v.string(), // "3-Day Pass", "Weekend Bundle"
    description: v.string(),
    eventDayIds: v.array(v.id("eventDays")),
    price: v.number(), // Bundle price in cents
    discountPercentage: v.optional(v.number()),
    quantityTotal: v.number(),
    quantitySold: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_event", ["eventId"]),

  // Orders
  orders: defineTable({
    userId: v.id("users"),
    eventId: v.id("events"),
    orderNumber: v.string(), // Auto-generated unique order #
    
    // Items
    items: v.array(v.object({
      ticketId: v.optional(v.id("tickets")),
      bundleId: v.optional(v.id("bundles")),
      quantity: v.number(),
      pricePerItem: v.number(),
      subtotal: v.number(),
    })),
    
    // Pricing
    subtotal: v.number(),
    fees: v.number(),
    total: v.number(),
    
    // Payment
    paymentMethod: v.union(
      v.literal("STRIPE"),
      v.literal("CASH"),
      v.literal("SPLIT")
    ),
    paymentStatus: v.union(
      v.literal("PENDING"),
      v.literal("COMPLETED"),
      v.literal("FAILED"),
      v.literal("REFUNDED"),
      v.literal("PARTIAL")
    ),
    stripePaymentIntentId: v.optional(v.string()),
    stripeChargeId: v.optional(v.string()),
    
    // Split payment tracking
    splitPaymentId: v.optional(v.string()),
    splitPayments: v.optional(v.array(v.object({
      payerId: v.string(),
      payerEmail: v.string(),
      amount: v.number(),
      paid: v.boolean(),
      paidAt: v.optional(v.number()),
    }))),
    
    // Cash payment (seller)
    soldBySellerId: v.optional(v.id("users")),
    cashVerificationCode: v.optional(v.string()),
    cashVerifiedAt: v.optional(v.number()),
    
    // Buyer info
    buyerName: v.string(),
    buyerEmail: v.string(),
    buyerPhone: v.optional(v.string()),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_event", ["eventId"])
    .index("by_order_number", ["orderNumber"])
    .index("by_payment_status", ["paymentStatus"])
    .index("by_seller", ["soldBySellerId"]),

  // Ticket instances (individual tickets)
  ticketInstances: defineTable({
    orderId: v.id("orders"),
    ticketId: v.optional(v.id("tickets")),
    bundleId: v.optional(v.id("bundles")),
    eventId: v.id("events"),
    eventDayId: v.optional(v.id("eventDays")),
    
    // Ticket details
    ticketNumber: v.string(), // Unique ticket #
    qrCode: v.string(), // Base64 or Convex file storage ID
    qrHash: v.string(), // HMAC signature for validation
    
    // Status
    status: v.union(
      v.literal("VALID"),
      v.literal("SCANNED"),
      v.literal("TRANSFERRED"),
      v.literal("CANCELLED")
    ),
    
    // Scanning
    scannedAt: v.optional(v.number()),
    scannedBy: v.optional(v.id("users")),
    scanLocation: v.optional(v.string()),
    manualCheckin: v.boolean(),
    manualCheckinReason: v.optional(v.string()),
    
    // Transfer
    originalOwnerId: v.id("users"),
    currentOwnerId: v.id("users"),
    transferredAt: v.optional(v.number()),
    transferHistory: v.array(v.object({
      fromUserId: v.id("users"),
      toUserId: v.id("users"),
      transferredAt: v.number(),
    })),
    
    createdAt: v.number(),
  })
    .index("by_order", ["orderId"])
    .index("by_event", ["eventId"])
    .index("by_ticket_number", ["ticketNumber"])
    .index("by_qr_hash", ["qrHash"])
    .index("by_owner", ["currentOwnerId"])
    .index("by_status", ["status"]),

  // Waiting list / Queue system
  waitingList: defineTable({
    userId: v.id("users"),
    eventId: v.id("events"),
    ticketId: v.id("tickets"),
    
    // Queue position
    position: v.number(),
    joinedAt: v.number(),
    
    // Offer status
    status: v.union(
      v.literal("WAITING"),
      v.literal("OFFERED"),
      v.literal("EXPIRED"),
      v.literal("PURCHASED"),
      v.literal("CANCELLED")
    ),
    
    // Offer details (when status = OFFERED)
    offerExpiresAt: v.optional(v.number()),
    offerCreatedAt: v.optional(v.number()),
    
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_event", ["eventId"])
    .index("by_ticket", ["ticketId"])
    .index("by_status", ["status"])
    .index("by_position", ["eventId", "ticketId", "position"]),

  // Authorized sellers
  authorizedSellers: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    sellerName: v.string(),
    sellerEmail: v.string(),
    
    // Allocation
    allocatedTickets: v.number(),
    soldTickets: v.number(),
    
    // Seller code (4-digit, rotates daily)
    currentCode: v.string(),
    codeGeneratedAt: v.number(),
    
    // Commission
    commissionRate: v.optional(v.number()), // Percentage
    commissionEarned: v.number(), // In cents
    
    // Status
    status: v.union(
      v.literal("ACTIVE"),
      v.literal("INACTIVE"),
      v.literal("REVOKED")
    ),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // Event staff (scanners)
  eventStaff: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    staffName: v.string(),
    staffEmail: v.string(),
    role: v.union(v.literal("SCANNER"), v.literal("ADMIN")),
    
    // Access control
    accessExpiresAt: v.number(),
    active: v.boolean(),
    
    createdAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_user", ["userId"])
    .index("by_active", ["active"]),

  // Scans log
  scans: defineTable({
    ticketInstanceId: v.id("ticketInstances"),
    eventId: v.id("events"),
    eventDayId: v.optional(v.id("eventDays")),
    scannedBy: v.id("users"),
    
    // Scan details
    scanType: v.union(v.literal("QR_SCAN"), v.literal("MANUAL_LOOKUP")),
    manualReason: v.optional(v.string()),
    deviceInfo: v.optional(v.string()),
    location: v.optional(v.string()),
    
    // Validation
    valid: v.boolean(),
    errorMessage: v.optional(v.string()),
    
    scannedAt: v.number(),
  })
    .index("by_ticket", ["ticketInstanceId"])
    .index("by_event", ["eventId"])
    .index("by_scanner", ["scannedBy"])
    .index("by_time", ["scannedAt"]),

  // Rate limiting
  rateLimits: defineTable({
    userId: v.id("users"),
    action: v.string(), // "JOIN_QUEUE", "PURCHASE_TICKET", "CREATE_EVENT"
    count: v.number(),
    windowStart: v.number(),
  })
    .index("by_user_action", ["userId", "action"]),

  // Discount codes
  discountCodes: defineTable({
    eventId: v.id("events"),
    code: v.string(),
    description: v.string(),
    
    // Discount type
    discountType: v.union(v.literal("PERCENTAGE"), v.literal("FIXED_AMOUNT")),
    discountValue: v.number(),
    
    // Limits
    maxUses: v.optional(v.number()),
    currentUses: v.number(),
    maxUsesPerUser: v.optional(v.number()),
    
    // Validity period
    validFrom: v.number(),
    validUntil: v.number(),
    
    // Applicable tickets
    applicableTicketIds: v.optional(v.array(v.id("tickets"))),
    
    active: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_code", ["code"])
    .index("by_active", ["active"]),
});
```

### 4.2 Convex Functions Organization

```
convex/
├── schema.ts                 # Database schema
├── _generated/               # Auto-generated types
│
├── auth.ts                   # Authentication config (@convex-dev/auth)
│
├── events/
│   ├── mutations.ts          # Create, update, delete events
│   ├── queries.ts            # Get event(s), search events
│   ├── actions.ts            # Complex operations (Stripe setup)
│   └── helpers.ts            # Shared event utilities
│
├── tickets/
│   ├── mutations.ts          # Create, update ticket types
│   ├── queries.ts            # Get ticket availability
│   └── inventory.ts          # Inventory management logic
│
├── orders/
│   ├── mutations.ts          # Create order, update payment status
│   ├── queries.ts            # Get orders, order history
│   └── actions.ts            # Stripe payment processing
│
├── queue/
│   ├── mutations.ts          # Join queue, leave queue
│   ├── queries.ts            # Get queue position
│   ├── actions.ts            # Process queue (offer tickets)
│   └── crons.ts              # Expire offers, clean up queue
│
├── sellers/
│   ├── mutations.ts          # Add/remove sellers, verify codes
│   ├── queries.ts            # Get seller stats
│   └── crons.ts              # Rotate seller codes daily
│
├── scanning/
│   ├── mutations.ts          # Scan ticket, manual check-in
│   ├── queries.ts            # Get scan history
│   └── helpers.ts            # QR validation logic
│
├── payments/
│   ├── stripe.ts             # Stripe Connect integration
│   └── webhooks.ts           # Handle Stripe webhooks
│
└── crons/
    ├── expireOffers.ts       # Expire queue offers every minute
    ├── releaseReservations.ts # Release expired reservations
    └── rotateSellerCodes.ts  # Rotate seller codes daily at midnight
```

---

## 5. Frontend Architecture

### 5.1 Next.js App Router Structure

```
app/
├── (auth)/                   # Auth layout group
│   ├── login/
│   ├── register/
│   └── layout.tsx
│
├── (public)/                 # Public pages layout
│   ├── events/
│   │   ├── page.tsx         # Event listing
│   │   ├── [eventId]/
│   │   │   ├── page.tsx     # Event detail
│   │   │   ├── checkout/    # Ticket purchase
│   │   │   └── queue/       # Queue waiting page
│   │   └── search/
│   ├── about/
│   └── layout.tsx
│
├── (dashboard)/              # User dashboard layout
│   ├── dashboard/
│   │   ├── tickets/         # My tickets
│   │   ├── orders/          # Order history
│   │   └── profile/
│   ├── organizer/
│   │   ├── events/
│   │   │   ├── create/
│   │   │   ├── [eventId]/
│   │   │   │   ├── edit/
│   │   │   │   ├── tickets/
│   │   │   │   ├── sellers/
│   │   │   │   ├── staff/
│   │   │   │   └── analytics/
│   │   └── onboarding/      # Stripe Connect onboarding
│   └── layout.tsx
│
├── (scanner)/                # Scanner app layout (can be PWA)
│   ├── scan/
│   │   ├── [eventId]/
│   │   │   ├── page.tsx     # QR scanner interface
│   │   │   └── manual/      # Manual lookup
│   │   └── offline/         # Offline mode
│   └── layout.tsx
│
├── api/
│   ├── webhooks/
│   │   └── stripe/
│   │       └── route.ts     # Stripe webhook handler
│   └── auth/
│       └── [...convex]/     # Convex auth routes
│
├── layout.tsx               # Root layout
├── page.tsx                 # Homepage
└── globals.css              # Global styles (Tailwind)
```

### 5.2 Component Architecture

```
components/
├── ui/                      # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── toast.tsx
│   └── ...
│
├── events/
│   ├── EventCard.tsx        # Event display card
│   ├── EventFilters.tsx     # Category/search filters
│   ├── EventForm.tsx        # Create/edit event form
│   ├── EventCalendar.tsx    # Calendar view
│   └── EventMap.tsx         # Map view with locations
│
├── tickets/
│   ├── TicketCard.tsx       # Ticket type display
│   ├── TicketSelector.tsx   # Ticket quantity selector
│   ├── BundleSelector.tsx   # Multi-day bundle selector
│   ├── TicketAvailability.tsx # Real-time inventory display
│   └── QRCode.tsx           # QR code display
│
├── checkout/
│   ├── CheckoutForm.tsx     # Purchase form
│   ├── PaymentMethod.tsx    # Stripe Elements
│   ├── SplitPayment.tsx     # Split payment UI
│   └── OrderSummary.tsx     # Cart summary
│
├── queue/
│   ├── QueuePosition.tsx    # Position in queue
│   ├── QueueProgress.tsx    # Progress bar
│   └── OfferExpiry.tsx      # Countdown timer
│
├── scanning/
│   ├── QRScanner.tsx        # Camera-based QR scanner
│   ├── ManualLookup.tsx     # Search by name/email
│   ├── ScanResult.tsx       # Validation result display
│   └── OfflineQueue.tsx     # Offline scan queue
│
├── sellers/
│   ├── SellerDashboard.tsx  # Seller stats
│   ├── CashPayment.tsx      # Cash payment interface
│   └── SellerCode.tsx       # Display seller code
│
└── shared/
    ├── Header.tsx
    ├── Footer.tsx
    ├── Navigation.tsx
    ├── UserMenu.tsx
    └── LoadingStates.tsx
```

### 5.3 Real-Time Subscriptions Pattern

```typescript
// Example: Real-time ticket availability
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function TicketAvailability({ eventId }: { eventId: string }) {
  // This automatically subscribes to real-time updates
  const availability = useQuery(api.tickets.queries.getAvailability, {
    eventId: eventId as any,
  });

  if (!availability) {
    return <TicketAvailabilitySkeleton />;
  }

  return (
    <div className="space-y-4">
      {availability.tickets.map((ticket) => (
        <div key={ticket._id} className="border rounded-lg p-4">
          <h3 className="font-semibold">{ticket.ticketType}</h3>
          <p className="text-sm text-gray-600">
            {ticket.quantityTotal - ticket.quantitySold - ticket.quantityReserved} remaining
          </p>
          
          {/* Real-time indicator */}
          {ticket.quantityReserved > 0 && (
            <p className="text-xs text-orange-500 animate-pulse">
              {ticket.quantityReserved} people buying now
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## 6. Payment Architecture

### 6.1 Stripe Connect Implementation

```typescript
// convex/payments/stripe.ts

import Stripe from "stripe";
import { v } from "convex/values";
import { action } from "../_generated/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

// Create Stripe Connect account for event organizer
export const createConnectAccount = action({
  args: {
    email: v.string(),
    businessName: v.string(),
  },
  handler: async (ctx, args) => {
    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: args.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual",
    });

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/organizer/onboarding/refresh`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/organizer/onboarding/complete`,
      type: "account_onboarding",
    });

    return {
      accountId: account.id,
      onboardingUrl: accountLink.url,
    };
  },
});

// Create payment intent for ticket purchase
export const createPaymentIntent = action({
  args: {
    orderId: v.id("orders"),
    amount: v.number(),
    connectedAccountId: v.string(),
    applicationFeeAmount: v.number(), // Platform fee
  },
  handler: async (ctx, args) => {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: args.amount,
      currency: "usd",
      application_fee_amount: args.applicationFeeAmount,
      transfer_data: {
        destination: args.connectedAccountId,
      },
      metadata: {
        orderId: args.orderId,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  },
});

// Process refund for cancelled event
export const refundPayment = action({
  args: {
    chargeId: v.string(),
    amount: v.optional(v.number()), // Full refund if not specified
  },
  handler: async (ctx, args) => {
    const refund = await stripe.refunds.create({
      charge: args.chargeId,
      amount: args.amount,
    });

    return {
      refundId: refund.id,
      status: refund.status,
    };
  },
});
```

### 6.2 Payment Flow Diagrams

#### Standard Purchase Flow
```
User → Select Tickets → Checkout
                          ↓
        Convex: Create pending order & reserve inventory
                          ↓
        Stripe: Create payment intent (with Connect split)
                          ↓
        Frontend: Stripe Elements form
                          ↓
        User: Submit payment → Stripe processes
                          ↓
        Stripe Webhook: payment_intent.succeeded
                          ↓
        Convex: Confirm order, issue tickets, release inventory
                          ↓
        Email: Send tickets with QR codes
```

#### Split Payment Flow
```
Initiator → Start split payment → Convex: Create split order
                                     ↓
        Generate payment links for each payer (with tokens)
                                     ↓
        Send emails/SMS to all payers
                                     ↓
        Each payer: Complete their portion via Stripe
                                     ↓
        Track payments in split order
                                     ↓
        When all paid: Issue tickets to initiator
                                     ↓
        OR 24hr timeout: Cancel order, refund partial payments
```

---

## 7. Real-Time Queue System

### 7.1 Queue Architecture (inspired by sample repo)

```typescript
// convex/queue/mutations.ts

import { v } from "convex/values";
import { mutation } from "../_generated/server";

// Join queue for a ticket
export const joinQueue = mutation({
  args: {
    eventId: v.id("events"),
    ticketId: v.id("tickets"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = identity.subject as any;

    // Check rate limit (max 3 queue joins per hour)
    const recentJoins = await ctx.db
      .query("waitingList")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => 
        q.gt(q.field("joinedAt"), Date.now() - 60 * 60 * 1000)
      )
      .collect();

    if (recentJoins.length >= 3) {
      throw new Error("Rate limit exceeded. Try again later.");
    }

    // Check if already in queue
    const existing = await ctx.db
      .query("waitingList")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => 
        q.and(
          q.eq(q.field("eventId"), args.eventId),
          q.eq(q.field("ticketId"), args.ticketId),
          q.eq(q.field("status"), "WAITING")
        )
      )
      .first();

    if (existing) {
      throw new Error("Already in queue for this ticket");
    }

    // Get current queue size
    const queueSize = await ctx.db
      .query("waitingList")
      .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
      .filter((q) => q.eq(q.field("status"), "WAITING"))
      .collect();

    // Add to queue
    const queueEntry = await ctx.db.insert("waitingList", {
      userId,
      eventId: args.eventId,
      ticketId: args.ticketId,
      position: queueSize.length + 1,
      status: "WAITING",
      joinedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      queueEntryId: queueEntry,
      position: queueSize.length + 1,
    };
  },
});

// Get current queue position (real-time subscription)
export const getQueuePosition = mutation({
  args: {
    eventId: v.id("events"),
    ticketId: v.id("tickets"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const userId = identity.subject as any;

    const entry = await ctx.db
      .query("waitingList")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("eventId"), args.eventId),
          q.eq(q.field("ticketId"), args.ticketId),
          q.or(
            q.eq(q.field("status"), "WAITING"),
            q.eq(q.field("status"), "OFFERED")
          )
        )
      )
      .first();

    if (!entry) return null;

    return {
      position: entry.position,
      status: entry.status,
      offerExpiresAt: entry.offerExpiresAt,
    };
  },
});
```

### 7.2 Queue Processing Cron

```typescript
// convex/crons/processQueue.ts

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run every 30 seconds to process queue
crons.interval(
  "process-queue",
  { seconds: 30 },
  internal.queue.actions.processQueue
);

// Expire old offers every minute
crons.interval(
  "expire-offers",
  { seconds: 60 },
  internal.queue.actions.expireOffers
);

export default crons;
```

```typescript
// convex/queue/actions.ts

import { v } from "convex/values";
import { internalAction } from "../_generated/server";

export const processQueue = internalAction({
  handler: async (ctx) => {
    // Get all tickets with available capacity
    const tickets = await ctx.runQuery(
      internal.tickets.queries.getTicketsWithCapacity
    );

    for (const ticket of tickets) {
      const availableSpots = 
        ticket.quantityTotal - 
        ticket.quantitySold - 
        ticket.quantityReserved;

      if (availableSpots <= 0) continue;

      // Get next person in queue
      const nextInQueue = await ctx.runQuery(
        internal.queue.queries.getNextInQueue,
        { ticketId: ticket._id }
      );

      if (!nextInQueue) continue;

      // Create offer (5 minute expiry)
      await ctx.runMutation(internal.queue.mutations.createOffer, {
        queueEntryId: nextInQueue._id,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      // Reserve inventory
      await ctx.runMutation(internal.tickets.mutations.reserveTicket, {
        ticketId: ticket._id,
        quantity: 1,
      });

      // Send notification (email/SMS)
      // ... notification logic
    }
  },
});

export const expireOffers = internalAction({
  handler: async (ctx) => {
    const expiredOffers = await ctx.runQuery(
      internal.queue.queries.getExpiredOffers
    );

    for (const offer of expiredOffers) {
      // Mark as expired
      await ctx.runMutation(internal.queue.mutations.expireOffer, {
        queueEntryId: offer._id,
      });

      // Release reserved inventory
      await ctx.runMutation(internal.tickets.mutations.releaseReservation, {
        ticketId: offer.ticketId,
        quantity: 1,
      });
    }
  },
});
```

---

## 8. Authentication & Authorization

### 8.1 @convex-dev/auth Configuration

```typescript
// convex/auth.ts

import { convexAuth } from "@convex-dev/auth/server";
import Google from "@auth/core/providers/google";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
});
```

### 8.2 Role-Based Access Control

```typescript
// lib/permissions.ts

import { Id } from "@/convex/_generated/dataModel";

export type UserRole = "USER" | "ORGANIZER" | "SELLER" | "SCANNER" | "ADMIN";

export async function hasPermission(
  ctx: any,
  eventId: Id<"events">,
  requiredRole: UserRole
): Promise<boolean> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return false;

  const userId = identity.subject;

  // Check if user is event organizer
  const event = await ctx.db.get(eventId);
  if (event?.organizerId === userId) return true;

  // Check if user is authorized seller
  if (requiredRole === "SELLER") {
    const seller = await ctx.db
      .query("authorizedSellers")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), userId),
          q.eq(q.field("status"), "ACTIVE")
        )
      )
      .first();

    return !!seller;
  }

  // Check if user is event staff
  if (requiredRole === "SCANNER") {
    const staff = await ctx.db
      .query("eventStaff")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), userId),
          q.eq(q.field("active"), true),
          q.gt(q.field("accessExpiresAt"), Date.now())
        )
      )
      .first();

    return !!staff;
  }

  return false;
}
```

---

## 9. QR Code Generation & Validation

### 9.1 QR Code Generation

```typescript
// lib/qrcode.ts

import QRCode from "qrcode";
import crypto from "crypto";

export async function generateTicketQR(
  ticketInstanceId: string,
  secretKey: string
): Promise<{ qrCode: string; qrHash: string }> {
  // Create HMAC signature
  const timestamp = Date.now();
  const data = `${ticketInstanceId}:${timestamp}`;
  const hmac = crypto
    .createHmac("sha256", secretKey)
    .update(data)
    .digest("hex");

  const qrData = {
    ticketId: ticketInstanceId,
    timestamp,
    signature: hmac,
  };

  // Generate QR code as data URL
  const qrCode = await QRCode.toDataURL(JSON.stringify(qrData), {
    errorCorrectionLevel: "H",
    width: 400,
  });

  return {
    qrCode,
    qrHash: hmac,
  };
}

export function validateQRSignature(
  ticketInstanceId: string,
  timestamp: number,
  signature: string,
  secretKey: string
): boolean {
  // Check if timestamp is not too old (24 hours)
  if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
    return false;
  }

  const data = `${ticketInstanceId}:${timestamp}`;
  const expectedSignature = crypto
    .createHmac("sha256", secretKey)
    .update(data)
    .digest("hex");

  return signature === expectedSignature;
}
```

### 9.2 Scanner Component

```typescript
// components/scanning/QRScanner.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Html5QrcodeScanner } from "html5-qrcode";

export function QRScanner({ eventId }: { eventId: string }) {
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  
  const scanTicket = useMutation(api.scanning.mutations.scanTicket);

  useEffect(() => {
    if (!scanning) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      },
      false
    );

    scanner.render(
      async (decodedText) => {
        try {
          const qrData = JSON.parse(decodedText);
          
          const result = await scanTicket({
            eventId: eventId as any,
            ticketInstanceId: qrData.ticketId,
            timestamp: qrData.timestamp,
            signature: qrData.signature,
          });

          // Show success/error UI
          if (result.valid) {
            // Green screen, success sound
          } else {
            // Red screen, error sound
          }
        } catch (error) {
          console.error("Invalid QR code", error);
        }
      },
      (errorMessage) => {
        // Handle scan error
      }
    );

    scannerRef.current = scanner;

    return () => {
      scanner.clear();
    };
  }, [scanning, eventId, scanTicket]);

  return (
    <div className="space-y-4">
      <button
        onClick={() => setScanning(!scanning)}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        {scanning ? "Stop Scanning" : "Start Scanning"}
      </button>
      
      {scanning && <div id="qr-reader" />}
    </div>
  );
}
```

---

## 10. Offline Support Strategy

### 10.1 Progressive Web App (PWA)

```typescript
// public/service-worker.js

const CACHE_NAME = "stepperslife-scanner-v1";
const urlsToCache = [
  "/scan",
  "/offline",
  "/assets/icons/*",
  "/assets/sounds/*",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Background sync for offline scans
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-scans") {
    event.waitUntil(syncOfflineScans());
  }
});

async function syncOfflineScans() {
  const db = await openIndexedDB();
  const scans = await db.getAll("offlineScans");
  
  for (const scan of scans) {
    try {
      await fetch("/api/scans/sync", {
        method: "POST",
        body: JSON.stringify(scan),
      });
      await db.delete("offlineScans", scan.id);
    } catch (error) {
      console.error("Failed to sync scan", error);
    }
  }
}
```

### 10.2 Offline Storage

```typescript
// lib/offline-storage.ts

import { openDB, DBSchema } from "idb";

interface ScannerDB extends DBSchema {
  offlineScans: {
    key: string;
    value: {
      id: string;
      ticketInstanceId: string;
      eventId: string;
      scannedAt: number;
      deviceInfo: string;
    };
  };
  cachedEvents: {
    key: string;
    value: {
      eventId: string;
      data: any;
      cachedAt: number;
    };
  };
}

export async function openScannerDB() {
  return openDB<ScannerDB>("scanner-db", 1, {
    upgrade(db) {
      db.createObjectStore("offlineScans", { keyPath: "id" });
      db.createObjectStore("cachedEvents", { keyPath: "eventId" });
    },
  });
}

export async function saveOfflineScan(scan: any) {
  const db = await openScannerDB();
  await db.add("offlineScans", {
    id: crypto.randomUUID(),
    ...scan,
  });
}

export async function syncOfflineScans() {
  const db = await openScannerDB();
  const scans = await db.getAll("offlineScans");
  
  // Sync with Convex when back online
  // ...
}
```

---

## 11. Performance Optimization

### 11.1 Caching Strategy

```typescript
// middleware.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Cache static assets aggressively
  if (request.nextUrl.pathname.startsWith("/_next/static")) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=31536000, immutable"
    );
  }

  // Cache event images
  if (request.nextUrl.pathname.startsWith("/api/images")) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=86400, stale-while-revalidate=3600"
    );
  }

  return response;
}
```

### 11.2 React Server Components Strategy

```typescript
// app/(public)/events/[eventId]/page.tsx (Server Component)

import { api } from "@/convex/_generated/api";
import { preloadQuery } from "convex/nextjs";
import { TicketSelector } from "@/components/tickets/TicketSelector";

export default async function EventPage({
  params,
}: {
  params: { eventId: string };
}) {
  // Preload data on server (no loading state needed)
  const preloadedEvent = await preloadQuery(api.events.queries.getEvent, {
    eventId: params.eventId as any,
  });

  return (
    <div>
      <EventDetails preloadedData={preloadedEvent} />
      
      {/* Client component for interactive features */}
      <TicketSelector eventId={params.eventId} />
    </div>
  );
}
```

### 11.3 Image Optimization

```typescript
// next.config.ts

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "expert-vulture-775.convex.cloud",
        pathname: "/api/storage/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  
  // Enable optimizations
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-*"],
  },
};

export default nextConfig;
```

---

## 12. Security Architecture

### 12.1 Security Layers

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Network Security                               │
│ - HTTPS only (TLS 1.3)                                  │
│ - CORS configuration                                     │
│ - Rate limiting (Convex + Edge)                         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 2: Authentication                                  │
│ - @convex-dev/auth (JWT tokens)                         │
│ - Google OAuth                                           │
│ - Session management                                     │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 3: Authorization                                   │
│ - Role-based access control (RBAC)                      │
│ - Event-level permissions                                │
│ - Seller/staff access control                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 4: Data Protection                                 │
│ - Input validation (Zod schemas)                        │
│ - SQL injection prevention (Convex queries)             │
│ - XSS prevention (React escaping)                       │
│ - CSRF tokens (Convex auth)                             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 5: Payment Security                                │
│ - PCI DSS compliance (Stripe)                           │
│ - No raw card data stored                               │
│ - Tokenization (Stripe Elements)                        │
│ - Webhook signature verification                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 6: QR Code Security                                │
│ - HMAC signatures                                        │
│ - Timestamp validation                                   │
│ - One-time use enforcement                              │
│ - Replay attack prevention                              │
└─────────────────────────────────────────────────────────┘
```

### 12.2 Rate Limiting Implementation

```typescript
// convex/ratelimits/check.ts

import { v } from "convex/values";
import { query } from "../_generated/server";

export const checkRateLimit = query({
  args: {
    action: v.string(),
    limit: v.number(),
    windowMs: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = identity.subject as any;
    const windowStart = Date.now() - args.windowMs;

    const existing = await ctx.db
      .query("rateLimits")
      .withIndex("by_user_action", (q) =>
        q.eq("userId", userId).eq("action", args.action)
      )
      .filter((q) => q.gt(q.field("windowStart"), windowStart))
      .first();

    if (existing && existing.count >= args.limit) {
      return {
        allowed: false,
        resetAt: existing.windowStart + args.windowMs,
      };
    }

    return { allowed: true };
  },
});
```

---

## 13. Monitoring & Observability

### 13.1 Logging Strategy

```typescript
// lib/logger.ts

type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  userId?: string;
  eventId?: string;
  metadata?: Record<string, any>;
}

export function log(entry: Omit<LogEntry, "timestamp">) {
  const logEntry: LogEntry = {
    ...entry,
    timestamp: Date.now(),
  };

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log(JSON.stringify(logEntry, null, 2));
  }

  // Send to external logging service in production
  // e.g., Datadog, Sentry, LogRocket
}
```

### 13.2 Error Tracking

```typescript
// lib/error-tracking.ts

import * as Sentry from "@sentry/nextjs";

export function initErrorTracking() {
  if (process.env.NODE_ENV === "production") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 1.0,
    });
  }
}

export function captureError(
  error: Error,
  context?: Record<string, any>
) {
  if (process.env.NODE_ENV === "production") {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error("Error:", error, "Context:", context);
  }
}
```

---

## 14. Deployment Architecture

### 14.1 Current Deployment Setup

```bash
# PM2 Configuration
# /root/websites/events-stepperslife/ecosystem.config.js

module.exports = {
  apps: [{
    name: "events-stepperslife",
    script: "npm",
    args: "start",
    cwd: "/root/websites/events-stepperslife",
    instances: "max", // Cluster mode
    exec_mode: "cluster",
    env: {
      NODE_ENV: "production",
      PORT: 3004,
    },
    error_file: "./logs/err.log",
    out_file: "./logs/out.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
  }]
};
```

### 14.2 Environment Variables

```bash
# .env.local (Production)

# App
NEXT_PUBLIC_APP_URL=https://events.stepperslife.com
NODE_ENV=production

# Convex
CONVEX_DEPLOYMENT=expert-vulture-775
NEXT_PUBLIC_CONVEX_URL=https://expert-vulture-775.convex.cloud

# Auth (@convex-dev/auth)
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret
JWT_PRIVATE_KEY=your_jwt_private_key

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_CONNECT_CLIENT_ID=ca_xxx

# Email (e.g., Resend)
RESEND_API_KEY=re_xxx
FROM_EMAIL=tickets@stepperslife.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1xxx

# QR Code Secret
QR_CODE_SECRET_KEY=your_secret_key_for_hmac

# Feature Flags
ENABLE_QUEUE_SYSTEM=true
ENABLE_CASH_PAYMENTS=true
ENABLE_SPLIT_PAYMENTS=true
```

---

## 15. Testing Strategy

### 15.1 Testing Pyramid

```
                    ▲
                   / \
                  /   \
                 /  E2E \
                /       \
               /---------\
              /           \
             / Integration \
            /               \
           /-----------------\
          /                   \
         /   Unit Tests        \
        /                       \
       /-------------------------\
```

### 15.2 Testing Tools

```json
// package.json (test dependencies)
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@playwright/test": "^1.40.0",
    "vitest": "^1.0.0",
    "convex-test": "^0.1.0"
  }
}
```

### 15.3 Convex Function Tests

```typescript
// convex/events/mutations.test.ts

import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "../schema";
import { createEvent } from "./mutations";

test("creates event successfully", async () => {
  const t = convexTest(schema);

  const eventId = await t.mutation(createEvent, {
    name: "Test Event",
    description: "Test Description",
    eventType: "TICKETED_EVENT",
    startDate: Date.now(),
    // ... other fields
  });

  expect(eventId).toBeDefined();

  const event = await t.run(async (ctx) => {
    return await ctx.db.get(eventId);
  });

  expect(event?.name).toBe("Test Event");
});
```

---

## 16. Migration Strategy (If Applicable)

Since this is a greenfield project, no migration is needed. However, for future reference:

### 16.1 Data Migration Pattern

```typescript
// convex/migrations/001_add_bundles.ts

import { internalMutation } from "../_generated/server";

export const migration_001 = internalMutation({
  handler: async (ctx) => {
    // Example: Add bundles support
    const events = await ctx.db.query("events").collect();
    
    for (const event of events) {
      // Migration logic
    }
  },
});
```

---

## 17. API Documentation

### 17.1 Convex API Endpoints

All Convex functions are automatically type-safe and accessible via:

```typescript
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";

// Queries (real-time subscriptions)
const events = useQuery(api.events.queries.listEvents, { category: "Workshop" });

// Mutations
const createEvent = useMutation(api.events.mutations.createEvent);

// Actions (non-reactive, for external APIs)
const processPayment = useMutation(api.payments.stripe.createPaymentIntent);
```

### 17.2 Webhook Endpoints

```typescript
// app/api/webhooks/stripe/route.ts

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case "payment_intent.succeeded":
        await convex.mutation(api.orders.mutations.confirmPayment, {
          paymentIntentId: event.data.object.id,
        });
        break;

      case "account.updated":
        // Handle Connect account updates
        break;

      // ... other webhook events
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Webhook error" },
      { status: 400 }
    );
  }
}
```

---

## 18. Future Enhancements

### 18.1 Phase 2 Features
- Reserved seating with interactive seat maps
- AI-powered event recommendations
- Social features ("Who's Going", friend discovery)
- Event analytics dashboard
- Email marketing automation
- Mobile app (React Native)

### 18.2 Phase 3 Features
- Virtual events with live streaming
- NFT tickets (blockchain integration)
- Dynamic pricing based on demand
- Multi-language support
- Accessibility improvements (WCAG 2.1 Level AAA)

---

## 19. Appendices

### A. Convex Resources
- Documentation: https://docs.convex.dev
- Discord: https://convex.dev/community
- Deployment Dashboard: https://dashboard.convex.dev

### B. Stripe Connect Resources
- Documentation: https://stripe.com/docs/connect
- Dashboard: https://dashboard.stripe.com/connect

### C. Environment Setup Guide
```bash
# Clone repository
git clone https://github.com/yourusername/events-stepperslife.git
cd events-stepperslife

# Install dependencies
npm install

# Set up Convex
npx convex dev

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# Run development server
npm run dev

# Deploy to production (PM2)
npm run build
pm2 start ecosystem.config.js
pm2 save
```

---

## Document Control

**Approval:**
- [ ] Lead Architect
- [ ] Engineering Lead
- [ ] DevOps Lead
- [ ] Security Officer

**Next Steps:**
1. Review and approval from technical leads
2. Set up Convex project and configure schema
3. Set up Stripe Connect account
4. Configure authentication with @convex-dev/auth
5. Begin MVP development (see mvp.md)

**Revision History:**
- v1.0 - October 24, 2025 - Initial architecture document
