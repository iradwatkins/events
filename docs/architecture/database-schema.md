# Database Schema Documentation
**SteppersLife Event Ticketing Platform**

**Version:** 1.0
**Last Updated:** October 25, 2025
**Database:** Convex v1.28.0

---

## Overview

This document provides the complete database schema for the SteppersLife platform. The schema is defined in `convex/schema.ts` and uses Convex's type-safe schema definition system.

**Total Tables:** 6 (MVP)
**Indexes:** 15
**Search Indexes:** 1

---

## Complete Schema Definition

### File: `convex/schema.ts`

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ==================== USERS ====================
  users: defineTable({
    // Authentication
    email: v.string(),
    emailVerified: v.boolean(),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),

    // Profile
    profileImage: v.optional(v.id("_storage")),

    // Stripe
    stripeCustomerId: v.optional(v.string()),
    stripeConnectAccountId: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"]),

  // ==================== EVENTS ====================
  events: defineTable({
    // Basic Info
    name: v.string(),
    description: v.string(),
    organizerName: v.string(),

    // Type & Status
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

    // Date/Time (MVP: Single-day only)
    startDate: v.number(), // Unix timestamp in milliseconds
    startTime: v.optional(v.string()), // "7:00 PM"
    endTime: v.optional(v.string()), // "11:00 PM"
    timezone: v.string(), // "America/New_York"

    // Location
    location: v.object({
      address: v.string(),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      country: v.string(),
    }),

    // Media & Categorization
    images: v.array(v.id("_storage")),
    categories: v.array(v.string()),

    // Event Type Specific
    doorPrice: v.optional(v.string()), // For FREE_EVENT: "$20 at the door"

    // Settings
    maxTicketsPerOrder: v.number(),
    minTicketsPerOrder: v.number(),
    allowWaitlist: v.boolean(), // Future: Phase 2
    allowTransfers: v.boolean(), // Future: Phase 2

    // Stripe Connect
    stripeConnectAccountId: v.optional(v.string()),
    stripeAccountSetupComplete: v.boolean(),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_start_date", ["startDate"])
    .searchIndex("search_events", {
      searchField: "name",
      filterFields: ["status", "eventType"],
    }),

  // ==================== TICKETS ====================
  tickets: defineTable({
    eventId: v.id("events"),

    // Ticket Details
    ticketType: v.string(), // "General Admission", "VIP", etc.
    description: v.optional(v.string()),
    price: v.number(), // In cents (e.g., 2500 = $25.00)

    // Inventory
    quantityTotal: v.number(),
    quantitySold: v.number(),
    quantityReserved: v.number(), // Temporarily held during checkout

    // Sales Period
    salesStart: v.number(),
    salesEnd: v.number(),

    // Limits
    maxPerOrder: v.number(),
    minPerOrder: v.number(),

    // Status
    active: v.boolean(),

    createdAt: v.number(),
  })
    .index("by_event", ["eventId"]),

  // ==================== ORDERS ====================
  orders: defineTable({
    // User & Event (userId optional for guest checkout)
    userId: v.optional(v.id("users")),
    eventId: v.id("events"),
    orderNumber: v.string(), // "ORD-1698765432-abc123"

    // Items (MVP: Simple quantity, no line items)
    quantity: v.number(),

    // Pricing
    totalAmount: v.number(), // In cents

    // Payment
    paymentStatus: v.union(
      v.literal("PENDING"),
      v.literal("COMPLETED"),
      v.literal("FAILED"),
      v.literal("REFUNDED")
    ),
    paymentMethod: v.optional(v.literal("STRIPE")),
    stripePaymentIntentId: v.optional(v.string()),
    stripeChargeId: v.optional(v.string()),

    // Buyer Info
    buyerName: v.string(),
    buyerEmail: v.string(),
    buyerPhone: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_order_number", ["orderNumber"])
    .index("by_payment_status", ["paymentStatus"]),

  // ==================== TICKET INSTANCES ====================
  ticketInstances: defineTable({
    // References
    orderId: v.id("orders"),
    ticketId: v.id("tickets"),
    eventId: v.id("events"),

    // Ticket Details
    ticketNumber: v.string(), // Unique: "TIX-1698765432-xyz789"
    ticketType: v.optional(v.string()), // "General Admission"
    qrCode: v.string(), // Base64 data URL
    qrHash: v.string(), // HMAC signature for validation

    // Status
    status: v.union(
      v.literal("VALID"),
      v.literal("SCANNED"),
      v.literal("CANCELLED")
    ),

    // Scanning
    scannedAt: v.optional(v.number()),
    scannedBy: v.optional(v.id("users")),

    // Ownership (for future transfer feature)
    currentOwnerId: v.id("users"),

    createdAt: v.number(),
  })
    .index("by_order", ["orderId"])
    .index("by_event", ["eventId"])
    .index("by_ticket_number", ["ticketNumber"])
    .index("by_qr_hash", ["qrHash"])
    .index("by_status", ["status"]),

  // ==================== SCANS ====================
  scans: defineTable({
    ticketInstanceId: v.id("ticketInstances"),
    eventId: v.id("events"),
    scannedBy: v.id("users"),

    // Scan Details
    scanType: v.union(
      v.literal("QR_SCAN"),
      v.literal("MANUAL_LOOKUP")
    ),
    manualReason: v.optional(v.string()),

    // Validation
    valid: v.boolean(),
    errorMessage: v.optional(v.string()),

    scannedAt: v.number(),
  })
    .index("by_ticket", ["ticketInstanceId"])
    .index("by_event", ["eventId"])
    .index("by_scanner", ["scannedBy"]),
});
```

---

## Table Descriptions

### 1. `users` Table

**Purpose:** Store user account information

**Row Count (Est.):** 500-1,000 users (MVP launch)

**Primary Queries:**
- Find user by email: `by_email` index
- Get user profile: `ctx.db.get(userId)`

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | Id | Auto | Convex-generated unique ID |
| `email` | string | Yes | User's email address (unique) |
| `emailVerified` | boolean | Yes | Email verification status |
| `name` | string | No | User's full name |
| `phone` | string | No | Phone number (optional) |
| `profileImage` | Id (storage) | No | Profile picture file ID |
| `stripeCustomerId` | string | No | Stripe customer ID (for saved cards) |
| `stripeConnectAccountId` | string | No | Stripe Connect account ID (organizers only) |
| `createdAt` | number | Yes | Account creation timestamp |
| `updatedAt` | number | Yes | Last update timestamp |

**Indexes:**
- `by_email` - Lookup users by email (for login)

**Example Document:**
```json
{
  "_id": "j77x9z8...",
  "email": "organizer@example.com",
  "emailVerified": true,
  "name": "John Doe",
  "phone": "+1 555-123-4567",
  "profileImage": "kg88y0a9...",
  "stripeConnectAccountId": "acct_abc123xyz",
  "createdAt": 1698765432000,
  "updatedAt": 1698765432000
}
```

---

### 2. `events` Table

**Purpose:** Store all event information

**Row Count (Est.):** 100-200 events (MVP launch)

**Primary Queries:**
- List published events: `by_status` index (status = "PUBLISHED")
- Search events: `search_events` index
- Upcoming events: `by_start_date` index (startDate >= now)

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | Id | Auto | Convex-generated unique ID |
| `name` | string | Yes | Event name (e.g., "Summer Steppers Social") |
| `description` | string | Yes | Rich text HTML description |
| `organizerName` | string | Yes | Organizer's name or organization |
| `eventType` | "SAVE_THE_DATE" \| "FREE_EVENT" \| "TICKETED_EVENT" | Yes | Event type |
| `status` | "DRAFT" \| "PUBLISHED" \| "CANCELLED" | Yes | Publication status |
| `startDate` | number | Yes | Unix timestamp (milliseconds) |
| `startTime` | string | No | Time string (e.g., "7:00 PM") |
| `endTime` | string | No | Time string (e.g., "11:00 PM") |
| `timezone` | string | Yes | IANA timezone (e.g., "America/New_York") |
| `location` | object | Yes | Address object (see below) |
| `images` | Id[] | Yes | Array of storage IDs for event images |
| `categories` | string[] | Yes | Array of category names |
| `doorPrice` | string | No | Price at door (FREE_EVENT only) |
| `maxTicketsPerOrder` | number | Yes | Maximum tickets per transaction |
| `minTicketsPerOrder` | number | Yes | Minimum tickets per transaction |
| `allowWaitlist` | boolean | Yes | Enable waitlist (Phase 2) |
| `allowTransfers` | boolean | Yes | Enable ticket transfers (Phase 2) |
| `stripeConnectAccountId` | string | No | Organizer's Stripe account ID |
| `stripeAccountSetupComplete` | boolean | Yes | Stripe onboarding complete |
| `createdAt` | number | Yes | Creation timestamp |
| `updatedAt` | number | Yes | Last update timestamp |

**Location Object:**
```typescript
{
  address: string;    // "123 Main Street"
  city: string;       // "Chicago"
  state: string;      // "IL"
  zipCode: string;    // "60601"
  country: string;    // "US"
}
```

**Indexes:**
- `by_status` - Filter events by publication status
- `by_start_date` - Sort events chronologically
- `search_events` - Full-text search on event name

**Example Document:**
```json
{
  "_id": "k88y0a9...",
  "name": "Summer Steppers Social 2025",
  "description": "<p>Join us for the biggest stepping event of the year!</p>",
  "organizerName": "Chicago Steppers Association",
  "eventType": "TICKETED_EVENT",
  "status": "PUBLISHED",
  "startDate": 1719792000000,
  "startTime": "7:00 PM",
  "endTime": "11:00 PM",
  "timezone": "America/Chicago",
  "location": {
    "address": "123 Main Street",
    "city": "Chicago",
    "state": "IL",
    "zipCode": "60601",
    "country": "US"
  },
  "images": ["kg88y0a9..."],
  "categories": ["Set", "Weekend Event"],
  "maxTicketsPerOrder": 10,
  "minTicketsPerOrder": 1,
  "allowWaitlist": false,
  "allowTransfers": false,
  "stripeConnectAccountId": "acct_xyz789",
  "stripeAccountSetupComplete": true,
  "createdAt": 1698765432000,
  "updatedAt": 1698765432000
}
```

---

### 3. `tickets` Table

**Purpose:** Define ticket types for ticketed events

**Row Count (Est.):** 200-400 tickets (1-3 per event)

**Primary Queries:**
- Get tickets for event: `by_event` index

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | Id | Auto | Convex-generated unique ID |
| `eventId` | Id | Yes | Reference to events table |
| `ticketType` | string | Yes | Ticket name (e.g., "General Admission") |
| `description` | string | No | Ticket description |
| `price` | number | Yes | Price in cents (e.g., 2500 = $25.00) |
| `quantityTotal` | number | Yes | Total tickets available |
| `quantitySold` | number | Yes | Tickets sold (confirmed payments) |
| `quantityReserved` | number | Yes | Tickets reserved (pending checkout) |
| `salesStart` | number | Yes | Sales start timestamp |
| `salesEnd` | number | Yes | Sales end timestamp |
| `maxPerOrder` | number | Yes | Max tickets per order |
| `minPerOrder` | number | Yes | Min tickets per order |
| `active` | boolean | Yes | Ticket available for purchase |
| `createdAt` | number | Yes | Creation timestamp |

**Calculated Fields (Not Stored):**
```typescript
available = quantityTotal - quantitySold - quantityReserved;
percentRemaining = (available / quantityTotal) * 100;
soldOut = available === 0;
```

**Indexes:**
- `by_event` - Get all tickets for an event

**Example Document:**
```json
{
  "_id": "m99z1b0...",
  "eventId": "k88y0a9...",
  "ticketType": "General Admission",
  "description": "Includes entry, appetizers, and 1 drink ticket",
  "price": 2500,
  "quantityTotal": 200,
  "quantitySold": 150,
  "quantityReserved": 10,
  "salesStart": 1698765432000,
  "salesEnd": 1719792000000,
  "maxPerOrder": 10,
  "minPerOrder": 1,
  "active": true,
  "createdAt": 1698765432000
}
```

**Available:** 200 - 150 - 10 = 40 tickets remaining

---

### 4. `orders` Table

**Purpose:** Store ticket purchase orders

**Row Count (Est.):** 500-1,000 orders (MVP launch)

**Primary Queries:**
- Get orders for event: `by_event` index
- Lookup order by number: `by_order_number` index
- Filter by payment status: `by_payment_status` index

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | Id | Auto | Convex-generated unique ID |
| `userId` | Id | No | User ID (optional for guest checkout) |
| `eventId` | Id | Yes | Reference to events table |
| `orderNumber` | string | Yes | Human-readable order number |
| `quantity` | number | Yes | Number of tickets purchased |
| `totalAmount` | number | Yes | Total price in cents |
| `paymentStatus` | "PENDING" \| "COMPLETED" \| "FAILED" \| "REFUNDED" | Yes | Payment state |
| `paymentMethod` | "STRIPE" | No | Payment method used |
| `stripePaymentIntentId` | string | No | Stripe payment intent ID |
| `stripeChargeId` | string | No | Stripe charge ID |
| `buyerName` | string | Yes | Buyer's full name |
| `buyerEmail` | string | Yes | Buyer's email address |
| `buyerPhone` | string | No | Buyer's phone number |
| `createdAt` | number | Yes | Order creation timestamp |
| `updatedAt` | number | Yes | Last update timestamp |

**Order Number Format:**
```
ORD-{timestamp}-{random}
Example: ORD-1698765432-abc123xyz
```

**Indexes:**
- `by_event` - Get all orders for an event
- `by_order_number` - Lookup order by number (customer support)
- `by_payment_status` - Filter by payment status

**Example Document:**
```json
{
  "_id": "n00a2c1...",
  "userId": "j77x9z8...",
  "eventId": "k88y0a9...",
  "orderNumber": "ORD-1698765432-abc123",
  "quantity": 2,
  "totalAmount": 5000,
  "paymentStatus": "COMPLETED",
  "paymentMethod": "STRIPE",
  "stripePaymentIntentId": "pi_xyz789",
  "stripeChargeId": "ch_abc123",
  "buyerName": "Jane Smith",
  "buyerEmail": "jane@example.com",
  "buyerPhone": "+1 555-987-6543",
  "createdAt": 1698765432000,
  "updatedAt": 1698765432000
}
```

---

### 5. `ticketInstances` Table

**Purpose:** Individual tickets with QR codes

**Row Count (Est.):** 1,000-2,000 tickets (MVP launch)

**Primary Queries:**
- Get tickets for order: `by_order` index
- Get tickets for event: `by_event` index
- Lookup ticket by number: `by_ticket_number` index
- Validate QR hash: `by_qr_hash` index
- Filter by status: `by_status` index

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | Id | Auto | Convex-generated unique ID |
| `orderId` | Id | Yes | Reference to orders table |
| `ticketId` | Id | Yes | Reference to tickets table |
| `eventId` | Id | Yes | Reference to events table |
| `ticketNumber` | string | Yes | Unique ticket number |
| `ticketType` | string | No | Ticket type name |
| `qrCode` | string | Yes | Base64 data URL of QR code image |
| `qrHash` | string | Yes | HMAC signature for validation |
| `status` | "VALID" \| "SCANNED" \| "CANCELLED" | Yes | Ticket state |
| `scannedAt` | number | No | Scan timestamp |
| `scannedBy` | Id | No | User ID of scanner |
| `currentOwnerId` | Id | Yes | Current ticket owner (for transfers) |
| `createdAt` | number | Yes | Creation timestamp |

**Ticket Number Format:**
```
TIX-{timestamp}-{random}
Example: TIX-1698765432-xyz789abc
```

**QR Code Data Format:**
```json
{
  "ticketId": "p11b3d2...",
  "timestamp": 1698765432000,
  "signature": "a1b2c3d4e5f6..."
}
```

**Indexes:**
- `by_order` - Get all tickets for an order
- `by_event` - Get all tickets for an event
- `by_ticket_number` - Lookup ticket by number
- `by_qr_hash` - Fast QR validation
- `by_status` - Filter valid vs. scanned tickets

**Example Document:**
```json
{
  "_id": "p11b3d2...",
  "orderId": "n00a2c1...",
  "ticketId": "m99z1b0...",
  "eventId": "k88y0a9...",
  "ticketNumber": "TIX-1698765432-xyz789",
  "ticketType": "General Admission",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
  "qrHash": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "status": "VALID",
  "currentOwnerId": "j77x9z8...",
  "createdAt": 1698765432000
}
```

---

### 6. `scans` Table

**Purpose:** Log all ticket scan attempts

**Row Count (Est.):** 1,000-3,000 scans (MVP launch)

**Primary Queries:**
- Get scans for ticket: `by_ticket` index
- Get scans for event: `by_event` index
- Get scans by scanner: `by_scanner` index

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | Id | Auto | Convex-generated unique ID |
| `ticketInstanceId` | Id | Yes | Reference to ticketInstances |
| `eventId` | Id | Yes | Reference to events |
| `scannedBy` | Id | Yes | User ID of scanner |
| `scanType` | "QR_SCAN" \| "MANUAL_LOOKUP" | Yes | Scan method |
| `manualReason` | string | No | Reason for manual check-in |
| `valid` | boolean | Yes | Scan result (true = success) |
| `errorMessage` | string | No | Error message if invalid |
| `scannedAt` | number | Yes | Scan timestamp |

**Indexes:**
- `by_ticket` - Get scan history for a ticket
- `by_event` - Get all scans for an event
- `by_scanner` - Track scans by staff member

**Example Document:**
```json
{
  "_id": "q22c4e3...",
  "ticketInstanceId": "p11b3d2...",
  "eventId": "k88y0a9...",
  "scannedBy": "j77x9z8...",
  "scanType": "QR_SCAN",
  "valid": true,
  "scannedAt": 1719792000000
}
```

---

## Relationships

```
users (1) ──< events (many)           [User creates multiple events]
users (1) ──< orders (many)           [User has multiple orders]
users (1) ──< ticketInstances (many)  [User owns multiple tickets]
users (1) ──< scans (many)            [Staff scans multiple tickets]

events (1) ──< tickets (many)         [Event has multiple ticket types]
events (1) ──< orders (many)          [Event has multiple orders]
events (1) ──< ticketInstances (many) [Event has multiple tickets]
events (1) ──< scans (many)           [Event has multiple scans]

tickets (1) ──< ticketInstances (many) [Ticket type has multiple instances]

orders (1) ──< ticketInstances (many)  [Order contains multiple tickets]

ticketInstances (1) ──< scans (many)   [Ticket can be scanned multiple times (logs)]
```

---

## Data Migration Notes

**Initial Setup:**
1. Deploy Convex schema: `npx convex dev`
2. Schema automatically creates tables
3. No seed data required for MVP

**Future Migrations:**
- Add new fields: Use `v.optional()` for backwards compatibility
- Rename fields: Create new field, migrate data, delete old field
- Delete fields: Mark as optional first, then remove in future schema version

---

## Performance Considerations

**Indexes:**
- All foreign key fields are indexed
- Search functionality uses dedicated search index
- Time-based queries use timestamp indexes

**Optimization:**
- Use `.withIndex()` for all filtered queries
- Avoid full table scans
- Batch inserts when creating multiple ticket instances

**Estimated Query Times:**
- Get event by ID: <10ms
- List published events (20 per page): <50ms
- Search events: <100ms
- Validate QR code: <20ms

---

## Document Control

**Version:** 1.0
**Last Updated:** October 25, 2025
**Maintained By:** Development Team

**Next Review:** When adding new features requiring schema changes
