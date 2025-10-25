# Story 2.3: Create Ticketed Event (Basic - No Stripe Yet)

**Epic:** Epic 2 - Event Creation & Management
**Priority:** P0
**Effort:** 5 points
**Sprint:** Week 1-2
**Status:** Ready for Development

---

## User Story

**As an** event organizer
**I want to** create a ticketed event with multiple ticket types
**So that** I can define inventory and pricing (Stripe integration comes in Story 2.4)

---

## Acceptance Criteria

- [ ] Can select "Ticketed Event" type
- [ ] Can add multiple ticket types (name, price, quantity)
- [ ] Can set sales period (start/end dates)
- [ ] Can set min/max tickets per order
- [ ] Ticket types saved to `tickets` table
- [ ] Event requires Stripe Connect (warning shown, blocks publishing)
- [ ] Validation: at least 1 ticket type required

---

## Tasks

### 1. Create Tickets Table Schema

**Files:**
- `convex/schema.ts` - Add `tickets` table (if not exists)

---

### 2. Create `createTicketedEvent` Mutation

**Files:**
- `convex/events/mutations.ts`

**Code:**
```typescript
export const createTicketedEvent = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    startDate: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    timezone: v.string(),
    location: v.object({...}),
    organizerName: v.string(),
    categories: v.array(v.string()),
    imageId: v.id("_storage"),
    tickets: v.array(v.object({
      ticketType: v.string(),
      price: v.number(),
      quantityTotal: v.number(),
      maxPerOrder: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    // Create event
    const eventId = await ctx.db.insert("events", {
      name: args.name,
      description: args.description,
      organizerName: args.organizerName,
      eventType: "TICKETED_EVENT",
      status: "DRAFT",
      startDate: args.startDate,
      startTime: args.startTime,
      endTime: args.endTime,
      timezone: args.timezone,
      location: args.location,
      images: [args.imageId],
      categories: args.categories,
      maxTicketsPerOrder: 10,
      minTicketsPerOrder: 1,
      allowWaitlist: false,
      allowTransfers: false,
      stripeAccountSetupComplete: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create ticket types
    for (const ticket of args.tickets) {
      await ctx.db.insert("tickets", {
        eventId,
        ticketType: ticket.ticketType,
        price: ticket.price,
        quantityTotal: ticket.quantityTotal,
        quantitySold: 0,
        quantityReserved: 0,
        salesStart: args.startDate - 86400000 * 30, // 30 days before
        salesEnd: args.startDate,
        maxPerOrder: ticket.maxPerOrder,
        minPerOrder: 1,
        active: true,
        createdAt: Date.now(),
      });
    }

    return eventId;
  },
});
```

---

### 3. Create TicketTypeEditor Component

**Files:**
- `components/events/TicketTypeEditor.tsx`

**Features:**
- Add/remove ticket types
- Edit name, price, quantity
- Validation (price > 0, quantity > 0)

---

### 4. Update Event Creation Page

Add ticket type editor to Ticketed Event form

---

### 5. Display Warning (No Stripe Yet)

Show warning: "Complete Stripe Connect onboarding before publishing" (Story 2.4)

---

## Testing

- [ ] Can create ticketed event with multiple ticket types
- [ ] Tickets saved to database correctly
- [ ] Validation works
- [ ] Warning displayed

---

## Dev Agent Record

[To be completed by dev agent]

---

**Created:** October 25, 2025
**Owner:** John (PM Agent)
