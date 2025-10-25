# Story 2.2: Create Free Event

**Epic:** Epic 2 - Event Creation & Management
**Priority:** P0
**Effort:** 3 points
**Sprint:** Week 1-2
**Status:** Ready for Development

---

## User Story

**As an** event organizer
**I want to** create a free event with door pricing information
**So that** I can promote events where payment happens at the venue

---

## Acceptance Criteria

- [ ] Can select "Free Event" type from create page
- [ ] All fields from Save the Date + door price field + time fields
- [ ] Door price displayed prominently on event page (e.g., "$20 at the door")
- [ ] No ticketing or payment integration
- [ ] Location details required and prominent
- [ ] Event saved as DRAFT
- [ ] Success message and redirect to dashboard

---

## Tasks

### 1. Create `createFreeEvent` Convex Mutation

**Files:**
- `convex/events/mutations.ts` - Add `createFreeEvent` function

**Code Snippet:**
```typescript
export const createFreeEvent = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    startDate: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    timezone: v.string(),
    location: v.object({
      address: v.string(),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      country: v.string(),
    }),
    organizerName: v.string(),
    categories: v.array(v.string()),
    imageId: v.id("_storage"),
    doorPrice: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("events", {
      ...args,
      eventType: "FREE_EVENT",
      status: "DRAFT",
      images: [args.imageId],
      maxTicketsPerOrder: 1,
      minTicketsPerOrder: 1,
      allowWaitlist: false,
      allowTransfers: false,
      stripeAccountSetupComplete: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
```

---

### 2. Add Time Picker Components

**Files:**
- `components/events/TimePicker.tsx` - Create time picker component

---

### 3. Update Event Creation Page

**Files:**
- `app/(dashboard)/organizer/events/create/page.tsx` - Add Free Event form

**Additional Fields:**
- Start Time
- End Time
- Timezone selector
- Location (full address object)
- Door Price (text input, e.g., "$20")

---

### 4. Update Public Event Detail Page

**Files:**
- `app/(public)/events/[eventId]/page.tsx` - Display door price prominently

**Display:**
- "Admission: $20 at the door"
- No "Buy Tickets" button
- Location details prominent

---

## Testing

- [ ] Can create free event
- [ ] Door price displays correctly on public page
- [ ] Location details complete and visible
- [ ] Times display in correct timezone
- [ ] Mobile responsive

---

## Dev Agent Record

[To be completed by dev agent]

---

**Created:** October 25, 2025
**Owner:** John (PM Agent)
