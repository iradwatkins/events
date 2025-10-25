# Story 2.7: Publish Event

**Epic:** Epic 2 - Event Creation & Management
**Priority:** P1
**Effort:** 2 points
**Sprint:** Week 9
**Status:** Ready for Development

---

## User Story

**As an** event organizer
**I want to** publish my event
**So that** the public can discover and purchase tickets

---

## Acceptance Criteria

- [ ] "Publish" button on event detail page
- [ ] Confirmation modal before publishing
- [ ] Validation checks before publishing
- [ ] Published events visible at `/events`
- [ ] Can unpublish events
- [ ] Real-time update (event appears in public listing immediately)

---

## Tasks

### 1. Create `publishEvent` Mutation

**Files:**
- `convex/events/mutations.ts`

**Code:**
```typescript
export const publishEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    
    // Validation
    if (event.eventType === "TICKETED_EVENT" && !event.stripeAccountSetupComplete) {
      throw new Error("Complete Stripe Connect onboarding before publishing");
    }

    if (event.startDate < Date.now()) {
      throw new Error("Cannot publish past events");
    }

    await ctx.db.patch(args.eventId, { status: "PUBLISHED" });
  },
});

export const unpublishEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.eventId, { status: "DRAFT" });
  },
});
```

---

### 2. Add Publish Button to Event Detail

**Files:**
- `app/(dashboard)/organizer/events/[eventId]/page.tsx`

**Features:**
- "Publish" button (if draft)
- "Unpublish" button (if published)
- Confirmation dialog
- Error handling

---

### 3. Update Public Event Listing Query

**Files:**
- `convex/events/queries.ts`

**Filter:**
```typescript
.withIndex("by_status", (q) => q.eq("status", "PUBLISHED"))
```

---

## Testing

- [ ] Can publish draft events
- [ ] Validation prevents publishing invalid events
- [ ] Published events appear in `/events` immediately
- [ ] Can unpublish events
- [ ] Confirmation modal works

---

## Dev Agent Record

[To be completed by dev agent]

---

**Created:** October 25, 2025
**Owner:** John (PM Agent)
