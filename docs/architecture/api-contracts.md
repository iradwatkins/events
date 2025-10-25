# API Contracts Documentation
**SteppersLife Event Ticketing Platform**

**Version:** 1.0
**Last Updated:** October 25, 2025

---

## Overview

Complete API reference for all Convex functions (queries, mutations, actions).

**Convex Functions Located In:** `convex/` directory

---

## Queries (Read Operations)

### `events.getPublicEvents`

**Purpose:** List all published events for public browsing

**Location:** `convex/events/queries.ts`

**Args:**
```typescript
{
  page?: number;           // Page number (default: 0)
  limit?: number;          // Items per page (default: 20)
  category?: string;       // Filter by category (optional)
}
```

**Returns:**
```typescript
Event[] // Array of published events
```

**Example:**
```typescript
const events = useQuery(api.events.queries.getPublicEvents, {
  page: 0,
  limit: 20,
  category: "Set"
});
```

---

### `events.getEvent`

**Purpose:** Get single event by ID

**Args:**
```typescript
{ eventId: Id<"events"> }
```

**Returns:**
```typescript
Event | null
```

---

### `events.getOrganizerEvents`

**Purpose:** Get all events for logged-in organizer

**Args:** None

**Returns:**
```typescript
Event[]
```

---

### `events.searchEvents`

**Purpose:** Full-text search events by name

**Args:**
```typescript
{ query: string }
```

**Returns:**
```typescript
Event[] // Top 10 results
```

---

### `tickets.getTicketAvailability`

**Purpose:** Get real-time ticket availability for event

**Args:**
```typescript
{ eventId: Id<"events"> }
```

**Returns:**
```typescript
Array<{
  ...Ticket;
  available: number;
  percentRemaining: number;
}>
```

---

### `orders.getUserOrders`

**Purpose:** Get orders for logged-in user

**Args:** None

**Returns:**
```typescript
Order[]
```

---

### `users.getUserTickets`

**Purpose:** Get all tickets owned by user

**Args:** None

**Returns:**
```typescript
Array<{
  order: Order;
  event: Event;
  tickets: TicketInstance[];
}>
```

---

### `scanning.canScanEvent`

**Purpose:** Check if user has permission to scan event

**Args:**
```typescript
{ eventId: Id<"events"> }
```

**Returns:**
```typescript
boolean
```

---

## Mutations (Write Operations)

### `events.createSaveTheDateEvent`

**Purpose:** Create Save the Date event

**Args:**
```typescript
{
  name: string;
  startDate: number;
  organizerName: string;
  categories: string[];
  imageId: Id<"_storage">;
}
```

**Returns:**
```typescript
Id<"events">
```

---

### `events.createFreeEvent`

**Purpose:** Create free event with door price

**Args:**
```typescript
{
  name: string;
  description: string;
  startDate: number;
  startTime: string;
  endTime: string;
  timezone: string;
  location: LocationObject;
  organizerName: string;
  categories: string[];
  imageId: Id<"_storage">;
  doorPrice: string;
}
```

**Returns:**
```typescript
Id<"events">
```

---

### `events.createTicketedEvent`

**Purpose:** Create ticketed event with ticket types

**Args:**
```typescript
{
  // Event details
  name: string;
  description: string;
  startDate: number;
  startTime: string;
  endTime: string;
  timezone: string;
  location: LocationObject;
  organizerName: string;
  categories: string[];
  imageId: Id<"_storage">;
  
  // Tickets
  tickets: Array<{
    ticketType: string;
    price: number;
    quantityTotal: number;
    maxPerOrder: number;
  }>;
}
```

**Returns:**
```typescript
Id<"events">
```

---

### `events.updateEvent`

**Purpose:** Update existing event

**Args:**
```typescript
{
  eventId: Id<"events">;
  ...updatedFields
}
```

**Returns:**
```typescript
void
```

---

### `events.publishEvent`

**Purpose:** Publish event (make public)

**Args:**
```typescript
{ eventId: Id<"events"> }
```

**Returns:**
```typescript
void
```

---

### `orders.createOrder`

**Purpose:** Create order and reserve inventory

**Args:**
```typescript
{
  eventId: Id<"events">;
  ticketId: Id<"tickets">;
  quantity: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
}
```

**Returns:**
```typescript
{
  orderId: Id<"orders">;
  orderNumber: string;
}
```

---

### `orders.confirmOrder`

**Purpose:** Confirm order after successful payment

**Args:**
```typescript
{ orderId: Id<"orders"> }
```

**Returns:**
```typescript
void
```

---

### `scanning.scanTicket`

**Purpose:** Validate and scan ticket via QR code

**Args:**
```typescript
{
  eventId: Id<"events">;
  ticketInstanceId: Id<"ticketInstances">;
  timestamp: number;
  signature: string;
}
```

**Returns:**
```typescript
{
  valid: boolean;
  attendeeName?: string;
  ticketType?: string;
  message?: string;
}
```

---

### `scanning.manualCheckin`

**Purpose:** Manually check in ticket

**Args:**
```typescript
{
  ticketInstanceId: Id<"ticketInstances">;
  reason: string;
}
```

**Returns:**
```typescript
void
```

---

## Actions (Node Environment)

### `payments.createPaymentIntent`

**Purpose:** Create Stripe payment intent with Connect split

**Location:** `convex/payments/stripe.ts`

**Args:**
```typescript
{
  orderId: Id<"orders">;
  amount: number; // In cents
  connectedAccountId: string;
}
```

**Returns:**
```typescript
{
  clientSecret: string;
  paymentIntentId: string;
}
```

---

### `payments.createConnectAccount`

**Purpose:** Create Stripe Connect Express account

**Args:**
```typescript
{
  email: string;
  businessName: string;
}
```

**Returns:**
```typescript
{
  accountId: string;
  onboardingUrl: string;
}
```

---

### `tickets.generateTicketQR`

**Purpose:** Generate QR code with HMAC signature

**Location:** `convex/tickets/qrcode.ts`

**Args:**
```typescript
{ ticketInstanceId: Id<"ticketInstances"> }
```

**Returns:**
```typescript
{
  qrCode: string; // Base64 data URL
  qrHash: string; // HMAC signature
}
```

---

### `email.sendTicketEmail`

**Purpose:** Send ticket email via Resend

**Location:** `convex/email/send.ts`

**Args:**
```typescript
{ orderId: Id<"orders"> }
```

**Returns:**
```typescript
{ emailId: string }
```

---

### `events.generateImageUploadUrl`

**Purpose:** Generate upload URL for event images

**Args:** None

**Returns:**
```typescript
string // Upload URL
```

---

## Error Handling

All functions throw standard JavaScript errors:

```typescript
throw new Error("Event not found");
throw new Error("Not authorized");
throw new Error("Not enough tickets available");
```

Frontend should catch and display user-friendly messages.

---

## Rate Limiting

**Implemented:** TBD (Phase 2)

**Current:** No rate limiting

**Future:** 100 requests/minute per user

---

## Document Control

**Version:** 1.0
**Last Updated:** October 25, 2025
**Maintained By:** Development Team
